import React, { useState, useEffect } from 'react';
import { ClipboardCheck, MapPin, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import client from '../api/client';

interface PendingReading {
  reading_id: string;
  previous_reading: number;
  current_reading: number;
  consumption: number;
  reading_date: string;
  reading_image_url: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  status: string;
  meter_number: string;
  cabinet_name: string;
  customer_number: string;
  full_name: string;
  technician_name: string;
}

const Readings: React.FC = () => {
  const [readings, setReadings] = useState<PendingReading[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingReadings();
  }, []);

  const fetchPendingReadings = async () => {
    setLoading(true);
    try {
      const response = await client.get('/readings/pending');
      if (response.data.success) {
        setReadings(response.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('فشل تحميل القراءات المعلقة');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (readingId: string) => {
    setActionLoading(readingId);
    try {
      const response = await client.put(`/readings/${readingId}/approve`);
      if (response.data.success) {
        // Remove from list
        setReadings(prev => prev.filter(r => r.reading_id !== readingId));
        alert('تم اعتماد القراءة وإصدار الفاتورة للمشترك بنجاح!');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'فشل اعتماد القراءة');
    } finally {
      setActionLoading(null);
    }
  };

  // Base URL of backend for media images
  const apiBaseURL = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:3000';

  return (
    <div className="animate-fade-in">
      <div className="page-header-actions">
        <div className="page-title-section">
          <h2 className="page-title">مراجعة القراءات الميدانية</h2>
          <p className="page-subtitle">اعتماد القراءات المرفوعة من الفنيين والموافقة عليها بعد الكشف عن شذوذ الاستهلاك</p>
        </div>
        <button className="btn btn-primary" onClick={fetchPendingReadings} disabled={loading}>
          تحديث القراءات
        </button>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

      <div className="glass-card">
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>جاري جلب القراءات المعلقة...</p>
        ) : readings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            <ClipboardCheck size={48} style={{ color: 'var(--accent-success)', marginBottom: '16px' }} />
            <p style={{ fontSize: '15px', fontWeight: 600 }}>كل القراءات معتمدة ولا توجد أي معلقات</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>يتم إدراج القراءات هنا إذا تم الكشف عن نمط استهلاك شاذ أو غير اعتيادي يحتاج موافقة المشرف.</p>
          </div>
        ) : (
          <div className="readings-list-wrapper">
            {readings.map((reading) => (
              <div key={reading.reading_id} className="reading-review-card">
                {/* Meter Photo */}
                <div className="reading-image-box">
                  {reading.reading_image_url ? (
                    <a 
                      href={`${apiBaseURL}${reading.reading_image_url}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      title="عرض الصورة كاملة"
                    >
                      <img 
                        src={`${apiBaseURL}${reading.reading_image_url}`} 
                        alt={`عداد ${reading.meter_number}`} 
                      />
                    </a>
                  ) : (
                    <div className="reading-no-image">
                      <ImageIcon size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                      <span>لا توجد صورة</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="reading-info-box">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 700 }}>{reading.full_name}</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>رقم المشترك: {reading.customer_number} | عداد رقم: {reading.meter_number}</span>
                      </div>
                      <span className="badge badge-warning">تحت المراجعة</span>
                    </div>

                    <div className="reading-info-row">
                      <div className="reading-info-item">
                        <span className="reading-info-label">القراءة السابقة</span>
                        <span className="reading-info-value">{reading.previous_reading} كيلوواط</span>
                      </div>
                      <div className="reading-info-item">
                        <span className="reading-info-label">القراءة الحالية</span>
                        <span className="reading-info-value" style={{ color: 'var(--accent-cyan)' }}>{reading.current_reading} كيلوواط</span>
                      </div>
                      <div className="reading-info-item">
                        <span className="reading-info-label">صافي الاستهلاك</span>
                        <span className="reading-info-value" style={{ color: 'var(--accent-error)' }}>{reading.consumption} ك.و.س</span>
                      </div>
                      <div className="reading-info-item">
                        <span className="reading-info-label">موقع الرفع GPS</span>
                        {reading.gps_latitude && reading.gps_longitude ? (
                          <a 
                            href={`https://www.google.com/maps?q=${reading.gps_latitude},${reading.gps_longitude}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-blue)', fontSize: '12px', fontWeight: 600 }}
                          >
                            <MapPin size={12} />
                            <span>عرض الخريطة</span>
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>غير متاح</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>بواسطة الفني: <strong>{reading.technician_name}</strong></span>
                      <span style={{ margin: '0 8px' }}>|</span>
                      <span>تاريخ القراءة: {new Date(reading.reading_date).toLocaleString('ar-YE')}</span>
                    </div>

                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleApprove(reading.reading_id)}
                      disabled={actionLoading === reading.reading_id}
                    >
                      {actionLoading === reading.reading_id ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>جاري الاعتماد...</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          <span>اعتماد القراءة وإصدار الفاتورة</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Readings;
