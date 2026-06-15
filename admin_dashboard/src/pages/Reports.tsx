import React, { useState, useEffect } from 'react';
import { BrainCircuit, AlertTriangle, ShieldCheck, Zap, Sparkles, CheckCircle, Activity } from 'lucide-react';
import client from '../api/client';

interface AIReport {
  report_id: string;
  analysis_type: string;
  anomaly_score: number;
  severity: string;
  findings: string;
  recommended_action: string | null;
  created_at: string;
  meter_number: string | null;
  customer_name: string | null;
}

const Reports: React.FC = () => {
  const [reports, setReports] = useState<AIReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  useEffect(() => {
    fetchAIReports();
  }, []);

  const fetchAIReports = async () => {
    setLoading(true);
    try {
      const response = await client.get('/ai-reports');
      if (response.data.success) {
        setReports(response.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('فشل تحميل تقارير الذكاء الاصطناعي');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev?.toLowerCase()) {
      case 'critical': return <span className="badge badge-danger" style={{ boxShadow: '0 0 10px rgba(239, 68, 68, 0.2)' }}>حرج جداً</span>;
      case 'high': return <span className="badge badge-danger">مرتفع</span>;
      case 'medium': return <span className="badge badge-warning">متوسط</span>;
      case 'low': return <span className="badge badge-success">منخفض</span>;
      default: return <span className="badge badge-secondary">{sev}</span>;
    }
  };

  const getAnalysisTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'leakage_detection': return 'كشف تسريب كهرباء';
      case 'fraud_detection': return 'اشتباه سرقة وتلاعب';
      case 'usage_forecast': return 'تحليل وتوقع الاستهلاك';
      case 'load_anomaly': return 'شذوذ في الحمل الكهربائي';
      default: return type;
    }
  };

  const filteredReports = reports.filter(r => {
    const matchSeverity = severityFilter ? r.severity?.toLowerCase() === severityFilter.toLowerCase() : true;
    const matchType = typeFilter ? r.analysis_type?.toLowerCase() === typeFilter.toLowerCase() : true;
    return matchSeverity && matchType;
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header-actions">
        <div className="page-title-section">
          <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BrainCircuit className="text-cyan" size={28} style={{ filter: 'drop-shadow(0 0 8px rgba(0, 242, 254, 0.4))' }} />
            <span>التقارير الذكية ونظام الكشف المتقدم</span>
          </h2>
          <p className="page-subtitle">تقارير مدعومة بالذكاء الاصطناعي لتحليل الأحمال والكشف عن التلاعب وسرقة التيار أو تسريب الكهرباء في الشبكة</p>
        </div>
        <button className="btn btn-primary" onClick={fetchAIReports} disabled={loading}>
          <Sparkles size={16} />
          <span>تحديث تحليلات AI</span>
        </button>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

      {/* AI Overview Cards */}
      <div className="stats-grid">
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-error)' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>بلاغات حرجة نشطة</span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>
              {reports.filter(r => ['critical', 'high'].includes(r.severity?.toLowerCase())).length} بلاغات
            </h3>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(0, 242, 254, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
            <Activity size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>متوسط معامل الشذوذ بالشبكة</span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>
              {reports.length > 0 ? (reports.reduce((acc, curr) => acc + curr.anomaly_score, 0) / reports.length).toFixed(1) : 0}%
            </h3>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-success)' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>دقة مطابقة نموذج التنبؤ</span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>94.8%</h3>
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="glass-card search-filter-bar">
        <div className="filter-select-wrapper">
          <select 
            className="form-select"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="">كل مستويات الخطورة</option>
            <option value="critical">حرج جداً</option>
            <option value="high">مرتفع</option>
            <option value="medium">متوسط</option>
            <option value="low">منخفض</option>
          </select>
        </div>

        <div className="filter-select-wrapper">
          <select 
            className="form-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">كل أنواع التحليل</option>
            <option value="leakage_detection">كشف تسريب كهرباء</option>
            <option value="fraud_detection">اشتباه سرقة وتلاعب</option>
            <option value="usage_forecast">تحليل وتوقع الاستهلاك</option>
          </select>
        </div>
      </div>

      {/* Reports Grid List */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginTop: '20px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>جاري تشغيل محرك التحليل والذكاء الاصطناعي...</p>
        ) : filteredReports.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <CheckCircle size={48} style={{ color: 'var(--accent-success)', marginBottom: '16px', display: 'inline-block' }} />
            <p style={{ fontWeight: 600 }}>لا توجد أي تقارير شذوذ أو تلاعب حالياً</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>الشبكة تعمل باستقرار ومعاملات التذبذب الاستهلاكي طبيعية تماماً.</p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const isCritical = ['critical', 'high'].includes(report.severity?.toLowerCase());
            return (
              <div 
                key={report.report_id} 
                className="glass-card" 
                style={{
                  borderRight: `4px solid ${isCritical ? 'var(--accent-error)' : 'var(--accent-cyan)'}`,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Visual Glow for Critical Anomaly */}
                {isCritical && (
                  <div style={{
                    position: 'absolute',
                    top: '-50px',
                    left: '-50px',
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(239,68,68,0.2) 0%, transparent 70%)',
                    zIndex: 0
                  }} />
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '14px', position: 'relative', zIndex: 1 }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Zap size={16} className="text-cyan" />
                      <span>{getAnalysisTypeLabel(report.analysis_type)}</span>
                    </h3>
                    {report.customer_name && (
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                        المشترك: <strong>{report.customer_name}</strong> | عداد رقم: <strong>{report.meter_number}</strong>
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>معامل الانحراف</span>
                      <p style={{ fontSize: '15px', fontWeight: 800, color: report.anomaly_score > 70 ? 'var(--accent-error)' : 'var(--accent-cyan)' }}>{report.anomaly_score}%</p>
                    </div>
                    {getSeverityBadge(report.severity)}
                  </div>
                </div>

                <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-primary)', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                  <strong>النتائج المكتشفة:</strong>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{report.findings}</p>
                </div>

                {report.recommended_action && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, flexShrink: 0 }}>الإجراء الموصى به:</span>
                    <span style={{ color: 'var(--text-primary)' }}>{report.recommended_action}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', fontSize: '10px', color: 'var(--text-muted)' }}>
                  <span>تاريخ وموعد الفحص التلقائي: {new Date(report.created_at).toLocaleString('ar-YE')}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Reports;
