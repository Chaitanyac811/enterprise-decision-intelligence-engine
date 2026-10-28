import React from 'react';
import {
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Compass
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Area
} from 'recharts';
import LoadingState from '../components/LoadingState';
import {
  formatCurrency,
  formatCompactCurrency,
  formatNumber,
  formatDate
} from '../utils/formatters';

export default function ForecastingPage({ forecastData, loading, onRetry }) {
  if (loading && !forecastData) {
    return <LoadingState message="Computing time-series forecast & evaluating holdout MAE..." />;
  }

  const evalMetrics = forecastData?.evaluation || {};
  const forecastList = forecastData?.forecast || [];
  const historical = forecastData?.historical || [];

  // Combine historical (last 30 days) and 7-day forecast for unified charting
  const recentHistorical = historical.slice(-30).map((h) => ({
    date: h.date,
    actual: h.actual_revenue,
    predicted: null,
    lower: null,
    upper: null,
  }));

  // Bridge point: last historical point connects to forecast
  const bridgePoint = recentHistorical.length > 0 ? {
    date: recentHistorical[recentHistorical.length - 1].date,
    actual: recentHistorical[recentHistorical.length - 1].actual,
    predicted: recentHistorical[recentHistorical.length - 1].actual,
    lower: recentHistorical[recentHistorical.length - 1].actual,
    upper: recentHistorical[recentHistorical.length - 1].actual,
  } : null;

  const futurePoints = forecastList.map((f) => ({
    date: f.date,
    actual: null,
    predicted: f.predicted_revenue,
    lower: f.lower_confidence_90,
    upper: f.upper_confidence_90,
    day_name: f.day_name,
  }));

  const chartData = [
    ...recentHistorical.slice(0, -1),
    ...(bridgePoint ? [bridgePoint] : []),
    ...futurePoints,
  ];

  return (
    <div className="space-y-6">
      {/* 1. Model Evaluation Metrics Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* MAE Metric Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
            <span>Mean Absolute Error (MAE)</span>
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {evalMetrics.mae_formatted || '₹0.00'}
          </div>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            {evalMetrics.mae_interpretation || 'Holdout evaluation metric.'}
          </p>
        </div>

        {/* MAPE Metric Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
            <span>Mean Absolute % Error (MAPE)</span>
            <Compass className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {evalMetrics.mape_percent ? `${evalMetrics.mape_percent}%` : 'N/A'}
          </div>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Percentage divergence on unseen historical holdout test set (lower is superior).
          </p>
        </div>

        {/* Algorithm Baseline Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
            <span>Baseline Methodology</span>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-sm font-bold text-slate-900">
            Seasonal Moving Average (7-Day)
          </div>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Evaluated against 7-day unseen historical holdout window. Captures weekend vs weekday retail cycles.
          </p>
        </div>
      </div>

      {/* 2. Unified Forecast Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Historical Observations & 7-Day Forward Projection
            </h3>
            <p className="text-xs text-slate-500">
              Solid line: Recorded historical sales • Dashed indigo line: 7-day predicted trajectory
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-5 bg-slate-700 rounded-full" />
              Actual Historical
            </span>
            <span className="flex items-center gap-1.5 text-indigo-600 font-medium">
              <span className="h-0.5 w-5 bg-indigo-600 border-b-2 border-dashed" />
              7-Day Forecast
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  minTickGap={25}
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
                      const isForecast = data.predicted !== null && data.actual === null;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-bold text-slate-200">
                            {formatDate(data.date)} {data.day_name ? `(${data.day_name})` : ''}
                          </p>
                          {data.actual !== null && (
                            <p className="text-slate-300">
                              Actual Revenue: <strong>{formatCurrency(data.actual)}</strong>
                            </p>
                          )}
                          {data.predicted !== null && (
                            <>
                              <p className="text-indigo-400 font-bold">
                                Projected: {formatCurrency(data.predicted)}
                              </p>
                              {data.lower !== null && data.upper !== null && (
                                <p className="text-slate-400 text-[11px]">
                                  90% Band: {formatCurrency(data.lower)} – {formatCurrency(data.upper)}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* Historical actual curve */}
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#334155"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: '#334155' }}
                  connectNulls={false}
                />
                {/* Forward projection curve */}
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#4f46e5', stroke: '#fff', strokeWidth: 1.5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Insufficient historical data to compute time-series projection.
            </div>
          )}
        </div>
      </div>

      {/* 3. 7-Day Forecast Projection Table & Assumptions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projections Table (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-1">
            7-Day Forward Daily Projections
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Point estimates with 90% confidence uncertainty intervals
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Day of Week</th>
                  <th className="pb-2 text-right">Projected Revenue</th>
                  <th className="pb-2 text-right">90% Lower Bound</th>
                  <th className="pb-2 text-right">90% Upper Bound</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {forecastList.map((f) => (
                  <tr key={f.date} className="hover:bg-slate-50">
                    <td className="py-2.5 font-medium text-slate-900 whitespace-nowrap">
                      {formatDate(f.date)}
                    </td>
                    <td className="py-2.5 text-slate-600 font-medium">
                      {f.day_name}
                    </td>
                    <td className="py-2.5 text-right font-bold text-indigo-600">
                      {formatCurrency(f.predicted_revenue)}
                    </td>
                    <td className="py-2.5 text-right text-slate-500">
                      {formatCurrency(f.lower_confidence_90)}
                    </td>
                    <td className="py-2.5 text-right text-slate-500">
                      {formatCurrency(f.upper_confidence_90)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Model Assumptions Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-1">
              Model Assumptions & Rationale
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Why this baseline was selected for interview presentation
            </p>

            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Seasonality:</strong> Multiplicative day-of-week ratio accurately mirrors retail purchasing spikes on weekends.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Explainability:</strong> Moving averages avoid the black-box risk of deep learning architectures on small datasets.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Validation:</strong> The model is validated using a strictly out-of-sample 7-day holdout set to report honest MAE.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-500">
            <strong>Interview Tip:</strong> Complex neural networks (e.g. LSTM/Transformers) overfit on sample retail datasets with &lt; 10,000 dates. A seasonal moving average baseline is the industry standard benchmark.
          </div>
        </div>
      </div>
    </div>
  );
}
