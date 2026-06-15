import { Router, Response, NextFunction } from 'express';
import { getComplaints, getComplaintById, createComplaint, updateComplaintStatus } from '../controllers/complaints.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();

// استخدام التحقق من تسجيل الدخول لجميع المسارات
router.use(authenticate);

// عرض الشكاوى (العميل يرى شكاويه فقط، الموظف يحتاج صلاحية)
router.get('/', (req: any, res: Response, next: NextFunction) => {
  if (req.user?.role === 'customer') return next();
  return requirePermission('read:complaints')(req, res, next);
}, getComplaints);

// عرض شكوى معينة (العميل يرى شكواه فقط، الموظف يحتاج صلاحية)
router.get('/:id', (req: any, res: Response, next: NextFunction) => {
  if (req.user?.role === 'customer') return next();
  return requirePermission('read:complaints')(req, res, next);
}, getComplaintById);

// إضافة شكوى (العميل يضيف شكواه مباشرة، الموظف يحتاج صلاحية)
router.post('/', (req: any, res: Response, next: NextFunction) => {
  if (req.user?.role === 'customer') return next();
  return requirePermission('resolve:complaints')(req, res, next);
}, createComplaint);

// تحديث حالة الشكوى (للموظفين فقط)
router.put('/:id', requirePermission('resolve:complaints'), updateComplaintStatus);

export default router;
