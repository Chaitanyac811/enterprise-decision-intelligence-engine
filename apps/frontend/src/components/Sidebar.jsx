import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  UploadCloud,
  HelpCircle,
  Database,
  Cpu,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, health }) {
  const navItems = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Sales Analytics', icon: BarChart3 },
    { id: 'anomalies', label: 'Anomaly Detection', icon: AlertTriangle },
    { id: 'forecast', label: 'Sales Forecasting', icon: TrendingUp },
    { id: 'recommendations', label: 'Business Recommendations', icon: Lightbulb },
    { id: 'ingestion', label: 'Data Ingestion & ETL', icon: UploadCloud },
    { id: 'about', label: 'About & Methodology', icon: HelpCircle },
  ];

  const dbOk = health?.database?.connected;
  const analyticsOk = health?.analytics_microservice?.available;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight leading-none">
            Enterprise BI
          </h1>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Decision Intelligence Engine
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* System Status Footbar */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-xs space-y-2">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Runtime Architecture
        </div>
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2 text-slate-300">
            <Database className="h-3.5 w-3.5 text-slate-400" />
            <span>PostgreSQL 18</span>
          </div>
          {dbOk ? (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <CheckCircle2 className="h-3 w-3" /> Ready
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-rose-400 font-medium">
              <AlertCircle className="h-3 w-3" /> Error
            </span>
          )}
        </div>
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2 text-slate-300">
            <Cpu className="h-3.5 w-3.5 text-slate-400" />
            <span>Python Analytics</span>
          </div>
          {analyticsOk ? (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <CheckCircle2 className="h-3 w-3" /> Active
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
              <AlertCircle className="h-3 w-3" /> Degraded
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
