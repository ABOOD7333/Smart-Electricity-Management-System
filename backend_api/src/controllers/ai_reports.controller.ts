import { Request, Response } from 'express';
import { query } from '../database/connection';
import { AuthRequest } from '../middleware/auth.middleware';

// جلب جميع التقارير
export const getAIReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.company_id;
    const result = await query(
      `SELECT r.*, m.meter_number, c.full_name as customer_name
       FROM ai_reports r
       LEFT JOIN meters m ON r.meter_id = m.meter_id
       LEFT JOIN customers c ON r.customer_id = c.customer_id
       WHERE ($1::uuid IS NULL OR r.company_id = $1)
       ORDER BY r.created_at DESC`,
      [companyId || null]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('getAIReports error:', error);
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
    let companyId = req.user?.company_id;

    if (!companyId && (meter_id || customer_id)) {
      if (meter_id) {
        const meterRes = await query('SELECT company_id FROM meters WHERE meter_id = $1', [meter_id]);
        if (meterRes.rows.length > 0) companyId = meterRes.rows[0].company_id;
      } else if (customer_id) {
        const custRes = await query('SELECT company_id FROM customers WHERE customer_id = $1', [customer_id]);
        if (custRes.rows.length > 0) companyId = custRes.rows[0].company_id;
      }
    }

    if (!companyId) {
      res.status(400).json({ success: false, message: 'تعذر تحديد سياق الشركة للتقرير' });
      return;
    }

    const result = await query(
      `INSERT INTO ai_reports 
        (meter_id, customer_id, analysis_type, anomaly_score, severity, findings, recommended_action, company_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [meter_id, customer_id, analysis_type, anomaly_score, severity || 'low', findings, recommended_action, companyId]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('createAIReport error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إضافة التقرير' });
  }
};
