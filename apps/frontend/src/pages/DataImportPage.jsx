import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCw,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { api } from '../api';
import LoadingState from '../components/LoadingState';
import { formatNumber } from '../utils/formatters';

export default function DataImportPage({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.getIngestionHistory();
      if (res && res.history) {
        setHistory(res.history);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.toLowerCase().endsWith('.csv')) {
        setUploadError('Please select a valid .csv file.');
        return;
      }
      setFile(selected);
      setUploadError(null);
      setUploadResult(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (!selected.name.toLowerCase().endsWith('.csv')) {
        setUploadError('Only .csv files are supported.');
        return;
      }
      setFile(selected);
      setUploadError(null);
      setUploadResult(null);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const res = await api.uploadCsv(file);
      setUploadResult(res);
      setFile(null);
      await fetchHistory();
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      setUploadError(err.message || 'CSV ingestion failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Information & Sample CSV Download CTA */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Data Ingestion & ETL Pipeline
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Upload retail sales transactions in CSV format. Validates columns, schemas, foreign keys, and prevents duplicate records.
          </p>
        </div>

        {/* Download Sample CSV for Live Presentation */}
        <a
          href={api.getSampleCsvUrl()}
          download="sample_retail_sales.csv"
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors shrink-0"
        >
          <Download className="h-4 w-4" />
          <span>Download Sample CSV (100 Rows)</span>
        </a>
      </div>

      {/* 2. Upload Box & Live Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dropzone Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h4 className="text-sm font-bold text-slate-900 mb-3">
            Upload CSV File
          </h4>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
              }`}
              onClick={() => document.getElementById('csv-file-input').click()}
            >
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <UploadCloud className="h-6 w-6" />
              </div>

              {file ? (
                <div>
                  <p className="text-xs font-bold text-indigo-700">{file.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB • Ready for validation
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Click to browse or drag and drop your CSV here
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Max file size 10MB • Required: transaction_id, date, product_id, category, quantity, unit_price, region
                  </p>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 rounded-lg shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <RotateCw className="h-4 w-4 animate-spin" />
                  <span>Validating & Normalizing ETL Records...</span>
                </>
              ) : (
                <span>Validate & Ingest File</span>
              )}
            </button>
          </form>
        </div>

        {/* Validation Result Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">
              Ingestion Validation Summary
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Real-time audit results of the most recent batch execution
            </p>

            {uploadResult ? (
              <div className="space-y-4">
                {/* Status banner */}
                <div
                  className={`p-3.5 rounded-lg border text-xs flex items-start gap-3 ${
                    uploadResult.status === 'COMPLETED'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : uploadResult.status === 'PARTIAL'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {uploadResult.status === 'COMPLETED' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold text-xs uppercase tracking-wide">
                      Batch Status: {uploadResult.status}
                    </span>
                    <p className="mt-0.5 leading-relaxed">{uploadResult.summary}</p>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Rows</div>
                    <div className="text-base font-bold text-slate-900 mt-0.5">{uploadResult.total_records}</div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                    <div className="text-[10px] text-emerald-600 font-semibold uppercase">Accepted</div>
                    <div className="text-base font-bold text-emerald-700 mt-0.5">{uploadResult.accepted_records}</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                    <div className="text-[10px] text-amber-600 font-semibold uppercase">Duplicates</div>
                    <div className="text-base font-bold text-amber-700 mt-0.5">{uploadResult.skipped_records}</div>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                    <div className="text-[10px] text-rose-600 font-semibold uppercase">Rejected</div>
                    <div className="text-base font-bold text-rose-700 mt-0.5">{uploadResult.rejected_records}</div>
                  </div>
                </div>

                {/* Error log if any */}
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wide mb-1.5">
                      Rejected Rows Error Log (Top {uploadResult.errors.length})
                    </div>
                    <div className="bg-slate-900 text-slate-300 p-3 rounded-lg text-[11px] font-mono space-y-1 max-h-36 overflow-y-auto">
                      {uploadResult.errors.map((err, idx) => (
                        <div key={idx} className="text-rose-400">
                          • {err}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-48 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-xs text-slate-400 p-6 text-center">
                <FileSpreadsheet className="h-8 w-8 text-slate-300 mb-2" />
                <span>Upload a CSV file to inspect validation diagnostics and database commit status.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Ingestion History Audit Trail */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
              Ingestion Job Audit History
            </h4>
            <p className="text-xs text-slate-500">
              Audit log recorded in PostgreSQL <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono">ingestion_jobs</code> table
            </p>
          </div>
          <button
            onClick={fetchHistory}
            className="p-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {loadingHistory ? (
            <LoadingState message="Fetching audit trail..." />
          ) : history.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Job ID</th>
                  <th className="py-2.5 px-3">Filename</th>
                  <th className="py-2.5 px-3">Execution Time</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-right">Accepted</th>
                  <th className="py-2.5 px-3 text-right">Skipped</th>
                  <th className="py-2.5 px-3 text-right">Rejected</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                      {job.job_id}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {job.filename}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {job.created_at}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-800">
                      {formatNumber(job.total_records)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">
                      {formatNumber(job.accepted_records)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-amber-600">
                      {formatNumber(job.skipped_records)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-rose-600">
                      {formatNumber(job.rejected_records)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        job.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : job.status === 'PARTIAL'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No historical ingestion jobs logged yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
