import React from 'react';
import {
  IndianRupee,
  ShoppingBag,
  Package,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  Legend
} from 'recharts';
import KpiCard from '../components/KpiCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import {
  formatCurrency,
  formatCompactCurrency,
  formatNumber,
  formatPercent,
  formatDate
} from '../utils/formatters';

const CATEGORY_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
const REGION_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'];

export default function OverviewPage({
  kpis,
  trends,
  categories,
  regions,
  topProducts,
  anomalies,
  loading,
  error,
  onRetry,
  onNavigate
}) {
  if (loading && !kpis) {
    return <LoadingState message="Loading business intelligence overview..." />;
  }
  if (error && !kpis) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  const k = kpis || {};
  const recentAnomalies = (anomalies?.anomalies || []).slice(-3).reverse();

  return (
    <div className="space-y-6">
      {/* 1. KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Revenue"
          value={formatCurrency(k.total_revenue || 0)}
          icon={IndianRupee}
          changePercent={k.revenue_growth_percent}
          subtext={`vs equivalent prior period (${formatCompactCurrency(k.prior_period_revenue || 0)})`}
          color="indigo"
        />
        <KpiCard
          title="Total Orders"
          value={formatNumber(k.total_orders || 0)}
          icon={ShoppingBag}
          subtext="Unique checkout transactions"
          color="blue"
        />
        <KpiCard
          title="Units Sold"
          value={formatNumber(k.total_units || 0)}
          icon={Package}
          subtext="Cumulative items shipped"
          color="emerald"
        />
        <KpiCard
          title="Average Order Value"
          value={formatCurrency(k.average_order_value || 0)}
          icon={CreditCard}
          subtext="Total Revenue / Total Orders"
          color="amber"
        />
      </div>

      {/* 2. Anomaly Alert Banner (if any recent high/medium anomaly) */}
      {recentAnomalies.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Statistical Outliers Detected
                </span>
                <span className="bg-amber-200/70 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {anomalies.summary.anomalies_detected} Flagged in Range
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Latest: {recentAnomalies[0].date} — {recentAnomalies[0].reason}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('anomalies')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-amber-200/60 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            <span>Investigate Anomalies</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 3. Primary Charts Row: Sales Trend (2 cols) & Category Share (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Daily Revenue Velocity
              </h3>
              <p className="text-xs text-slate-500">
                Timeline trend showing aggregated revenue and volume fluctuation
              </p>
            </div>
            <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
              {trends?.length || 0} Data Points
            </span>
          </div>

          <div className="h-72 w-full">
            {trends && trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(str) => {
                      const d = new Date(str);
                      return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
                    }}
                    minTickGap={30}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(val) => formatCompactCurrency(val)}
                  />
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Revenue']}
                    labelFormatter={(label) => formatDate(label)}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No trend observations in the selected filter window.
              </div>
            )}
          </div>
        </div>

        {/* Category Share Donut Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Revenue by Category
            </h3>
            <p className="text-xs text-slate-500 mb-2">
              Contribution percentage by retail department
            </p>
          </div>

          <div className="h-56 w-full relative">
            {categories && categories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="revenue"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categories.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No category data available.
              </div>
            )}
          </div>

          {/* Mini Legend */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {categories?.slice(0, 4).map((c, i) => (
              <div key={c.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                  />
                  <span className="text-slate-600 truncate">{c.category}</span>
                </div>
                <span className="font-semibold text-slate-900 shrink-0">
                  {c.share_percent}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Secondary Row: Regional Performance & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Comparison Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Geographic Revenue Distribution
              </h3>
              <p className="text-xs text-slate-500">
                Performance benchmarking across the 5 operating territories
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            {regions && regions.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regions} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="region"
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(val) => formatCompactCurrency(val)}
                  />
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No regional data available.
              </div>
            )}
          </div>
        </div>

        {/* Top 5 Products Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Top Performing Products
                </h3>
                <p className="text-xs text-slate-500">
                  Leading revenue contributors in current range
                </p>
              </div>
              <button
                onClick={() => onNavigate('analytics')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-2">Product Name</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2 text-right">Units</th>
                    <th className="pb-2 text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topProducts?.slice(0, 5).map((p) => (
                    <tr key={p.product_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 font-medium text-slate-900 truncate max-w-[180px]">
                        {p.name}
                      </td>
                      <td className="py-2.5 text-slate-500">
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-medium text-slate-700">
                        {formatNumber(p.units_sold)}
                      </td>
                      <td className="py-2.5 text-right font-bold text-slate-900">
                        {formatCurrency(p.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
