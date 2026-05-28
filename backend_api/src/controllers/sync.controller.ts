import { Response } from 'express';
import { getClient, query } from '../database/connection';
import { processReading } from '../services/reading.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const syncOfflineData = async (req: AuthRequest, res: Response): Promise<void> => {
  const { readings, payments } = req.body;
  const user_id = req.user?.user_id;

  if (!readings && !payments) {
    res.status(400).json({ success: false, message: 'لا توجد بيانات للمزامنة' });
    return;
  }

  const client = await getClient();
  let syncResults = {
    readings: { success: 0, failed: 0 },
    payments: { success: 0, failed: 0 }
  };

  try {
    await client.query('BEGIN');

    // مزامنة القراءات
    if (readings && Array.isArray(readings)) {
      for (const reading of readings) {
        try {
          await processReading({
            meter_id: reading.meter_id,
            technician_id: user_id || '',
            current_reading: parseFloat(reading.current_reading),
            reading_date: reading.reading_date ? new Date(reading.reading_date) : undefined,
            gps_latitude: reading.gps_latitude ? parseFloat(reading.gps_latitude) : undefined,
            gps_longitude: reading.gps_longitude ? parseFloat(reading.gps_longitude) : undefined,
            reading_image_url: reading.reading_image_url,
            notes: reading.notes ? reading.notes + ' (Offline Sync)' : '(Offline Sync)'
          });
          syncResults.readings.success++;
        } catch (err) {
          console.error('Failed to sync reading:', err);
          syncResults.readings.failed++;
        }
      }
    }

    // مزامنة المدفوعات
    if (payments && Array.isArray(payments)) {
      for (const payment of payments) {
        try {
          await client.query(
            `INSERT INTO payments 
              (bill_id, customer_id, received_by, amount_paid, payment_method, payment_date)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              payment.bill_id, 
              payment.customer_id, 
              user_id, 
              payment.amount_paid, 
              payment.payment_method || 'cash', 
              payment.payment_date || new Date()
            ]
          );
          syncResults.payments.success++;
        } catch (err) {
          console.error('Failed to sync payment:', err);
          syncResults.payments.failed++;
        }
      }
    }

    await client.query('COMMIT');
    
    res.status(200).json({
      success: true,
      message: 'تمت المزامنة بنجاح',
      data: syncResults
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'حدث خطأ غير متوقع أثناء المزامنة' });
  } finally {
    client.release();
  }
};
