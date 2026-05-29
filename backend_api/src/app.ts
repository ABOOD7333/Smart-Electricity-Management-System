import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';

// Routes
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customers.routes';
import billRoutes from './routes/bills.routes';
import readingRoutes from './routes/readings.routes';
import meterRoutes from './routes/meters.routes';
import userRoutes from './routes/users.routes';
import complaintsRoutes from './routes/complaints.routes';
import aiReportsRoutes from './routes/ai_reports.routes';
import syncRoutes from './routes/sync.routes';

// Middleware
import { errorHandler, notFound } from './middleware/error.middleware';

dotenv.config();

const app: Application = express();

// ===========================
// الحماية والإعدادات العامة
// ===========================
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts & styles in web app
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

// تحديد معدل الطلبات (الحماية من الهجمات)
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 دقيقة
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'عدد كبير جداً من الطلبات، حاول مرة أخرى بعد قليل' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// تفعيل سياق الشركة لتحديد المستأجر تلقائياً لجميع الطلبات
import { tenantContext } from './middleware/tenant.middleware';
app.use(tenantContext);

// ===========================
// خدمة الواجهة الأمامية (Web App)
// ===========================
const publicPath = path.join(__dirname, '../../public');
app.use(express.static(publicPath));

// ===========================
// المسارات الصحية (Health Check)
// ===========================
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: '⚡ Smart Electricity Management System API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ===========================
// تسجيل الـ Routes
// ===========================
app.use('/api/auth',      authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bills',     billRoutes);
app.use('/api/readings',  readingRoutes);
app.use('/api/meters',    meterRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/ai-reports', aiReportsRoutes);
app.use('/api/sync',       syncRoutes);

// ===========================
// معالجة الأخطاء
// ===========================
// Serve index.html for any unknown route (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.use(notFound);
app.use(errorHandler);

export default app;
