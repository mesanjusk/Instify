import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import BASE_URL from '../config';
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';

const PaymentMode = () => {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ mode: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const fetchData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/paymentmode`);
      setList(res.data || []);
    } catch {
      toast.error('Failed to fetch payment modes');
    }
  };

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.mode) return toast.error('Mode is required');
    setLoading(true);

    try {
      if (editingId) {
        if (!window.confirm('Update this payment mode?')) return;
        await axios.put(`${BASE_URL}/api/paymentmode/${editingId}`, form);
        toast.success('Updated');
      } else {
        await axios.post(`${BASE_URL}/api/paymentmode`, form);
        toast.success('Added');
      }
      setForm({ mode: '', description: '' });
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
    setForm({ mode: item.mode, description: item.description });
    setEditingId(item._id);
    setShowModal(true);
  };

  const handleDelete = async (_id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/paymentmode/${_id}`);
      toast.success('Deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (showModal && inputRef.current) inputRef.current.focus();
  }, [showModal]);

  const filtered = [...list]
    .sort((a, b) => a.mode.localeCompare(b.mode))
    .filter(item => item.mode.toLowerCase().includes(search.toLowerCase()));

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>Payment Modes</Typography>
          <Typography variant="body2" color="text.secondary">Manage available payment methods</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setForm({ mode: '', description: '' });
            setEditingId(null);
            setShowModal(true);
          }}
          sx={{ flexShrink: 0 }}
        >
          Add Mode
        </Button>
      </Stack>

      {/* Search */}
      <TextField
        placeholder="Search mode..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        sx={{ mb: 2, width: { xs: '100%', sm: 320 } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      {/* Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: '65vh' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Mode</strong></TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>Description</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No modes found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item._id} hover>
                  <TableCell>{item.mode}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{item.description}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <IconButton size="small" color="warning" onClick={() => handleEdit(item)} aria-label="Edit">
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(item._id)} aria-label="Delete">
                        <Delete fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Mode' : 'Add New Mode'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                inputRef={inputRef}
                label="Mode"
                value={form.mode}
                onChange={handleChange('mode')}
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Description (optional)"
                value={form.description}
                onChange={handleChange('description')}
                fullWidth
                size="small"
                multiline
                rows={3}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowModal(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="success" disabled={loading}>
              {loading ? <CircularProgress size={18} color="inherit" /> : editingId ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default PaymentMode;
