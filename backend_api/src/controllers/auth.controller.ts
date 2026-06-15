import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../database/connection';
import { TenantRequest } from '../middleware/tenant.middleware';

// ============================================================
// 1. تسجيل الدخول (Login) مع عزل الشركات
// ============================================================
export const login = async (req: TenantRequest, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
    return;
  }

  try {
    // التحقق من وجود معرف الشركة الفعّال في سياق الطلب
    if (!req.tenantId) {
      res.status(400).json({ success: false, message: 'معرف الشركة غير محدد في سياق الطلب' });
      return;
    }

    // البحث عن المستخدم بشرط مطابقة الشركة النشطة
    const result = await query(
      `SELECT u.*, r.role_name as role 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.role_id 
       WHERE u.username = $1 AND u.company_id = $2 AND u.is_active = TRUE`,
      [username, req.tenantId]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة لهذه الشركة' });
      return;
    }

    const user = result.rows[0];

    // التحقق من تطابق كلمة المرور
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
      return;
    }

    // إنشاء الـ Token وتضمين معرف الشركة وعشيرة الحماية
    const tokenPayload = {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      zone_id: user.zone_id,
      company_id: user.company_id,
    };

    const accessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      { user_id: user.user_id, company_id: user.company_id },
      process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    // تحديث تاريخ آخر تسجيل دخول
    await query('UPDATE users SET last_login = NOW() WHERE user_id = $1', [user.user_id]);

    res.status(200).json({
      success: true,
      message: `مرحباً بك، ${user.full_name}!`,
      data: {
        user: {
          user_id: user.user_id,
          full_name: user.full_name,
          username: user.username,
          role: user.role,
          zone_id: user.zone_id,
          company_id: user.company_id,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم أثناء تسجيل الدخول' });
  }
};

// ============================================================
// 2. تسجيل مشترك جديد والتحقق من ملكية العداد (Register & Meter Validation)
// ============================================================
export const register = async (req: TenantRequest, res: Response): Promise<void> => {
  const { username, password, full_name, email, phone_number, meter_number, company_code } = req.body;

  if (!username || !password || !full_name || !phone_number || !meter_number) {
    res.status(400).json({ 
      success: false, 
      message: 'الرجاء إدخال الحقول الإلزامية: اسم المستخدم، كلمة المرور، الاسم الكامل، رقم الهاتف، ورقم العداد' 
    });
    return;
  }

  try {
    let activeCompanyId = req.tenantId;

    // إذا تم إرسال رمز الشركة في الطلب، نقوم بجلب معرفها للتأكد
    if (company_code) {
      const compResult = await query(
        'SELECT company_id FROM companies WHERE company_code = $1 AND is_active = TRUE',
        [company_code.toUpperCase()]
      );
      if (compResult.rows.length === 0) {
        res.status(404).json({ success: false, message: 'شركة الكهرباء المدخلة غير موجودة أو تم إلغاء تنشيطها' });
        return;
      }
      activeCompanyId = compResult.rows[0].company_id;
    }

    if (!activeCompanyId) {
      res.status(400).json({ success: false, message: 'معرف الشركة غير محدد. يرجى توفير رمز الشركة X-Company-Code' });
      return;
    }

    // أ. التحقق من وجود العداد في قاعدة بيانات الشركة المحددة
    const meterResult = await query(
      'SELECT meter_id, customer_id, zone_id FROM meters WHERE meter_number = $1 AND company_id = $2 AND status = \'active\'',
      [meter_number, activeCompanyId]
    );

    if (meterResult.rows.length === 0) {
      res.status(400).json({ 
        success: false, 
        message: 'رقم العداد غير مسجل لهذه الشركة أو تم إلغاء تنشيطه. يرجى مراجعة خدمة العملاء' 
      });
      return;
    }

    const { customer_id, zone_id } = meterResult.rows[0];

    // ب. التحقق من عدم وجود حساب مستخدم سابق مسجل ومرتبط بهذا العميل
    const existingUserByCustomer = await query(
      'SELECT user_id FROM users WHERE customer_id = $1 AND company_id = $2',
      [customer_id, activeCompanyId]
    );

    if (existingUserByCustomer.rows.length > 0) {
      res.status(400).json({ 
        success: false, 
        message: 'هذا العداد مسجل به حساب مشترك نشط بالفعل. لا يمكن تسجيل حساب مكرر لنفس العداد' 
      });
      return;
    }

    // جـ. التحقق من عدم تكرار اسم المستخدم
    const existingUserByName = await query(
      'SELECT user_id FROM users WHERE username = $1',
      [username]
    );

    if (existingUserByName.rows.length > 0) {
      res.status(409).json({ success: false, message: `اسم المستخدم "${username}" محجوز مسبقاً، يرجى اختيار اسم مستخدم آخر` });
      return;
    }

    // د. جلب دور المشترك (customer) لهذه الشركة
    const roleResult = await query(
      'SELECT role_id FROM roles WHERE role_name = \'customer\' AND company_id = $1',
      [activeCompanyId]
    );

    if (roleResult.rows.length === 0) {
      res.status(500).json({ success: false, message: 'لم يتم العثور على دور "المشترك" المهيأ لهذه الشركة' });
      return;
    }

    const role_id = roleResult.rows[0].role_id;
    const password_hash = await bcrypt.hash(password, 12);

    // هـ. إدراج المشترك الجديد في جدول المستخدمين
    const insertResult = await query(
      `INSERT INTO users (full_name, username, email, phone_number, password_hash, role_id, zone_id, company_id, customer_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING user_id, full_name, username, email, phone_number, created_at`,
      [full_name, username, email || null, phone_number, password_hash, role_id, zone_id, activeCompanyId, customer_id]
    );

    const newUser = insertResult.rows[0];

    // و. توليد التوكنات مباشرة لدخول المشترك تلقائياً بعد التسجيل
    const tokenPayload = {
      user_id: newUser.user_id,
      username: newUser.username,
      role: 'customer',
      zone_id,
      company_id: activeCompanyId,
    };

    const accessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      { user_id: newUser.user_id, company_id: activeCompanyId },
      process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    res.status(201).json({
      success: true,
      message: 'تم تسجيل حسابك كمشترك بنجاح!',
      data: {
        user: {
          user_id: newUser.user_id,
          full_name: newUser.full_name,
          username: newUser.username,
          role: 'customer',
          zone_id,
          company_id: activeCompanyId,
        },
        accessToken,
        refreshToken,
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم أثناء التسجيل' });
  }
};

// ============================================================
// 3. طلب استعادة الحساب وإرسال الـ OTP (Forgot Password)
// ============================================================
export const forgotPassword = async (req: TenantRequest, res: Response): Promise<void> => {
  const { company_code, phone_number, meter_number } = req.body;

  if (!phone_number || !meter_number) {
    res.status(400).json({ success: false, message: 'الرجاء إدخال رقم الهاتف ورقم العداد لاستعادة الحساب' });
    return;
  }

  try {
    let activeCompanyId = req.tenantId;

    if (company_code) {
      const compResult = await query(
        'SELECT company_id FROM companies WHERE company_code = $1 AND is_active = TRUE',
        [company_code.toUpperCase()]
      );
      if (compResult.rows.length === 0) {
        res.status(404).json({ success: false, message: 'شركة الكهرباء المدخلة غير موجودة' });
        return;
      }
      activeCompanyId = compResult.rows[0].company_id;
    }

    if (!activeCompanyId) {
      res.status(400).json({ success: false, message: 'معرف الشركة غير محدد. يرجى توفير رمز الشركة X-Company-Code' });
      return;
    }

    // التحقق من صحة ومطابقة البيانات (المستخدم + العميل + العداد) في سياق الشركة
    const userResult = await query(
      `SELECT u.user_id, u.phone_number 
       FROM users u
       JOIN customers c ON u.customer_id = c.customer_id
       JOIN meters m ON m.customer_id = c.customer_id
       WHERE u.phone_number = $1 AND m.meter_number = $2 AND u.company_id = $3 AND u.is_active = TRUE`,
      [phone_number, meter_number, activeCompanyId]
    );

    if (userResult.rows.length === 0) {
      res.status(400).json({ 
        success: false, 
        message: 'البيانات المدخلة غير متطابقة مع أي حساب مشترك مسجل ومفعّل لدينا' 
      });
      return;
    }

    // توليد رمز OTP عشوائي من 6 أرقام
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // صالح لمدة 5 دقائق

    // تخزين الرمز في قاعدة البيانات
    await query(
      `INSERT INTO otp_verifications (company_id, phone_number, otp_code, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [activeCompanyId, phone_number, otpCode, expiresAt]
    );

    // محاكاة إرسال الـ OTP للتطوير المحلي (طباعة الكود وإرجاعه مؤقتاً في استجابة الـ API)
    console.log(`\n============== MOCK OTP SMS SENDER ==============`);
    console.log(`To: ${phone_number}`);
    console.log(`Message: رمز التحقق الخاص بك لمنصة SEMS هو: ${otpCode}. ينتهي خلال 5 دقائق.`);
    console.log(`=================================================\n`);

    res.status(200).json({
      success: true,
      message: 'تم إرسال رمز التحقق (OTP) بنجاح إلى رقم جوالك المسجل',
      mockOtp: process.env.NODE_ENV === 'development' ? otpCode : undefined // إظهار الكود فقط للتطوير المريح
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم أثناء طلب استعادة الحساب' });
  }
};

// ============================================================
// 4. التحقق من الـ OTP وتوليد Reset Token
// ============================================================
export const verifyOtp = async (req: TenantRequest, res: Response): Promise<void> => {
  const { company_code, phone_number, otp_code } = req.body;

  if (!phone_number || !otp_code) {
    res.status(400).json({ success: false, message: 'يرجى إدخال رقم الهاتف ورمز التحقق (OTP)' });
    return;
  }

  try {
    let activeCompanyId = req.tenantId;

    if (company_code) {
      const compResult = await query(
        'SELECT company_id FROM companies WHERE company_code = $1 AND is_active = TRUE',
        [company_code.toUpperCase()]
      );
      if (compResult.rows.length === 0) {
        res.status(404).json({ success: false, message: 'الشركة غير موجودة' });
        return;
      }
      activeCompanyId = compResult.rows[0].company_id;
    }

    if (!activeCompanyId) {
      res.status(400).json({ success: false, message: 'معرف الشركة غير محدد' });
      return;
    }

    // جلب آخر رمز OTP صالح لم يتم استخدامه
    const otpResult = await query(
      `SELECT * FROM otp_verifications 
       WHERE phone_number = $1 AND company_id = $2 AND is_verified = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [phone_number, activeCompanyId]
    );

    if (otpResult.rows.length === 0) {
      res.status(400).json({ success: false, message: 'رمز التحقق غير موجود، أو منتهي الصلاحية، يرجى طلب رمز جديد' });
      return;
    }

    const verification = otpResult.rows[0];

    // حماية ضد الهجمات المتكررة (Brute-Force Protection)
    if (verification.attempts >= 5) {
      res.status(429).json({ success: false, message: 'تم تجاوز الحد الأقصى للمحاولات الخاطئة (5 محاولات). يرجى طلب رمز جديد' });
      return;
    }

    // تحديث عدد المحاولات
    await query(
      'UPDATE otp_verifications SET attempts = attempts + 1 WHERE verification_id = $1',
      [verification.verification_id]
    );

    // التحقق من صحة الرمز
    if (verification.otp_code !== otp_code) {
      res.status(400).json({ success: false, message: 'رمز التحقق غير صحيح. يرجى المحاولة مجدداً' });
      return;
    }

    // إنشاء توكن تعيين آمن (Reset Token) صالح لمدة 15 دقيقة
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // وضع إشارة التحقق بنجاح وحفظ التوكن
    await query(
      'UPDATE otp_verifications SET is_verified = TRUE, reset_token = $1 WHERE verification_id = $2',
      [resetToken, verification.verification_id]
    );

    res.status(200).json({
      success: true,
      message: 'تم التحقق من الرمز بنجاح. يمكنك الآن إعادة تعيين كلمة المرور',
      resetToken
    });
  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم أثناء التحقق من الرمز' });
  }
};

// ============================================================
// 5. تعيين كلمة المرور الجديدة باستخدام الـ Reset Token
// ============================================================
export const resetPassword = async (req: TenantRequest, res: Response): Promise<void> => {
  const { company_code, reset_token, new_password } = req.body;

  if (!reset_token || !new_password) {
    res.status(400).json({ success: false, message: 'يرجى توفير توكن إعادة التعيين وكلمة المرور الجديدة' });
    return;
  }

  if (new_password.length < 8) {
    res.status(400).json({ success: false, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' });
    return;
  }

  try {
    let activeCompanyId = req.tenantId;

    if (company_code) {
      const compResult = await query(
        'SELECT company_id FROM companies WHERE company_code = $1 AND is_active = TRUE',
        [company_code.toUpperCase()]
      );
      if (compResult.rows.length === 0) {
        res.status(404).json({ success: false, message: 'الشركة غير موجودة' });
        return;
      }
      activeCompanyId = compResult.rows[0].company_id;
    }

    if (!activeCompanyId) {
      res.status(400).json({ success: false, message: 'معرف الشركة غير محدد' });
      return;
    }

    // البحث عن التوكن والتحقق من صحته خلال 15 دقيقة من إنشائه
    const verifyResult = await query(
      `SELECT * FROM otp_verifications 
       WHERE reset_token = $1 AND company_id = $2 AND is_verified = TRUE AND expires_at + INTERVAL '15 minutes' > NOW()
       LIMIT 1`,
      [reset_token, activeCompanyId]
    );

    if (verifyResult.rows.length === 0) {
      res.status(400).json({ success: false, message: 'توكن إعادة التعيين غير صالح أو انتهت صلاحيته' });
      return;
    }

    const { phone_number, verification_id } = verifyResult.rows[0];

    // تشفير كلمة المرور الجديدة
    const newHash = await bcrypt.hash(new_password, 12);

    // تحديث كلمة مرور المستخدم المطابق للهاتف والشركة
    const updateResult = await query(
      `UPDATE users SET password_hash = $1 
       WHERE phone_number = $2 AND company_id = $3 AND is_active = TRUE
       RETURNING user_id, full_name`,
      [newHash, phone_number, activeCompanyId]
    );

    if (updateResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'لم يتم العثور على مستخدم مسجل يطابق هذا الهاتف' });
      return;
    }

    // تنظيف وإتلاف توكن استعادة الحساب لمنع استخدامه مرة أخرى
    await query(
      'UPDATE otp_verifications SET reset_token = NULL WHERE verification_id = $1',
      [verification_id]
    );

    res.status(200).json({
      success: true,
      message: 'تم إعادة تعيين كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة'
    });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم أثناء إعادة تعيين كلمة المرور' });
  }
};

// ============================================================
// 6. تغيير كلمة المرور للمستخدم المسجل (Change Password)
// ============================================================
export const changePassword = async (req: any, res: Response): Promise<void> => {
  const { current_password, new_password } = req.body;
  const user_id = req.user?.user_id;

  if (!current_password || !new_password) {
    res.status(400).json({ success: false, message: 'يرجى إدخال جميع الحقول' });
    return;
  }

  if (new_password.length < 8) {
    res.status(400).json({ success: false, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' });
    return;
  }

  try {
    const result = await query('SELECT password_hash FROM users WHERE user_id = $1', [user_id]);
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
      return;
    }

    const isMatch = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
      return;
    }

    const newHash = await bcrypt.hash(new_password, 12);
    await query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [newHash, user_id]);

    res.status(200).json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

// ============================================================
// 7. بيانات المستخدم الحالي (Get Profile) مع بيانات الشركة
// ============================================================
export const getMe = async (req: any, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT u.user_id, u.full_name, u.username, u.email, u.phone_number, u.last_login,
              r.role_name as role, z.zone_name, c.company_name, c.company_code, u.customer_id
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN zones z ON u.zone_id = z.zone_id
       LEFT JOIN companies c ON u.company_id = c.company_id
       WHERE u.user_id = $1`,
      [req.user?.user_id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
      return;
    }

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Get me error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

// ============================================================
// 8. تسجيل شركة كهرباء جديدة (Register New Company)
// ============================================================
export const registerCompany = async (req: Request, res: Response): Promise<void> => {
  const {
    company_name,
    company_code,
    email,
    phone_number,
    address,
    license_number,
    admin_full_name,
    admin_username,
    admin_password,
  } = req.body;

  // التحقق من الحقول الإلزامية
  if (!company_name || !company_code || !admin_full_name || !admin_username || !admin_password || !phone_number) {
    res.status(400).json({
      success: false,
      message: 'يرجى إدخال جميع الحقول الإلزامية: اسم الشركة، الرمز، رقم الهاتف، وبيانات المشرف',
    });
    return;
  }

  const normalizedCode = company_code.trim().toUpperCase();

  if (!/^[A-Z0-9_]{3,20}$/.test(normalizedCode)) {
    res.status(400).json({
      success: false,
      message: 'رمز الشركة يجب أن يكون بالإنجليزية والأرقام فقط (3-20 حرف)',
    });
    return;
  }

  if (admin_password.length < 8) {
    res.status(400).json({ success: false, message: 'كلمة مرور المشرف يجب أن تكون 8 أحرف على الأقل' });
    return;
  }

  try {
    // أ. التحقق من عدم تكرار رمز الشركة
    const existCode = await query('SELECT company_id FROM companies WHERE company_code = $1', [normalizedCode]);
    if (existCode.rows.length > 0) {
      res.status(409).json({ success: false, message: `رمز الشركة "${normalizedCode}" مستخدم بالفعل، يرجى اختيار رمز آخر` });
      return;
    }

    // جـ. إدراج الشركة الجديدة
    const companyResult = await query(
      `INSERT INTO companies (company_name, company_code, email, phone_number, address, license_number, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING company_id, company_name, company_code`,
      [company_name.trim(), normalizedCode, email || null, phone_number.trim(), address || null, license_number || null]
    );
    const newCompany = companyResult.rows[0];
    const newCompanyId = newCompany.company_id;

    // د. إنشاء الأدوار الافتراضية للشركة الجديدة
    const defaultRoles = [
      { name: 'admin',       desc: 'مدير النظام بكامل الصلاحيات' },
      { name: 'customer',    desc: 'مشترك لعرض الفواتير والقراءات وتقديم الشكاوى' },
      { name: 'technician',  desc: 'فني ميداني لأخذ القراءات وتصوير العدادات' },
      { name: 'cashier',     desc: 'أمين صندوق لاستلام الفواتير والمدفوعات' },
      { name: 'supervisor',  desc: 'مشرف مالي وإداري للمناطق' },
      { name: 'accountant',  desc: 'محاسب مالي للشركة' },
      { name: 'reader',      desc: 'قارئ عدادات ميداني' },
    ];

    for (const role of defaultRoles) {
      await query(
        `INSERT INTO roles (role_name, description, company_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (role_name, company_id) DO NOTHING`,
        [role.name, role.desc, newCompanyId]
      );
    }

    // هـ. إدخال صلاحيات الأدوار للشركة الجديدة
    // 1. Admin gets all permissions
    await query(
      `INSERT INTO role_permissions (role_id, permission_id)
       SELECT r.role_id, p.permission_id
       FROM roles r
       CROSS JOIN permissions p
       WHERE r.role_name = 'admin' AND r.company_id = $1
       ON CONFLICT DO NOTHING`,
      [newCompanyId]
    );

    // 2. Technician gets partial permissions
    await query(
      `INSERT INTO role_permissions (role_id, permission_id)
       SELECT r.role_id, p.permission_id
       FROM roles r
       CROSS JOIN permissions p
       WHERE r.role_name = 'technician' AND r.company_id = $1 
         AND p.permission_key IN ('read:customers', 'read:meters', 'read:readings', 'write:readings', 'read:complaints')
       ON CONFLICT DO NOTHING`,
      [newCompanyId]
    );

    // 3. Cashier gets partial permissions
    await query(
      `INSERT INTO role_permissions (role_id, permission_id)
       SELECT r.role_id, p.permission_id
       FROM roles r
       CROSS JOIN permissions p
       WHERE r.role_name = 'cashier' AND r.company_id = $1
         AND p.permission_key IN ('read:customers', 'read:bills', 'read:payments', 'write:payments')
       ON CONFLICT DO NOTHING`,
      [newCompanyId]
    );

    // 4. Supervisor gets partial permissions
    await query(
      `INSERT INTO role_permissions (role_id, permission_id)
       SELECT r.role_id, p.permission_id
       FROM roles r
       CROSS JOIN permissions p
       WHERE r.role_name = 'supervisor' AND r.company_id = $1
         AND p.permission_key IN (
           'read:users', 'read:customers', 'write:customers', 'read:meters', 'write:meters',
           'read:readings', 'write:readings', 'approve:readings', 'read:bills', 'write:bills',
           'read:payments', 'read:complaints', 'resolve:complaints', 'read:ai_reports'
         )
       ON CONFLICT DO NOTHING`,
      [newCompanyId]
    );

    // و. إنشاء المناطق الافتراضية للشركة الجديدة
    await query(
      `INSERT INTO zones (zone_name, zone_code, company_id)
       VALUES 
         ('المنطقة الرئيسية', 'MAIN', $1),
         ('منطقة الشمال', 'NORTH', $1),
         ('منطقة الجنوب', 'SOUTH', $1),
         ('منطقة الشرق', 'EAST', $1)
       ON CONFLICT (zone_code, company_id) DO NOTHING`,
      [newCompanyId]
    );

    // ز. إنشاء تعريفات الأسعار الافتراضية للشركة الجديدة
    await query(
      `INSERT INTO tariff_rates (customer_type, min_kwh, max_kwh, rate_per_kwh, effective_from, company_id)
       VALUES
         ('residential', 0, 200, 30, '2025-01-01', $1),
         ('residential', 201, NULL, 50, '2025-01-01', $1),
         ('commercial', 0, NULL, 265, '2025-01-01', $1),
         ('industrial', 0, NULL, 200, '2025-01-01', $1)
       ON CONFLICT DO NOTHING`,
      [newCompanyId]
    );

    // حـ. جلب دور المشرف للشركة الجديدة
    const adminRoleResult = await query(
      `SELECT role_id FROM roles WHERE role_name = 'admin' AND company_id = $1`,
      [newCompanyId]
    );
    if (adminRoleResult.rows.length === 0) {
      res.status(500).json({ success: false, message: 'فشل إنشاء دور المشرف للشركة' });
      return;
    }
    const adminRoleId = adminRoleResult.rows[0].role_id;

    // ط. إنشاء حساب المشرف للشركة الجديدة
    const adminPasswordHash = await bcrypt.hash(admin_password, 12);
    const adminUserResult = await query(
      `INSERT INTO users (full_name, username, phone_number, password_hash, role_id, company_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING user_id, full_name, username`,
      [admin_full_name.trim(), admin_username.trim(), phone_number.trim(), adminPasswordHash, adminRoleId, newCompanyId]
    );
    const adminUser = adminUserResult.rows[0];

    // ز. توليد التوكن للدخول التلقائي بعد التسجيل
    const tokenPayload = {
      user_id: adminUser.user_id,
      username: adminUser.username,
      role: 'admin',
      company_id: newCompanyId,
    };
    const accessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as jwt.SignOptions
    );

    res.status(201).json({
      success: true,
      message: `تم تسجيل شركة "${newCompany.company_name}" بنجاح! يمكنك الآن تسجيل الدخول بحساب المشرف`,
      data: {
        company: {
          company_id: newCompanyId,
          company_name: newCompany.company_name,
          company_code: newCompany.company_code,
        },
        admin: {
          user_id: adminUser.user_id,
          full_name: adminUser.full_name,
          username: adminUser.username,
        },
        accessToken,
      },
    });
  } catch (error) {
    console.error('❌ Register company error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم أثناء تسجيل الشركة' });
  }
};

// ============================================================
// 9. جلب جميع شركات الكهرباء التجارية النشطة (Get Active Companies)
// ============================================================
export const getCompanies = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      'SELECT company_id, company_name, company_code FROM companies WHERE is_active = TRUE ORDER BY company_name ASC'
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Get companies error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم أثناء جلب شركات الكهرباء' });
  }
};

// ============================================================
// 10. إعادة تعيين بيانات مدير الشركة (Admin Reset - محمي بمفتاح سري)
// ============================================================
export const resetAdminCredentials = async (req: Request, res: Response): Promise<void> => {
  const MASTER_KEY = process.env.MASTER_RESET_KEY || 'SEMS_MASTER_2026_RESET';
  const { master_key, updates } = req.body;

  if (master_key !== MASTER_KEY) {
    res.status(403).json({ success: false, message: 'مفتاح إعادة التعيين غير صحيح' });
    return;
  }

  if (!Array.isArray(updates) || updates.length === 0) {
    res.status(400).json({ success: false, message: 'يرجى إرسال قائمة التحديثات' });
    return;
  }

  try {
    const results = [];

    for (const update of updates) {
      const { company_code, new_username, new_password } = update;

      if (!company_code || !new_username || !new_password) {
        results.push({ company_code, success: false, message: 'بيانات ناقصة' });
        continue;
      }

      // جلب معرف الشركة
      const compResult = await query(
        'SELECT company_id FROM companies WHERE company_code = $1 AND is_active = TRUE',
        [company_code.toUpperCase()]
      );

      if (compResult.rows.length === 0) {
        results.push({ company_code, success: false, message: 'الشركة غير موجودة' });
        continue;
      }

      const company_id = compResult.rows[0].company_id;

      // جلب دور المدير
      const roleResult = await query(
        'SELECT role_id FROM roles WHERE role_name = $1 AND company_id = $2',
        ['admin', company_id]
      );

      if (roleResult.rows.length === 0) {
        results.push({ company_code, success: false, message: 'دور المدير غير موجود للشركة' });
        continue;
      }

      const admin_role_id = roleResult.rows[0].role_id;

      // تشفير كلمة المرور الجديدة
      const new_hash = await bcrypt.hash(new_password, 12);

      // تحديث المستخدم الإداري (role=admin) في الشركة
      const updateResult = await query(
        `UPDATE users SET username = $1, password_hash = $2, is_active = TRUE
         WHERE role_id = $3 AND company_id = $4
         RETURNING user_id, username, full_name`,
        [new_username, new_hash, admin_role_id, company_id]
      );

      if (updateResult.rows.length === 0) {
        // إنشاء مستخدم مدير جديد إذا لم يكن موجوداً
        const insertResult = await query(
          `INSERT INTO users (full_name, username, password_hash, role_id, company_id, is_active)
           VALUES ($1, $2, $3, $4, $5, TRUE)
           RETURNING user_id, username, full_name`,
          [`مدير ${company_code}`, new_username, new_hash, admin_role_id, company_id]
        );
        results.push({
          company_code,
          success: true,
          message: 'تم إنشاء مدير جديد بنجاح',
          user: insertResult.rows[0]
        });
      } else {
        results.push({
          company_code,
          success: true,
          message: 'تم تحديث بيانات المدير بنجاح',
          user: updateResult.rows[0]
        });
      }
    }

    res.status(200).json({ success: true, results });
  } catch (error) {
    console.error('❌ Reset admin credentials error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

