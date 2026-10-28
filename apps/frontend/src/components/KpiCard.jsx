import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatPercent } from '../utils/formatters';

export default function KpiCard({ title, value, icon: Icon, changePercent, subtext, color = 'indigo' }) {
  const isPositive = changePercent > 0;
  const isNegative = changePercent < 0;

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-${color}-50 text-${color}-600`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </div>

        {changePercent !== undefined && changePercent !== null && (
          <div
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
              isPositive
                ? 'bg-emerald-50 text-emerald-700'
                : isNegative
                ? 'bg-rose-50 text-rose-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isPositive && <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />}
            {isNegative && <ArrowDownRight className="h-3 w-3 stroke-[2.5]" />}
            <span>{formatPercent(changePercent)}</span>
          </div>
        )}
      </div>

      {subtext && (
        <p className="mt-1.5 text-xs text-slate-500 font-medium">
          {subtext}
        </p>
      )}
    </div>
  );
}
