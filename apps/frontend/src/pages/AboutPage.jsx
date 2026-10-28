import React from 'react';
import {
  Layers,
  Database,
  Cpu,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  FileCode,
  ShieldCheck,
  Terminal,
  Clock
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* 1. Executive Summary & Pitch */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Enterprise Decision Intelligence Engine
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Architectural Overview, Mathematical Foundations, and Presentation Guide
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg text-xs leading-relaxed text-slate-700 space-y-2">
          <p className="font-bold text-indigo-950 uppercase tracking-wide text-[11px]">
            60-Second Interview Pitch:
          </p>
          <p>
            "The Enterprise Decision Intelligence Engine is an end-to-end retail business intelligence platform that bridges raw transactional ingestion, analytical storage, and automated prescriptive decision-making. 
            Data flows from validated CSV uploads through an ACID-compliant PostgreSQL schema into a high-performance Express backend. 
            Advanced analytics, statistical anomaly detection using Tukey's IQR, and seasonal baseline forecasting are calculated via a dedicated Python microservice running FastAPI and pandas. 
            Finally, our grounded recommendation engine evaluates empirical metrics to surface high-priority operational strategies directly to business leadership."
          </p>
        </div>
      </div>

      {/* 2. Architecture Diagram & Component Roles */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-600" />
          System Architecture & Data Flow
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Frontend */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">
              Client Layer
            </span>
            <h5 className="font-bold text-slate-900 text-sm mb-1">React + Vite</h5>
            <p className="text-slate-500 mb-3 text-[11px]">Port: 3000</p>
            <ul className="space-y-1 text-slate-600 text-[11px]">
              <li>• Recharts visualizers</li>
              <li>• Responsive Tailwind UI</li>
              <li>• CSV upload portal</li>
              <li>• Real-time filter state</li>
            </ul>
          </div>

          {/* Backend */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
              API Gateway & ETL
            </span>
            <h5 className="font-bold text-slate-900 text-sm mb-1">Node.js + Express</h5>
            <p className="text-slate-500 mb-3 text-[11px]">Port: 5000</p>
            <ul className="space-y-1 text-slate-600 text-[11px]">
              <li>• REST API & Auth filters</li>
              <li>• Multer streaming CSV ETL</li>
              <li>• Deduplication engine</li>
              <li>• Parameterized SQL queries</li>
            </ul>
          </div>

          {/* Analytics Service */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
              Analytics & ML
            </span>
            <h5 className="font-bold text-slate-900 text-sm mb-1">Python FastAPI</h5>
            <p className="text-slate-500 mb-3 text-[11px]">Port: 5001</p>
            <ul className="space-y-1 text-slate-600 text-[11px]">
              <li>• pandas & NumPy core</li>
              <li>• Tukey IQR outlier filter</li>
              <li>• Seasonal moving average</li>
              <li>• Holdout MAE validation</li>
            </ul>
          </div>

          {/* Database */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block mb-1">
              Persistent Storage
            </span>
            <h5 className="font-bold text-slate-900 text-sm mb-1">PostgreSQL 18</h5>
            <p className="text-slate-500 mb-3 text-[11px]">Port: 5433</p>
            <ul className="space-y-1 text-slate-600 text-[11px]">
              <li>• ACID transaction safety</li>
              <li>• B-tree date & region indexes</li>
              <li>• Foreign key constraints</li>
              <li>• Ingestion audit history</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. Mathematical Foundations & Algorithms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* KPI & Math Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileCode className="h-4 w-4 text-indigo-600" />
            Core KPI Mathematical Formulas
          </h4>

          <div className="space-y-3 text-xs text-slate-600">
            <div>
              <strong className="text-slate-900">Total Revenue (₹):</strong>
              <div className="font-mono bg-slate-100 p-2 rounded mt-1 text-indigo-800">
                Revenue = Σ (Quantity × Unit_Price)
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Derived and persisted at transaction time to preserve historical price lock against future catalogue price updates.
              </p>
            </div>

            <div>
              <strong className="text-slate-900">Average Order Value (AOV):</strong>
              <div className="font-mono bg-slate-100 p-2 rounded mt-1 text-indigo-800">
                AOV = Total Revenue / Total Unique Orders
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Total orders counts distinct transaction IDs; protected with zero-division safeguard.
              </p>
            </div>

            <div>
              <strong className="text-slate-900">Period-over-Period Growth Rate:</strong>
              <div className="font-mono bg-slate-100 p-2 rounded mt-1 text-indigo-800">
                Growth % = [(Current_Rev - Prior_Rev) / Prior_Rev] × 100%
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Dynamically shifts an equivalent preceding window duration (e.g. 30 days prior).
              </p>
            </div>
          </div>
        </div>

        {/* Anomaly Detection Math Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Anomaly Detection & Forecasting
          </h4>

          <div className="space-y-3 text-xs text-slate-600">
            <div>
              <strong className="text-slate-900">Tukey's IQR Outlier Filter:</strong>
              <div className="font-mono bg-slate-100 p-2 rounded mt-1 text-indigo-800">
                IQR = Q3 - Q1<br />
                Upper Limit = Q3 + (1.5 × IQR)<br />
                Lower Limit = max(0, Q1 - (1.5 × IQR))
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Extreme anomalies (3.0 × IQR or |Z| ≥ 3.0) receive HIGH severity status.
              </p>
            </div>

            <div>
              <strong className="text-slate-900">Seasonal Forecast & Holdout Evaluation:</strong>
              <div className="font-mono bg-slate-100 p-2 rounded mt-1 text-indigo-800">
                MAE = (1/n) Σ |Actual_i - Predicted_i|
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                The model reserves the last 7 days as unseen historical test data to compute empirical MAE, MAPE, and RMSE before projecting 7 future days.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Interview Questions Quick Cheat-Sheet */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Key Technical Interview Points
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="p-3 bg-slate-50 rounded-lg space-y-1">
            <strong className="text-slate-900">Q: Why separate the Python analytics service from Express?</strong>
            <p>
              A: Separation of concerns. Node.js is optimal for concurrent I/O, streaming file uploads, and connection pooling. Python with pandas/NumPy is vectorized and tailored for numerical math, statistical IQR, and matrix operations. Microservice communication is cleanly decoupled via HTTP JSON contracts.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg space-y-1">
            <strong className="text-slate-900">Q: How are duplicate CSV uploads prevented?</strong>
            <p>
              A: Intra-batch deduplication via an in-memory hash set, combined with a unique constraint on <code className="font-mono">transaction_id</code> in PostgreSQL. Existing records trigger <code className="font-mono">ON CONFLICT DO NOTHING</code> and are logged as skipped/duplicate in <code className="font-mono">ingestion_jobs</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
