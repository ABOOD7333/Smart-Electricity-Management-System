import { query } from './connection';
import { Request } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

interface AuditLogOptions {
  req?: AuthRequest | Request;
  userId?: string;
  action: string;
  tableName: string;
  recordId?: string;
  oldValues?: any;
  newValues?: any;
}

/**
 * دالة مساعدة لتسجيل حركات النظام (Audit Logging)
 */
export const logAudit = async (options: AuditLogOptions): Promise<void> => {
  try {
    let userId = options.userId;
    let ipAddress = '';
    let userAgent = '';

    if (options.req) {
      // استخراج معرف المستخدم إذا كان الطلب من نوع AuthRequest
      if ('user' in options.req && options.req.user) {
        userId = options.req.user.user_id;
      }
      
      ipAddress = options.req.ip || options.req.socket.remoteAddress || '';
      userAgent = options.req.headers['user-agent'] || '';
    }

    await query(
      `INSERT INTO audit_logs 
        (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId || null,
        options.action,
        options.tableName,
        options.recordId || null,
        options.oldValues ? JSON.stringify(options.oldValues) : null,
        options.newValues ? JSON.stringify(options.newValues) : null,
        ipAddress,
        userAgent
      ]
    );
  } catch (error) {
    // نقوم بطباعة الخطأ ولكن لا نوقف العملية الأصلية إذا فشل تسجيل الرقابة
    console.error('❌ Failed to save audit log:', error);
  }
};
