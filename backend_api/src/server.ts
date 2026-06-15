import app from './app';
import pool from './database/connection';
import { runMigration } from './database/run_migration';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // التحقق من الاتصال بقاعدة البيانات
    await pool.query('SELECT 1');
    console.log('✅ Database connection verified');

    // تشغيل هجرات قاعدة البيانات تلقائياً عند التشغيل (مثالي لمنصات مثل Railway)
    await runMigration(false);

    app.listen(PORT, () => {
      console.log('');
      console.log('⚡ ================================================== ⚡');
      console.log('   Smart Electricity Management System - API Server');
      console.log('⚡ ================================================== ⚡');
      console.log(`   🚀 Server running on: http://localhost:${PORT}`);
      console.log(`   🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   📋 Health Check: http://localhost:${PORT}/api/health`);
      console.log('⚡ ================================================== ⚡');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// معالجة إغلاق النظام بشكل نظيف
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received. Closing server gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received. Closing server gracefully...');
  await pool.end();
  process.exit(0);
});

startServer();
