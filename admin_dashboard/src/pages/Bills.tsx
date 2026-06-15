import React, { useState, useEffect } from 'react';
import { Search, CreditCard, Eye } from 'lucide-react';
import client from '../api/client';
import Modal from '../components/Modal';

interface Bill {
  bill_id: string;
  invoice_number: string;
  billing_cycle: string;
  period_from: string;
  period_to: string;
  consumption_kwh: number;
  consumption_value: number;
  arrears: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  due_date: string;
  status: string;
  issue_date: string;
  customer_number: string;
  full_name: string;
  phone_number: string;
  meter_number: string;
  cabinet_name: string;
}

const Bills: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // Search & Filter state
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Modals state
  const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [billPayments, setBillPayments] = useState<any[]>([]);

  // Form states
  const [paymentData, setPaymentData] = useState({
    amount_paid: '',
    payment_method: 'cash',
    reference_number: '',
    notes: '',
  });

  const [formError, setFormError] = useState<string>('');
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchBills();
  }, [search, statusFilter, page]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const response = await client.get('/bills', {
        params: {
          search, // Actually getAllBills usesreq.query.customer_id, status, from_date, to_date. Wait, let's pass search and status
          status: statusFilter,
          page,
          limit: 10
        }
      });
      if (response.data.success) {
        setBills(response.data.data);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (err) {
      console.error(err);
      setError('فشل تحميل قائمة الفواتير');
    } finally {
      setLoading(false);
    }
  };

  const handleBillClick = async (bill: Bill) => {
    setSelectedBill(bill);
    setIsDetailModalOpen(true);
    try {
      const response = await client.get(`/bills/${bill.bill_id}`);
      if (response.data.success) {
        setBillPayments(response.data.data.payments || []);
      }
    } catch (err) {
      console.error('Failed to fetch bill details', err);
    }
  };

  const handlePayClick = (bill: Bill) => {
    setSelectedBill(bill);
    setPaymentData({
      amount_paid: bill.balance_due.toString(),
      payment_method: 'cash',
      reference_number: '',
      notes: '',
    });
    setIsPayModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;
    
    setFormError('');
    setSubmitLoading(true);

    try {
      const response = await client.post(`/bills/${selectedBill.bill_id}/pay`, {
        amount_paid: parseFloat(paymentData.amount_paid),
        payment_method: paymentData.payment_method,
        reference_number: paymentData.reference_number,
        notes: paymentData.notes,
      });

      if (response.data.success) {
        setIsPayModalOpen(false);
        fetchBills();
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'حدث خطأ أثناء تسجيل الدفعة المالية');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <span className="badge badge-success">مدفوعة</span>;
      case 'unpaid': return <span className="badge badge-danger">غير مدفوعة</span>;
      case 'partially_paid': return <span className="badge badge-warning">مدفوعة جزئياً</span>;
      case 'cancelled': return <span className="badge badge-secondary">ملغاة</span>;
      default: return <span className="badge badge-info">{status}</span>;
    }
  };

  const getMethodText = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'cash': return 'نقداً';
      case 'bank_transfer': return 'حوالة مصرفية';
      case 'online': return 'دفع إلكتروني';
      default: return method;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header-actions">
        <div className="page-title-section">
          <h2 className="page-title">إدارة الفواتير والمدفوعات</h2>
          <p className="page-subtitle">تتبع الفواتير الصادرة للمشتركين وتحصيل المستحقات المالية</p>
        </div>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

      {/* Search and Filter Bar */}
      <div className="glass-card search-filter-bar">
        <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} style={{ position: 'absolute', right: '14px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="البحث برقم الفاتورة، أو معايير أخرى..."
            style={{ paddingRight: '40px' }}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="filter-select-wrapper">
          <select 
            className="form-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">كل حالات السداد</option>
            <option value="paid">مدفوعة</option>
            <option value="unpaid">غير مدفوعة</option>
            <option value="partially_paid">مدفوعة جزئياً</option>
          </select>
        </div>
      </div>

      {/* Bills Table */}
      <div className="glass-card">
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>جاري تحميل الفواتير...</p>
        ) : (
          <>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>رقم الفاتورة</th>
                    <th>المشترك</th>
                    <th>رقم العميل</th>
                    <th>الاستهلاك (كيلوواط)</th>
                    <th>قيمة الاستهلاك</th>
                    <th>المبلغ الإجمالي</th>
                    <th>المسدد</th>
                    <th>المتبقي</th>
                    <th>تاريخ الاستحقاق</th>
                    <th>الحالة</th>
                    <th>العمليات</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        لا توجد فواتير مطابقة لخيارات الفلترة
                      </td>
                    </tr>
                  ) : (
                    bills.map((bill) => (
                      <tr key={bill.bill_id}>
                        <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{bill.invoice_number}</td>
                        <td style={{ fontWeight: 500 }}>{bill.full_name}</td>
                        <td>{bill.customer_number}</td>
                        <td>{bill.consumption_kwh} ك.و.س</td>
                        <td>${Number(bill.consumption_value).toLocaleString()}</td>
                        <td style={{ fontWeight: 600 }}>${Number(bill.total_amount).toLocaleString()}</td>
                        <td style={{ color: 'var(--accent-success)' }}>${Number(bill.amount_paid).toLocaleString()}</td>
                        <td style={{ color: bill.balance_due > 0 ? 'var(--accent-error)' : 'inherit' }}>
                          ${Number(bill.balance_due).toLocaleString()}
                        </td>
                        <td>{new Date(bill.due_date).toLocaleDateString('ar-YE')}</td>
                        <td>{getStatusBadge(bill.status)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => handleBillClick(bill)} title="عرض التفاصيل">
                              <Eye size={14} />
                            </button>
                            {bill.status !== 'paid' && (
                              <button className="btn btn-primary" style={{ padding: '6px 10px' }} onClick={() => handlePayClick(bill)} title="تسجيل سداد">
                                <CreditCard size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >السابق</button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '13px' }}>
                  صفحة {page} من {totalPages}
                </span>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >التالي</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal: Bill Details */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="تفاصيل الفاتورة" size="lg">
        {selectedBill && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
              <div>
                <h4 style={{ color: 'var(--accent-cyan)', marginBottom: '8px' }}>معلومات الفاتورة</h4>
                <p style={{ fontSize: '13px', margin: '4px 0' }}><strong>رقم الفاتورة:</strong> {selectedBill.invoice_number}</p>
                <p style={{ fontSize: '13px', margin: '4px 0' }}><strong>تاريخ الإصدار:</strong> {new Date(selectedBill.issue_date).toLocaleDateString('ar-YE')}</p>
                <p style={{ fontSize: '13px', margin: '4px 0' }}><strong>تاريخ الاستحقاق:</strong> {new Date(selectedBill.due_date).toLocaleDateString('ar-YE')}</p>
                <p style={{ fontSize: '13px', margin: '4px 0' }}><strong>حلقة الفوترة:</strong> {selectedBill.billing_cycle}</p>
                <p style={{ fontSize: '13px', margin: '4px 0' }}><strong>الفترة:</strong> من {new Date(selectedBill.period_from).toLocaleDateString('ar-YE')} إلى {new Date(selectedBill.period_to).toLocaleDateString('ar-YE')}</p>
              </div>
              <div>
                <h4 style={{ color: 'var(--accent-cyan)', marginBottom: '8px' }}>تفاصيل المشترك والعداد</h4>
                <p style={{ fontSize: '13px', margin: '4px 0' }}><strong>المشترك:</strong> {selectedBill.full_name}</p>
                <p style={{ fontSize: '13px', margin: '4px 0' }}><strong>رقم العميل:</strong> {selectedBill.customer_number}</p>
                <p style={{ fontSize: '13px', margin: '4px 0' }}><strong>رقم العداد:</strong> {selectedBill.meter_number}</p>
                <p style={{ fontSize: '13px', margin: '4px 0' }}><strong>كابينة التوزيع:</strong> {selectedBill.cabinet_name || 'غير محددة'}</p>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: 'var(--accent-cyan)', marginBottom: '12px' }}>الحساب المالي للاستهلاك</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>الاستهلاك (كيلوواط ساعة)</span>
                  <p style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{selectedBill.consumption_kwh} ك.و.س</p>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>قيمة الاستهلاك الحالي</span>
                  <p style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>${Number(selectedBill.consumption_value).toLocaleString()}</p>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>المتأخرات السابقة</span>
                  <p style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px', color: 'var(--accent-warning)' }}>${Number(selectedBill.arrears).toLocaleString()}</p>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>المبلغ الإجمالي المستحق</span>
                  <p style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px', color: 'var(--accent-cyan)' }}>${Number(selectedBill.total_amount).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ color: 'var(--accent-cyan)', marginBottom: '12px' }}>سجل المدفوعات المستلمة على الفاتورة</h4>
              {billPayments.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
                  لم يتم تسجيل أي عمليات سداد لهذه الفاتورة بعد.
                </p>
              ) : (
                <div className="table-container">
                  <table className="custom-table" style={{ fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th>رقم السداد</th>
                        <th>المبلغ المدفوع</th>
                        <th>طريقة الدفع</th>
                        <th>رقم المرجع (الرقم الدفتري/الحوالة)</th>
                        <th>تاريخ السداد</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billPayments.map((pay, i) => (
                        <tr key={i}>
                          <td style={{ color: 'var(--accent-cyan)' }}>{pay.payment_id || i + 1}</td>
                          <td style={{ fontWeight: 600, color: 'var(--accent-success)' }}>${Number(pay.amount_paid).toLocaleString()}</td>
                          <td>{getMethodText(pay.payment_method)}</td>
                          <td>{pay.reference_number || <span style={{ color: 'var(--text-muted)' }}>لا يوجد</span>}</td>
                          <td>{pay.payment_date ? new Date(pay.payment_date).toLocaleString('ar-YE') : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn btn-secondary" onClick={() => setIsDetailModalOpen(false)}>إغلاق</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Record Payment */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="تسجيل سداد مالي">
        {formError && <div className="alert-error">{formError}</div>}
        {selectedBill && (
          <form onSubmit={handlePaymentSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '13px' }}><strong>المشترك:</strong> {selectedBill.full_name}</p>
              <p style={{ fontSize: '13px' }}><strong>رقم الفاتورة:</strong> {selectedBill.invoice_number}</p>
              <p style={{ fontSize: '13px' }}><strong>المبلغ المستحق حالياً:</strong> <span style={{ color: 'var(--accent-error)', fontWeight: 700 }}>${Number(selectedBill.balance_due).toLocaleString()}</span></p>
            </div>

            <div className="form-group">
              <label className="form-label">المبلغ المدفوع ($)</label>
              <input 
                type="number" 
                step="0.01"
                className="form-input" 
                placeholder="أدخل قيمة المبلغ المسدد"
                value={paymentData.amount_paid}
                onChange={(e) => setPaymentData(prev => ({ ...prev, amount_paid: e.target.value }))}
                required
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ملاحظة: سيتم توزيع المبلغ على الفواتير المستحقة الأقدم أولاً للمشترك تلقائياً</span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">طريقة الدفع</label>
                <select 
                  className="form-select"
                  value={paymentData.payment_method}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, payment_method: e.target.value }))}
                >
                  <option value="cash">نقداً</option>
                  <option value="bank_transfer">حوالة مصرفية</option>
                  <option value="online">دفع إلكتروني</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">الرقم المرجعي (السند / الحوالة)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="رقم السند الدفتري أو الحوالة"
                  value={paymentData.reference_number}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, reference_number: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">ملاحظات إضافية</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="أي ملاحظات حول السداد"
                value={paymentData.notes}
                onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsPayModalOpen(false)}>إلغاء</button>
              <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                {submitLoading ? 'جاري تسجيل الدفعة...' : 'تأكيد عملية السداد'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Bills;
