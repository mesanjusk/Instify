import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Divider,
  Stack, TextField, Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import apiClient from '../apiClient';

export default function TrialBalance() {
  const [rows, setRows]   = useState([]);
  const [totals, setTotals] = useState({ totalDebit: 0, totalCredit: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const uuid = localStorage.getItem('institute_uuid');

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await apiClient.get(`/api/transaction/trial-balance?institute_uuid=${uuid}`);
      if (res.data?.success) {
        setRows(res.data.result || []);
        setTotals({ totalDebit: res.data.totalDebit || 0, totalCredit: res.data.totalCredit || 0 });
      } else setError('No data');
    } catch { setError('Failed to load trial balance'); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (uuid) load(); }, []);

  function exportCSV() {
    const header = 'Account Name,Group,Debit,Credit\n';
    const body = rows.map(r => `"${r.name}","${r.group || ''}",${r.debit},${r.credit}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'trial_balance.csv'; a.click();
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Trial Balance</Typography>
          <Typography variant="caption" color="text.secondary">All accounts debit/credit summary</Typography>
        </Box>
        <Button size="small" startIcon={<DownloadIcon />} onClick={exportCSV} disabled={!rows.length}>Export CSV</Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box textAlign="center" py={5}><CircularProgress /></Box>
      ) : (
        <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Account</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Group</th>
                <th style={{ padding: '10px 16px', textAlign: 'right', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Debit (Dr)</th>
                <th style={{ padding: '10px 16px', textAlign: 'right', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Credit (Cr)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '9px 16px', fontWeight: 500 }}>{r.name}</td>
                  <td style={{ padding: '9px 16px', color: '#94a3b8', fontSize: 12 }}>{r.group || '—'}</td>
                  <td style={{ padding: '9px 16px', textAlign: 'right', color: r.debit > 0 ? '#4f46e5' : '#94a3b8' }}>
                    {r.debit > 0 ? `₹${r.debit.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ padding: '9px 16px', textAlign: 'right', color: r.credit > 0 ? '#10b981' : '#94a3b8' }}>
                    {r.credit > 0 ? `₹${r.credit.toLocaleString()}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f1f5f9', borderTop: '2px solid #e2e8f0' }}>
                <td colSpan={2} style={{ padding: '10px 16px', fontWeight: 700 }}>Total</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: '#4f46e5' }}>₹{totals.totalDebit.toLocaleString()}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>₹{totals.totalCredit.toLocaleString()}</td>
              </tr>
              {Math.abs(totals.totalDebit - totals.totalCredit) > 1 && (
                <tr style={{ background: '#fef3c7' }}>
                  <td colSpan={4} style={{ padding: '8px 16px', fontSize: 12, color: '#92400e' }}>
                    ⚠ Difference: ₹{Math.abs(totals.totalDebit - totals.totalCredit).toLocaleString()} — Trial balance does not balance.
                  </td>
                </tr>
              )}
              {Math.abs(totals.totalDebit - totals.totalCredit) <= 1 && rows.length > 0 && (
                <tr style={{ background: '#f0fdf4' }}>
                  <td colSpan={4} style={{ padding: '8px 16px', fontSize: 12, color: '#15803d' }}>
                    ✓ Trial balance is balanced.
                  </td>
                </tr>
              )}
            </tfoot>
          </table>
          {rows.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <Typography color="text.secondary">No transactions found. Add transactions to see the trial balance.</Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
