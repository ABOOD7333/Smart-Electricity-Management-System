import { Request, Response } from 'express';
import { query } from '../database/connection';
import { logAudit } from '../database/audit.utility';
import { AuthRequest } from '../middleware/auth.middleware';

export const getComplaints = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let q = `SELECT c.*, cust.full_name as customer_name, cust.customer_number, u.full_name as assigned_to_name
             FROM complaints c
             JOIN customers cust ON c.customer_id = cust.customer_id
             LEFT JOIN users u ON c.assigned_to = u.user_id`;
    let params: any[] = [];

    // إذا كان المستخدم مشتركاً، يتم تصفية الشكاوى لتخص حسابه فقط
    if (req.user?.role === 'customer') {
      q += ` WHERE c.customer_id = $1`;
      params.push(req.user.customer_id);
    }

    q += ` ORDER BY c.created_at DESC`;

    const result = await query(q, params);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب الشكاوى' });
  }
};

export const getComplaintById = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  try {
    const result = await query(
      `SELECT c.*, cust.full_name as customer_name, cust.customer_number, u.full_name as assigned_to_name
       FROM complaints c
       JOIN customers cust ON c.customer_id = cust.customer_id
       LEFT JOIN users u ON c.assigned_to = u.user_id
       WHERE c.complaint_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'الشكوى غير موجودة' });
      return;
    }

    const complaint = result.rows[0];

    // التحقق من ملكية المشترك للشكوى
    if (req.user?.role === 'customer' && req.user?.customer_id !== complaint.customer_id) {
      res.status(403).json({ success: false, message: 'غير مصرح لك بمشاهدة تفاصيل شكوى لا تخصك' });
      return;
    }

    res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};

export const createComplaint = async (req: AuthRequest, res: Response): Promise<void> => {
  let { customer_id, category, subject, description } = req.body;

  // إذا كان مشتركاً، نفرض معرف حسابه تلقائياً
  if (req.user?.role === 'customer') {
    customer_id = req.user.customer_id;
  }

  if (!customer_id || !subject || !description) {
    res.status(400).json({ success: false, message: 'يرجى إدخال الحقول المطلوبة' });
    return;
  }

  try {
    const result = await query(
      `INSERT INTO complaints (customer_id, category, subject, description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [customer_id, category || 'other', subject, description]
    );

    const newComplaint = result.rows[0];

    await logAudit({
      req,
      action: 'CREATE_COMPLAINT',
      tableName: 'complaints',
      recordId: newComplaint.complaint_id,
      newValues: newComplaint
    });

    res.status(201).json({ success: true, message: 'تم تسجيل الشكوى بنجاح', data: newComplaint });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إضافة الشكوى' });
  }
};

export const updateComplaintStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { status, resolution_notes, assigned_to } = req.body;

  try {
    const oldResult = await query('SELECT * FROM complaints WHERE complaint_id = $1', [id]);
    if (oldResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'الشكوى غير موجودة' });
      return;
    }
    const oldComplaint = oldResult.rows[0];

    const result = await query(
      `UPDATE complaints 
       SET status = COALESCE($1, status),
           resolution_notes = COALESCE($2, resolution_notes),
           assigned_to = COALESCE($3, assigned_to),
           updated_at = NOW()
       WHERE complaint_id = $4 RETURNING *`,
      [status, resolution_notes, assigned_to, id]
    );

    const updatedComplaint = result.rows[0];

    await logAudit({
      req,
      action: 'UPDATE_COMPLAINT',
      tableName: 'complaints',
      recordId: id,
      oldValues: oldComplaint,
      newValues: updatedComplaint
    });

    res.status(200).json({ success: true, message: 'تم تحديث الشكوى بنجاح', data: updatedComplaint });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحديث الشكوى' });
  }
};
