import React, { useState, useEffect } from 'react';
import { UserPlus, Key, Power, UserCheck, UserX } from 'lucide-react';
import client from '../api/client';
import Modal from '../components/Modal';

interface User {
  user_id: string;
  full_name: string;
  username: string;
  email: string | null;
  phone_number: string | null;
  role: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  zone_name: string | null;
}

interface Zone {
  zone_id: string;
  zone_name: string;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    phone_number: '',
    password: '',
    role: 'technician',
    zone_id: '',
  });

  const [newPassword, setNewPassword] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchUsers();
    fetchZones();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await client.get('/users');
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('فشل تحميل قائمة الموظفين والمستخدمين');
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

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitLoading(true);

    try {
      const payload = { ...formData };
      if (!payload.zone_id) {
        // Remove empty zone_id
        delete (payload as any).zone_id;
      }
      const response = await client.post('/users', payload);
      if (response.data.success) {
        setIsAddModalOpen(false);
        setFormData({
          full_name: '',
          username: '',
          email: '',
          phone_number: '',
          password: '',
          role: 'technician',
          zone_id: '',
        });
        fetchUsers();
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'حدث خطأ أثناء إضافة الموظف');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (confirm(`هل أنت متأكد من تغيير حالة حساب ${user.full_name}؟`)) {
      try {
        const response = await client.patch(`/users/${user.user_id}/toggle`);
        if (response.data.success) {
          fetchUsers();
        }
      } catch (err) {
        console.error(err);
        alert('فشل تغيير حالة الموظف');
      }
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setFormError('');
    setSubmitLoading(true);

    try {
      const response = await client.put(`/users/${selectedUser.user_id}/reset-password`, {
        new_password: newPassword,
      });

      if (response.data.success) {
        setIsResetModalOpen(false);
        setNewPassword('');
        alert(response.data.message);
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'حدث خطأ أثناء إعادة تعيين كلمة المرور');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getRoleText = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'مدير النظام';
      case 'supervisor': return 'مشرف عام';
      case 'cashier': return 'محاسب / صندوق';
      case 'technician': return 'فني ميداني';
      default: return role;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'badge-danger';
      case 'supervisor': return 'badge-warning';
      case 'cashier': return 'badge-success';
      case 'technician': return 'badge-info';
      default: return 'badge-secondary';
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header-actions">
        <div className="page-title-section">
          <h2 className="page-title">إدارة الموظفين والمستخدمين</h2>
          <p className="page-subtitle">إضافة وتعيين أدوار الموظفين وتغيير صلاحياتهم وتفعيل حساباتهم</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <UserPlus size={18} />
          <span>إضافة موظف جديد</span>
        </button>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

      {/* Users Table */}
      <div className="glass-card">
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>جاري تحميل الموظفين...</p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>الاسم الكامل</th>
                  <th>اسم المستخدم</th>
                  <th>الدور الوظيفي</th>
                  <th>البريد الإلكتروني</th>
                  <th>الهاتف</th>
                  <th>المنطقة المغطاة</th>
                  <th>آخر تسجيل دخول</th>
                  <th>حالة الحساب</th>
                  <th>العمليات</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      لا يوجد موظفين مسجلين حالياً
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.user_id}>
                      <td style={{ fontWeight: 600 }}>{user.full_name}</td>
                      <td style={{ color: 'var(--accent-cyan)' }}>{user.username}</td>
                      <td>
                        <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                          {getRoleText(user.role)}
                        </span>
                      </td>
                      <td>{user.email || <span style={{ color: 'var(--text-muted)' }}>لا يوجد</span>}</td>
                      <td>{user.phone_number || <span style={{ color: 'var(--text-muted)' }}>لا يوجد</span>}</td>
                      <td>{user.zone_name || <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>كل المناطق</span>}</td>
                      <td style={{ fontSize: '12px' }}>
                        {user.last_login ? new Date(user.last_login).toLocaleString('ar-YE') : <span style={{ color: 'var(--text-muted)' }}>لم يسجل دخول</span>}
                      </td>
                      <td>
                        {user.is_active ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <UserCheck size={12} /> مفعّل
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <UserX size={12} /> معطّل
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px', color: 'var(--accent-warning)', borderColor: 'rgba(245,158,11,0.2)' }}
                            onClick={() => { setSelectedUser(user); setIsResetModalOpen(true); }}
                            title="إعادة تعيين كلمة المرور"
                          >
                            <Key size={14} />
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px', color: user.is_active ? 'var(--accent-error)' : 'var(--accent-success)' }}
                            onClick={() => handleToggleStatus(user)}
                            title={user.is_active ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                          >
                            <Power size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add User */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="إضافة حساب موظف جديد">
        {formError && <div className="alert-error">{formError}</div>}
        <form onSubmit={handleAddSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">الاسم الكامل للموظف</label>
              <input 
                type="text" 
                className="form-input" 
                name="full_name" 
                placeholder="مثال: أحمد محمد علي"
                value={formData.full_name} 
                onChange={handleInputChange} 
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">اسم المستخدم (لتسجيل الدخول)</label>
              <input 
                type="text" 
                className="form-input" 
                name="username" 
                placeholder="مثال: ahmed_dev"
                value={formData.username} 
                onChange={handleInputChange} 
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">البريد الإلكتروني</label>
              <input 
                type="email" 
                className="form-input" 
                name="email" 
                placeholder="example@mail.com"
                value={formData.email} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">رقم الهاتف</label>
              <input 
                type="text" 
                className="form-input" 
                name="phone_number" 
                placeholder="777xxxxxx"
                value={formData.phone_number} 
                onChange={handleInputChange} 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">الدور والوظيفة</label>
              <select 
                className="form-select" 
                name="role"
                value={formData.role} 
                onChange={handleInputChange}
                required
              >
                <option value="technician">فني ميداني (رفع قراءات)</option>
                <option value="cashier">محاسب / صندوق (تحصيل مالي)</option>
                <option value="supervisor">مشرف عام (اعتماد وإدارة)</option>
                <option value="admin">مدير النظام</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">المنطقة الجغرافية المغطاة (للفنيين)</label>
              <select 
                className="form-select" 
                name="zone_id"
                value={formData.zone_id} 
                onChange={handleInputChange}
              >
                <option value="">كل المناطق (أو غير محدد)</option>
                {zones.map(z => (
                  <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">كلمة مرور الحساب</label>
            <input 
              type="password" 
              className="form-input" 
              name="password" 
              placeholder="يجب ألا تقل عن 8 أحرف"
              value={formData.password} 
              onChange={handleInputChange} 
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>إلغاء</button>
            <button type="submit" className="btn btn-primary" disabled={submitLoading}>
              {submitLoading ? 'جاري إنشاء الحساب...' : 'حفظ الموظف'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Reset Password */}
      <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} title="إعادة تعيين كلمة مرور موظف">
        {formError && <div className="alert-error">{formError}</div>}
        {selectedUser && (
          <form onSubmit={handleResetPasswordSubmit}>
            <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', border: '1px solid var(--border-color)', fontSize: '13px' }}>
              <p>سيتم تعديل كلمة مرور الموظف: <strong>{selectedUser.full_name}</strong></p>
              <p>اسم المستخدم: <strong>{selectedUser.username}</strong></p>
            </div>
            <div className="form-group">
              <label className="form-label">كلمة المرور الجديدة</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="أدخل 8 أحرف على الأقل"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsResetModalOpen(false)}>إلغاء</button>
              <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                {submitLoading ? 'جاري التعديل...' : 'تحديث كلمة المرور'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Users;
