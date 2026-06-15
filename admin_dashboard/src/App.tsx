import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Bills from './pages/Bills';
import Meters from './pages/Meters';
import Readings from './pages/Readings';
import Users from './pages/Users';
import Complaints from './pages/Complaints';
import Reports from './pages/Reports';

// Protected Route Wrapper Component
const ProtectedLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const token = localStorage.getItem('accessToken');
  const userString = localStorage.getItem('user');
  const companyName = localStorage.getItem('companyName') || '';
  const location = useLocation();

  if (!token || !userString) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userString);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/': return 'لوحة التحكم الإحصائية';
      case '/customers': return 'إدارة المشتركين';
      case '/bills': return 'إدارة الفواتير والمدفوعات';
      case '/meters': return 'إدارة العدادات الكهربائية';
      case '/readings': return 'مراجعة القراءات الميدانية';
      case '/users': return 'إدارة موظفي الشركة';
      case '/complaints': return 'البلاغات والشكاوى';
      case '/reports': return 'تقارير الذكاء الاصطناعي (AI)';
      default: return 'نظام إدارة الكهرباء الذكي';
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}></div>
      <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar 
          companyName={companyName}
          userFullName={user.full_name}
          userRole={user.role}
        />
      </div>

      {/* Main page content area */}
      <main className="main-content">
        <Header 
          pageTitle={getPageTitle(location.pathname)}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/meters" element={<Meters />} />
          <Route path="/readings" element={<Readings />} />
          <Route path="/users" element={<Users />} />
          <Route path="/complaints" element={<Complaints />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
