import { Request, Response } from 'express';
import { query, getClient } from '../database/connection';
import { generateBillForReading } from '../services/billing.service';

// ===========================
// جلب جميع الفواتير (مع عزل الشركة)
// ===========================
export const getAllBills = async (req: any, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, customer_id, from_date, to_date } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let conditions: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    // [CRIT-03] فرض عزل الشركة دائماً
    const companyId = req.tenantId;
    if (companyId) {
      conditions.push(`b.company_id = $${paramIndex++}`);
      params.push(companyId);
    }

    if (status) { conditions.push(`b.status = $${paramIndex++}`); params.push(status); }
    if (customer_id) { conditions.push(`b.customer_id = $${paramIndex++}`); params.push(customer_id); }
    if (from_date) { conditions.push(`b.issue_date >= $${paramIndex++}`); params.push(from_date); }
    if (to_date) { conditions.push(`b.issue_date <= $${paramIndex++}`); params.push(to_date); }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(`SELECT COUNT(*) FROM bills b ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT 
        b.bill_id, b.invoice_number, b.billing_cycle, b.period_from, b.period_to,
        b.consumption_kwh, b.consumption_value, b.arrears, b.total_amount,
        b.amount_paid, b.balance_due, b.due_date, b.status, b.issue_date,
        c.customer_number, c.full_name, c.phone_number,
        m.meter_number, m.cabinet_name
       FROM bills b
       JOIN customers c ON b.customer_id = c.customer_id
       JOIN meters m ON b.meter_id = m.meter_id
       ${whereClause}
       ORDER BY b.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, Number(limit), offset]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

// ===========================
// جلب فاتورة واحدة كاملة (مع عزل الشركة)
// ===========================
export const getBillById = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // [CRIT-05] إضافة فلتر company_id لمنع الوصول لفواتير شركات أخرى
    const companyId = req.tenantId;

    const result = await query(
      `SELECT 
        b.*,
        c.customer_number, c.full_name, c.phone_number, c.address,
        m.meter_number, m.cabinet_name,
        json_agg(DISTINCT jsonb_build_object(
          'payment_id', p.payment_id,
          'amount_paid', p.amount_paid,
          'payment_method', p.payment_method,
          'reference_number', p.reference_number,
          'payment_date', p.payment_date
        )) FILTER (WHERE p.payment_id IS NOT NULL) AS payments
       FROM bills b
       JOIN customers c ON b.customer_id = c.customer_id
       JOIN meters m ON b.meter_id = m.meter_id
       LEFT JOIN payments p ON p.bill_id = b.bill_id
       WHERE (b.bill_id = $1 OR b.invoice_number::TEXT = $1)
         AND ($2::uuid IS NULL OR b.company_id = $2)
       GROUP BY b.bill_id, c.customer_number, c.full_name, c.phone_number, c.address, m.meter_number, m.cabinet_name`,
      [id, companyId || null]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'الفاتورة غير موجودة أو لا تنتمي لشركتك' });
      return;
    }

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

// ===========================
// إنشاء فاتورة جديدة (من القراءة)
// ===========================
export const createBill = async (req: any, res: Response): Promise<void> => {
  const { reading_id } = req.body;

  if (!reading_id) {
    res.status(400).json({ success: false, message: 'رقم القراءة مطلوب لإصدار الفاتورة' });
    return;
  }

  try {
    const bill = await generateBillForReading(reading_id, req.user?.user_id);

    res.status(201).json({
      success: true,
      message: `تم إنشاء الفاتورة رقم ${bill.invoice_number} بنجاح`,
      data: bill,
    });
  } catch (error: any) {
    console.error('Create bill error:', error);
    res.status(400).json({ success: false, message: error.message || 'حدث خطأ في إنشاء الفاتورة' });
  }
};

// ===========================
// تسجيل دفعة على فاتورة
// ===========================
export const recordPayment = async (req: any, res: Response): Promise<void> => {
  const { id } = req.params;
  const { amount_paid, payment_method, reference_number, notes } = req.body;

  if (!amount_paid || amount_paid <= 0) {
    res.status(400).json({ success: false, message: 'يرجى إدخال مبلغ صحيح' });
    return;
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // [HIGH-06] جلب الفاتورة مع التحقق من ملكية الشركة
    const companyId = (req as any).tenantId;
    const billResult = await client.query(
      `SELECT * FROM bills WHERE (bill_id = $1 OR invoice_number::TEXT = $1)
       AND ($2::uuid IS NULL OR company_id = $2) FOR UPDATE`,
      [id, companyId || null]
    );

    if (billResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'الفاتورة غير موجودة أو لا تنتمي لشركتك' });
      await client.query('ROLLBACK');
      return;
    }

    const targetBill = billResult.rows[0];
    const customerId = targetBill.customer_id;

    // التحقق من ملكية المشترك للفاتورة
    if (req.user?.role === 'customer' && req.user?.customer_id !== customerId) {
      res.status(403).json({ success: false, message: 'غير مصرح لك بسداد فاتورة لا تخص حسابك' });
      await client.query('ROLLBACK');
      return;
    }

    // جلب جميع الفواتير غير المدفوعة للمشترك في نفس الشركة
    const unpaidBillsResult = await client.query(
      `SELECT * FROM bills 
       WHERE customer_id = $1 AND company_id = $2 AND status IN ('unpaid', 'partially_paid') 
       ORDER BY invoice_number ASC FOR UPDATE`,
      [customerId, targetBill.company_id]
    );

    if (unpaidBillsResult.rows.length === 0) {
      res.status(400).json({ success: false, message: 'لا توجد فواتير مستحقة سداد غير مدفوعة لهذا المشترك' });
      await client.query('ROLLBACK');
      return;
    }

    let remainingPayment = Number(amount_paid);
    const paymentsCreated = [];

    for (const bill of unpaidBillsResult.rows) {
      if (remainingPayment <= 0) break;

      const billTotal = Number(bill.total_amount);
      const billPaid = Number(bill.amount_paid);
      const billRemaining = billTotal - billPaid;

      if (billRemaining <= 0) continue;

      const allocation = Math.min(remainingPayment, billRemaining);
      const newPaid = billPaid + allocation;
      const newStatus = newPaid >= billTotal ? 'paid' : 'partially_paid';

      // تحديث الفاتورة
      await client.query(
        'UPDATE bills SET amount_paid = $1, status = $2 WHERE bill_id = $3',
        [newPaid, newStatus, bill.bill_id]
      );

      // تسجيل الدفعة لهذه الفاتورة
      const paymentRes = await client.query(
        `INSERT INTO payments (bill_id, customer_id, received_by, amount_paid, payment_method, reference_number, notes, company_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [bill.bill_id, customerId, req.user?.user_id, allocation, payment_method || 'cash', reference_number, notes, targetBill.company_id]
      );
      paymentsCreated.push(paymentRes.rows[0]);

      remainingPayment -= allocation;
    }

    // إذا كان هناك مبلغ متبقي (دفع زائد)، يتم إضافته كدفعة مقدمة لآخر فاتورة
    if (remainingPayment > 0) {
      const lastBill = unpaidBillsResult.rows[unpaidBillsResult.rows.length - 1];
      const newPaid = Number(lastBill.amount_paid) + remainingPayment;
      
      await client.query(
        'UPDATE bills SET amount_paid = $1 WHERE bill_id = $2',
        [newPaid, lastBill.bill_id]
      );
      
      const paymentRes = await client.query(
        `INSERT INTO payments (bill_id, customer_id, received_by, amount_paid, payment_method, reference_number, notes, company_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [lastBill.bill_id, customerId, req.user?.user_id, remainingPayment, payment_method || 'cash', reference_number, 'دفعة زائدة (رصيد دائن): ' + (notes || ''), targetBill.company_id]
      );
      paymentsCreated.push(paymentRes.rows[0]);
    }

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: `تم تسجيل الدفعة بنجاح وتوزيعها على الفواتير المستحقة`,
      data: paymentsCreated,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ success: false, message: 'حدث خطأ في تسجيل الدفعة' });
  } finally {
    client.release();
  }
};

// ===========================
// إحصائيات لوحة التحكم (مع عزل الشركة)
// ===========================
export const getDashboardStats = async (req: any, res: Response): Promise<void> => {
  try {
    // [CRIT-03] عزل الإحصائيات بالشركة — كل شركة ترى بياناتها فقط
    const companyId = req.tenantId;
    const companyFilter = companyId ? `WHERE company_id = '${companyId}'` : '';
    const billsCompanyFilter = companyId ? `WHERE b.company_id = '${companyId}'` : '';

    const [billsStats, customersStats, recentBills] = await Promise.all([
      query(`SELECT
        COUNT(*) FILTER (WHERE status = 'unpaid') AS unpaid_count,
        COUNT(*) FILTER (WHERE status = 'paid') AS paid_count,
        COUNT(*) FILTER (WHERE status = 'partially_paid') AS partial_count,
        SUM(balance_due) FILTER (WHERE status != 'paid' AND status != 'cancelled') AS total_unpaid_amount,
        SUM(amount_paid) AS total_collected,
        COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'paid') AS overdue_count
       FROM bills ${companyFilter}`),
      query(`SELECT
        COUNT(*) AS total_customers,
        COUNT(*) FILTER (WHERE status = 'active') AS active_customers,
        COUNT(*) FILTER (WHERE status = 'disconnected') AS disconnected_customers
       FROM customers ${companyFilter}`),
      query(`SELECT b.invoice_number, b.total_amount, b.status, b.issue_date,
              c.full_name, c.customer_number
             FROM bills b JOIN customers c ON b.customer_id = c.customer_id
             ${billsCompanyFilter}
             ORDER BY b.created_at DESC LIMIT 5`),
    ]);

    res.status(200).json({
      success: true,
      data: {
        bills: billsStats.rows[0],
        customers: customersStats.rows[0],
        recent_bills: recentBills.rows,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};
