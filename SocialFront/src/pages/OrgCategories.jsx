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

const OrgCategories = () => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ category: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const categoryInputRef = useRef();

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/org-categories`);
      setCategories(res.data || []);
    } catch (err) {
      toast.error('Failed to fetch categories');
    }
  };

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) return toast.error('Category is required');
    setLoading(true);

    try {
      if (editingId) {
        if (!window.confirm('Update this category?')) return;
        await axios.put(`${BASE_URL}/api/org-categories/${editingId}`, form);
        toast.success('Category updated');
      } else {
        await axios.post(`${BASE_URL}/api/org-categories`, form);
        toast.success('Category added');
      }
      setForm({ category: '', description: '' });
      setEditingId(null);
      setShowModal(false);
      fetchCategories();
    } catch {
      toast.error('Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setForm({ category: item.category, description: item.description });
    setEditingId(item._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/org-categories/${id}`);
      toast.success('Deleted');
      fetchCategories();
    } catch {
      toast.error('Failed to delete');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (showModal && categoryInputRef.current) {
      categoryInputRef.current.focus();
    }
  }, [showModal]);

  const filtered = categories.filter(c =>
    c.category.toLowerCase().includes(search.toLowerCase())
  );

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
          <Typography variant="h5" fontWeight={700}>Organization Categories</Typography>
          <Typography variant="body2" color="text.secondary">Manage institute/organization category types</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setForm({ category: '', description: '' });
            setEditingId(null);
            setShowModal(true);
          }}
          sx={{ flexShrink: 0 }}
        >
          Add Category
        </Button>
      </Stack>

      {/* Search */}
      <TextField
        placeholder="Search category..."
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
              <TableCell><strong>Category</strong></TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>Description</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c._id} hover>
                  <TableCell>{c.category}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{c.description}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <IconButton size="small" color="warning" onClick={() => handleEdit(c)} aria-label="Edit">
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(c._id)} aria-label="Delete">
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
        <DialogTitle>{editingId ? 'Edit Category' : 'Add New Category'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                inputRef={categoryInputRef}
                label="Category"
                value={form.category}
                onChange={handleChange('category')}
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

export default OrgCategories;
