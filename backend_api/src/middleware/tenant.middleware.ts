import { Request, Response, NextFunction } from 'express';
import { query } from '../database/connection';
import jwt from 'jsonwebtoken';

// تعريف واجهة الطلب الخاصة بالشركات (TenantRequest)
export interface TenantRequest extends Request {
  tenantId?: string;
  companyCode?: string;
  user?: {
    user_id: string;
    username: string;
    role: string;
    zone_id: string | null;
    company_id: string; // معرف الشركة المصاحب للتوكن
  };
}

/**
 * وسيط تحديد سياق الشركة (Tenant Context Middleware)
 * يقرأ رمز الشركة من ترويسة الطلب X-Company-Code أو من النطاق الفرعي (Subdomain)
 * ويثبت معرف الشركة في الطلب للوصول الآمن.
 */
export const tenantContext = async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
  let companyIdentifier = req.headers['x-company-code'] as string;
  const host = req.headers.host || '';

  // 1. استخراج رمز الشركة من النطاق الفرعي إذا كان متوفراً (مثال: noor.platform.com)
  if (!companyIdentifier && host.includes('.platform.com')) {
    const subdomain = host.split('.')[0];
    if (subdomain && subdomain !== 'www' && subdomain !== 'platform') {
      companyIdentifier = subdomain.toUpperCase();
    }
  }

  // 2. إذا لم يتم توفير معرف للشركة، نفترض وجود الشركة الافتراضية BPOWER كخلفية توافقية لعدم كسر النظام الحالي
  if (!companyIdentifier) {
    companyIdentifier = 'BPOWER';
  }

  try {
    // جلب الشركة المحددة والتحقق من كونها نشطة
    const compResult = await query(
      'SELECT company_id, company_code, company_name FROM companies WHERE (company_code = $1 OR domain_name = $2) AND is_active = TRUE',
      [companyIdentifier.toUpperCase(), host.toLowerCase()]
    );

    if (compResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'شركة الكهرباء المطلوبة غير مسجلة أو تم إيقاف تنشيطها'
      });
      return;
    }

    req.tenantId = compResult.rows[0].company_id;
    req.companyCode = compResult.rows[0].company_code;
    next();
  } catch (error) {
    console.error('❌ Error processing tenant context:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ داخلي في الخادم أثناء تحديد سياق الشركة'
    });
  }
};

/**
 * وسيط التحقق المصادق عليه للشركات (Tenant Auth Middleware)
 * يتحقق من أن توكن الـ JWT المطروح ينتمي لنفس الشركة النشطة في سياق الطلب الحالي لمنع التداخل أو تسريب البيانات.
 */
export const requireTenantAuth = (req: TenantRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'وصول مرفوض: التوكن غير موجود، يرجى تسجيل الدخول أولاً'
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;

    // التحقق من تطابق معرف الشركة المخزن في التوكن مع معرف الشركة في سياق الطلب الحالي
    if (decoded.company_id && req.tenantId && decoded.company_id !== req.tenantId) {
      res.status(403).json({
        success: false,
        message: 'وصول مرفوض: غير مصرح لك بالوصول إلى بيانات شركة كهرباء أخرى'
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'الجلسة منتهية أو غير صالحة، يرجى تسجيل الدخول مجدداً'
    });
  }
};
