import React, { useState } from 'react';
import {
  Lightbulb,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Filter,
  ArrowRight,
  ShieldAlert,
  Zap,
  Info
} from 'lucide-react';
import LoadingState from '../components/LoadingState';

export default function RecommendationsPage({ recommendations, loading, onRetry, onNavigate }) {
  const [filterPriority, setFilterPriority] = useState('ALL');

  if (loading && !recommendations) {
    return <LoadingState message="Evaluating business decision rules..." />;
  }

  const recList = recommendations?.recommendations || [];
  const filteredRecs = filterPriority === 'ALL'
    ? recList
    : recList.filter((r) => r.priority === filterPriority);

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'REVENUE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'RISK':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'OPERATIONS':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'GROWTH':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Filter */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Prescriptive Decision Intelligence ({filteredRecs.length})
            </h3>
            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Rule-Based Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic business actions generated directly from current transactional metrics and statistical variance
          </p>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setFilterPriority('ALL')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              filterPriority === 'ALL'
                ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Priorities
          </button>
          <button
            onClick={() => setFilterPriority('HIGH')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              filterPriority === 'HIGH'
                ? 'bg-white text-rose-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            High Priority
          </button>
          <button
            onClick={() => setFilterPriority('MEDIUM')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              filterPriority === 'MEDIUM'
                ? 'bg-white text-amber-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Medium
          </button>
          <button
            onClick={() => setFilterPriority('LOW')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              filterPriority === 'LOW'
                ? 'bg-white text-blue-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Low
          </button>
        </div>
      </div>

      {/* 2. Educational Alert */}
      <div className="bg-slate-900 text-slate-300 rounded-xl p-4 text-xs flex items-start gap-3">
        <Info className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-white">
            Architecture Clarification for Interview Presentation
          </p>
          <p className="text-slate-400 leading-relaxed">
            This module operates as a deterministic, rule-based recommendation engine evaluating actual computed metrics (growth rates, category concentration ratios, regional variance, and anomaly frequencies). It avoids hallucinating causes and clearly isolates observed facts from recommended operational remedies.
          </p>
        </div>
      </div>

      {/* 3. Recommendation Cards List */}
      <div className="space-y-4">
        {filteredRecs.length > 0 ? (
          filteredRecs.map((rec) => (
            <div
              key={rec.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getPriorityBadge(rec.priority)}`}>
                    {rec.priority} PRIORITY
                  </span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${getCategoryBadge(rec.category)}`}>
                    {rec.category}
                  </span>
                  <span className="font-mono text-xs text-slate-400">{rec.id}</span>
                </div>

                <div className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 px-3 py-1 rounded-md">
                  Supporting Evidence: <span className="text-indigo-600 font-bold">{rec.supporting_metric}</span>
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-900 mb-1.5">
                {rec.title}
              </h4>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {rec.explanation}
              </p>

              {/* Action Resolution Box */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3.5 flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-[11px] font-bold text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-indigo-600" />
                    Recommended Strategic Action
                  </div>
                  <p className="text-xs text-indigo-900 font-medium">
                    {rec.suggested_action}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-400">
            No recommendations match the selected priority filter.
          </div>
        )}
      </div>
    </div>
  );
}
