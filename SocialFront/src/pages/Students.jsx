import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  Box, Card, CardContent, Stack, Typography, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Tooltip, InputAdornment, CircularProgress, MenuItem, Select,
  FormControl, InputLabel
} from '@mui/material';
import { Edit, Delete, Add, PictureAsPdf, FileDownload, Search } from '@mui/icons-material';
import apiClient from '../apiClient';
import { useApp } from '../context/AppContext';

const Students = () => {
  const { institute_uuid } = useApp();
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dob: '',
    gender: '',
    mobileSelf: '',
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

  const fetchStudents = async () => {
    if (!institute_uuid) return;
    try {
      setLoading(true);
      const res = await apiClient.get('/api/students', { params: { institute_uuid } });
      setStudents(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = { ...form };

    try {
      if (editingId) {
        if (!window.confirm('Update this student?')) return;
        await axios.put(`${BASE_URL}/api/students/${editingId}`, payload);
        toast.success('Student updated');
      } else {
        await axios.post(`${BASE_URL}/api/students`, payload);
        toast.success('Student added');
      }
      setForm({ firstName: '', middleName: '', lastName: '', dob: '', gender: '', mobileSelf: '', institute_uuid: `${institute_uuid}` });
      setEditingId(null);
      setShowModal(false);
      fetchStudents();
    } catch (err) {
      toast.error('Failed to submit');
    }
  };

  const handleEdit = (student) => {
    setForm({
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName,
      dob: student.dob,
      gender: student.gender,
      mobileSelf: student.mobileSelf
    });
    setEditingId(student._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/students/${id}`);
      toast.success('Deleted');
      fetchStudents();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filteredStudents = students.filter(s =>
    s.firstName.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const exportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['FirstName', 'MiddleName', 'LastName', 'DOB', 'Gender', 'Mobile']],
      body: filteredStudents.map(s => [
        s.firstName,
        s.middleName,
        s.lastName,
        s.dob,
        s.gender,
        s.mobileSelf
      ])
    });
    doc.save('students.pdf');
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredStudents.map(s => ({
      'First Name': s.firstName,
      'Middle Name': s.middleName,
      'Last Name': s.lastName,
      'DOB': s.dob,
      'Gender': s.gender,
      'Mobile': s.mobileSelf
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'students.xlsx');
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
          placeholder="Search student"
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
          <Tooltip title="Add Student">
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setForm({ firstName: '', middleName: '', lastName: '', dob: '', gender: '', mobileSelf: '' });
                setEditingId(null);
                setShowModal(true);
              }}
              sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', whiteSpace: 'nowrap' }}
            >
              Add Student
            </Button>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress sx={{ color: '#4f46e5' }} />
        </Box>
      ) : filteredStudents.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 6 }}>
          <Typography color="text.secondary">No students found.</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' },
            gap: 1.5
          }}
        >
          {filteredStudents.map((s) => (
            <Card
              key={s._id}
              sx={{ cursor: 'pointer', '&:hover': { boxShadow: '0 4px 16px rgba(79,70,229,0.12)' } }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap>
                      {s.firstName} {s.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {s.mobileSelf}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      DOB: {s.dob}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {s.gender}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, ml: 0.5 }}>
                    <IconButton size="small" onClick={() => handleEdit(s)} sx={{ color: '#f59e0b' }}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(s._id)} sx={{ color: '#ef4444' }}>
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
          {editingId ? 'Edit Student' : 'Add New Student'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="First Name"
                value={form.firstName}
                onChange={handleChange('firstName')}
                fullWidth
                required
              />
              <TextField
                label="Middle Name"
                value={form.middleName}
                onChange={handleChange('middleName')}
                fullWidth
                required
              />
              <TextField
                label="Last Name"
                value={form.lastName}
                onChange={handleChange('lastName')}
                fullWidth
                required
              />
              <TextField
                label="Mobile Number"
                type="number"
                value={form.mobileSelf}
                onChange={handleChange('mobileSelf')}
                fullWidth
              />
              <TextField
                label="Date of Birth"
                type="date"
                value={form.dob}
                onChange={handleChange('dob')}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={form.gender}
                  onChange={handleChange('gender')}
                  label="Gender"
                >
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

export default Students;
