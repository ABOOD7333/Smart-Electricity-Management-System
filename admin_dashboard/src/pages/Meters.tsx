import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2 } from 'lucide-react';
import client from '../api/client';
import Modal from '../components/Modal';

interface Meter {
  meter_id: string;
  meter_number: string;
  cabinet_name: string | null;
  status: string;
  installation_date: string;
  gps_latitude: number | null;
  gps_longitude: number | null;
  customer_id: string;
  customer_number: string;
  full_name: string;
  phone_number: string;
  zone_name: string | null;
  last_reading: number | null;
  last_reading_date: string | null;
}

interface Customer {
  customer_id: string;
  customer_number: string;
  full_name: string;
}

interface Zone {
  zone_id: string;
  zone_name: string;
}

const Meters: React.FC = () => {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
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
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    meter_number: '',
    customer_id: '',
    cabinet_name: '',
    zone_id: '',
    meter_brand: 'generic',
    meter_type: 'digital',
    installation_date: new Date().toISOString().split('T')[0],
    gps_latitude: '',
    gps_longitude: '',
    notes: '',
  });

  const [editFormData, setEditFormData] = useState({
    cabinet_name: '',
    status: 'active',
    notes: '',
    gps_latitude: '',
    gps_longitude: '',
  });

  const [formError, setFormError] = useState<string>('');
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchMeters();
    fetchZones();
    if (isAddModalOpen) {
      fetchCustomers();
    }
  }, [search, statusFilter, zoneFilter, page, isAddModalOpen]);

  const fetchMeters = async () => {
    setLoading(true);
    try {
      const response = await client.get('/meters', {
        params: {
          search,
          status: statusFilter,
          zone_id: zoneFilter,
          page,
          limit: 10
        }
      });
      if (response.data.success) {
        setMeters(response.data.data);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (err) {
      console.error(err);
      setError('فشل تحميل قائمة العدادات');
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

  const fetchCustomers = async () => {
    try {
      // Just fetch some customers to select
      const response = await client.get('/customers', { params: { limit: 100 } });
      if (response.data.success) {
        setCustomers(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch customers', err);
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
      const payload = {
        ...formData,
        gps_latitude: formData.gps_latitude ? parseFloat(formData.gps_latitude) : undefined,
        gps_longitude: formData.gps_longitude ? parseFloat(formData.gps_longitude) : undefined,
      };

      const response = await client.post('/meters', payload);
      if (response.data.success) {
        setIsAddModalOpen(false);
        setFormData({
          meter_number: '',
          customer_id: '',
          cabinet_name: '',
          zone_id: '',
          meter_brand: 'generic',
          meter_type: 'digital',
          installation_date: new Date().toISOString().split('T')[0],
          gps_latitude: '',
          gps_longitude: '',
          notes: '',
        });
        fetchMeters();
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'حدث خطأ أثناء تسجيل العداد');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditClick = (meter: Meter) => {
    setSelectedMeter(meter);
    setEditFormData({
      cabinet_name: meter.cabinet_name || '',
      status: meter.status,
      notes: '',
      gps_latitude: meter.gps_latitude?.toString() || '',
      gps_longitude: meter.gps_longitude?.toString() || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeter) return;
    
    setFormError('');
    setSubmitLoading(true);

    try {
      const payload = {
        ...editFormData,
        gps_latitude: editFormData.gps_latitude ? parseFloat(editFormData.gps_latitude) : undefined,
        gps_longitude: editFormData.gps_longitude ? parseFloat(editFormData.gps_longitude) : undefined,
      };

      const response = await client.put(`/meters/${selectedMeter.meter_id}`, payload);
      if (response.data.success) {
        setIsEditModalOpen(false);
        fetchMeters();
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'حدث خطأ أثناء تعديل بيانات العداد');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="badge badge-success">نشط / يعمل</span>;
      case 'maintenance': return <span className="badge badge-warning">صيانة</span>;
      case 'inactive': return <span className="badge badge-danger">معطل</span>;
      default: return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header-actions">
        <div className="page-title-section">
          <h2 className="page-title">إدارة العدادات الكهربائية</h2>
          <p className="page-subtitle">تسجيل العدادات وربطها بالمشتركين ومتابعة كبائن التوزيع وحالة العدادات</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          <span>تسجيل عداد جديد</span>
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
            placeholder="بحث برقم العداد أو اسم العميل..."
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
            <option value="active">نشط / يعمل</option>
            <option value="maintenance">صيانة</option>
            <option value="inactive">معطل</option>
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

      {/* Meters Table */}
      <div className="glass-card">
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>جاري تحميل العدادات...</p>
        ) : (
          <>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>رقم العداد</th>
                    <th>اسم العميل المستأجر</th>
                    <th>رقم العميل</th>
                    <th>المنطقة</th>
                    <th>كابينة التوزيع</th>
                    <th>آخر قراءة معتمدة</th>
                    <th>تاريخ القراءة</th>
                    <th>تاريخ التركيب</th>
                    <th>الحالة</th>
                    <th>العمليات</th>
                  </tr>
                </thead>
                <tbody>
                  {meters.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        لا توجد عدادات مسجلة تطابق معايير الفلترة
                      </td>
                    </tr>
                  ) : (
                    meters.map((meter) => (
                      <tr key={meter.meter_id}>
                        <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{meter.meter_number}</td>
                        <td style={{ fontWeight: 500 }}>{meter.full_name}</td>
                        <td>{meter.customer_number}</td>
                        <td>{meter.zone_name || 'غير محدد'}</td>
                        <td>{meter.cabinet_name || <span style={{ color: 'var(--text-muted)' }}>غير محدد</span>}</td>
                        <td style={{ fontWeight: 600 }}>{meter.last_reading !== null ? `${meter.last_reading} ك.و` : <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>لا توجد</span>}</td>
                        <td style={{ fontSize: '12px' }}>
                          {meter.last_reading_date ? new Date(meter.last_reading_date).toLocaleDateString('ar-YE') : '-'}
                        </td>
                        <td style={{ fontSize: '12px' }}>
                          {new Date(meter.installation_date).toLocaleDateString('ar-YE')}
                        </td>
                        <td>{getStatusBadge(meter.status)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => handleEditClick(meter)} title="تحديث حالة العداد">
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

      {/* Modal: Add Meter */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="تسجيل عداد كهرباء جديد للمشترك">
        {formError && <div className="alert-error">{formError}</div>}
        <form onSubmit={handleAddSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">رقم العداد (الرقم التسلسلي المكتوب على الجهاز)</label>
              <input 
                type="text" 
                className="form-input" 
                name="meter_number" 
                placeholder="مثال: M-998822"
                value={formData.meter_number} 
                onChange={handleInputChange} 
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">المشترك (العميل المستأجر للعداد)</label>
              <select 
                className="form-select" 
                name="customer_id"
                value={formData.customer_id} 
                onChange={handleInputChange}
                required
              >
                <option value="">اختر العميل</option>
                {customers.map(c => (
                  <option key={c.customer_id} value={c.customer_id}>{c.full_name} ({c.customer_number})</option>
                ))}
              </select>
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
              <label className="form-label">اسم كابينة التوزيع (المغذي للعداد)</label>
              <input 
                type="text" 
                className="form-input" 
                name="cabinet_name" 
                placeholder="مثال: كابينة رقم 5 - شارع المقالح"
                value={formData.cabinet_name} 
                onChange={handleInputChange} 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">الشركة المصنعة</label>
              <input 
                type="text" 
                className="form-input" 
                name="meter_brand" 
                value={formData.meter_brand} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">نوع العداد</label>
              <select 
                className="form-select" 
                name="meter_type"
                value={formData.meter_type} 
                onChange={handleInputChange}
              >
                <option value="digital">رقمي (Digital)</option>
                <option value="smart">ذكي (Smart)</option>
                <option value="analog">ميكانيكي قرصي (Mechanical)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">إحداثيات خط العرض GPS (Latitude)</label>
              <input 
                type="text" 
                className="form-input" 
                name="gps_latitude" 
                placeholder="مثال: 15.3499"
                value={formData.gps_latitude} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">إحداثيات خط الطول GPS (Longitude)</label>
              <input 
                type="text" 
                className="form-input" 
                name="gps_longitude" 
                placeholder="مثال: 44.2048"
                value={formData.gps_longitude} 
                onChange={handleInputChange} 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">تاريخ التركيب والتشغيل</label>
            <input 
              type="date" 
              className="form-input" 
              name="installation_date" 
              value={formData.installation_date} 
              onChange={handleInputChange} 
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">ملاحظات فنية</label>
            <input 
              type="text" 
              className="form-input" 
              name="notes" 
              placeholder="مثال: عداد خارجي مع قاطع أوتوماتيكي"
              value={formData.notes} 
              onChange={handleInputChange} 
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>إلغاء</button>
            <button type="submit" className="btn btn-primary" disabled={submitLoading}>
              {submitLoading ? 'جاري التسجيل...' : 'حفظ العداد'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Meter */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="تحديث حالة عداد كهرباء">
        {formError && <div className="alert-error">{formError}</div>}
        {selectedMeter && (
          <form onSubmit={handleEditSubmit}>
            <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', border: '1px solid var(--border-color)', fontSize: '13px' }}>
              <p>العداد الرقمي: <strong>{selectedMeter.meter_number}</strong></p>
              <p>المشترك: <strong>{selectedMeter.full_name}</strong></p>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">كابينة التوزيع (المغذي)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  name="cabinet_name" 
                  value={editFormData.cabinet_name} 
                  onChange={handleEditInputChange} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">حالة عمل العداد</label>
                <select 
                  className="form-select" 
                  name="status"
                  value={editFormData.status} 
                  onChange={handleEditInputChange}
                >
                  <option value="active">نشط / يعمل</option>
                  <option value="maintenance">صيانة دورية</option>
                  <option value="inactive">معطل عن العمل</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">خط عرض GPS (Latitude)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  name="gps_latitude" 
                  value={editFormData.gps_latitude} 
                  onChange={handleEditInputChange} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">خط طول GPS (Longitude)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  name="gps_longitude" 
                  value={editFormData.gps_longitude} 
                  onChange={handleEditInputChange} 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">ملاحظات حول حالة العداد</label>
              <input 
                type="text" 
                className="form-input" 
                name="notes" 
                placeholder="أدخل أي ملاحظات فنية"
                value={editFormData.notes} 
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
        )}
      </Modal>
    </div>
  );
};

export default Meters;
