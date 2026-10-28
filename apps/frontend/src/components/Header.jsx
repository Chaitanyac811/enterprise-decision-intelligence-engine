import React from 'react';
import { Calendar, Filter, RotateCw, UploadCloud } from 'lucide-react';

const REGIONS = ['All', 'North', 'South', 'East', 'West', 'Central'];
const CATEGORIES = [
  'All',
  'Electronics',
  'Apparel',
  'Home & Kitchen',
  'FMCG',
  'Beauty & Personal Care',
];

export default function Header({
  activeTabTitle,
  filters,
  setFilters,
  onRefresh,
  loading,
  onOpenUpload,
}) {
  const handleRangeChange = (preset) => {
    const today = new Date('2026-10-28'); // anchored to sample data current date
    let start = null;
    let end = today.toISOString().split('T')[0];

    if (preset === '30d') {
      const d = new Date(today);
      d.setDate(d.getDate() - 30);
      start = d.toISOString().split('T')[0];
    } else if (preset === '90d') {
      const d = new Date(today);
      d.setDate(d.getDate() - 90);
      start = d.toISOString().split('T')[0];
    } else if (preset === '180d') {
      const d = new Date(today);
      d.setDate(d.getDate() - 180);
      start = d.toISOString().split('T')[0];
    } else if (preset === 'all') {
      start = null;
      end = null;
    }

    setFilters((prev) => ({
      ...prev,
      preset,
      startDate: start,
      endDate: end,
    }));
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          {activeTabTitle}
        </h2>
        <p className="text-[11px] text-slate-500">
          Retail Operations & Decision Support • Currency: INR (₹)
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Preset Date Range Buttons */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => handleRangeChange('all')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              filters.preset === 'all'
                ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Data
          </button>
          <button
            onClick={() => handleRangeChange('180d')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              filters.preset === '180d'
                ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            6 Months
          </button>
          <button
            onClick={() => handleRangeChange('90d')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              filters.preset === '90d'
                ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            90 Days
          </button>
          <button
            onClick={() => handleRangeChange('30d')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              filters.preset === '30d'
                ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            30 Days
          </button>
        </div>

        {/* Region Filter */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 shadow-sm">
          <span className="text-slate-400 font-medium">Region:</span>
          <select
            value={filters.region}
            onChange={(e) => setFilters((prev) => ({ ...prev, region: e.target.value }))}
            className="bg-transparent font-medium outline-none cursor-pointer text-slate-800"
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r === 'All' ? 'All Regions' : r}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 shadow-sm">
          <span className="text-slate-400 font-medium">Category:</span>
          <select
            value={filters.category}
            onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
            className="bg-transparent font-medium outline-none cursor-pointer text-slate-800"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Categories' : c}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          title="Refresh Data"
          className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg transition-colors shadow-sm disabled:opacity-50"
        >
          <RotateCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
        </button>

        {/* Quick Upload CTA */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-colors"
        >
          <UploadCloud className="h-3.5 w-3.5" />
          <span>Upload CSV</span>
        </button>
      </div>
    </header>
  );
}
