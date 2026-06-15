import { Router } from 'express';
import { getComplaints, getComplaintById, createComplaint, updateComplaintStatus } from '../controllers/complaints.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();

// استخدام التحقق من تسجيل الدخول لجميع المسارات
router.use(authenticate);

// عرض الشكاوى (يحتاج صلاحية)
router.get('/', requirePermission('read:complaints'), getComplaints);

// عرض شكوى معينة (يحتاج صلاحية)
router.get('/:id', requirePermission('read:complaints'), getComplaintById);

// إضافة شكوى (كل مستخدم مسجل الدخول غالباً يستطيع، أو حسب الصلاحية)
// في نظامنا، الموظف يضيف الشكوى نيابة عن المشترك
router.post('/', requirePermission('resolve:complaints'), createComplaint);

// تحديث حالة الشكوى
router.put('/:id', requirePermission('resolve:complaints'), updateComplaintStatus);

export default router;
