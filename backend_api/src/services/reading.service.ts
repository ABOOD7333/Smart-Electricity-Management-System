import { query } from '../database/connection';

// دالة مساعدة لحساب المسافة بين نقطتين GPS (بالمتر) باستخدام معادلة Haversine
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // نصف قطر الأرض بالمتر
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // المسافة بالمتر
};

interface SubmitReadingParams {
  meter_id: string;
  technician_id: string;
  current_reading: number;
  reading_date?: Date;
  gps_latitude?: number;
  gps_longitude?: number;
  reading_image_url?: string;
  notes?: string;
}

export const processReading = async (params: SubmitReadingParams) => {
  const { meter_id, technician_id, current_reading, gps_latitude, gps_longitude, reading_image_url, notes } = params;

  // 1. جلب بيانات العداد والقراءة السابقة
  const meterResult = await query(
    `SELECT m.*, 
      (SELECT current_reading FROM meter_readings mr 
       WHERE mr.meter_id = m.meter_id 
       ORDER BY reading_date DESC LIMIT 1) as last_reading
     FROM meters m WHERE m.meter_id = $1`,
    [meter_id]
  );

  if (meterResult.rows.length === 0) {
    throw new Error('العداد غير موجود');
  }

  const meter = meterResult.rows[0];
  const previous_reading = meter.last_reading ? parseFloat(meter.last_reading) : 0;

  // 2. التحقق من صحة القراءة الأساسية
  if (current_reading < previous_reading) {
    throw new Error(`القراءة الحالية (${current_reading}) لا يمكن أن تكون أقل من القراءة السابقة (${previous_reading})`);
  }

  const consumption = current_reading - previous_reading;
  let status = 'approved';
  const anomalyFlags: string[] = [];

  // 3. التحقق الجغرافي (GPS Verification)
  if (gps_latitude && gps_longitude && meter.gps_latitude && meter.gps_longitude) {
    const distance = calculateDistance(
      parseFloat(meter.gps_latitude), parseFloat(meter.gps_longitude),
      gps_latitude, gps_longitude
    );
    
    // إذا كانت المسافة أكثر من 100 متر
    if (distance > 100) {
      status = 'pending';
      anomalyFlags.push(`تم أخذ القراءة من مسافة بعيدة عن العداد (${Math.round(distance)} متر)`);
    }
  }

  // 4. اكتشاف الاستهلاك غير الطبيعي (Abnormal Consumption)
  const avgResult = await query(
    `SELECT AVG(consumption) as avg_consumption 
     FROM (
       SELECT consumption FROM meter_readings 
       WHERE meter_id = $1 ORDER BY reading_date DESC LIMIT 3
     ) sub`,
    [meter_id]
  );

  if (avgResult.rows.length > 0 && avgResult.rows[0].avg_consumption) {
    const avgConsumption = parseFloat(avgResult.rows[0].avg_consumption);
    
    if (avgConsumption > 0) {
      if (consumption > avgConsumption * 2) {
        status = 'pending';
        anomalyFlags.push(`استهلاك مرتفع جداً (أكثر من 200% من المتوسط: ${avgConsumption.toFixed(2)})`);
      } else if (consumption < avgConsumption * 0.2 && consumption > 0) {
        status = 'pending';
        anomalyFlags.push(`استهلاك منخفض جداً (أقل من 20% من المتوسط: ${avgConsumption.toFixed(2)})`);
      }
    }
  }

  // إذا تم العثور على شذوذ، نضيفه للملاحظات
  const finalNotes = anomalyFlags.length > 0 ? 
    (notes ? notes + ' | ' : '') + 'شذوذ النظام: ' + anomalyFlags.join('، ') 
    : notes;

  // 5. حفظ القراءة في قاعدة البيانات
  const insertResult = await query(
    `INSERT INTO meter_readings 
      (meter_id, technician_id, previous_reading, current_reading, reading_image_url, gps_latitude, gps_longitude, status, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      meter_id, technician_id, previous_reading, current_reading, 
      reading_image_url || null, gps_latitude || null, gps_longitude || null, 
      status, finalNotes || null
    ]
  );

  const reading = insertResult.rows[0];

  // إذا كان هناك شذوذ، يمكننا اختياريًا إضافته إلى جدول تقارير الذكاء الاصطناعي/المراقبة
  if (status === 'pending') {
    await query(
      `INSERT INTO ai_reports (meter_id, customer_id, analysis_type, anomaly_score, severity, findings)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        meter_id, meter.customer_id, 'manual_reading_validation', 
        80, 'high', finalNotes
      ]
    );
  }

  return reading;
};
