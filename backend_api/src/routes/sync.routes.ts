import { Router } from 'express';
import { syncOfflineData } from '../controllers/sync.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// نقطة المزامنة للموبايل
router.post('/', syncOfflineData);

export default router;
