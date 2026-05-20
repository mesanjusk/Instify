import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import BASE_URL from '../config';
import { formatDisplayDate } from '../utils/dateUtils';
import {
  Box,
  Stack,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { Add, Edit, Delete, Business } from '@mui/icons-material';

const Owner = () => {
  const [orgs, setOrgs] = useState([]);
  const [orgTypes, setOrgTypes] = useState([]);
  const [form, setForm] = useState({
    institute_title: '',
    institute_call_number: '',
    center_head_name: '',
    institute_type: '',
    center_code: '',
    theme_color: '#5b5b5b'
  });
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();
  const { user } = useApp();

  useEffect(() => {
    if (user && user.role !== 'owner' && user.role !== 'super_admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    axios.get(`${BASE_URL}/api/org-categories`)
      .then(res => {
        setOrgTypes(res.data);
      })
      .catch(err => {
        console.error('Failed to fetch institute types:', err);
        toast.error('Failed to load institute types');
      });
  }, []);

  useEffect(() => {
    fetchOrgs();
  }, []);

  const fetchOrgs = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/institute/GetOrganizList`);
      if (res.data?.success) {
        setOrgs(res.data.result);
      } else {
        toast.error('No orgs found');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error fetching orgs');
    }
  };

  const handleInputChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await axios.put(`${BASE_URL}/api/organize/update/${editingId}`, form);
        toast.success('institute updated');
      } else {
        const res = await axios.post(`${BASE_URL}/api/organize/add`, form);
        if (res.data === 'exist') toast.error('institute already exists');
        else if (res.data === 'notexist') toast.success('institute added');
        else toast.error('Unexpected error');
      }

      // Cleanup and refresh
      setShowModal(false);
      resetForm();
      fetchOrgs();
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit');
    }
  };

  const handleDelete = async (uuid) => {
    if (!window.confirm('Are you sure you want to delete this institute and all related data?')) return;

    try {
      await axios.delete(`${BASE_URL}/api/institute/${uuid}`);
      toast.success('Institute deleted');
      fetchOrgs();
    } catch (error) {
      toast.error('Error deleting institute');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      institute_title: item.institute_title || '',
      institute_call_number: item.institute_call_number || '',
      center_head_name: item.center_head_name || '',
      institute_type: item.institute_type || '',
      center_code: item.center_code || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ institute_title: '', institute_call_number: '', center_head_name: '', institute_type: '', center_code: '' });
  };

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
          <Typography variant="h5" fontWeight={700}>Owners</Typography>
          <Typography variant="body2" color="text.secondary">Manage institute owners and registrations</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => { resetForm(); setShowModal(true); }}
          sx={{ flexShrink: 0 }}
        >
          New Owner
        </Button>
      </Stack>

      {/* Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: '70vh' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>Mobile</strong></TableCell>
              <TableCell><strong>Head Name</strong></TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>Plan</strong></TableCell>
              <TableCell><strong>Start</strong></TableCell>
              <TableCell><strong>Expiry</strong></TableCell>
              <TableCell align="center"><strong>Action</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orgs.map((item, idx) => (
              <TableRow key={idx} hover>
                <TableCell>{item.institute_title}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{item.institute_call_number}</TableCell>
                <TableCell>{item.center_head_name}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  <Chip label={item.plan_type || 'trial'} size="small" variant="outlined" />
                </TableCell>
                <TableCell>{item.start_date ? formatDisplayDate(item.start_date) : '-'}</TableCell>
                <TableCell>{item.expiry_date ? formatDisplayDate(item.expiry_date) : '-'}</TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <IconButton size="small" color="warning" onClick={() => handleEdit(item)} aria-label="Edit">
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(item.institute_uuid || item._id)} aria-label="Delete">
                      <Delete fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Institute' : 'Add New Institute'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label="Institute Title"
                value={form.institute_title}
                onChange={handleInputChange('institute_title')}
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Center Head Name"
                value={form.center_head_name}
                onChange={handleInputChange('center_head_name')}
                required
                fullWidth
                size="small"
              />
              <FormControl fullWidth size="small" required>
                <InputLabel>Institute Type</InputLabel>
                <Select
                  value={form.institute_type}
                  onChange={handleInputChange('institute_type')}
                  label="Institute Type"
                >
                  <MenuItem value="">Select Institute Type</MenuItem>
                  {orgTypes.map((type) => (
                    <MenuItem key={type._id} value={type.category}>{type.category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Center Code (Login ID & Password)"
                value={form.center_code}
                onChange={handleInputChange('center_code')}
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Institute Call Number"
                value={form.institute_call_number}
                onChange={handleInputChange('institute_call_number')}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]{10}', maxLength: 10 }}
                required
                fullWidth
                size="small"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowModal(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="success">
              {editingId ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default Owner;
