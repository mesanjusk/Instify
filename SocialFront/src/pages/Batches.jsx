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

const Batches = () => {
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState({ name: '', timing: '' });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const nameInputRef = useRef();
  const searchTimeout = useRef();

  const institute_id = localStorage.getItem('institute_uuid');

  const fetchBatches = async () => {
    try {
      setFetchLoading(true);
      const res = await axios.get(`${BASE_URL}/api/batches`);
      setBatches(res.data || []);
    } catch (err) {
      toast.error('Failed to fetch batches');
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (showModal && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [showModal]);

  // Debounce for search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const filtered = batches.filter(b =>
    b.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!institute_id) return toast.error('Missing institute ID');

    const payload = { ...form, institute_uuid: institute_id };
    setLoading(true);
    try {
      if (editingId) {
        if (!window.confirm('Update this batch?')) return;
        await axios.put(`${BASE_URL}/api/batches/${editingId}`, payload);
        toast.success('Batch updated');
      } else {
        await axios.post(`${BASE_URL}/api/batches`, payload);
        toast.success('Batch added');
      }
      setForm({ name: '', timing: '' });
      setEditingId(null);
      setShowModal(false);
      fetchBatches();
    } catch (err) {
      toast.error('Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (batch) => {
    setForm({ name: batch.name, timing: batch.timing });
    setEditingId(batch._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this batch?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/batches/${id}`);
      toast.success('Deleted');
      fetchBatches();
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
          placeholder="Search batch"
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
          <Tooltip title="Add Batch">
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setForm({ name: '', timing: '' });
                setEditingId(null);
                setShowModal(true);
              }}
              sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none' }}
            >
              Add Batch
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
          <Typography color="text.secondary">No batches found.</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' },
            gap: 1.5
          }}
        >
          {filtered.map((b) => (
            <Card
              key={b._id}
              sx={{ cursor: 'pointer', '&:hover': { boxShadow: '0 4px 16px rgba(79,70,229,0.12)' } }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap>
                      {b.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {b.timing || <em>No timing</em>}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, ml: 0.5 }}>
                    <IconButton size="small" onClick={() => handleEdit(b)} sx={{ color: '#f59e0b' }}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(b._id)} sx={{ color: '#ef4444' }}>
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
          {editingId ? 'Edit Batch' : 'Add New Batch'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                inputRef={nameInputRef}
                label="Batch Name"
                value={form.name}
                onChange={handleChange('name')}
                fullWidth
                required
              />
              <TextField
                label="Timing (e.g., 10AM–12PM)"
                value={form.timing}
                onChange={handleChange('timing')}
                fullWidth
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

export default Batches;
