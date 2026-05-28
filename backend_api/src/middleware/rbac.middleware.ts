import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { query } from '../database/connection';

/**
 * Middleware للتحقق من صلاحية معينة (Dynamic RBAC)
 * @param requiredPermission اسم الصلاحية المطلوبة (مثال: 'read:users')
 */
export const requirePermission = (requiredPermission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'غير مصرح: يرجى تسجيل الدخول' });
      return;
    }

    const roleName = req.user.role;

    // أدمن يملك كل الصلاحيات دائماً كإجراء احتياطي (أو يمكن الاعتماد على الجدول فقط)
    if (roleName === 'admin') {
      next();
      return;
    }

    try {
      // التحقق من قاعدة البيانات إذا كان هذا الدور يملك الصلاحية المطلوبة
      const result = await query(
        `SELECT 1
         FROM role_permissions rp
         JOIN roles r ON rp.role_id = r.role_id
         JOIN permissions p ON rp.permission_id = p.permission_id
         WHERE r.role_name = $1 AND p.permission_key = $2`,
        [roleName, requiredPermission]
      );

      if (result.rows.length === 0) {
        res.status(403).json({
          success: false,
          message: `ليس لديك الصلاحية المطلوبة: ${requiredPermission}`
        });
        return;
      }

      next();
    } catch (error) {
      console.error('RBAC Error:', error);
      res.status(500).json({ success: false, message: 'خطأ في التحقق من الصلاحيات' });
    }
  };
};
