import React, { useState } from 'react';
import {
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  ExternalLink,
  HelpCircle,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Scatter
} from 'recharts';
import { api } from '../api';
import LoadingState from '../components/LoadingState';
import {
  formatCurrency,
  formatCompactCurrency,
  formatNumber,
  formatDate
} from '../utils/formatters';

export default function AnomalyDetectionPage({ anomalies, loading, onRetry }) {
  const [inspectDate, setInspectDate] = useState(null);
  const [inspectionData, setInspectionData] = useState(null);
  const [loadingInspection, setLoadingInspection] = useState(false);

  if (loading && !anomalies) {
    return <LoadingState message="Running statistical anomaly detection..." />;
  }

  const handleInspect = async (dateStr) => {
    setInspectDate(dateStr);
    setLoadingInspection(true);
    try {
      const res = await api.inspectAnomalyDate(dateStr);
      setInspectionData(res);
    } catch (err) {
      console.error('Failed to inspect anomaly date:', err);
    } finally {
      setLoadingInspection(false);
    }
  };

  const closeInspection = () => {
    setInspectDate(null);
    setInspectionData(null);
  };

  const params = anomalies?.parameters || {};
  const summary = anomalies?.summary || {};
  const series = anomalies?.annotated_series || [];
  const anomalyList = anomalies?.anomalies || [];

  return (
    <div className="space-y-6">
      {/* 1. Methodology & Disclaimer Alert */}
      <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4 flex items-start gap-3 text-xs text-indigo-950">
        <Info className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-indigo-900">
            Statistical Signal Methodology (Tukey's IQR & Rolling Z-Score)
          </p>
          <p className="text-indigo-800/90 leading-relaxed">
            Outliers are flagged at the daily revenue aggregation level using an Interquartile Range (IQR = Q3 - Q1) threshold band combined with standard Z-score dispersion.
            <strong className="text-indigo-950"> Important:</strong> An anomaly is a mathematical variance signal warranting investigation, not definitive proof of operational failure, fraud, or data error.
          </p>
        </div>
      </div>

      {/* 2. Statistical Parameters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
          <div className="text-[10px] font-semibold text-slate-400 uppercase">Q1 (25th %)</div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">{formatCompactCurrency(params.q1 || 0)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
          <div className="text-[10px] font-semibold text-slate-400 uppercase">Median (50th %)</div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">{formatCompactCurrency(params.median || 0)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
          <div className="text-[10px] font-semibold text-slate-400 uppercase">Q3 (75th %)</div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">{formatCompactCurrency(params.q3 || 0)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
          <div className="text-[10px] font-semibold text-slate-400 uppercase">IQR Spread</div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">{formatCompactCurrency(params.iqr || 0)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
          <div className="text-[10px] font-semibold text-emerald-600 uppercase">Lower Bound</div>
          <div className="text-sm font-bold text-emerald-700 mt-0.5">{formatCompactCurrency(params.lower_threshold || 0)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
          <div className="text-[10px] font-semibold text-rose-600 uppercase">Upper Bound</div>
          <div className="text-sm font-bold text-rose-700 mt-0.5">{formatCompactCurrency(params.upper_threshold || 0)}</div>
        </div>
      </div>

      {/* 3. Anomaly Timeline Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Statistical Threshold Boundary Timeline
            </h3>
            <p className="text-xs text-slate-500">
              Solid curve traces daily revenue; dashed lines represent statistical upper & lower Tukey limits
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-5 bg-indigo-600 rounded-full" />
              Observed
            </span>
            <span className="flex items-center gap-1.5 text-rose-600">
              <span className="h-0.5 w-5 bg-rose-500 border-b border-dashed" />
              Upper Threshold
            </span>
            <span className="flex items-center gap-1.5 text-amber-600">
              <span className="h-0.5 w-5 bg-amber-500 border-b border-dashed" />
              Lower Threshold
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          {series.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-bold text-slate-200">{formatDate(data.date)}</p>
                          <p className="text-indigo-400">
                            Revenue: <strong>{formatCurrency(data.revenue)}</strong>
                          </p>
                          <p className="text-slate-400">
                            Expected: {formatCurrency(data.expected)}
                          </p>
                          <p className="text-slate-400">
                            Upper Limit: {formatCurrency(data.upper_bound)}
                          </p>
                          {data.is_anomaly && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold text-[10px]">
                              Flagged Outlier ({data.severity})
                            </span>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* Upper and Lower threshold reference lines */}
                {params.upper_threshold && (
                  <ReferenceLine
                    y={params.upper_threshold}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                )}
                {params.lower_threshold && (
                  <ReferenceLine
                    y={params.lower_threshold}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (payload.is_anomaly) {
                      return (
                        <circle
                          key={payload.date}
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill={payload.severity === 'HIGH' ? '#ef4444' : '#f59e0b'}
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      );
                    }
                    return null;
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No daily observations available to compute timeline thresholds.
            </div>
          )}
        </div>
      </div>

      {/* 4. Flagged Outliers Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Flagged Statistical Observations ({anomalyList.length})
            </h3>
            <p className="text-xs text-slate-500">
              Review flagged dates and click "Inspect Date" to drill down into underlying checkout records
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {anomalyList.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Observed Revenue</th>
                  <th className="py-2.5 px-3 text-right">Expected Baseline</th>
                  <th className="py-2.5 px-3 text-right">Z-Score</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Statistical Reason</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {anomalyList.map((a) => (
                  <tr key={a.date} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-medium text-slate-900 whitespace-nowrap">
                      {formatDate(a.date)}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                        a.anomaly_type === 'SPIKE' ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {a.anomaly_type === 'SPIKE' ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                        {a.anomaly_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(a.observed_revenue)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">
                      {formatCurrency(a.expected_revenue)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-700">
                      {a.z_score > 0 ? `+${a.z_score}` : a.z_score}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        a.severity === 'HIGH'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {a.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={a.reason}>
                      {a.reason}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleInspect(a.date)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded transition-colors"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No anomalies detected for the current filter criteria.
            </div>
          )}
        </div>
      </div>

      {/* 5. Inspection Modal / Drawer */}
      {inspectDate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Transaction Audit: {formatDate(inspectDate)}
                </h3>
                <p className="text-xs text-slate-500">
                  Underlying line-item sales records contributing to flagged statistical observation
                </p>
              </div>
              <button
                onClick={closeInspection}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto flex-1">
              {loadingInspection ? (
                <LoadingState message="Fetching granular records for date..." />
              ) : inspectionData ? (
                <div className="space-y-4">
                  {/* Summary row */}
                  <div className="flex items-center gap-6 p-3 bg-slate-50 rounded-lg text-xs">
                    <div>
                      <span className="text-slate-500">Total Transactions:</span>{' '}
                      <strong className="text-slate-900">{inspectionData.transaction_count}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Total Day Revenue:</span>{' '}
                      <strong className="text-slate-900">{formatCurrency(inspectionData.total_revenue_on_date)}</strong>
                    </div>
                  </div>

                  {/* Table */}
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="pb-2">Tx ID</th>
                        <th className="pb-2">Product</th>
                        <th className="pb-2">Category</th>
                        <th className="pb-2 text-right">Qty</th>
                        <th className="pb-2 text-right">Price</th>
                        <th className="pb-2 text-right">Revenue</th>
                        <th className="pb-2">Region</th>
                        <th className="pb-2">Segment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inspectionData.transactions.map((tx) => (
                        <tr key={tx.transaction_id} className="hover:bg-slate-50">
                          <td className="py-2 font-mono text-indigo-600">{tx.transaction_id}</td>
                          <td className="py-2 font-medium text-slate-900">{tx.product_name}</td>
                          <td className="py-2 text-slate-500">{tx.category}</td>
                          <td className="py-2 text-right text-slate-700">{tx.quantity}</td>
                          <td className="py-2 text-right text-slate-600">{formatCurrency(tx.unit_price)}</td>
                          <td className="py-2 text-right font-bold text-slate-900">{formatCurrency(tx.revenue)}</td>
                          <td className="py-2 text-slate-600">{tx.region}</td>
                          <td className="py-2">
                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-medium text-slate-700">
                              {tx.customer_segment}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end">
              <button
                onClick={closeInspection}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
