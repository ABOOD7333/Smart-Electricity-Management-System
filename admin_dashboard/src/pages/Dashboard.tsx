import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  Receipt, 
  Activity, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import client from '../api/client';
import StatCard from '../components/StatCard';

interface DashboardData {
  bills: {
    unpaid_count: number;
    paid_count: number;
    partial_count: number;
    total_unpaid_amount: string | null;
    total_collected: string | null;
    overdue_count: number;
  };
  customers: {
    total_customers: number;
    active_customers: number;
    disconnected_customers: number;
  };
  recent_bills: Array<{
    invoice_number: string;
    total_amount: number;
    status: string;
    issue_date: string;
    full_name: string;
    customer_number: string;
  }>;
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [pendingReadingsCount, setPendingReadingsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, readingsRes] = await Promise.all([
        client.get('/bills/dashboard'),
        client.get('/readings/pending'),
      ]);

      if (dashRes.data.success) {
        setData(dashRes.data.data);
      }
      if (readingsRes.data.success) {
        setPendingReadingsCount(readingsRes.data.data.length);
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء تحميل بيانات لوحة التحكم');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>جاري تحميل الإحصاءات والبيانات...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--accent-error)' }}>
        <p>{error || 'فشل تحميل البيانات'}</p>
        <button className="btn btn-secondary" style={{ marginTop: '16px' }} onClick={fetchDashboardData}>إعادة المحاولة</button>
      </div>
    );
  }

  const { bills, customers, recent_bills } = data;

  const totalCollected = parseFloat(bills.total_collected || '0');
  const totalUnpaid = parseFloat(bills.total_unpaid_amount || '0');
  const totalInvoiced = totalCollected + totalUnpaid;
  const collectionRate = totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : '0';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <span className="badge badge-success">مدفوعة</span>;
      case 'unpaid': return <span className="badge badge-danger">غير مدفوعة</span>;
      case 'partially_paid': return <span className="badge badge-warning">مدفوعة جزئياً</span>;
      case 'cancelled': return <span className="badge badge-secondary">ملغاة</span>;
      default: return <span className="badge badge-info">{status}</span>;
    }
  };

  // Mock revenue data for chart
  const weeklyRevenue = [
    { day: 'السبت', val: totalCollected * 0.12 },
    { day: 'الأحد', val: totalCollected * 0.15 },
    { day: 'الأثنين', val: totalCollected * 0.18 },
    { day: 'الثلاثاء', val: totalCollected * 0.14 },
    { day: 'الأربعاء', val: totalCollected * 0.22 },
    { day: 'الخميس', val: totalCollected * 0.11 },
    { day: 'الجمعة', val: totalCollected * 0.08 }
  ];
  
  const maxVal = Math.max(...weeklyRevenue.map(d => d.val)) || 1000;

  return (
    <div className="animate-fade-in">
      <div className="page-header-actions">
        <div className="page-title-section">
          <h2 className="page-title">اللوحة الرئيسية للشركة</h2>
          <p className="page-subtitle">متابعة فورية للنشاط التجاري والاستهلاكي والمالي</p>
        </div>
        <button className="btn btn-primary" onClick={fetchDashboardData}>تحديث البيانات</button>
      </div>

      {/* Grid of Statistics */}
      <div className="stats-grid">
        <StatCard 
          title="إجمالي المشتركين"
          value={customers.total_customers}
          icon={<Users size={22} />}
          description={`نشط: ${customers.active_customers} | مفصول: ${customers.disconnected_customers}`}
          color="var(--accent-blue)"
          trend={{ value: '12% +', isUpward: true }}
        />
        <StatCard 
          title="الإيرادات المحصلة"
          value={`$${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<DollarSign size={22} />}
          description={`نسبة التحصيل الإجمالية: ${collectionRate}%`}
          color="var(--accent-success)"
          trend={{ value: '8.4% +', isUpward: true }}
        />
        <StatCard 
          title="فواتير غير مسددة"
          value={bills.unpaid_count + bills.partial_count}
          icon={<Receipt size={22} />}
          description={`المستحقات المعلقة: $${totalUnpaid.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          color="var(--accent-warning)"
          trend={{ value: `${bills.overdue_count} متأخرة`, isUpward: false }}
        />
        <StatCard 
          title="قراءات بانتظار المراجعة"
          value={pendingReadingsCount}
          icon={<Activity size={22} />}
          description="تحتاج لمراجعة المشرف واعتمادها"
          color={pendingReadingsCount > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)'}
          trend={pendingReadingsCount > 0 ? { value: 'هام', isUpward: false } : undefined}
        />
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Weekly Revenue Custom Chart */}
        <div className="glass-card chart-card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>توزيع الإيرادات المحصلة (أسبوعي - افتراضي)</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>آخر 7 أيام عمل</span>
          </div>
          <div className="chart-container" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '10px 20px', height: '220px', borderBottom: '1px solid var(--border-color)' }}>
            {weeklyRevenue.map((item, index) => {
              const pct = (item.val / maxVal) * 85 + 5; // Height percentage
              return (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '12px' }}>
                  <div style={{ position: 'relative', width: '32px', height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    {/* Tooltip on hover */}
                    <div className="chart-bar-tooltip" style={{ fontSize: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px 6px', position: 'absolute', bottom: `${pct + 5}%`, zIndex: 10, whiteSpace: 'nowrap' }}>
                      ${Math.round(item.val).toLocaleString()}
                    </div>
                    {/* Glowing bar */}
                    <div style={{
                      width: '12px',
                      height: `${pct}%`,
                      background: 'linear-gradient(to top, var(--accent-blue), var(--accent-cyan))',
                      borderRadius: '10px 10px 0 0',
                      boxShadow: '0 0 10px rgba(0, 242, 254, 0.2)',
                      transition: 'height 0.5s ease-in-out'
                    }}></div>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Status Circular Progress Card */}
        <div className="glass-card chart-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="card-header">
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>حالة الفواتير الإجمالية</h3>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '140px', position: 'relative' }}>
            {/* Simple Circular Ring SVG */}
            <svg width="120" height="120" viewBox="0 0 36 36">
              <path
                className="circle-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--bg-tertiary)"
                strokeWidth="2.5"
              />
              <path
                className="circle"
                strokeDasharray={`${collectionRate}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--accent-success)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-success)' }}>{collectionRate}%</span>
              <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>تحصيل مالي</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} className="text-success" />
                <span>مدفوعة بالكامل ({bills.paid_count})</span>
              </div>
              <span style={{ fontWeight: 600 }}>${totalCollected.toLocaleString()}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} className="text-warning" />
                <span>مدفوعة جزئياً ({bills.partial_count})</span>
              </div>
              <span style={{ fontWeight: 600 }}>جزئي</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} className="text-danger" />
                <span>غير مدفوعة ({bills.unpaid_count})</span>
              </div>
              <span style={{ fontWeight: 600, color: 'var(--accent-error)' }}>${totalUnpaid.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>آخر الفواتير الصادرة</h3>
          <a href="/bills" style={{ fontSize: '12px', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>عرض كل الفواتير</span>
            <ArrowUpRight size={14} />
          </a>
        </div>
        
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>رقم الفاتورة</th>
                <th>اسم المشترك</th>
                <th>رقم العميل</th>
                <th>المبلغ الإجمالي</th>
                <th>تاريخ الإصدار</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {recent_bills.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>لا توجد فواتير صادرة مؤخراً</td>
                </tr>
              ) : (
                recent_bills.map((bill, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{bill.invoice_number}</td>
                    <td>{bill.full_name}</td>
                    <td>{bill.customer_number}</td>
                    <td>${bill.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>{new Date(bill.issue_date).toLocaleDateString('ar-YE')}</td>
                    <td>{getStatusBadge(bill.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
