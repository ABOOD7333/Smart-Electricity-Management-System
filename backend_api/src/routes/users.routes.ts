import { Router } from 'express';
import { getAllUsers, createUser, toggleUserStatus, resetPassword } from '../controllers/users.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// جميع عمليات المستخدمين للأدمن فقط
router.use(authorize('admin'));

// GET  /api/users                    - جميع المستخدمين
router.get('/', getAllUsers);

// POST /api/users                    - إضافة مستخدم
router.post('/', createUser);

// PATCH /api/users/:id/toggle        - تفعيل/تعطيل
router.patch('/:id/toggle', toggleUserStatus);

// PUT   /api/users/:id/reset-password - إعادة تعيين كلمة مرور
router.put('/:id/reset-password', resetPassword);

export default router;
