import React from 'react';
import { Bell, ShieldAlert, Wifi, Menu } from 'lucide-react';

interface HeaderProps {
  pageTitle: string;
  onMenuToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({ pageTitle, onMenuToggle }) => {
  return (
    <header className="header">
      <div className="header-right">
        <button className="mobile-menu-btn" onClick={onMenuToggle}>
          <Menu size={24} />
        </button>
        <h1 className="header-title">{pageTitle}</h1>
      </div>

      <div className="header-left">
        {/* Status Indicators */}
        <div className="header-status">
          <Wifi size={16} className="text-success" />
          <span className="status-label">متصل بالخادم</span>
        </div>

        {/* Notifications and Security Alert Icons */}
        <div className="header-actions">
          <button className="action-icon-btn" title="تنبيهات النظام">
            <Bell size={20} />
            <span className="badge-dot"></span>
          </button>
          <button className="action-icon-btn" title="حالة النظام الأمنية">
            <ShieldAlert size={20} className="text-warning" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
