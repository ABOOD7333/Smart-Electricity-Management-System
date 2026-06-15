# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# تثبيت كافة الاعتماديات بما فيها أدوات التطوير وTypeScript للبناء
RUN npm ci

COPY . .

# بناء مشروع TypeScript (ترجمة ملفات src إلى dist)
RUN npm run build

# Stage 2: Production runtime stage
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# تثبيت اعتماديات الإنتاج فقط للحفاظ على حجم الحاوية صغيراً وآمناً
RUN npm ci --only=production

# نسخ الملفات المترجمة من مرحلة البناء
COPY --from=builder /usr/src/app/dist ./dist

# نسخ مجلد الواجهة الأمامية (Web App)
COPY --from=builder /usr/src/app/public ./public

# إنشاء مستخدم غير مسؤول (non-root) للأمان والحماية
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# إنشاء مجلدات الرفع وتغيير ملكية مجلد العمل للمستخدم الآمن لتفادي خطأ الصلاحيات (EACCES)
RUN mkdir -p /usr/src/app/uploads/readings && chown -R appuser:appgroup /usr/src/app

USER appuser

EXPOSE 3000

# تشغيل الخادم من الملف المترجم dist/server.js
CMD ["node", "dist/server.js"]
