import { Router } from 'express';
import { getAllMeters, getMeterById, createMeter, updateMeter } from '../controllers/meters.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// GET  /api/meters         - جميع العدادات
router.get('/', getAllMeters);

// GET  /api/meters/:id     - عداد واحد مع قراءاته
router.get('/:id', getMeterById);

// POST /api/meters         - إضافة عداد
router.post('/', authorize('admin', 'supervisor'), createMeter);

// PUT  /api/meters/:id     - تعديل عداد
router.put('/:id', authorize('admin', 'supervisor'), updateMeter);

export default router;
