import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  Box, Card, CardContent, Stack, Typography, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Tooltip, InputAdornment, CircularProgress, Chip, Checkbox
} from '@mui/material';
import { Edit, Delete, Add, PictureAsPdf, FileDownload, Search, GridView, ViewList } from '@mui/icons-material';
import BASE_URL from '../config';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', courseFees: '', examFees: '', duration: '' });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [detailCourse, setDetailCourse] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('card');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const searchTimeout = useRef();

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/courses`);
      setCourses(res.data || []);
    } catch {
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${BASE_URL}/api/courses/${editingId}`, { ...form });
        toast.success('Course updated');
      } else {
        await axios.post(`${BASE_URL}/api/courses`, { ...form });
        toast.success('Course added');
      }
      setForm({ name: '', description: '', courseFees: '', examFees: '', duration: '' });
      setEditingId(null);
      setShowModal(false);
      fetchCourses();
    } catch {
      toast.error('Failed to submit');
    }
  };

  const handleEdit = (course) => {
    setForm({ name: course.name, description: course.description, courseFees: course.courseFees || '', examFees: course.examFees || '', duration: course.duration || '' });
    setEditingId(course._id);
    setDetailCourse(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/courses/${id}`);
      toast.success('Deleted');
      setDetailCourse(null);
      fetchCourses();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} course(s)?`)) return;
    try {
      await axios.post(`${BASE_URL}/api/courses/bulk-delete`, { ids: [...selectedIds] });
      toast.success(`Deleted ${selectedIds.size} course(s)`);
      setSelectedIds(new Set());
      setSelectionMode(false);
      fetchCourses();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filteredCourses = courses.filter(c => c.name.toLowerCase().includes(debouncedSearch.toLowerCase()));
  const allSelected = filteredCourses.length > 0 && selectedIds.size === filteredCourses.length;

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
    autoTable(doc, { head: [['Course Name', 'Description', 'Course Fees', 'Exam Fees', 'Duration']], body: filteredCourses.map(c => [c.name, c.description || '-', c.courseFees || '-', c.examFees || '-', c.duration || '-']) });
    doc.save('courses.pdf');
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredCourses.map(c => ({ 'Course Name': c.name, Description: c.description, 'Course Fees': c.courseFees, 'Exam Fees': c.examFees, Duration: c.duration })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Courses');
    XLSX.writeFile(wb, 'courses.xlsx');
  };

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 1, sm: 2 }, bgcolor: 'background.default' }}>
      {/* Toolbar */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1} sx={{ mb: 3 }}>
        <TextField
          placeholder="Search course"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ width: { xs: '100%', sm: 280 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
        />
        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: 'flex-end' }} useFlexGap>
          <Tooltip title="Export PDF"><IconButton onClick={exportPDF} sx={{ bgcolor: '#ef4444', color: '#fff', borderRadius: 1, '&:hover': { bgcolor: '#dc2626' } }}><PictureAsPdf fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Export Excel"><IconButton onClick={exportExcel} sx={{ bgcolor: '#10b981', color: '#fff', borderRadius: 1, '&:hover': { bgcolor: '#059669' } }}><FileDownload fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Card view"><IconButton onClick={() => setViewMode('card')} sx={{ bgcolor: viewMode === 'card' ? '#1a7a4a' : 'grey.200', color: viewMode === 'card' ? '#fff' : 'text.secondary', borderRadius: 1 }}><GridView fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="List view"><IconButton onClick={() => setViewMode('list')} sx={{ bgcolor: viewMode === 'list' ? '#1a7a4a' : 'grey.200', color: viewMode === 'list' ? '#fff' : 'text.secondary', borderRadius: 1 }}><ViewList fontSize="small" /></IconButton></Tooltip>
          {!selectionMode ? (
            <Button size="small" variant="outlined" onClick={() => setSelectionMode(true)} sx={{ textTransform: 'none' }}>Select</Button>
          ) : (
            <>
              <Button size="small" variant="outlined" onClick={() => allSelected ? setSelectedIds(new Set()) : setSelectedIds(new Set(filteredCourses.map(c => c._id)))} sx={{ textTransform: 'none' }}>{allSelected ? 'Deselect All' : 'Select All'}</Button>
              {selectedIds.size > 0 && <Button size="small" variant="contained" color="error" onClick={handleBulkDelete} sx={{ textTransform: 'none' }}>Delete ({selectedIds.size})</Button>}
              <Button size="small" variant="outlined" color="inherit" onClick={clearSelection} sx={{ textTransform: 'none' }}>Cancel</Button>
            </>
          )}
          <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({ name: '', description: '', courseFees: '', examFees: '', duration: '' }); setEditingId(null); setShowModal(true); }} sx={{ bgcolor: '#1a7a4a', '&:hover': { bgcolor: '#25a066' }, textTransform: 'none', whiteSpace: 'nowrap' }}>Add Course</Button>
        </Stack>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress sx={{ color: '#1a7a4a' }} /></Box>
      ) : filteredCourses.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 6 }}><Typography color="text.secondary">No courses found.</Typography></Box>
      ) : viewMode === 'card' ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 1.5 }}>
          {filteredCourses.map((c) => (
            <Card
              key={c._id}
              onClick={() => selectionMode ? toggleSelect(c._id) : setDetailCourse(c)}
              sx={{ cursor: 'pointer', position: 'relative', outline: selectedIds.has(c._id) ? '2px solid #1a7a4a' : 'none', bgcolor: selectedIds.has(c._id) ? 'rgba(26,122,74,0.06)' : 'white', '&:hover': { boxShadow: '0 4px 16px rgba(26,122,74,0.12)' } }}
            >
              {selectionMode && (
                <Box sx={{ position: 'absolute', top: 4, left: 4 }} onClick={e => e.stopPropagation()}>
                  <Checkbox size="small" checked={selectedIds.has(c._id)} onChange={() => toggleSelect(c._id)} sx={{ p: 0 }} />
                </Box>
              )}
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, pl: selectionMode ? 4 : 2 }}>
                <Typography variant="subtitle2" fontWeight={700} noWrap>{c.name}</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>{c.description || <em>No description</em>}</Typography>
                {c.courseFees && <Chip label={`₹${c.courseFees}`} size="small" sx={{ fontSize: '0.65rem', height: 18, bgcolor: 'rgba(26,122,74,0.08)', color: '#1a7a4a', mr: 0.5 }} />}
                {c.examFees && <Chip label={`Exam ₹${c.examFees}`} size="small" sx={{ fontSize: '0.65rem', height: 18, bgcolor: 'rgba(16,185,129,0.08)', color: '#10b981' }} />}
                {c.duration && <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>{c.duration}</Typography>}
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {selectionMode && <th style={{ padding: '10px 12px', width: 40 }}><Checkbox size="small" checked={allSelected} onChange={() => allSelected ? setSelectedIds(new Set()) : setSelectedIds(new Set(filteredCourses.map(c => c._id)))} sx={{ p: 0 }} /></th>}
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Course Name</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Fees</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map(c => (
                <tr key={c._id} onClick={() => selectionMode ? toggleSelect(c._id) : setDetailCourse(c)} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', background: selectedIds.has(c._id) ? 'rgba(26,122,74,0.06)' : 'white' }}
                  onMouseEnter={e => { if (!selectedIds.has(c._id)) e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = selectedIds.has(c._id) ? 'rgba(26,122,74,0.06)' : 'white'; }}>
                  {selectionMode && <td style={{ padding: '8px 12px' }} onClick={e => e.stopPropagation()}><Checkbox size="small" checked={selectedIds.has(c._id)} onChange={() => toggleSelect(c._id)} sx={{ p: 0 }} /></td>}
                  <td style={{ padding: '8px 12px', fontWeight: 500, fontSize: 14 }}>{c.name}</td>
                  <td style={{ padding: '8px 12px', fontSize: 13, color: '#6b7280' }}>{c.courseFees ? `₹${c.courseFees}` : '-'}</td>
                  <td style={{ padding: '8px 12px', fontSize: 13, color: '#6b7280' }}>{c.duration || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}

      {/* Detail popup */}
      <Dialog open={!!detailCourse} onClose={() => setDetailCourse(null)} fullWidth maxWidth="xs">
        {detailCourse && (
          <>
            <DialogTitle sx={{ pb: 1 }}>{detailCourse.name}</DialogTitle>
            <DialogContent>
              {detailCourse.description && <Typography variant="body2" color="text.secondary" mb={1}>{detailCourse.description}</Typography>}
              {detailCourse.courseFees && <Typography variant="body2">Course Fees: ₹{detailCourse.courseFees}</Typography>}
              {detailCourse.examFees && <Typography variant="body2">Exam Fees: ₹{detailCourse.examFees}</Typography>}
              {detailCourse.duration && <Typography variant="body2">Duration: {detailCourse.duration}</Typography>}
            </DialogContent>
            <DialogActions sx={{ px: 2, pb: 2, gap: 1, flexWrap: 'wrap' }}>
              <Button variant="contained" color="error" startIcon={<Delete />} onClick={() => handleDelete(detailCourse._id)} sx={{ textTransform: 'none' }}>Delete</Button>
              <Button variant="contained" startIcon={<Edit />} onClick={() => handleEdit(detailCourse)} sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' }, textTransform: 'none' }}>Edit</Button>
              <Button variant="outlined" onClick={() => setDetailCourse(null)} sx={{ textTransform: 'none', ml: 'auto' }}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1 }}>{editingId ? 'Edit Course' : 'Add New Course'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField label="Course Name" value={form.name} onChange={handleChange('name')} fullWidth required />
              <TextField label="Description" value={form.description} onChange={handleChange('description')} fullWidth multiline rows={3} />
              <TextField label="Course Fees" type="number" value={form.courseFees} onChange={handleChange('courseFees')} fullWidth InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
              <TextField label="Exam Fees" type="number" value={form.examFees} onChange={handleChange('examFees')} fullWidth InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
              <TextField label="Duration (e.g., 6 months)" value={form.duration} onChange={handleChange('duration')} fullWidth />
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

export default Courses;
