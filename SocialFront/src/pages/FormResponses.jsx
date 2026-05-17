import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, CircularProgress, IconButton, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip, Typography, Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import apiClient from '../apiClient';

function toCSV(headers, rows) {
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => escape(Array.isArray(row[h]) ? row[h].join(', ') : row[h])).join(','));
  }
  return lines.join('\n');
}

export default function FormResponses() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [formRes, respRes] = await Promise.all([
          apiClient.get(`/api/forms/${formId}`),
          apiClient.get(`/api/forms/${formId}/responses`),
        ]);
        setForm(formRes.data.result);
        setResponses(respRes.data.result || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [formId]);

  function download() {
    if (!form || !responses.length) return;
    const headers = ['Submitted At', ...form.fields.sort((a, b) => a.order - b.order).map(f => f.label)];
    const rows = responses.map(r => {
      const row = { 'Submitted At': new Date(r.createdAt).toLocaleString() };
      for (const f of form.fields) row[f.label] = r.data?.[f.label] ?? '';
      return row;
    });
    const csv = toCSV(headers, rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.slug}-responses.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <Box textAlign="center" py={6}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  const sortedFields = [...(form?.fields || [])].sort((a, b) => a.order - b.order);

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Tooltip title="Back to forms">
          <IconButton size="small" onClick={() => navigate(-1)}><ArrowBackIcon /></IconButton>
        </Tooltip>
        <Box flex={1}>
          <Typography variant="h6" fontWeight={700}>{form?.title} — Responses</Typography>
          <Typography variant="caption" color="text.secondary">{responses.length} response{responses.length !== 1 ? 's' : ''}</Typography>
        </Box>
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={download} disabled={!responses.length}>
          Export CSV
        </Button>
      </Stack>

      {responses.length === 0 ? (
        <Box textAlign="center" py={6}>
          <Typography color="text.secondary">No responses yet.</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Submitted At</TableCell>
                {sortedFields.map(f => (
                  <TableCell key={f.field_uuid} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{f.label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {responses.map((r, idx) => (
                <TableRow key={r.response_uuid} hover>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(r.createdAt).toLocaleString()}</TableCell>
                  {sortedFields.map(f => (
                    <TableCell key={f.field_uuid}>
                      {Array.isArray(r.data?.[f.label])
                        ? r.data[f.label].join(', ')
                        : (r.data?.[f.label] ?? '—')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
