import React from 'react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  colorClass?: string;
  trend?: { value: number; label: string };
}

export function StatCard({ title, value, subtitle, icon, colorClass = 'bg-gradient-to-r from-cyan-500 to-blue-500', trend }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
            {trend && (
              <p className={`text-xs mt-2 font-medium ${trend.value >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value).toFixed(1)}% {trend.label}
              </p>
            )}
          </div>
          {icon && (
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${colorClass}`}>
              {icon}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
