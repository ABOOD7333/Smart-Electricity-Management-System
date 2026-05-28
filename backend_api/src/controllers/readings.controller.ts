import { Request, Response } from 'express';
import { query } from '../database/connection';
import { processReading } from '../services/reading.service';

// ===========================
// إضافة قراءة عداد جديدة (من تطبيق الموبايل)
// ===========================
export const createReading = async (req: any, res: Response): Promise<void> => {
  const {
    meter_id, current_reading,
    reading_date, gps_latitude, gps_longitude,
    notes
  } = req.body;

  if (!meter_id || current_reading === undefined) {
    res.status(400).json({ success: false, message: 'رقم العداد والقراءة الحالية حقول إلزامية' });
    return;
  }

  // إذا تم رفع صورة، احصل على مسارها
  const reading_image_url = req.file ? `/uploads/readings/${req.file.filename}` : undefined;

  try {
    const reading = await processReading({
      meter_id,
      technician_id: req.user?.user_id,
      current_reading: parseFloat(current_reading),
      reading_date: reading_date ? new Date(reading_date) : undefined,
      gps_latitude: gps_latitude ? parseFloat(gps_latitude) : undefined,
      gps_longitude: gps_longitude ? parseFloat(gps_longitude) : undefined,
      reading_image_url,
      notes
    });

    res.status(201).json({
      success: true,
      message: reading.status === 'pending' ? 'تم حفظ القراءة وتحتاج مراجعة (شذوذ محتمل)' : 'تم حفظ القراءة واعتمادها بنجاح',
      data: reading,
    });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message || 'حدث خطأ في حفظ القراءة' });
  }
};

// ===========================
// جلب قراءات عداد معين
// ===========================
export const getMeterReadings = async (req: Request, res: Response): Promise<void> => {
  const { meter_id } = req.params;
  const { limit = 10 } = req.query;

  try {
    const result = await query(
      `SELECT 
        r.*, u.full_name AS technician_name
       FROM meter_readings r
       JOIN users u ON r.technician_id = u.user_id
       WHERE r.meter_id = $1
       ORDER BY r.reading_date DESC
       LIMIT $2`,
      [meter_id, Number(limit)]
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

// ===========================
// الموافقة على قراءة (المشرف)
// ===========================
export const approveReading = async (req: any, res: Response): Promise<void> => {
  const { reading_id } = req.params;

  try {
    const result = await query(
      `UPDATE meter_readings 
       SET status = 'approved', approved_by = $1
       WHERE reading_id = $2
       RETURNING *`,
      [req.user?.user_id, reading_id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'القراءة غير موجودة' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'تمت الموافقة على القراءة بنجاح',
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

// ===========================
// قراءات الفنيين المعلقة (لوحة المشرف)
// ===========================
export const getPendingReadings = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT 
        r.reading_id, r.previous_reading, r.current_reading, r.consumption,
        r.reading_date, r.reading_image_url, r.gps_latitude, r.gps_longitude, r.status,
        m.meter_number, m.cabinet_name,
        c.customer_number, c.full_name,
        u.full_name AS technician_name
       FROM meter_readings r
       JOIN meters m ON r.meter_id = m.meter_id
       JOIN customers c ON m.customer_id = c.customer_id
       JOIN users u ON r.technician_id = u.user_id
       WHERE r.status = 'pending'
       ORDER BY r.reading_date DESC`
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};
