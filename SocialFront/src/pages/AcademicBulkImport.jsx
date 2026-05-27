/**
 * Academic Bulk Import
 * Import Students, Admissions, Courses, or Batches from CSV, Excel (.xlsx/.xls), or JSON.
 */

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Collapse, Divider, IconButton, Stack, Tab, Tabs, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import GroupsIcon from '@mui/icons-material/Groups';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useApp } from '../context/AppContext';
import apiClient from '../apiClient';

const TYPE_CONFIG = {
  students: {
    label: 'Students',
    icon: <PeopleIcon fontSize="small" />,
    color: '#1a7a4a',
    apiPath: '/api/csv-import/students',
    headers: ['firstName', 'lastName', 'middleName', 'mobileSelf', 'mobileParent', 'dob', 'gender', 'address', 'education'],
    sample: {
      firstName: 'Rahul', lastName: 'Sharma', middleName: '', mobileSelf: '9876543210',
      mobileParent: '9876543211', dob: '2000-05-15', gender: 'Male', address: 'Mumbai', education: 'B.Com',
    },
    notes: 'Duplicate mobile numbers within the same institute are skipped.',
  },
  admissions: {
    label: 'Admissions',
    icon: <SchoolIcon fontSize="small" />,
    color: '#10b981',
    apiPath: '/api/csv-import/admissions',
    headers: ['firstName', 'lastName', 'mobileSelf', 'course', 'batchTime', 'admissionDate', 'examEvent'],
    sample: {
      firstName: 'Priya', lastName: 'Verma', mobileSelf: '9123456789',
      course: 'React Course', batchTime: '10:00 AM', admissionDate: '2024-06-01', examEvent: 'June 2024',
    },
    notes: 'Student is matched by mobile. If not found, a new student record is created automatically.',
  },
  courses: {
    label: 'Courses',
    icon: <LibraryBooksIcon fontSize="small" />,
    color: '#d4a017',
    apiPath: '/api/csv-import/courses',
    headers: ['name', 'description', 'courseFees', 'examFees', 'duration'],
    sample: {
      name: 'React Fundamentals', description: 'Learn React from scratch',
      courseFees: '5000', examFees: '500', duration: '3 months',
    },
    notes: 'Courses with the same name in your institute are skipped.',
  },
  batches: {
    label: 'Batches',
    icon: <GroupsIcon fontSize="small" />,
    color: '#0891b2',
    apiPath: '/api/csv-import/batches',
    headers: ['name', 'timing'],
    sample: { name: 'Morning Batch A', timing: '09:00 AM - 11:00 AM' },
    notes: 'Batches with the same name in your institute are skipped.',
  },
  leads: {
    label: 'Leads',
    icon: <TrendingUpIcon fontSize="small" />,
    color: '#f59e0b',
    apiPath: '/api/csv-import/leads',
    headers: ['firstName', 'lastName', 'mobileSelf', 'course', 'enquiryDate', 'followupDate', 'referredBy'],
    sample: {
      firstName: 'Amit', lastName: 'Patel', mobileSelf: '9988776655',
      course: 'Python Basics', enquiryDate: '2024-06-01', followupDate: '2024-06-10', referredBy: 'Google',
    },
    notes: 'Student is matched by mobile. A new student record is created if not found.',
  },
};

const TYPES = Object.keys(TYPE_CONFIG);

function downloadSampleCSV(type) {
  const cfg = TYPE_CONFIG[type];
  const csv = [cfg.headers.join(','), cfg.headers.map(h => cfg.sample[h] ?? '').join(',')].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `sample-${type}.csv`;
  a.click();
}

function downloadSampleExcel(type) {
  const cfg = TYPE_CONFIG[type];
  const ws = XLSX.utils.json_to_sheet([cfg.sample]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `sample-${type}.xlsx`);
}

function downloadSampleJSON(type) {
  const cfg = TYPE_CONFIG[type];
  const json = JSON.stringify([cfg.sample], null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a.download = `sample-${type}.json`;
  a.click();
}

async function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'json') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(Array.isArray(data) ? data : (data.data || data.rows || [data]));
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  if (ext === 'xlsx' || ext === 'xls') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          resolve(XLSX.utils.sheet_to_json(ws, { defval: '' }));
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // CSV via PapaParse
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (r) => resolve(r.data),
      error: reject,
    });
  });
}

