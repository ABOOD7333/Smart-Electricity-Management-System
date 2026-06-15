import { Request, Response } from 'express';
import { query } from '../database/connection';

// ===========================
// جلب جميع العدادات
// ===========================
export const getAllMeters = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, search, status, zone_id } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let conditions: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(m.meter_number ILIKE $${paramIndex} OR c.full_name ILIKE $${paramIndex} OR c.customer_number::TEXT LIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (status) { conditions.push(`m.status = $${paramIndex++}`); params.push(status); }
    if (zone_id) { conditions.push(`m.zone_id = $${paramIndex++}`); params.push(zone_id); }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM meters m JOIN customers c ON m.customer_id = c.customer_id ${whereClause}`,
      params
    );

    const result = await query(
      `SELECT 
        m.meter_id, m.meter_number, m.cabinet_name, m.status,
        m.installation_date, m.gps_latitude, m.gps_longitude,
        c.customer_id, c.customer_number, c.full_name, c.phone_number,
        z.zone_name,
        (SELECT r.current_reading FROM meter_readings r WHERE r.meter_id = m.meter_id 
         ORDER BY r.reading_date DESC LIMIT 1) AS last_reading,
        (SELECT r.reading_date FROM meter_readings r WHERE r.meter_id = m.meter_id 
         ORDER BY r.reading_date DESC LIMIT 1) AS last_reading_date
       FROM meters m
       JOIN customers c ON m.customer_id = c.customer_id
       LEFT JOIN zones z ON m.zone_id = z.zone_id
       ${whereClause}
       ORDER BY m.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, Number(limit), offset]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / Number(limit)),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

// ===========================
// جلب عداد واحد بالتفصيل
// ===========================
export const getMeterById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT m.*, c.customer_number, c.full_name, c.phone_number, z.zone_name
       FROM meters m
       JOIN customers c ON m.customer_id = c.customer_id
       LEFT JOIN zones z ON m.zone_id = z.zone_id
       WHERE m.meter_id = $1 OR m.meter_number = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'العداد غير موجود' });
      return;
    }

    // جلب آخر 5 قراءات
    const readings = await query(
      `SELECT r.reading_id, r.previous_reading, r.current_reading, r.consumption,
              r.reading_date, r.status, u.full_name AS technician_name
       FROM meter_readings r
       JOIN users u ON r.technician_id = u.user_id
       WHERE r.meter_id = $1
       ORDER BY r.reading_date DESC LIMIT 5`,
      [result.rows[0].meter_id]
    );

    res.status(200).json({
      success: true,
      data: { ...result.rows[0], recent_readings: readings.rows },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

// ===========================
// إضافة عداد جديد
// ===========================
export const createMeter = async (req: any, res: Response): Promise<void> => {
  const {
    meter_number, customer_id, cabinet_name, zone_id,
    meter_brand, meter_type, installation_date,
    gps_latitude, gps_longitude, notes
  } = req.body;

  if (!meter_number || !customer_id) {
    res.status(400).json({ success: false, message: 'رقم العداد والعميل حقول إلزامية' });
    return;
  }

  try {
    // التحقق من عدم تكرار رقم العداد
    const existing = await query('SELECT meter_id FROM meters WHERE meter_number = $1', [meter_number]);
    if (existing.rows.length > 0) {
      res.status(409).json({ success: false, message: `رقم العداد ${meter_number} مسجل مسبقاً` });
      return;
    }

    const result = await query(
      `INSERT INTO meters (meter_number, customer_id, cabinet_name, zone_id,
        meter_brand, meter_type, installation_date, gps_latitude, gps_longitude, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [meter_number, customer_id, cabinet_name, zone_id,
       meter_brand, meter_type, installation_date, gps_latitude, gps_longitude, notes]
    );

    res.status(201).json({
      success: true,
      message: `تم إضافة العداد ${meter_number} بنجاح`,
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

// ===========================
// تحديث حالة العداد
// ===========================
export const updateMeter = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { cabinet_name, status, notes, gps_latitude, gps_longitude } = req.body;

  try {
    const result = await query(
      `UPDATE meters SET
        cabinet_name = COALESCE($1, cabinet_name),
        status = COALESCE($2, status),
        notes = COALESCE($3, notes),
        gps_latitude = COALESCE($4, gps_latitude),
        gps_longitude = COALESCE($5, gps_longitude)
       WHERE meter_id = $6
       RETURNING *`,
      [cabinet_name, status, notes, gps_latitude, gps_longitude, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'العداد غير موجود' });
      return;
    }

    res.status(200).json({ success: true, message: 'تم تحديث بيانات العداد', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};
