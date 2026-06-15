import React, { useState, useEffect } from 'react';
import { Search, Edit2, UserPlus } from 'lucide-react';
import client from '../api/client';
import Modal from '../components/Modal';

interface Customer {
  customer_id: string;
  customer_number: string;
  full_name: string;
  phone_number: string;
  status: string;
  customer_type: string;
  created_at: string;
  zone_name: string | null;
  meter_number: string | null;
  total_debt: number;
}

interface Zone {
  zone_id: string;
  zone_name: string;
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // Search & Filter state
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [zoneFilter, setZoneFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    customer_number: '',
    full_name: '',
    phone_number: '',
    alternate_phone: '',
    national_id: '',
    address: '',
    zone_id: '',
    customer_type: 'residential',
  });

  const [editFormData, setEditFormData] = useState({
    full_name: '',
    phone_number: '',
    alternate_phone: '',
    address: '',
    zone_id: '',
    status: 'active',
  });

  const [formError, setFormError] = useState<string>('');
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchCustomers();
    fetchZones();
  }, [search, statusFilter, zoneFilter, page]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await client.get('/customers', {
        params: {
          search,
          status: statusFilter,
          zone_id: zoneFilter,
          page,
          limit: 10
        }
      });
      if (response.data.success) {
        setCustomers(response.data.data);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (err) {
      console.error(err);
      setError('فشل تحميل قائمة المشتركين');
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      const response = await client.get('/customers/zones');
      if (response.data.success) {
        setZones(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch zones', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitLoading(true);

    try {
      const response = await client.post('/customers', formData);
      if (response.data.success) {
        setIsAddModalOpen(false);
        // Reset form
        setFormData({
          customer_number: '',
          full_name: '',
          phone_number: '',
          alternate_phone: '',
          national_id: '',
          address: '',
          zone_id: '',
          customer_type: 'residential',
        });
        fetchCustomers();
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'حدث خطأ أثناء إضافة المشترك');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditClick = (cust: Customer) => {
    setSelectedCustomer(cust);
    setEditFormData({
      full_name: cust.full_name,
      phone_number: cust.phone_number,
      alternate_phone: '', // alternat_phone not in list, fallback
      address: '',
      zone_id: '',
      status: cust.status,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    
    setFormError('');
    setSubmitLoading(true);

    try {
      const response = await client.put(`/customers/${selectedCustomer.customer_id}`, editFormData);
      if (response.data.success) {
        setIsEditModalOpen(false);
        fetchCustomers();
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'حدث خطأ أثناء تعديل بيانات المشترك');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="badge badge-success">نشط</span>;
      case 'disconnected': return <span className="badge badge-danger">مفصول</span>;
      case 'suspended': return <span className="badge badge-warning">معلق</span>;
      default: return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header-actions">
        <div className="page-title-section">
          <h2 className="page-title">إدارة المشتركين</h2>
          <p className="page-subtitle">عرض وإضافة وتعديل بيانات العملاء في شركة الكهرباء</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <UserPlus size={18} />
          <span>إضافة مشترك جديد</span>
        </button>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

      {/* Search and Filter Bar */}
      <div className="glass-card search-filter-bar">
        <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} style={{ position: 'absolute', right: '14px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="بحث بالاسم، رقم المشترك، الهاتف..."
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
            <option value="">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="disconnected">مفصول</option>
          </select>
        </div>

        <div className="filter-select-wrapper">
          <select 
            className="form-select"
            value={zoneFilter}
            onChange={(e) => { setZoneFilter(e.target.value); setPage(1); }}
          >
            <option value="">كل المناطق</option>
            {zones.map(z => (
              <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="glass-card">
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>جاري تحميل البيانات...</p>
        ) : (
          <>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>رقم المشترك</th>
                    <th>الاسم الكامل</th>
                    <th>الهاتف</th>
                    <th>المنطقة</th>
                    <th>رقم العداد</th>
                    <th>المديونية</th>
                    <th>الحالة</th>
                    <th>العمليات</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        لا يوجد أي مشتركين يطابقون خيارات البحث
                      </td>
                    </tr>
                  ) : (
                    customers.map((cust) => (
                      <tr key={cust.customer_id}>
                        <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{cust.customer_number}</td>
                        <td style={{ fontWeight: 500 }}>{cust.full_name}</td>
                        <td>{cust.phone_number}</td>
                        <td>{cust.zone_name || 'غير محدد'}</td>
                        <td>{cust.meter_number || <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>بلا عداد</span>}</td>
                        <td style={{ color: cust.total_debt > 0 ? 'var(--accent-error)' : 'inherit', fontWeight: cust.total_debt > 0 ? 600 : 'normal' }}>
                          ${Number(cust.total_debt).toLocaleString()}
                        </td>
                        <td>{getStatusBadge(cust.status)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => handleEditClick(cust)} title="تعديل البيانات">
                              <Edit2 size={14} />
                            </button>
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

      {/* Modal: Add Customer */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="إضافة مشترك جديد">
        {formError && <div className="alert-error">{formError}</div>}
        <form onSubmit={handleAddSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">رقم المشترك (رقم الحساب/العداد)</label>
              <input 
                type="text" 
                className="form-input" 
                name="customer_number" 
                placeholder="مثال: 2026101"
                value={formData.customer_number} 
                onChange={handleInputChange} 
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">الاسم الكامل للمشترك</label>
              <input 
                type="text" 
                className="form-input" 
                name="full_name" 
                placeholder="أدخل الاسم الرباعي"
                value={formData.full_name} 
                onChange={handleInputChange} 
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">رقم الهاتف الأساسي</label>
              <input 
                type="text" 
                className="form-input" 
                name="phone_number" 
                placeholder="مثال: 777123456"
                value={formData.phone_number} 
                onChange={handleInputChange} 
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">رقم هاتف بديل (اختياري)</label>
              <input 
                type="text" 
                className="form-input" 
                name="alternate_phone" 
                placeholder="مثال: 777987654"
                value={formData.alternate_phone} 
                onChange={handleInputChange} 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">المنطقة الجغرافية</label>
              <select 
                className="form-select" 
                name="zone_id"
                value={formData.zone_id} 
                onChange={handleInputChange}
                required
              >
                <option value="">اختر المنطقة</option>
                {zones.map(z => (
                  <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">نوع الاشتراك</label>
              <select 
                className="form-select" 
                name="customer_type"
                value={formData.customer_type} 
                onChange={handleInputChange}
              >
                <option value="residential">منزلي</option>
                <option value="commercial">تجاري</option>
                <option value="industrial">صناعي</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">الرقم الوطني / الهوية الشخصية</label>
            <input 
              type="text" 
              className="form-input" 
              name="national_id" 
              placeholder="رقم البطاقة الشخصية أو جواز السفر"
              value={formData.national_id} 
              onChange={handleInputChange} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">العنوان بالتفصيل</label>
            <input 
              type="text" 
              className="form-input" 
              name="address" 
              placeholder="مثال: صنعاء - حي الأصبحي - شارع المقالح"
              value={formData.address} 
              onChange={handleInputChange} 
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>إلغاء</button>
            <button type="submit" className="btn btn-primary" disabled={submitLoading}>
              {submitLoading ? 'جاري الإضافة...' : 'حفظ المشترك'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Customer */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="تعديل بيانات المشترك">
        {formError && <div className="alert-error">{formError}</div>}
        <form onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label className="form-label">الاسم الكامل للمشترك</label>
            <input 
              type="text" 
              className="form-input" 
              name="full_name" 
              value={editFormData.full_name} 
              onChange={handleEditInputChange} 
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">رقم الهاتف</label>
              <input 
                type="text" 
                className="form-input" 
                name="phone_number" 
                value={editFormData.phone_number} 
                onChange={handleEditInputChange} 
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">حالة الحساب</label>
              <select 
                className="form-select" 
                name="status"
                value={editFormData.status} 
                onChange={handleEditInputChange}
              >
                <option value="active">نشط</option>
                <option value="disconnected">مفصول (فصل الخدمة)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">المنطقة الجغرافية</label>
            <select 
              className="form-select" 
              name="zone_id"
              value={editFormData.zone_id} 
              onChange={handleEditInputChange}
            >
              <option value="">ابقاء بدون تغيير</option>
              {zones.map(z => (
                <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">العنوان</label>
            <input 
              type="text" 
              className="form-input" 
              name="address" 
              value={editFormData.address} 
              onChange={handleEditInputChange} 
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>إلغاء</button>
            <button type="submit" className="btn btn-primary" disabled={submitLoading}>
              {submitLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Customers;
