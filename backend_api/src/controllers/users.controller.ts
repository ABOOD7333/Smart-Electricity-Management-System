import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../database/connection';

// ===========================
// جلب جميع المستخدمين (مع عزل الشركة)
// ===========================
export const getAllUsers = async (req: any, res: Response): Promise<void> => {
  try {
    // [CRIT-04] عزل المستخدمين بالشركة — كل مدير يرى موظفيه فقط
    const companyId = req.tenantId;
    const result = await query(
      `SELECT u.user_id, u.full_name, u.username, u.email, u.phone_number,
              r.role_name AS role, u.is_active, u.last_login, u.created_at,
              z.zone_name
       FROM users u
       LEFT JOIN zones z ON u.zone_id = z.zone_id
       LEFT JOIN roles r ON u.role_id = r.role_id
       WHERE ($1::uuid IS NULL OR u.company_id = $1)
       ORDER BY u.created_at DESC`,
      [companyId || null]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('getAllUsers error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

// ===========================
// إضافة مستخدم جديد (مع عزل الشركة)
// ===========================
export const createUser = async (req: any, res: Response): Promise<void> => {
  const { full_name, username, email, phone_number, password, role, zone_id } = req.body;

  if (!full_name || !username || !password || !role) {
    res.status(400).json({ success: false, message: 'الاسم واسم المستخدم وكلمة المرور والدور حقول إلزامية' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ success: false, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' });
    return;
  }

  // [MED-01] التحقق من وجود company_id قبل إنشاء المستخدم
  const companyId = req.tenantId;
  if (!companyId) {
    res.status(400).json({ success: false, message: 'تعذر تحديد سياق الشركة' });
    return;
  }

  try {
    const existing = await query('SELECT user_id FROM users WHERE username = $1 AND company_id = $2', [username, companyId]);
    if (existing.rows.length > 0) {
      res.status(409).json({ success: false, message: `اسم المستخدم "${username}" مستخدم مسبقاً` });
      return;
    }

    const roleResult = await query(
      'SELECT role_id FROM roles WHERE role_name = $1 AND company_id = $2',
      [role, companyId]
    );

    if (roleResult.rows.length === 0) {
      res.status(400).json({ success: false, message: `الدور الوظيفي "${role}" غير معرف في هذه الشركة` });
      return;
    }
    const roleId = roleResult.rows[0].role_id;

    const password_hash = await bcrypt.hash(password, 12);

    const result = await query(
      `INSERT INTO users (full_name, username, email, phone_number, password_hash, role_id, zone_id, company_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING user_id, full_name, username, email, zone_id, created_at`,
      [full_name, username, email || null, phone_number || null, password_hash, roleId, zone_id || null, companyId]
    );

    res.status(201).json({
      success: true,
      message: `تم إنشاء حساب ${full_name} (${role}) بنجاح`,
      data: {
        ...result.rows[0],
        role
      },
    });
  } catch (error) {
    console.error('createUser error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

// ===========================
// تفعيل / تعطيل مستخدم (مع عزل الشركة)
// ===========================
export const toggleUserStatus = async (req: any, res: Response): Promise<void> => {
  const { id } = req.params;
  // [MED-02] التحقق من أن المستخدم ينتمي لنفس الشركة
  const companyId = req.tenantId;
  try {
    const result = await query(
      `UPDATE users SET is_active = NOT is_active
       WHERE user_id = $1 AND ($2::uuid IS NULL OR company_id = $2)
       RETURNING user_id, full_name, username, is_active`,
      [id, companyId || null]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'المستخدم غير موجود أو لا ينتمي لشركتك' });
      return;
    }

    const status = result.rows[0].is_active ? 'مفعّل' : 'معطّل';
    res.status(200).json({
      success: true,
      message: `تم ${status} حساب ${result.rows[0].full_name}`,
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

// ===========================
// إعادة تعيين كلمة مرور (مع عزل الشركة)
// ===========================
export const resetPassword = async (req: any, res: Response): Promise<void> => {
  const { id } = req.params;
  const { new_password } = req.body;
  // [MED-03] التحقق من أن المستخدم ينتمي لشركة المدير
  const companyId = req.tenantId;

  if (!new_password || new_password.length < 8) {
    res.status(400).json({ success: false, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' });
    return;
  }

  try {
    const password_hash = await bcrypt.hash(new_password, 12);
    const result = await query(
      `UPDATE users SET password_hash = $1
       WHERE user_id = $2 AND ($3::uuid IS NULL OR company_id = $3)
       RETURNING full_name, username`,
      [password_hash, id, companyId || null]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'المستخدم غير موجود أو لا ينتمي لشركتك' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `تم إعادة تعيين كلمة مرور ${result.rows[0].full_name} بنجاح`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};
