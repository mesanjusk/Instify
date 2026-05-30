import React, { useState, useEffect, useRef, useMemo } from 'react';
import apiClient from '../apiClient';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  Box, Card, CardContent, Stack, Typography, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Tooltip, InputAdornment, CircularProgress, MenuItem, Select,
  FormControl, InputLabel, Pagination, Checkbox
} from '@mui/material';
import { Edit, Delete, Add, PictureAsPdf, FileDownload, Search, GridView, ViewList } from '@mui/icons-material';

const PAGE_SIZE = 25;

const Students = () => {
  const institute_uuid = localStorage.getItem('institute_uuid') || '';
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ firstName: '', middleName: '', lastName: '', dob: '', gender: '', mobileSelf: '', institute_uuid });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [detailStudent, setDetailStudent] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('card');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const searchTimeout = useRef();

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/students');
      setStudents(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.put(`/api/students/${editingId}`, { ...form });
        toast.success('Student updated');
      } else {
        await apiClient.post('/api/students', { ...form });
        toast.success('Student added');
      }
      setForm({ firstName: '', middleName: '', lastName: '', dob: '', gender: '', mobileSelf: '', institute_uuid });
      setEditingId(null);
      setShowModal(false);
      fetchStudents();
    } catch {
      toast.error('Failed to submit');
    }
  };

  const handleEdit = (student) => {
    setForm({ firstName: student.firstName, middleName: student.middleName || '', lastName: student.lastName, dob: student.dob || '', gender: student.gender || '', mobileSelf: student.mobileSelf || '', institute_uuid });
    setEditingId(student._id);
    setDetailStudent(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try {
      await apiClient.delete(`/api/students/${id}`);
      toast.success('Deleted');
      setDetailStudent(null);
      fetchStudents();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} student(s)?`)) return;
    try {
      await apiClient.post('/api/students/bulk-delete', { ids: [...selectedIds] });
      toast.success(`Deleted ${selectedIds.size} student(s)`);
      setSelectedIds(new Set());
      setSelectionMode(false);
      fetchStudents();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filteredStudents = useMemo(
    () => students.filter(s => `${s.firstName} ${s.lastName} ${s.mobileSelf}`.toLowerCase().includes(debouncedSearch.toLowerCase())),
    [students, debouncedSearch]
  );

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE);
  const pagedStudents = viewMode === 'card' ? filteredStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : filteredStudents;
  const allSelected = filteredStudents.length > 0 && selectedIds.size === filteredStudents.length;

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearSelection = () => { setSelectedIds(new Set()); setSelectionMode(false); };

  const exportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, { head: [['FirstName', 'MiddleName', 'LastName', 'DOB', 'Gender', 'Mobile']], body: filteredStudents.map(s => [s.firstName, s.middleName, s.lastName, s.dob, s.gender, s.mobileSelf]) });
    doc.save('students.pdf');
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredStudents.map(s => ({ 'First Name': s.firstName, 'Middle Name': s.middleName, 'Last Name': s.lastName, DOB: s.dob, Gender: s.gender, Mobile: s.mobileSelf })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'students.xlsx');
  };

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 1, sm: 2 }, bgcolor: 'background.default' }}>
      {/* Toolbar */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1} sx={{ mb: 2 }}>
        <TextField
          placeholder="Search student"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ width: { xs: '100%', sm: 280 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
        />
        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: 'flex-end' }} useFlexGap>
          <Tooltip title="Export PDF"><IconButton onClick={exportPDF} sx={{ bgcolor: '#ef4444', color: '#fff', borderRadius: 1, '&:hover': { bgcolor: '#dc2626' } }}><PictureAsPdf fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Export Excel"><IconButton onClick={exportExcel} sx={{ bgcolor: '#10b981', color: '#fff', borderRadius: 1, '&:hover': { bgcolor: '#059669' } }}><FileDownload fontSize="small" /></IconButton></Tooltip>
          {/* View toggle */}
          <Tooltip title="Card view"><IconButton onClick={() => setViewMode('card')} sx={{ bgcolor: viewMode === 'card' ? '#1a7a4a' : 'grey.200', color: viewMode === 'card' ? '#fff' : 'text.secondary', borderRadius: 1 }}><GridView fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="List view"><IconButton onClick={() => setViewMode('list')} sx={{ bgcolor: viewMode === 'list' ? '#1a7a4a' : 'grey.200', color: viewMode === 'list' ? '#fff' : 'text.secondary', borderRadius: 1 }}><ViewList fontSize="small" /></IconButton></Tooltip>
          {/* Selection controls */}
          {!selectionMode ? (
            <Button size="small" variant="outlined" onClick={() => setSelectionMode(true)} sx={{ textTransform: 'none' }}>Select</Button>
          ) : (
            <>
              <Button size="small" variant="outlined" onClick={() => allSelected ? setSelectedIds(new Set()) : setSelectedIds(new Set(filteredStudents.map(s => s._id)))} sx={{ textTransform: 'none' }}>
                {allSelected ? 'Deselect All' : 'Select All'}
              </Button>
              {selectedIds.size > 0 && (
                <Button size="small" variant="contained" color="error" onClick={handleBulkDelete} sx={{ textTransform: 'none' }}>Delete ({selectedIds.size})</Button>
              )}
              <Button size="small" variant="outlined" color="inherit" onClick={clearSelection} sx={{ textTransform: 'none' }}>Cancel</Button>
            </>
          )}
          <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({ firstName: '', middleName: '', lastName: '', dob: '', gender: '', mobileSelf: '', institute_uuid }); setEditingId(null); setShowModal(true); }} sx={{ bgcolor: '#1a7a4a', '&:hover': { bgcolor: '#25a066' }, textTransform: 'none', whiteSpace: 'nowrap' }}>Add</Button>
        </Stack>
      </Stack>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress sx={{ color: '#1a7a4a' }} /></Box>
      ) : filteredStudents.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 6 }}><Typography color="text.secondary">No students found.</Typography></Box>
      ) : viewMode === 'card' ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 1.5 }}>
          {pagedStudents.map((s) => (
            <Card
              key={s._id}
              onClick={() => selectionMode ? toggleSelect(s._id) : setDetailStudent(s)}
              sx={{ cursor: 'pointer', position: 'relative', outline: selectedIds.has(s._id) ? '2px solid #1a7a4a' : 'none', bgcolor: selectedIds.has(s._id) ? 'rgba(26,122,74,0.06)' : 'white', '&:hover': { boxShadow: '0 4px 16px rgba(26,122,74,0.12)' } }}
            >
              {selectionMode && (
                <Box sx={{ position: 'absolute', top: 4, left: 4 }} onClick={e => e.stopPropagation()}>
                  <Checkbox size="small" checked={selectedIds.has(s._id)} onChange={() => toggleSelect(s._id)} sx={{ p: 0 }} />
                </Box>
              )}
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, pl: selectionMode ? 4 : 2 }}>
                <Typography variant="subtitle2" fontWeight={700} noWrap>{s.firstName} {s.lastName}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">{s.mobileSelf}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">{s.gender}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {selectionMode && <th style={{ padding: '10px 12px', width: 40 }}><Checkbox size="small" checked={allSelected} onChange={() => allSelected ? setSelectedIds(new Set()) : setSelectedIds(new Set(filteredStudents.map(s => s._id)))} sx={{ p: 0 }} /></th>}
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Name</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Mobile</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Gender</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>DOB</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(s => (
                <tr
                  key={s._id}
                  onClick={() => selectionMode ? toggleSelect(s._id) : setDetailStudent(s)}
                  style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', background: selectedIds.has(s._id) ? 'rgba(26,122,74,0.06)' : 'white' }}
                  onMouseEnter={e => { if (!selectedIds.has(s._id)) e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = selectedIds.has(s._id) ? 'rgba(26,122,74,0.06)' : 'white'; }}
                >
                  {selectionMode && <td style={{ padding: '8px 12px' }} onClick={e => e.stopPropagation()}><Checkbox size="small" checked={selectedIds.has(s._id)} onChange={() => toggleSelect(s._id)} sx={{ p: 0 }} /></td>}
                  <td style={{ padding: '8px 12px', fontWeight: 500, fontSize: 14 }}>{s.firstName} {s.lastName}</td>
                  <td style={{ padding: '8px 12px', fontSize: 13, color: '#6b7280' }}>{s.mobileSelf}</td>
                  <td style={{ padding: '8px 12px', fontSize: 13, color: '#6b7280' }}>{s.gender}</td>
                  <td style={{ padding: '8px 12px', fontSize: 13, color: '#6b7280' }}>{s.dob}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}

      {/* Pagination (card view) */}
      {viewMode === 'card' && totalPages > 1 && (
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 3 }} flexWrap="wrap" gap={1}>
          <Typography variant="caption" color="text.secondary">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredStudents.length)} of {filteredStudents.length}
          </Typography>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} size="small" color="primary" />
        </Stack>
      )}

      {/* Detail popup */}
      <Dialog open={!!detailStudent} onClose={() => setDetailStudent(null)} fullWidth maxWidth="xs">
        {detailStudent && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              {detailStudent.firstName} {detailStudent.lastName}
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary">Mobile: {detailStudent.mobileSelf}</Typography>
              <Typography variant="body2" color="text.secondary">DOB: {detailStudent.dob}</Typography>
              <Typography variant="body2" color="text.secondary">Gender: {detailStudent.gender}</Typography>
            </DialogContent>
            <DialogActions sx={{ px: 2, pb: 2, gap: 1, flexWrap: 'wrap' }}>
              <Button variant="contained" color="error" startIcon={<Delete />} onClick={() => handleDelete(detailStudent._id)} sx={{ textTransform: 'none' }}>Delete</Button>
              <Button variant="contained" startIcon={<Edit />} onClick={() => handleEdit(detailStudent)} sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' }, textTransform: 'none' }}>Edit</Button>
              <Button variant="outlined" onClick={() => setDetailStudent(null)} sx={{ textTransform: 'none', ml: 'auto' }}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1 }}>{editingId ? 'Edit Student' : 'Add New Student'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField label="First Name" value={form.firstName} onChange={handleChange('firstName')} fullWidth required />
              <TextField label="Middle Name" value={form.middleName} onChange={handleChange('middleName')} fullWidth />
              <TextField label="Last Name" value={form.lastName} onChange={handleChange('lastName')} fullWidth required />
              <TextField label="Mobile Number" type="number" value={form.mobileSelf} onChange={handleChange('mobileSelf')} fullWidth />
              <TextField label="Date of Birth" type="date" value={form.dob} onChange={handleChange('dob')} fullWidth InputLabelProps={{ shrink: true }} />
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select value={form.gender} onChange={handleChange('gender')} label="Gender">
                  <MenuItem value="">Select Gender</MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button variant="outlined" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#1a7a4a', '&:hover': { bgcolor: '#25a066' } }}>{editingId ? 'Update' : 'Save'}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default Students;
