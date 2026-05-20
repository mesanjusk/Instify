import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Box, Card, CardContent, Stack, Typography, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Tooltip, InputAdornment, CircularProgress
} from '@mui/material';
import { Edit, Delete, Add, Search } from '@mui/icons-material';
import BASE_URL from '../config';

const CoursesCategory = () => {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    name: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [fetchLoading, setFetchLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      setFetchLoading(true);
      const res = await axios.get(`${BASE_URL}/api/courseCategory`);
      setCourses(res.data || []);
    } catch (err) {
      toast.error('Failed to fetch courseCategory');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = { ...form };

    try {
      if (editingId) {
        if (!window.confirm('Update this courseCategory?')) return;
        await axios.put(`${BASE_URL}/api/courseCategory/${editingId}`, payload);
        toast.success('CourseCategory updated');
      } else {
        await axios.post(`${BASE_URL}/api/courseCategory`, payload);
        toast.success('CourseCategory added');
      }
      setForm({ name: '' });
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
    });
    setEditingId(course._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this courseCategory?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/courseCategory/${id}`);
      toast.success('Deleted');
      fetchCourses();
    } catch {
      toast.error('Failed to delete');
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

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
          placeholder="Search course category"
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
        <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-end', sm: 'flex-end' } }}>
          <Tooltip title="Add Course Category">
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setForm({ name: '' });
                setEditingId(null);
                setShowModal(true);
              }}
              sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none' }}
            >
              Add Category
            </Button>
          </Tooltip>
        </Box>
      </Stack>

      {/* Content */}
      {fetchLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress sx={{ color: '#4f46e5' }} />
        </Box>
      ) : filteredCourses.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 6 }}>
          <Typography color="text.secondary">No course categories found.</Typography>
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
          {editingId ? 'Edit Course Category' : 'Add New Course Category'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Category Name"
                value={form.name}
                onChange={handleChange('name')}
                fullWidth
                required
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

export default CoursesCategory;
