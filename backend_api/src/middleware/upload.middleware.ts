import multer from 'multer';
import path from 'path';
import fs from 'fs';

// تأكد من وجود مجلد الرفع
const uploadDir = path.join(__dirname, '../../uploads/readings');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// إعداد التخزين
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // اسم الملف يتكون من التاريخ ورقم عشوائي لتجنب التكرار
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// تصفية الملفات المقبولة (صور فقط)
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('الملف المرفوع يجب أن يكون صورة (JPG, PNG, إلخ)'));
  }
};

export const uploadReadingImage = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // الحد الأقصى 5 ميجابايت
  }
});
