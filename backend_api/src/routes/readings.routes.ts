import { Router } from 'express';
import {
  createReading, getMeterReadings, approveReading, getPendingReadings, getTechnicianReadings
} from '../controllers/readings.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { uploadReadingImage } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate);

// GET  /api/readings/technician    - سجل قراءات الفني الميداني الحالي
router.get('/technician', getTechnicianReadings);

// GET  /api/readings/pending       - قراءات معلقة (للمشرف)
router.get('/pending', authorize('admin', 'supervisor'), getPendingReadings);

// GET  /api/readings/meter/:meter_id - قراءات عداد معين
router.get('/meter/:meter_id', getMeterReadings);

// POST /api/readings               - إرسال قراءة (الفني من الموبايل)
router.post('/', uploadReadingImage.single('reading_image'), createReading);

// PUT  /api/readings/:reading_id/approve - الموافقة على قراءة
router.put('/:reading_id/approve', authorize('admin', 'supervisor'), approveReading);

export default router;
