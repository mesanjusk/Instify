/**
 * Bulk Download Page
 * Select students → download a ZIP containing:
 *   - students.csv  (all selected students)
 *   - student-cards/ folder with one .txt summary per student
 */

import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import Papa from 'papaparse';
import {
  Alert, Box, Button, Card, CardContent, Checkbox, CircularProgress,
  Divider, FormControlLabel, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography, TextField,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import { useApp } from '../context/AppContext';
import apiClient from '../apiClient';

export default function BulkDownload() {
  const { institute } = useApp();
  const instituteId = institute?.institute_uuid || localStorage.getItem('institute_uuid') || '';

  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [alert, setAlert] = useState(null);

  function showAlert(type, text) {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 5000);
  }

  async function fetchStudents() {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/students', { params: { institute_uuid: instituteId } });
      const list = res.data?.result || res.data?.data || [];
      setStudents(list);
      setFiltered(list);
    } catch (err) {
      showAlert('error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (instituteId) fetchStudents(); }, [instituteId]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q ? students.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        (s.mobileSelf || '').includes(q)
      ) : students
    );
  }, [search, students]);

  function toggleOne(uuid) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(uuid) ? next.delete(uuid) : next.add(uuid);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(s => s.uuid)));
    }
  }

  async function downloadZip() {
    const list = students.filter(s => selected.has(s.uuid));
    if (!list.length) return showAlert('warning', 'Select at least one student');

    setDownloading(true);
    try {
      const zip = new JSZip();

      // 1. students.csv
      const csvData = list.map(s => ({
        Name: `${s.firstName || ''} ${s.middleName || ''} ${s.lastName || ''}`.trim(),
        Mobile: s.mobileSelf || '',
        'Parent Mobile': s.mobileParent || '',
        Gender: s.gender || '',
        DOB: s.dob ? new Date(s.dob).toLocaleDateString('en-IN') : '',
        Address: s.address || '',
        Education: s.education || '',
      }));
      zip.file('students.csv', Papa.unparse(csvData));

      // 2. Individual student cards as text files
      const cardsFolder = zip.folder('student-cards');
      list.forEach(s => {
        const name = `${s.firstName || ''} ${s.lastName || ''}`.trim();
        const card = [
          '============================',
          `  STUDENT PROFILE`,
          '============================',
          `Name        : ${name}`,
          `Mobile      : ${s.mobileSelf || 'N/A'}`,
          `Parent Mob  : ${s.mobileParent || 'N/A'}`,
          `Gender      : ${s.gender || 'N/A'}`,
          `DOB         : ${s.dob ? new Date(s.dob).toLocaleDateString('en-IN') : 'N/A'}`,
          `Education   : ${s.education || 'N/A'}`,
          `Address     : ${s.address || 'N/A'}`,
          '============================',
          `Generated   : ${new Date().toLocaleString('en-IN')}`,
        ].join('\n');
        const safeName = name.replace(/[^a-zA-Z0-9]/g, '_') || s.uuid;
        cardsFolder.file(`${safeName}.txt`, card);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students-export-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      showAlert('success', `Downloaded ZIP with ${list.length} student(s)`);
    } catch (err) {
      showAlert('error', 'ZIP generation failed: ' + err.message);
    } finally {
      setDownloading(false);
    }
  }

  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', py: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <DownloadIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h5" fontWeight={700}>Bulk Download</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
          Export selected students as ZIP (CSV + individual cards)
        </Typography>
      </Stack>

      {alert && <Alert severity={alert.type} sx={{ mb: 2 }}>{alert.text}</Alert>}

      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" mb={2}>
            <TextField
              label="Search by name or mobile"
              value={search}
              onChange={e => setSearch(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<SelectAllIcon />}
              onClick={toggleAll}
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </Button>
            <Button
              variant="contained"
              startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
              onClick={downloadZip}
              disabled={downloading || selected.size === 0}
            >
              Download ZIP ({selected.size})
            </Button>
          </Stack>

          {loading ? (
            <Box textAlign="center" py={4}><CircularProgress /></Box>
          ) : (
            <TableContainer sx={{ maxHeight: 480, border: '1px solid #eee', borderRadius: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={selected.size > 0 && !allSelected}
                        onChange={toggleAll}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Mobile</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Gender</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Education</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No students found
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map(s => (
                    <TableRow
                      key={s.uuid}
                      hover
                      selected={selected.has(s.uuid)}
                      onClick={() => toggleOne(s.uuid)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={selected.has(s.uuid)} onChange={() => toggleOne(s.uuid)} onClick={e => e.stopPropagation()} />
                      </TableCell>
                      <TableCell>{`${s.firstName || ''} ${s.middleName || ''} ${s.lastName || ''}`.trim()}</TableCell>
                      <TableCell>{s.mobileSelf || '—'}</TableCell>
                      <TableCell>{s.gender || '—'}</TableCell>
                      <TableCell>{s.education || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Typography variant="caption" color="text.secondary" mt={1} display="block">
            {filtered.length} student(s) shown &nbsp;|&nbsp; {selected.size} selected
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
