import { Request, Response, NextFunction } from 'express';

// معالج موحد للأخطاء
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'حدث خطأ داخلي في الخادم';

  console.error(`❌ Error ${statusCode}: ${message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// إنشاء خطأ برمجي منظم
export const createError = (message: string, statusCode: number): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

// معالج المسارات غير الموجودة (404)
export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `المسار غير موجود: ${req.method} ${req.originalUrl}`,
  });
};
