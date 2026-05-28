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
