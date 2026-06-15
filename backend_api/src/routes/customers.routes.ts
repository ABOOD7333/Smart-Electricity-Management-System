import { Router } from 'express';
import {
  getAllCustomers, getCustomerById, createCustomer,
  updateCustomer, getCustomerBills, getZones, getCustomerDashboard
} from '../controllers/customers.controller';
import { requireTenantAuth } from '../middleware/tenant.middleware';
import { authorize, authenticate } from '../middleware/auth.middleware';

const router = Router();

// كل المسارات محمية مع التحقق من عزل الشركة
router.use(requireTenantAuth);

// GET  /api/customers/zones     - مناطق الشركة
router.get('/zones', getZones);

// GET  /api/customers/dashboard - لوحة تحكم المشترك
router.get('/dashboard', authenticate, getCustomerDashboard);

// GET  /api/customers          - جميع العملاء (مع بحث وصفحات)
router.get('/', getAllCustomers);

// GET  /api/customers/:id      - العميل بالتفصيل
router.get('/:id', getCustomerById);

// GET  /api/customers/:id/bills - فواتير عميل
router.get('/:id/bills', getCustomerBills);

// POST /api/customers          - إضافة عميل (أدمن + مشرف فقط)
router.post('/', authorize('admin', 'supervisor'), createCustomer);

// PUT  /api/customers/:id      - تعديل عميل
router.put('/:id', authorize('admin', 'supervisor'), updateCustomer);

export default router;
