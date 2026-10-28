import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Download, Filter, Layers, MapPin } from 'lucide-react';
import { api } from '../api';
import LoadingState from '../components/LoadingState';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';

export default function SalesAnalyticsPage({ filters, categories, regions }) {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total_pages: 1, total_records: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingTx, setLoadingTx] = useState(false);

  const fetchTransactions = async (page = 1, search = searchQuery) => {
    setLoadingTx(true);
    try {
      const res = await api.getTransactions({
        page,
        limit: pagination.limit,
        search,
        startDate: filters.startDate,
        endDate: filters.endDate,
        region: filters.region,
        category: filters.category,
      });
      if (res && res.transactions) {
        setTransactions(res.transactions);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1, searchQuery);
  }, [filters, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. Category & Regional Breakdown Metric Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Product Category Performance
              </h3>
              <p className="text-xs text-slate-500">
                Departmental metrics and share of wallet
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-2.5">Category</th>
                  <th className="pb-2.5 text-right">Orders</th>
                  <th className="pb-2.5 text-right">Units</th>
                  <th className="pb-2.5 text-right">Revenue</th>
                  <th className="pb-2.5 text-right">Share %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories?.map((c) => (
                  <tr key={c.category} className="hover:bg-slate-50/70">
                    <td className="py-2.5 font-semibold text-slate-800">{c.category}</td>
                    <td className="py-2.5 text-right text-slate-600">{formatNumber(c.orders)}</td>
                    <td className="py-2.5 text-right text-slate-600">{formatNumber(c.units)}</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">{formatCurrency(c.revenue)}</td>
                    <td className="py-2.5 text-right font-semibold text-indigo-600">{c.share_percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Regional Breakdown Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Regional Distribution Performance
              </h3>
              <p className="text-xs text-slate-500">
                Operating territory revenue and fulfillment volume
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-2.5">Region</th>
                  <th className="pb-2.5 text-right">Orders</th>
                  <th className="pb-2.5 text-right">Units</th>
                  <th className="pb-2.5 text-right">Revenue</th>
                  <th className="pb-2.5 text-right">Share %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {regions?.map((r) => (
                  <tr key={r.region} className="hover:bg-slate-50/70">
                    <td className="py-2.5 font-semibold text-slate-800">{r.region}</td>
                    <td className="py-2.5 text-right text-slate-600">{formatNumber(r.orders)}</td>
                    <td className="py-2.5 text-right text-slate-600">{formatNumber(r.units)}</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">{formatCurrency(r.revenue)}</td>
                    <td className="py-2.5 text-right font-semibold text-blue-600">{r.share_percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. Detailed Transaction Explorer with Server-Side Pagination */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Transaction Explorer & Audit Trail
            </h3>
            <p className="text-xs text-slate-500">
              Paginated record view joined with product catalog and fulfillment attributes
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search transaction or product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-1 focus:ring-indigo-500 w-64"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto min-h-[300px]">
          {loadingTx ? (
            <LoadingState message="Fetching transaction pages..." />
          ) : transactions.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Total Revenue</th>
                  <th className="py-2.5 px-3">Region</th>
                  <th className="py-2.5 px-3">Segment</th>
                  <th className="py-2.5 px-3">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.transaction_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-indigo-600">
                      {tx.transaction_id}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {formatDate(tx.sale_date)}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 max-w-[200px] truncate" title={tx.product_name}>
                      {tx.product_name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-medium">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                      {tx.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {formatCurrency(tx.unit_price)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(tx.revenue)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {tx.region}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                        tx.customer_segment === 'Corporate'
                          ? 'bg-purple-50 text-purple-700'
                          : tx.customer_segment === 'Wholesale'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {tx.customer_segment}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                      {tx.payment_method}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No transactions match your search or filter criteria.
            </div>
          )}
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{transactions.length}</strong> of{' '}
            <strong className="text-slate-800">{formatNumber(pagination.total_records)}</strong> transactions
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchTransactions(pagination.page - 1)}
              disabled={!pagination.has_prev || loadingTx}
              className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-medium text-slate-700">
              Page {pagination.page} of {pagination.total_pages || 1}
            </span>
            <button
              onClick={() => fetchTransactions(pagination.page + 1)}
              disabled={!pagination.has_next || loadingTx}
              className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
