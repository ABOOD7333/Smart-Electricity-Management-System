const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const cors = require('cors');

/**
 * Global Security Middleware Setup
 */
module.exports = (app) => {
  // 1. Set Security HTTP Headers (Protects against XSS, Clickjacking, sniffing)
  app.use(helmet());

  // 2. Data Sanitization against XSS (Cross-Site Scripting)
  app.use(xss());

  // 3. CORS Policy
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://admin.sems.com', 'https://api.sems.com'] 
      : '*',
    credentials: true
  }));

  // 4. Rate Limiting (Protects against DDoS and Brute Force)
  const limiter = rateLimit({
    max: 100, // Limit each IP to 100 requests per windowMs
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many requests from this IP, please try again in 15 minutes.'
  });
  app.use('/api', limiter);

  // Note: SQL Injection protection is handled natively by Prisma/Sequelize ORMs 
  // parameterization. If using raw queries, ensure variables are parameterized.
};
