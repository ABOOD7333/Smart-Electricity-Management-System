import React, { useState, useEffect } from 'react';
import { Edit3 } from 'lucide-react';
import client from '../api/client';
import Modal from '../components/Modal';

interface Complaint {
  complaint_id: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  resolution_notes: string | null;
  created_at: string;
  customer_name: string;
  customer_number: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
}

interface User {
  user_id: string;
  full_name: string;
  role: string;
}

const Complaints: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Modals state
  const [isResolveModalOpen, setIsResolveModalOpen] = useState<boolean>(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Form states
  const [resolveData, setResolveData] = useState({
    status: 'in_progress',
    resolution_notes: '',
    assigned_to: '',
  });

  const [formError, setFormError] = useState<string>('');
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchComplaints();
    fetchEmployees();
  }, [statusFilter]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await client.get('/complaints');
      if (response.data.success) {
        let data = response.data.data;
        if (statusFilter) {
          data = data.filter((c: Complaint) => c.status === statusFilter);
        }
        setComplaints(data);
      }
    } catch (err) {
      console.error(err);
      setError('فشل تحميل قائمة الشكاوى والبلاغات');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await client.get('/users');
      if (response.data.success) {
        // Only get supervisors and technicians
        const eligible = response.data.data.filter((u: User) => 
          ['technician', 'supervisor'].includes(u.role.toLowerCase())
        );
        setEmployees(eligible);
      }
    } catch (err) {
      console.error('Failed to fetch employees', err);
    }
  };

  const handleResolveClick = (comp: Complaint) => {
    setSelectedComplaint(comp);
    setResolveData({
      status: comp.status,
      resolution_notes: comp.resolution_notes || '',
      assigned_to: comp.assigned_to || '',
    });
    setIsResolveModalOpen(true);
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setFormError('');
    setSubmitLoading(true);

    try {
      const payload = {
        status: resolveData.status,
        resolution_notes: resolveData.resolution_notes,
        assigned_to: resolveData.assigned_to || null,
      };

      const response = await client.put(`/complaints/${selectedComplaint.complaint_id}`, payload);
      if (response.data.success) {
        setIsResolveModalOpen(false);
        fetchComplaints();
        alert('تم تحديث حالة البلاغ بنجاح');
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'حدث خطأ أثناء معالجة الشكوى');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <span className="badge badge-danger">جديد</span>;
      case 'in_progress': return <span className="badge badge-warning">قيد المتابعة</span>;
      case 'resolved': return <span className="badge badge-success">تم الحل</span>;
      case 'closed': return <span className="badge badge-secondary">مغلق</span>;
      default: return <span className="badge badge-info">{status}</span>;
    }
  };

  const getCategoryText = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'billing': return 'الفواتير والحسابات';
      case 'power_cut': return 'انقطاع التيار الكهربائي';
      case 'meter_leak': return 'خلل/تهريب في العداد';
      case 'unsafe_setup': return 'تمديدات غير آمنة';
      case 'other': return 'أخرى / عامة';
      default: return cat;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header-actions">
        <div className="page-title-section">
          <h2 className="page-title">البلاغات والشكاوى</h2>
          <p className="page-subtitle">استقبال الشكاوى الفنية والمالية المقدمة من المشتركين ومتابعة حلها</p>
        </div>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

      {/* Filter Bar */}
      <div className="glass-card search-filter-bar">
        <div className="filter-select-wrapper">
          <select 
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">كل حالات الشكاوى</option>
            <option value="new">بلاغات جديدة</option>
            <option value="in_progress">قيد المتابعة</option>
            <option value="resolved">تم حلها</option>
          </select>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="glass-card">
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>جاري تحميل البلاغات...</p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>المشترك</th>
                  <th>الفئة</th>
                  <th>الموضوع</th>
                  <th>تفاصيل الشكوى</th>
                  <th>الموظف المتابع</th>
                  <th>تاريخ التقديم</th>
                  <th>الحالة</th>
                  <th>العمليات</th>
                </tr>
              </thead>
              <tbody>
                {complaints.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      لا توجد شكاوى مسجلة حالياً تطابق الفلترة
                    </td>
                  </tr>
                ) : (
                  complaints.map((comp) => (
                    <tr key={comp.complaint_id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{comp.customer_name}</div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>رقم: {comp.customer_number}</span>
                      </td>
                      <td style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{getCategoryText(comp.category)}</td>
                      <td style={{ fontWeight: 500 }}>{comp.subject}</td>
                      <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={comp.description}>
                        {comp.description}
                      </td>
                      <td>
                        {comp.assigned_to_name ? (
                          <span style={{ fontSize: '13px' }}>{comp.assigned_to_name}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>غير معيّن</span>
                        )}
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        {new Date(comp.created_at).toLocaleString('ar-YE')}
                      </td>
                      <td>{getStatusBadge(comp.status)}</td>
                      <td>
                        <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => handleResolveClick(comp)} title="متابعة وحل الشكوى">
                          <Edit3 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Resolve / Assign Complaint */}
      <Modal isOpen={isResolveModalOpen} onClose={() => setIsResolveModalOpen(false)} title="معالجة وحل الشكوى">
        {formError && <div className="alert-error">{formError}</div>}
        {selectedComplaint && (
          <form onSubmit={handleResolveSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', border: '1px solid var(--border-color)', fontSize: '13px' }}>
              <p><strong>المشترك:</strong> {selectedComplaint.customer_name} ({selectedComplaint.customer_number})</p>
              <p><strong>نوع البلاغ:</strong> {getCategoryText(selectedComplaint.category)}</p>
              <p><strong>الموضوع:</strong> {selectedComplaint.subject}</p>
              <p><strong>شرح المشكلة:</strong> {selectedComplaint.description}</p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">حالة البلاغ</label>
                <select 
                  className="form-select"
                  value={resolveData.status}
                  onChange={(e) => setResolveData(prev => ({ ...prev, status: e.target.value }))}
                  required
                >
                  <option value="new">جديد</option>
                  <option value="in_progress">قيد المتابعة والمعالجة</option>
                  <option value="resolved">تم الحل بنجاح</option>
                  <option value="closed">مغلق دون إجراء</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">تعيين موظف للمتابعة فنية</label>
                <select 
                  className="form-select"
                  value={resolveData.assigned_to}
                  onChange={(e) => setResolveData(prev => ({ ...prev, assigned_to: e.target.value }))}
                >
                  <option value="">اختر الموظف...</option>
                  {employees.map(emp => (
                    <option key={emp.user_id} value={emp.user_id}>{emp.full_name} ({emp.role === 'technician' ? 'فني' : 'مشرف'})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">إجراءات الحل والرد على البلاغ</label>
              <textarea 
                className="form-input" 
                rows={4}
                style={{ resize: 'none', height: '100px' }}
                placeholder="أدخل تفاصيل ما تم اتخاذه من إجراءات لحل المشكلة أو الرد على المشترك"
                value={resolveData.resolution_notes}
                onChange={(e) => setResolveData(prev => ({ ...prev, resolution_notes: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsResolveModalOpen(false)}>إلغاء</button>
              <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                {submitLoading ? 'جاري حفظ التغييرات...' : 'حفظ التحديثات'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Complaints;
