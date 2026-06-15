import { Response } from 'express';
import { query } from '../database/connection';
import { TenantRequest } from '../middleware/tenant.middleware';

// ===========================
// جلب جميع العملاء (مع عزل الشركة)
// ===========================
export const getAllCustomers = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, search, status, zone_id } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let conditions: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    // فرض عزل الشركات التام
    if (req.tenantId) {
      conditions.push(`c.company_id = $${paramIndex}`);
      params.push(req.tenantId);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(c.full_name ILIKE $${paramIndex} OR c.customer_number::TEXT LIKE $${paramIndex} OR c.phone_number LIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      conditions.push(`c.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (zone_id) {
      conditions.push(`c.zone_id = $${paramIndex}`);
      params.push(zone_id);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM customers c ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT 
        c.customer_id, c.customer_number, c.full_name, c.phone_number,
        c.status, c.customer_type, c.created_at,
        z.zone_name,
        m.meter_number,
        COALESCE((SELECT SUM(b.total_amount - b.amount_paid) 
                  FROM bills b WHERE b.customer_id = c.customer_id 
                  AND b.status != 'paid'), 0) AS total_debt
       FROM customers c
       LEFT JOIN zones z ON c.zone_id = z.zone_id
       LEFT JOIN meters m ON m.customer_id = c.customer_id AND m.status = 'active'
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, Number(limit), offset]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

// ===========================
// جلب عميل واحد بالتفصيل (مع عزل الشركة)
// ===========================
export const getCustomerById = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        c.*, z.zone_name,
        json_agg(DISTINCT jsonb_build_object(
          'meter_id', m.meter_id,
          'meter_number', m.meter_number,
          'cabinet_name', m.cabinet_name,
          'status', m.status
        )) FILTER (WHERE m.meter_id IS NOT NULL) AS meters,
        COALESCE(SUM(CASE WHEN b.status != 'paid' THEN b.total_amount - b.amount_paid ELSE 0 END), 0) AS total_debt,
        COUNT(DISTINCT b.bill_id) AS total_bills
       FROM customers c
       LEFT JOIN zones z ON c.zone_id = z.zone_id
       LEFT JOIN meters m ON m.customer_id = c.customer_id
       LEFT JOIN bills b ON b.customer_id = c.customer_id
       WHERE (c.customer_id = $1 OR c.customer_number::TEXT = $1) AND c.company_id = $2
       GROUP BY c.customer_id, z.zone_name`,
      [id, req.tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'العميل غير موجود أو لا ينتمي لشركتك' });
      return;
    }

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get customer details error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

// ===========================
// إضافة عميل جديد (مع عزل الشركة)
// ===========================
export const createCustomer = async (req: TenantRequest, res: Response): Promise<void> => {
  const {
    customer_number, full_name, phone_number, alternate_phone,
    national_id, address, zone_id, customer_type
  } = req.body;

  if (!customer_number || !full_name) {
    res.status(400).json({ success: false, message: 'رقم المشترك واسمه حقول إلزامية' });
    return;
  }

  try {
    // التحقق من عدم تكرار رقم المشترك داخل نفس الشركة
    const existing = await query(
      'SELECT customer_id FROM customers WHERE customer_number = $1 AND company_id = $2',
      [customer_number, req.tenantId]
    );

    if (existing.rows.length > 0) {
      res.status(409).json({ success: false, message: `رقم المشترك ${customer_number} موجود مسبقاً في هذه الشركة` });
      return;
    }

    const result = await query(
      `INSERT INTO customers 
        (customer_number, full_name, phone_number, alternate_phone, national_id, 
         address, zone_id, customer_type, registered_by, company_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [customer_number, full_name, phone_number, alternate_phone, national_id,
       address, zone_id, customer_type || 'commercial', req.user?.user_id, req.tenantId]
    );

    res.status(201).json({
      success: true,
      message: `تم إضافة المشترك ${full_name} بنجاح`,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

// ===========================
// تعديل بيانات عميل (مع عزل الشركة)
// ===========================
export const updateCustomer = async (req: TenantRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { full_name, phone_number, alternate_phone, address, zone_id, status } = req.body;

  try {
    const result = await query(
      `UPDATE customers SET
        full_name = COALESCE($1, full_name),
        phone_number = COALESCE($2, phone_number),
        alternate_phone = COALESCE($3, alternate_phone),
        address = COALESCE($4, address),
        zone_id = COALESCE($5, zone_id),
        status = COALESCE($6, status)
       WHERE customer_id = $7 AND company_id = $8
       RETURNING *`,
      [full_name, phone_number, alternate_phone, address, zone_id, status, id, req.tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'العميل غير موجود أو لا ينتمي لشركتك' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'تم تحديث بيانات العميل بنجاح',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

// ===========================
// فواتير عميل معين (مع عزل الشركة)
// ===========================
export const getCustomerBills = async (req: TenantRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT b.*, m.meter_number
       FROM bills b
       JOIN meters m ON b.meter_id = m.meter_id
       WHERE b.customer_id = $1 AND b.company_id = $2
       ORDER BY b.created_at DESC
       LIMIT 50`,
      [id, req.tenantId]
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get customer bills error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

// ===========================
// جلب جميع مناطق الشركة (مع عزل الشركة)
// ===========================
export const getZones = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      'SELECT zone_id, zone_name, zone_code FROM zones WHERE company_id = $1 ORDER BY zone_name ASC',
      [req.tenantId]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get zones error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

