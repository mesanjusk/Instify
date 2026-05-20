import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  Box, Card, CardContent, Stack, Typography, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Tooltip, InputAdornment, CircularProgress, Chip
} from '@mui/material';
import { Edit, Delete, Add, PictureAsPdf, FileDownload, Search } from '@mui/icons-material';
import BASE_URL from '../config';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    courseFees: '',
    examFees: '',
    duration: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const searchTimeout = useRef();

  // Debounced search
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
    } catch (err) {
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = { ...form };

    try {
      if (editingId) {
        if (!window.confirm('Update this course?')) return;
        await axios.put(`${BASE_URL}/api/courses/${editingId}`, payload);
        toast.success('Course updated');
      } else {
        await axios.post(`${BASE_URL}/api/courses`, payload);
        toast.success('Course added');
      }
      setForm({ name: '', description: '', courseFees: '', examFees: '', duration: '' });
      setEditingId(null);
      setShowModal(false);
      fetchCourses();
    } catch (err) {
      toast.error('Failed to submit');
    }
  };

  const handleEdit = (course) => {
    setForm({
      name: course.name,
      description: course.description,
      courseFees: course.courseFees || '',
      examFees: course.examFees || '',
      duration: course.duration || ''
    });
    setEditingId(course._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/courses/${id}`);
      toast.success('Deleted');
      fetchCourses();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const exportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Course Name', 'Description', 'Course Fees', 'Exam Fees', 'Duration']],
      body: filteredCourses.map(c => [
        c.name,
        c.description || '-',
        c.courseFees || '-',
        c.examFees || '-',
        c.duration || '-'
      ])
    });
    doc.save('courses.pdf');
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredCourses.map(c => ({
      'Course Name': c.name,
      Description: c.description,
      'Course Fees': c.courseFees,
      'Exam Fees': c.examFees,
      Duration: c.duration
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Courses');
    XLSX.writeFile(wb, 'courses.xlsx');
  };

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 1, sm: 2 }, bgcolor: 'background.default' }}>
      {/* Header bar */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={1}
        sx={{ mb: 3 }}
      >
        <TextField
          placeholder="Search course"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ width: { xs: '100%', sm: 320 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            )
          }}
        />
        <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-end', sm: 'flex-end' }}>
          <Tooltip title="Export PDF">
            <IconButton
              onClick={exportPDF}
              sx={{ bgcolor: '#ef4444', color: '#fff', borderRadius: 1, '&:hover': { bgcolor: '#dc2626' } }}
            >
              <PictureAsPdf fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Excel">
            <IconButton
              onClick={exportExcel}
              sx={{ bgcolor: '#10b981', color: '#fff', borderRadius: 1, '&:hover': { bgcolor: '#059669' } }}
            >
              <FileDownload fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add Course">
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setForm({ name: '', description: '', courseFees: '', examFees: '', duration: '' });
                setEditingId(null);
                setShowModal(true);
              }}
              sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', whiteSpace: 'nowrap' }}
            >
              Add Course
            </Button>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress sx={{ color: '#4f46e5' }} />
        </Box>
      ) : filteredCourses.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 6 }}>
          <Typography color="text.secondary">No courses found.</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' },
            gap: 1.5
          }}
        >
          {filteredCourses.map((c) => (
            <Card
              key={c._id}
              sx={{ cursor: 'pointer', '&:hover': { boxShadow: '0 4px 16px rgba(79,70,229,0.12)' } }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap>
                      {c.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                      {c.description || <em>No description</em>}
                    </Typography>
                    {c.courseFees && (
                      <Chip
                        label={`Course: ₹${c.courseFees}`}
                        size="small"
                        sx={{ fontSize: '0.65rem', height: 18, mb: 0.25, bgcolor: 'rgba(79,70,229,0.08)', color: '#4f46e5' }}
                      />
                    )}
                    {c.examFees && (
                      <Chip
                        label={`Exam: ₹${c.examFees}`}
                        size="small"
                        sx={{ fontSize: '0.65rem', height: 18, mb: 0.25, bgcolor: 'rgba(16,185,129,0.08)', color: '#10b981', ml: 0.5 }}
                      />
                    )}
                    {c.duration && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {c.duration}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, ml: 0.5 }}>
                    <IconButton size="small" onClick={() => handleEdit(c)} sx={{ color: '#f59e0b' }}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(c._id)} sx={{ color: '#ef4444' }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1 }}>
          {editingId ? 'Edit Course' : 'Add New Course'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Course Name"
                value={form.name}
                onChange={handleChange('name')}
                fullWidth
                required
              />
              <TextField
                label="Description"
                value={form.description}
                onChange={handleChange('description')}
                fullWidth
                multiline
                rows={3}
              />
              <TextField
                label="Course Fees"
                type="number"
                value={form.courseFees}
                onChange={handleChange('courseFees')}
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>
                }}
              />
              <TextField
                label="Exam Fees"
                type="number"
                value={form.examFees}
                onChange={handleChange('examFees')}
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>
                }}
              />
              <TextField
                label="Duration (e.g., 6 months)"
                value={form.duration}
                onChange={handleChange('duration')}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button variant="outlined" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
            >
              {editingId ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default Courses;
