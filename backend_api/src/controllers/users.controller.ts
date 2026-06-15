import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../database/connection';

// ===========================
// جلب جميع المستخدمين
// ===========================
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT u.user_id, u.full_name, u.username, u.email, u.phone_number,
              u.role, u.is_active, u.last_login, u.created_at,
              z.zone_name
       FROM users u
       LEFT JOIN zones z ON u.zone_id = z.zone_id
       ORDER BY u.created_at DESC`
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

// ===========================
// إضافة مستخدم جديد
// ===========================
export const createUser = async (req: Request, res: Response): Promise<void> => {
  const { full_name, username, email, phone_number, password, role, zone_id } = req.body;

  if (!full_name || !username || !password || !role) {
    res.status(400).json({ success: false, message: 'الاسم واسم المستخدم وكلمة المرور والدور حقول إلزامية' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ success: false, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' });
    return;
  }

  try {
    const existing = await query('SELECT user_id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      res.status(409).json({ success: false, message: `اسم المستخدم "${username}" مستخدم مسبقاً` });
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);

    const result = await query(
      `INSERT INTO users (full_name, username, email, phone_number, password_hash, role, zone_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING user_id, full_name, username, email, role, zone_id, created_at`,
      [full_name, username, email, phone_number, password_hash, role, zone_id]
    );

    res.status(201).json({
      success: true,
      message: `تم إنشاء حساب ${full_name} (${role}) بنجاح`,
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

// ===========================
// تفعيل / تعطيل مستخدم
// ===========================
export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await query(
      `UPDATE users SET is_active = NOT is_active WHERE user_id = $1
       RETURNING user_id, full_name, username, is_active`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
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
// إعادة تعيين كلمة مرور
// ===========================
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { new_password } = req.body;

  if (!new_password || new_password.length < 8) {
    res.status(400).json({ success: false, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' });
    return;
  }

  try {
    const password_hash = await bcrypt.hash(new_password, 12);
    const result = await query(
      `UPDATE users SET password_hash = $1 WHERE user_id = $2
       RETURNING full_name, username`,
      [password_hash, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
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
