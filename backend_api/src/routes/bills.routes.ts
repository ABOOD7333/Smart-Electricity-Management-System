import { Router } from 'express';
import {
  getAllBills, getBillById, createBill,
  recordPayment, getDashboardStats
} from '../controllers/bills.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// GET  /api/bills/dashboard    - إحصائيات لوحة التحكم
router.get('/dashboard', getDashboardStats);

// GET  /api/bills              - جميع الفواتير
router.get('/', getAllBills);

// GET  /api/bills/:id          - فاتورة واحدة
router.get('/:id', getBillById);

// POST /api/bills              - إنشاء فاتورة (أدمن + مشرف + محاسب)
router.post('/', authorize('admin', 'supervisor', 'cashier'), createBill);

// POST /api/bills/:id/pay      - تسجيل دفعة
router.post('/:id/pay', authorize('admin', 'supervisor', 'cashier', 'customer'), recordPayment);

export default router;
