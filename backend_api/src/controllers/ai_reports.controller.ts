import { Request, Response } from 'express';
import { query } from '../database/connection';
import { AuthRequest } from '../middleware/auth.middleware';

// جلب جميع التقارير
export const getAIReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT r.*, m.meter_number, c.full_name as customer_name
       FROM ai_reports r
       LEFT JOIN meters m ON r.meter_id = m.meter_id
       LEFT JOIN customers c ON r.customer_id = c.customer_id
       ORDER BY r.created_at DESC`
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب تقارير الذكاء الاصطناعي' });
  }
};

// إنشاء تقرير (يُفترض أن يُستدعى بواسطة خدمة الـ AI)
export const createAIReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const { meter_id, customer_id, analysis_type, anomaly_score, severity, findings, recommended_action } = req.body;

  if (!analysis_type || anomaly_score === undefined || !findings) {
    res.status(400).json({ success: false, message: 'البيانات المطلوبة غير مكتملة' });
    return;
  }

  try {
    const result = await query(
      `INSERT INTO ai_reports 
        (meter_id, customer_id, analysis_type, anomaly_score, severity, findings, recommended_action)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [meter_id, customer_id, analysis_type, anomaly_score, severity || 'low', findings, recommended_action]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إضافة التقرير' });
  }
};
