import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Box, Card, CardContent, Stack, Typography, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Tooltip, InputAdornment, CircularProgress
} from '@mui/material';
import { Edit, Delete, Add, Search } from '@mui/icons-material';
import BASE_URL from '../config';

const Exam = () => {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ exam: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const inputRef = useRef();
  const searchTimeout = useRef();

  const fetchData = async () => {
    try {
      setFetchLoading(true);
      const res = await axios.get(`${BASE_URL}/api/exams`);
      setList(res.data || []);
    } catch {
      toast.error('Failed to fetch data');
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (showModal && inputRef.current) inputRef.current.focus();
  }, [showModal]);

  // Debounce for search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const filtered = list.filter(item =>
    item.exam.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.exam) return toast.error('Exam is required');
    setLoading(true);

    try {
      if (editingId) {
        if (!window.confirm('Update this entry?')) return;
        await axios.put(`${BASE_URL}/api/exams/${editingId}`, form);
        toast.success('Updated');
      } else {
        await axios.post(`${BASE_URL}/api/exams`, form);
        toast.success('Added');
      }
      setForm({ exam: '', description: '' });
      setEditingId(null);
      setShowModal(false);
      fetchData();
    } catch {
      toast.error('Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setForm({ exam: item.exam, description: item.description });
    setEditingId(item._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/exams/${id}`);
      toast.success('Deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
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
          placeholder="Search exam"
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
          <Tooltip title="Add Exam">
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setForm({ exam: '', description: '' });
                setEditingId(null);
                setShowModal(true);
              }}
              sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none' }}
            >
              Add Exam
            </Button>
          </Tooltip>
        </Box>
      </Stack>

      {/* Content */}
      {fetchLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress sx={{ color: '#4f46e5' }} />
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 6 }}>
          <Typography color="text.secondary">No entries found.</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' },
            gap: 1.5
          }}
        >
          {filtered.map((item) => (
            <Card
              key={item._id}
              sx={{ cursor: 'pointer', '&:hover': { boxShadow: '0 4px 16px rgba(79,70,229,0.12)' } }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap>
                      {item.exam}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {item.description || <em>No description</em>}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, ml: 0.5 }}>
                    <IconButton size="small" onClick={() => handleEdit(item)} sx={{ color: '#f59e0b' }}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(item._id)} sx={{ color: '#ef4444' }}>
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
          {editingId ? 'Edit Exam' : 'Add New Exam'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                inputRef={inputRef}
                label="Exam"
                value={form.exam}
                onChange={handleChange('exam')}
                fullWidth
                required
              />
              <TextField
                label="Description (optional)"
                value={form.description}
                onChange={handleChange('description')}
                fullWidth
                multiline
                rows={3}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button variant="outlined" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
            >
              {loading ? <CircularProgress size={18} color="inherit" /> : editingId ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default Exam;
