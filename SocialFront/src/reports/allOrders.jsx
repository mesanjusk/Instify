import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../apiClient';
import toast, { Toaster } from 'react-hot-toast';

const STATUS_COLORS = {
  pending:    { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  confirmed:  { bg: 'bg-blue-100',   text: 'text-blue-700'   },
  processing: { bg: 'bg-purple-100', text: 'text-purple-700' },
  shipped:    { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  delivered:  { bg: 'bg-green-100',  text: 'text-green-700'  },
  cancelled:  { bg: 'bg-red-100',    text: 'text-red-700'    },
};

const ACTIVE_STATUSES = ['pending', 'confirmed', 'processing', 'shipped'];

const StatusBadge = ({ status }) => {
  const c = STATUS_COLORS[status] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${c.bg} ${c.text}`}>
      {status}
    </span>
  );
};

export default function AllOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active'); // 'active' | 'delivered'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { username } = useParams();
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const institute_uuid = localStorage.getItem('institute_uuid');
      const { data } = await apiClient.get('/api/orders', {
        params: { institute_uuid },
      });
      setOrders(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusChange = async (uuid, newStatus) => {
    try {
      await apiClient.put(`/api/orders/${uuid}`, { status: newStatus });
      setOrders(prev =>
        prev.map(o => o.order_uuid === uuid ? { ...o, status: newStatus, deliveredAt: newStatus === 'delivered' ? new Date().toISOString() : o.deliveredAt } : o)
      );
      if (newStatus === 'delivered') {
        toast.success('Order marked as delivered');
      }
    } catch (err) {
      toast.error('Failed to update order status');
    }
  };

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (tab === 'active') {
        if (!ACTIVE_STATUSES.includes(o.status)) return false;
      } else {
        if (o.status !== 'delivered') return false;
      }
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      const q = search.toLowerCase();
      return (
        !q ||
        o.customerName?.toLowerCase().includes(q) ||
        o.customerMobile?.includes(q) ||
        String(o.order_id).includes(q)
      );
    });
  }, [orders, tab, search, statusFilter]);

  const activeCount = orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-semibold text-gray-800">Orders Report</h1>
        <button
          onClick={() => navigate(`/${username}/add-order`)}
          className="px-4 py-2 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700"
        >
          + New Order
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => { setTab('active'); setStatusFilter('all'); }}
          className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            tab === 'active'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Active Orders
          <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
            {activeCount}
          </span>
        </button>
        <button
          onClick={() => { setTab('delivered'); setStatusFilter('all'); }}
          className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            tab === 'delivered'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Delivered
          <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
            {deliveredCount}
          </span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, mobile, order #"
          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        {tab === 'active' && (
          <div className="flex gap-2 flex-wrap">
            {['all', ...ACTIVE_STATUSES].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded text-sm capitalize ${
                  statusFilter === s
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading orders…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {tab === 'active' ? 'No active orders found.' : 'No delivered orders yet.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Order #</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Mobile</th>
                <th className="px-4 py-3 text-left">Items</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">{tab === 'delivered' ? 'Delivered At' : 'Date'}</th>
                {tab === 'active' && <th className="px-4 py-3 text-left">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map(order => (
                <tr key={order.order_uuid} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">#{order.order_id}</td>
                  <td className="px-4 py-3 text-gray-700">{order.customerName}</td>
                  <td className="px-4 py-3 text-gray-600">{order.customerMobile || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {Array.isArray(order.items) && order.items.length > 0
                      ? order.items.map(i => i.name).join(', ')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">
                    ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {tab === 'delivered' && order.deliveredAt
                      ? new Date(order.deliveredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  {tab === 'active' && (
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={e => handleStatusChange(order.order_uuid, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      >
                        {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                          <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {!loading && (
        <p className="text-xs text-gray-400 mt-3">
          Showing {filtered.length} order{filtered.length !== 1 ? 's' : ''}
          {tab === 'active' ? ' (active)' : ' (delivered)'}
        </p>
      )}
    </div>
  );
}
