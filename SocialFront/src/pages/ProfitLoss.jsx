import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Divider,
  Stack, TextField, Typography, Chip,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import DownloadIcon from '@mui/icons-material/Download';
import apiClient from '../apiClient';

export default function ProfitLoss() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [from, setFrom]     = useState('');
  const [to, setTo]         = useState('');

  const uuid = localStorage.getItem('institute_uuid');

  async function load() {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ institute_uuid: uuid });
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await apiClient.get(`/api/transaction/pnl?${params}`);
      if (res.data?.success) setData(res.data.result);
      else setError('No data');
    } catch { setError('Failed to load P&L'); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (uuid) load(); }, []);

  function exportCSV() {
    if (!data) return;
    const lines = [
      'Type,Account,Amount',
      ...data.income.map(r => `Income,"${r.name}",${r.amount}`),
      `Income Total,,${data.totalIncome}`,
      ...data.expense.map(r => `Expense,"${r.name}",${r.amount}`),
      `Expense Total,,${data.totalExpense}`,
      `Net Profit,,${data.netProfit}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'pnl.csv'; a.click();
  }

  const netColor = data?.netProfit >= 0 ? '#10b981' : '#ef4444';

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Profit & Loss Statement</Typography>
          <Typography variant="caption" color="text.secondary">Income vs expenses overview</Typography>
        </Box>
        <Button size="small" startIcon={<DownloadIcon />} onClick={exportCSV} disabled={!data}>Export CSV</Button>
      </Stack>

      {/* Date filter */}
      <Stack direction="row" spacing={2} mb={2.5} alignItems="center">
        <TextField label="From" type="date" value={from} onChange={e => setFrom(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
        <TextField label="To" type="date" value={to} onChange={e => setTo(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
        <Button variant="outlined" size="small" onClick={load}>Apply</Button>
        {(from || to) && <Button size="small" onClick={() => { setFrom(''); setTo(''); setTimeout(load, 0); }}>Clear</Button>}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box textAlign="center" py={5}><CircularProgress /></Box>
      ) : data ? (
        <>
          {/* Summary cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
            <Box sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2, p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                <TrendingUpIcon sx={{ color: '#10b981', fontSize: 18 }} />
                <Typography variant="caption" color="#15803d" fontWeight={600}>Total Income</Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700} color="#15803d">₹{data.totalIncome.toLocaleString()}</Typography>
            </Box>
            <Box sx={{ bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 2, p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                <TrendingDownIcon sx={{ color: '#ef4444', fontSize: 18 }} />
                <Typography variant="caption" color="#dc2626" fontWeight={600}>Total Expenses</Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700} color="#dc2626">₹{data.totalExpense.toLocaleString()}</Typography>
            </Box>
            <Box sx={{ bgcolor: data.netProfit >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${data.netProfit >= 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: 2, p: 2 }}>
              <Typography variant="caption" sx={{ color: netColor, fontWeight: 600 }}>Net {data.netProfit >= 0 ? 'Profit' : 'Loss'}</Typography>
              <Typography variant="h5" fontWeight={700} sx={{ color: netColor }}>₹{Math.abs(data.netProfit).toLocaleString()}</Typography>
            </Box>
          </Box>

          {/* Income section */}
          <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden', mb: 2 }}>
            <Box sx={{ bgcolor: '#f0fdf4', px: 2, py: 1.25 }}>
              <Typography fontWeight={700} fontSize="0.875rem" color="#15803d">Income</Typography>
            </Box>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <tbody>
                {data.income.length === 0 && (
                  <tr><td colSpan={2} style={{ padding: '12px 16px', color: '#94a3b8', textAlign: 'center' }}>No income accounts found</td></tr>
                )}
                {data.income.map((r, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '9px 16px' }}>{r.name}</td>
                    <td style={{ padding: '9px 16px', textAlign: 'right', color: '#10b981', fontWeight: 500 }}>₹{r.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f0fdf4', borderTop: '2px solid #bbf7d0' }}>
                  <td style={{ padding: '9px 16px', fontWeight: 700 }}>Total Income</td>
                  <td style={{ padding: '9px 16px', textAlign: 'right', fontWeight: 700, color: '#15803d' }}>₹{data.totalIncome.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </Box>

          {/* Expense section */}
          <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden', mb: 2 }}>
            <Box sx={{ bgcolor: '#fef2f2', px: 2, py: 1.25 }}>
              <Typography fontWeight={700} fontSize="0.875rem" color="#dc2626">Expenses</Typography>
            </Box>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <tbody>
                {data.expense.length === 0 && (
                  <tr><td colSpan={2} style={{ padding: '12px 16px', color: '#94a3b8', textAlign: 'center' }}>No expense accounts found</td></tr>
                )}
                {data.expense.map((r, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '9px 16px' }}>{r.name}</td>
                    <td style={{ padding: '9px 16px', textAlign: 'right', color: '#ef4444', fontWeight: 500 }}>₹{r.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#fef2f2', borderTop: '2px solid #fecaca' }}>
                  <td style={{ padding: '9px 16px', fontWeight: 700 }}>Total Expenses</td>
                  <td style={{ padding: '9px 16px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>₹{data.totalExpense.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </Box>

          {/* Net */}
          <Box sx={{ bgcolor: data.netProfit >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${data.netProfit >= 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: 2, p: 2 }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography fontWeight={700}>Net {data.netProfit >= 0 ? 'Profit' : 'Loss'}</Typography>
              <Typography fontWeight={700} sx={{ color: netColor }}>₹{Math.abs(data.netProfit).toLocaleString()}</Typography>
            </Stack>
          </Box>
        </>
      ) : (
        <Box textAlign="center" py={5}>
          <Typography color="text.secondary">No data available. Make sure accounts are grouped as Income/Expense.</Typography>
        </Box>
      )}
    </Box>
  );
}
