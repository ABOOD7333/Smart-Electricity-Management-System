import { query } from '../database/connection';

export const generateBillForReading = async (reading_id: string, user_id: string) => {
  // 1. جلب القراءة والعداد والمشترك
  const readingResult = await query(
    `SELECT mr.*, m.customer_id, c.customer_type
     FROM meter_readings mr
     JOIN meters m ON mr.meter_id = m.meter_id
     JOIN customers c ON m.customer_id = c.customer_id
     WHERE mr.reading_id = $1`,
    [reading_id]
  );

  if (readingResult.rows.length === 0) {
    throw new Error('القراءة غير موجودة');
  }

  const reading = readingResult.rows[0];

  if (reading.status !== 'approved') {
    throw new Error('لا يمكن إصدار فاتورة لقراءة غير معتمدة');
  }

  // التأكد من عدم وجود فاتورة مسبقة لنفس القراءة
  const checkBill = await query('SELECT bill_id FROM bills WHERE reading_id = $1', [reading_id]);
  if (checkBill.rows.length > 0) {
    throw new Error('تم إصدار فاتورة لهذه القراءة مسبقاً');
  }

  const consumption = parseFloat(reading.consumption);
  
  // 2. حساب قيمة الاستهلاك بناءً على الشرائح
  const tariffResult = await query(
    `SELECT * FROM tariff_rates 
     WHERE customer_type = $1 AND is_active = TRUE
     ORDER BY min_kwh ASC`,
    [reading.customer_type]
  );

  let consumption_value = 0;
  let remaining_consumption = consumption;

  for (const tariff of tariffResult.rows) {
    const min = parseFloat(tariff.min_kwh);
    const max = tariff.max_kwh ? parseFloat(tariff.max_kwh) : Infinity;
    const rate = parseFloat(tariff.rate_per_kwh);

    const kwhInThisTier = max === Infinity 
      ? remaining_consumption 
      : Math.min(remaining_consumption, max - min + (min === 0 ? 0 : 1));

    if (kwhInThisTier > 0) {
      consumption_value += (kwhInThisTier * rate);
      remaining_consumption -= kwhInThisTier;
    }

    if (remaining_consumption <= 0) break;
  }

  // 3. جلب المتأخرات (Arrears)
  const arrearsResult = await query(
    `SELECT COALESCE(SUM(balance_due), 0) as total_arrears
     FROM bills
     WHERE customer_id = $1 AND status != 'paid' AND status != 'cancelled'`,
    [reading.customer_id]
  );
  const arrears = parseFloat(arrearsResult.rows[0].total_arrears);

  // 4. رسوم إضافية ثابتة (مثال: رسوم خدمة 1000 ريال)
  const services_fees = 1000;

  // 5. الحساب النهائي (يضم فقط قيمة الاستهلاك الحالي والرسوم الإضافية دون المتأخرات لتجنب التراكم المزدوج في قاعدة البيانات)
  const total_amount = consumption_value + services_fees;

  // جلب آخر رقم فاتورة لتوليد رقم تسلسلي
  const invoiceNumResult = await query('SELECT COALESCE(MAX(invoice_number), 10000) + 1 as next_invoice FROM bills');
  const invoice_number = invoiceNumResult.rows[0].next_invoice;

  // حفظ الفاتورة في قاعدة البيانات
  const billInsert = await query(
    `INSERT INTO bills 
      (invoice_number, customer_id, meter_id, reading_id, generated_by, 
       billing_cycle, period_from, period_to, previous_reading, current_reading, 
       consumption_kwh, consumption_value, services_fees, arrears, total_amount, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
    [
      invoice_number,
      reading.customer_id,
      reading.meter_id,
      reading.reading_id,
      user_id,
      reading.billing_cycle || new Date().getMonth() + 1, // دورة الشهر الحالي افتراضيا
      reading.period_from || new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      reading.period_to || new Date(),
      reading.previous_reading,
      reading.current_reading,
      consumption,
      consumption_value,
      services_fees,
      arrears,
      total_amount,
      new Date(new Date().getTime() + 15 * 24 * 60 * 60 * 1000) // بعد 15 يوم
    ]
  );

  return billInsert.rows[0];
};
