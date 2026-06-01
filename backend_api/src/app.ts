import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { query } from './database/connection';

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

// Trust proxy headers (e.g., X-Forwarded-For) from Railway load balancers
app.set('trust proxy', 1);

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

// ===========================
// المسارات الصحية والتشخيصية (Health & Diagnostics Check)
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

app.get('/api/diag', async (req, res) => {
  try {
    const dbNameRes = await query('SELECT current_database(), current_user');
    const currentDb = dbNameRes.rows[0].current_database;
    const currentUser = dbNameRes.rows[0].current_user;

    const dbsRes = await query('SELECT datname FROM pg_database WHERE datistemplate = false');
    const databases = dbsRes.rows.map(r => r.datname);

    const tablesRes = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    
    const results: any = {};
    for (const table of tables) {
      try {
        const countRes = await query(`SELECT COUNT(*) FROM "${table}"`);
        results[table] = countRes.rows[0].count;
      } catch (err: any) {
        results[table] = `ERROR: ${err.message}`;
      }
    }
    res.json({ 
      success: true, 
      current_database: currentDb,
      current_user: currentUser,
      all_databases: databases,
      tables: tables, 
      counts: results 
    });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// تفعيل سياق الشركة لتحديد المستأجر تلقائياً لجميع الطلبات
import { tenantContext } from './middleware/tenant.middleware';
app.use(tenantContext);

// ===========================
// خدمة الواجهة الأمامية (Web App)
// ===========================
// __dirname in production = /usr/src/app/dist
// public folder is at   = /usr/src/app/public
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

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
// SPA fallback: serve index.html for all non-API routes
// Note: app.use() without path works for all routes in Express 5
app.use((req, res, next) => {
  // Only serve index.html for non-API requests
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.use(notFound);
app.use(errorHandler);

export default app;