export default function AcademicBulkImport() {
  const { institute, user } = useApp();
  const instituteId = institute?.institute_uuid || localStorage.getItem('institute_uuid') || '';
  const createdBy = user?.name || 'admin';

  const [tab, setTab] = useState(0);
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [parseError, setParseError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [showErrors, setShowErrors] = useState(false);
  const fileRef = useRef();

  const type = TYPES[tab];
  const cfg = TYPE_CONFIG[type];

  function reset() {
    setFile(null);
    setRows([]);
    setHeaders([]);
    setParseError('');
    setResult(null);
    setShowErrors(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleTabChange(_, newTab) {
    setTab(newTab);
    reset();
  }

  async function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    reset();
    setFile(f);
    try {
      const parsed = await parseFile(f);
      if (!parsed.length) { setParseError('File is empty or could not be parsed'); return; }
      setHeaders(Object.keys(parsed[0]));
      setRows(parsed.slice(0, 10));
    } catch (err) {
      setParseError(err.message || 'Failed to parse file');
    }
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('institute_uuid', instituteId);
      fd.append('createdBy', createdBy);
      const res = await apiClient.post(cfg.apiPath, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  }

  const errorCount = result?.errors?.length || 0;

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', py: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
        <UploadFileIcon sx={{ fontSize: 30, color: cfg.color }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>Academic Bulk Import</Typography>
          <Typography variant="body2" color="text.secondary">
            Import records from CSV, Excel (.xlsx), or JSON files
          </Typography>
        </Box>
      </Stack>

      {/* Type tabs */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <Tabs
          value={tab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: '1px solid #eee', minHeight: 44 }}
        >
          {TYPES.map((t) => (
            <Tab
              key={t}
              icon={TYPE_CONFIG[t].icon}
              iconPosition="start"
              label={TYPE_CONFIG[t].label}
              sx={{ minHeight: 44, fontSize: '0.82rem', textTransform: 'none', fontWeight: 600 }}
            />
          ))}
        </Tabs>

        <CardContent>
          {/* Required columns */}
          <Stack direction="row" flexWrap="wrap" gap={0.75} mb={1.5} alignItems="center">
            <Typography variant="body2" color="text.secondary" fontWeight={600}>Required columns:</Typography>
            {cfg.headers.map(h => (
              <Chip key={h} label={h} size="small" sx={{ fontSize: '0.72rem', height: 22 }} />
            ))}
          </Stack>

          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
            {cfg.notes}
          </Typography>

          {/* Sample downloads */}
          <Stack direction="row" spacing={1} mb={2.5} flexWrap="wrap">
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center', mr: 0.5 }}>
              Download sample:
            </Typography>
            <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={() => downloadSampleCSV(type)}>
              CSV
            </Button>
            <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={() => downloadSampleExcel(type)}>
              Excel
            </Button>
            <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={() => downloadSampleJSON(type)}>
              JSON
            </Button>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {/* File picker */}
          <Stack direction="row" spacing={2} alignItems="center" mb={2} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              component="label"
              sx={{ borderStyle: 'dashed' }}
            >
              Choose File
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                hidden
                onChange={handleFile}
              />
            </Button>
            {file && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Chip label={file.name} size="small" color="primary" variant="outlined" />
                <Tooltip title="Clear">
                  <IconButton size="small" onClick={reset}><RestartAltIcon fontSize="small" /></IconButton>
                </Tooltip>
              </Stack>
            )}
          </Stack>

          <Typography variant="caption" color="text.secondary">
            Accepted: .csv &nbsp;·&nbsp; .xlsx / .xls &nbsp;·&nbsp; .json &nbsp;·&nbsp; Max 10 MB
          </Typography>

          {parseError && (
            <Alert severity="error" sx={{ mt: 2 }}>{parseError}</Alert>
          )}

          {/* Preview */}
          {rows.length > 0 && (
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Preview — first {rows.length} row{rows.length > 1 ? 's' : ''}
              </Typography>
              <TableContainer sx={{ maxHeight: 240, border: '1px solid #eee', borderRadius: 1, mb: 2 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {headers.map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow key={i} hover>
                        {headers.map(h => (
                          <TableCell key={h} sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                            {String(row[h] ?? '') || '—'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Button
                variant="contained"
                startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
                onClick={handleUpload}
                disabled={uploading}
                sx={{ bgcolor: cfg.color, '&:hover': { bgcolor: cfg.color, filter: 'brightness(0.9)' } }}
              >
                {uploading ? 'Importing…' : `Import ${cfg.label}`}
              </Button>
            </Box>
          )}

          {/* Result */}
          {result && (
            <Box mt={2}>
              <Alert
                severity={result.success ? (errorCount ? 'warning' : 'success') : 'error'}
                action={
                  result.success && errorCount > 0 ? (
                    <IconButton size="small" onClick={() => setShowErrors(v => !v)}>
                      {showErrors ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  ) : null
                }
              >
                {result.success
                  ? `Inserted: ${result.inserted}  |  Skipped (duplicates): ${result.skipped}  |  Errors: ${errorCount}  |  Total rows: ${result.total}`
                  : result.message}
              </Alert>

              {result.success && errorCount > 0 && (
                <Collapse in={showErrors}>
                  <Box mt={1} p={1.5} bgcolor="#fff8e1" borderRadius={1} border="1px solid #ffe082">
                    <Typography variant="caption" fontWeight={700} display="block" mb={1}>
                      Rows with errors ({errorCount}):
                    </Typography>
                    {result.errors.slice(0, 20).map((e, i) => (
                      <Typography key={i} variant="caption" display="block" color="error.main">
                        • {e.reason}{e.row?.firstname || e.row?.name ? ` — "${e.row.firstname || e.row.name}"` : ''}
                      </Typography>
                    ))}
                    {errorCount > 20 && (
                      <Typography variant="caption" color="text.secondary">
                        … and {errorCount - 20} more
                      </Typography>
                    )}
                  </Box>
                </Collapse>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
