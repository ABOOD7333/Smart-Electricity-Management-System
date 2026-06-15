import React, { type ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: {
    value: string;
    isUpward: boolean;
  };
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description, trend, color = 'var(--accent-blue)' }) => {
  return (
    <div className="glass-card stat-card" style={{ '--card-accent': color } as React.CSSProperties}>
      <div className="stat-card-header">
        <div className="stat-card-title">{title}</div>
        <div className="stat-card-icon" style={{ color: color }}>
          {icon}
        </div>
      </div>
      <div className="stat-card-body">
        <div className="stat-card-value">{value}</div>
        {(trend || description) && (
          <div className="stat-card-footer">
            {trend && (
              <span className={`stat-trend ${trend.isUpward ? 'up' : 'down'}`}>
                {trend.isUpward ? '▲' : '▼'} {trend.value}
              </span>
            )}
            {description && <span className="stat-desc">{description}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
