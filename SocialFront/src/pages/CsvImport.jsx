/**
 * CSV Import Page
 * Bulk import students or leads from a CSV file.
 * Uses PapaParse for browser-side preview before upload.
 */

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Divider, MenuItem, Select, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import { useApp } from '../context/AppContext';
import apiClient from '../apiClient';

const STUDENT_HEADERS = ['firstName', 'lastName', 'middleName', 'mobileSelf', 'mobileParent', 'dob', 'gender', 'address', 'education'];
const LEAD_HEADERS = ['firstName', 'lastName', 'mobileSelf', 'course', 'enquiryDate', 'followupDate', 'referredBy'];

const SAMPLE_CSV = {
  students: [STUDENT_HEADERS.join(','), 'Rahul,Sharma,,9876543210,9876543211,2000-05-15,Male,Mumbai,B.Com'].join('\n'),
  leads: [LEAD_HEADERS.join(','), 'Priya,Verma,9123456789,React Course,2024-06-01,2024-06-10,Google'].join('\n'),
};

export default function CsvImport() {
  const { institute, user } = useApp();
  const instituteId = institute?.institute_uuid || localStorage.getItem('institute_uuid') || '';
  const createdBy = user?.name || 'admin';

  const [type, setType] = useState('students');
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [fileName, setFileName] = useState('');
  const [file, setFile] = useState(null);
  const [parseError, setParseError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setFileName(f.name);
    setResult(null);
    setParseError('');

    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        if (!res.data.length) { setParseError('CSV is empty or invalid'); return; }
        setHeaders(Object.keys(res.data[0]));
        setRows(res.data.slice(0, 10)); // preview first 10 rows
      },
      error: (err) => setParseError(err.message),
    });
  }

  async function upload() {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('institute_uuid', instituteId);
      fd.append('createdBy', createdBy);
      const res = await apiClient.post(`/api/csv-import/${type}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV[type]], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sample-${type}.csv`;
    a.click();
  }

  function reset() {
    setRows([]);
    setHeaders([]);
    setFileName('');
    setFile(null);
    setResult(null);
    setParseError('');
    if (fileRef.current) fileRef.current.value = '';
  }

  const requiredCols = type === 'students' ? STUDENT_HEADERS : LEAD_HEADERS;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', py: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <UploadFileIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h5" fontWeight={700}>CSV Bulk Import</Typography>
      </Stack>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start" mb={3}>
            <Box>
              <Typography variant="body2" fontWeight={600} mb={0.5}>Import Type</Typography>
              <Select value={type} onChange={e => { setType(e.target.value); reset(); }} size="small" sx={{ minWidth: 160 }}>
                <MenuItem value="students">Students</MenuItem>
                <MenuItem value="leads">Leads / Enquiries</MenuItem>
              </Select>
            </Box>
            <Box sx={{ pt: { sm: 3 } }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={downloadSample}
              >
                Download Sample CSV
              </Button>
            </Box>
          </Stack>

          <Typography variant="body2" color="text.secondary" mb={1}>
            Required columns: <strong>{requiredCols.join(', ')}</strong>
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              component="label"
            >
              Choose CSV File
              <input ref={fileRef} type="file" accept=".csv" hidden onChange={handleFile} />
            </Button>
            {fileName && <Chip label={fileName} onDelete={reset} size="small" />}
          </Stack>

          {parseError && <Alert severity="error" sx={{ mb: 2 }}>{parseError}</Alert>}

          {rows.length > 0 && (
            <>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Preview (first {rows.length} row{rows.length > 1 ? 's' : ''})
              </Typography>
              <TableContainer sx={{ maxHeight: 260, mb: 2, border: '1px solid #eee', borderRadius: 1 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {headers.map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow key={i}>
                        {headers.map(h => (
                          <TableCell key={h} sx={{ whiteSpace: 'nowrap' }}>{row[h] || '-'}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Button
                variant="contained"
                startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
                onClick={upload}
                disabled={uploading}
              >
                {uploading ? 'Uploading…' : `Import ${type}`}
              </Button>
            </>
          )}

          {result && (
            <Alert severity={result.success ? (result.errors?.length ? 'warning' : 'success') : 'error'} sx={{ mt: 2 }}>
              {result.success
                ? `✅ Imported: ${result.inserted} | Skipped: ${result.skipped} | Errors: ${result.errors?.length || 0} (Total: ${result.total})`
                : result.message}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
