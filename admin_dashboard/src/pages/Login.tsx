import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Lock, User, Building2, ShieldCheck, AlertCircle } from 'lucide-react';
import client from '../api/client';

interface Company {
  company_id: string;
  company_name: string;
  company_code: string;
}

// لوحة تحكم إدارية - للمدراء فقط - v3.0
const AdminLogin: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyCode, setCompanyCode] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) navigate('/');
    loadCompanies();
  }, [navigate]);

  const loadCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const res = await client.get('/auth/companies');
      if (res.data.success && res.data.data.length > 0) {
        setCompanies(res.data.data);
        setCompanyCode(res.data.data[0].company_code);
      }
    } catch {
      setError('تعذّر الاتصال بالخادم. تأكد من أن النظام يعمل.');
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!companyCode || !username || !password) {
      setError('يرجى تعبئة جميع الحقول');
      return;
    }
    setLoading(true);
    try {
      localStorage.setItem('companyCode', companyCode);
      const res = await client.post('/auth/login', { username, password });
      if (res.data.success) {
        const { accessToken, refreshToken, user } = res.data.data;
        const adminRoles = ['admin', 'supervisor'];
        if (!adminRoles.includes(user.role?.toLowerCase())) {
          setError('هذه اللوحة مخصصة لمدراء الشركة فقط. الفنيون والمشتركون يستخدمون التطبيق.');
          localStorage.removeItem('companyCode');
          setLoading(false);
          return;
        }
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        const comp = companies.find(c => c.company_code === companyCode);
        if (comp) localStorage.setItem('companyName', comp.company_name);
        navigate('/');
      } else {
        setError(res.data.message || 'اسم المستخدم أو كلمة المرور غير صحيحة');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'فشل تسجيل الدخول. تحقق من بياناتك.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#080a10',
      backgroundImage: 'radial-gradient(circle at 15% 15%, rgba(79,172,254,0.08) 0, transparent 45%), radial-gradient(circle at 85% 85%, rgba(0,242,254,0.08) 0, transparent 45%)',
      fontFamily: "'Cairo', system-ui, sans-serif",
      direction: 'rtl',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        margin: '0 16px',
        background: 'rgba(15,18,29,0.85)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '20px',
        padding: '40px',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 40px rgba(0,242,254,0.04)',
      }}>

        {/* الشعار */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '68px',
            height: '68px',
            background: 'linear-gradient(135deg, rgba(79,172,254,0.15), rgba(0,242,254,0.15))',
            border: '1px solid rgba(0,242,254,0.3)',
            borderRadius: '16px',
            marginBottom: '18px',
            boxShadow: '0 0 30px rgba(0,242,254,0.15)',
          }}>
            <Zap size={34} style={{ color: '#00f2fe', filter: 'drop-shadow(0 0 8px rgba(0,242,254,0.6))' }} />
          </div>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 800,
            margin: '0 0 6px',
            background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>لوحة تحكم الإدارة</h1>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
            نظام إدارة الكهرباء الذكي · للمدراء فقط
          </p>
        </div>

        {/* رسالة الخطأ */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '13px',
            color: '#ef4444',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>

          {/* اختيار الشركة */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: '8px' }}>
              <Building2 size={13} style={{ marginLeft: '5px', verticalAlign: 'middle' }} />
              شركة الكهرباء
            </label>
            <select
              value={companyCode}
              onChange={e => setCompanyCode(e.target.value)}
              disabled={loading || loadingCompanies}
              style={{
                width: '100%',
                background: '#161a29',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '14px',
                color: '#f3f4f6',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {loadingCompanies ? (
                <option>جاري التحميل...</option>
              ) : companies.length === 0 ? (
                <option>لا توجد شركات مسجلة</option>
              ) : (
                companies.map(c => (
                  <option key={c.company_id} value={c.company_code}>
                    {c.company_name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* اسم المستخدم */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: '8px' }}>
              <User size={13} style={{ marginLeft: '5px', verticalAlign: 'middle' }} />
              اسم المستخدم
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="أدخل اسم المستخدم"
              disabled={loading}
              required
              style={{
                width: '100%',
                background: '#161a29',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '14px',
                color: '#f3f4f6',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* كلمة المرور */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: '8px' }}>
              <Lock size={13} style={{ marginLeft: '5px', verticalAlign: 'middle' }} />
              كلمة المرور
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                disabled={loading}
                required
                style={{
                  width: '100%',
                  background: '#161a29',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  padding: '12px 48px 12px 16px',
                  fontSize: '14px',
                  color: '#f3f4f6',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px',
                  fontSize: '12px',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* زر الدخول */}
          <button
            type="submit"
            disabled={loading || loadingCompanies}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? 'rgba(79,172,254,0.3)' : 'linear-gradient(135deg, #4facfe, #00f2fe)',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 700,
              color: loading ? '#9ca3af' : '#05070a',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(0,242,254,0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? 'جاري التحقق...' : 'دخول لوحة التحكم'}
          </button>
        </form>

        {/* تذييل */}
        <div style={{
          marginTop: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '11px',
          color: '#4b5563',
        }}>
          <ShieldCheck size={13} />
          <span>هذه اللوحة مخصصة لمدير الشركة فقط · الفنيون والمشتركون يستخدمون التطبيق</span>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
