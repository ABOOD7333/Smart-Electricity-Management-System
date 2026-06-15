import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    user_id: string;
    username: string;
    role: string;
    zone_id: string | null;
  };
}

// التحقق من صحة الـ JWT Token
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'غير مصرح: يرجى تسجيل الدخول أولاً'
    });
    return;
  }

  // [CRIT-01] التحقق من وجود مفتاح JWT — لا fallback ثابت
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('❌ FATAL: JWT_SECRET is not set in environment variables!');
    res.status(500).json({ success: false, message: 'خطأ في إعداد الخادم' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, jwtSecret) as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'الجلسة منتهية أو غير صالحة، يرجى تسجيل الدخول مجدداً'
    });
  }
};

// التحقق من الصلاحيات (Role-based)
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'غير مصرح' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `ليس لديك صلاحية للوصول. الأدوار المسموح بها: ${roles.join(', ')}`
      });
      return;
    }

    next();
  };
};
