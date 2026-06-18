// Admin Dashboard Login — v2.0 — SEMS Premium Dark UI
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ShieldCheck } from 'lucide-react';
import client from '../api/client';


interface Company {
  company_id: string;
  company_name: string;
  company_code: string;
}

const Login: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      navigate('/');
    }
    fetchCompanies();
  }, [navigate]);

  const fetchCompanies = async () => {
    try {
      const response = await client.get('/auth/companies');
      if (response.data.success) {
        setCompanies(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedCompany(response.data.data[0].company_code);
        }
      }
    } catch (err) {
      console.error('Failed to fetch companies', err);
      setError('فشل الاتصال بالخادم لجلب شركات الكهرباء. تأكد من أن الـ backend يعمل.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!selectedCompany) {
      setError('يرجى اختيار شركة كهرباء');
      return;
    }
    if (!username || !password) {
      setError('يرجى ملء جميع الحقول');
      return;
    }

    setLoading(true);

    try {
      // We pass the company code in localStorage so that our Axios interceptor picks it up.
      // Or we can pass it directly as a header for this specific request.
      localStorage.setItem('companyCode', selectedCompany);

      const response = await client.post('/auth/login', {
        username,
        password,
      });

      if (response.data.success) {
        const { accessToken, refreshToken, user } = response.data.data;
        
        // Check if user is admin, supervisor or accountant (dashboard roles)
        const allowedRoles = ['admin', 'supervisor', 'accountant'];
        if (!allowedRoles.includes(user.role.toLowerCase())) {
          setError('عذراً، هذا الحساب لا يملك صلاحيات كافية للوصول إلى لوحة التحكم الإدارية.');
          localStorage.removeItem('companyCode');
          setLoading(false);
          return;
        }

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Find company name
        const comp = companies.find(c => c.company_code === selectedCompany);
        if (comp) {
          localStorage.setItem('companyName', comp.company_name);
        }

        navigate('/');
      } else {
        setError(response.data.message || 'اسم المستخدم أو كلمة المرور غير صحيحة');
      }
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('فشل تسجيل الدخول. يرجى التحقق من صحة البيانات والاتصال بالشبكة.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="glass-card login-card animate-fade-in">
        <div className="login-logo">
          <Zap size={32} className="brand-icon" />
        </div>
        
        <h2 className="login-title">لوحة تحكم SEMS</h2>
        <p className="login-subtitle">نظام إدارة وفوترة الكهرباء الذكي للمشرفين والمدراء</p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">شركة الكهرباء المشغلة</label>
            <select 
              className="form-select"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              disabled={loading || companies.length === 0}
            >
              {companies.length === 0 ? (
                <option>جاري جلب الشركات...</option>
              ) : (
                companies.map((comp) => (
                  <option key={comp.company_id} value={comp.company_code}>
                    {comp.company_name} ({comp.company_code})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">اسم المستخدم</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="أدخل اسم مستخدم الحساب"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">كلمة المرور</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="أدخل كلمة مرور الحساب"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary login-btn"
            disabled={loading}
          >
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول الآمن'}
          </button>
        </form>

        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <ShieldCheck size={14} />
          <span>تشفير 256-بت آمن ومحمي بالكامل</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
