import { Router } from 'express';
import { 
  login, 
  register,
  registerCompany,
  forgotPassword, 
  verifyOtp, 
  resetPassword, 
  changePassword, 
  getMe,
  getCompanies
} from '../controllers/auth.controller';
import { requireTenantAuth } from '../middleware/tenant.middleware';

const router = Router();

// GET /api/auth/companies - جلب جميع شركات الكهرباء التجارية النشطة
router.get('/companies', getCompanies);

// POST /api/auth/login - تسجيل الدخول لعضو أو مشترك
router.post('/login', login);

// POST /api/auth/register - تسجيل مشترك جديد والتحقق من العداد
router.post('/register', register);

// POST /api/auth/register-company - تسجيل شركة كهرباء جديدة مع حساب المشرف
router.post('/register-company', registerCompany);

// POST /api/auth/forgot-password - طلب رمز التحقق لاستعادة الحساب
router.post('/forgot-password', forgotPassword);

// POST /api/auth/verify-otp - التحقق من الرمز المستلم وتوليد توكن إعادة تعيين
router.post('/verify-otp', verifyOtp);

// POST /api/auth/reset-password - إعادة تعيين كلمة مرور جديدة بالتوكن الموثق
router.post('/reset-password', resetPassword);

// GET /api/auth/me - جلب الملف الشخصي للمستخدم الحالي (محمي)
router.get('/me', requireTenantAuth, getMe);

// PUT /api/auth/change-password - تغيير كلمة المرور للمستخدم المسجل (محمي)
router.put('/change-password', requireTenantAuth, changePassword);

export default router;
