import { Router } from 'express';
import { getAIReports, createAIReport } from '../controllers/ai_reports.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate);

// جلب التقارير (فقط للمشرفين والمدراء)
router.get('/', requirePermission('read:ai_reports'), getAIReports);

// إضافة تقرير (مؤقتاً يتطلب صلاحيات قراءة التقارير أو يمكن جعله داخلياً)
router.post('/', requirePermission('read:ai_reports'), createAIReport);

export default router;
