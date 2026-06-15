import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  Gauge, 
  ClipboardCheck, 
  UserCog, 
  MessageSquareWarning, 
  BrainCircuit, 
  LogOut,
  Zap
} from 'lucide-react';

interface SidebarProps {
  companyName: string;
  userFullName: string;
  userRole: string;
}

const Sidebar: React.FC<SidebarProps> = ({ companyName, userFullName, userRole }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('companyCode');
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'اللوحة الرئيسية', icon: <LayoutDashboard size={20} /> },
    { path: '/customers', label: 'المشتركين (العملاء)', icon: <Users size={20} /> },
    { path: '/bills', label: 'إدارة الفواتير', icon: <Receipt size={20} /> },
    { path: '/meters', label: 'إدارة العدادات', icon: <Gauge size={20} /> },
    { path: '/readings', label: 'مراجعة القراءات', icon: <ClipboardCheck size={20} /> },
    { path: '/users', label: 'الموظفين والمستخدمين', icon: <UserCog size={20} /> },
    { path: '/complaints', label: 'البلاغات والشكاوى', icon: <MessageSquareWarning size={20} /> },
    { path: '/reports', label: 'التقارير الذكية (AI)', icon: <BrainCircuit size={20} /> },
  ];

  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'مدير النظام';
      case 'supervisor': return 'مشرف';
      case 'technician': return 'فني';
      case 'accountant': return 'محاسب';
      default: return role;
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Zap className="brand-icon" size={28} />
        <div className="brand-info">
          <span className="brand-name">SEMS</span>
          <span className="brand-tagline">إدارة الكهرباء الذكية</span>
        </div>
      </div>

      <div className="sidebar-company-card">
        <div className="company-icon-box">🏢</div>
        <div className="company-details">
          <div className="company-name">{companyName || 'شركة الكهرباء'}</div>
          <div className="user-details">
            <span className="user-name">{userFullName}</span>
            <span className="user-role-badge">{getRoleBadge(userRole)}</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
