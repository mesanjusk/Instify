import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import BASE_URL from '../config';
import { useApp } from '../context/AppContext';
import {
  Box,
  Card,
  CardContent,
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
  Chip,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Add, Edit, Delete, Search, Person } from '@mui/icons-material';

const User = () => {
  const { user, institute, loading } = useApp();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    password: '',
    role: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [fetchLoading, setFetchLoading] = useState(true);
  const navigate = useNavigate();
  const searchTimeout = useRef();

  // Prevent early redirect until loading is complete
  useEffect(() => {
    if (!loading && !institute?.institute_uuid) {
      toast.error("Institute not found. Please log in.");
      navigate('/');
    }
  }, [institute, loading]);

  // Fetch users once institute is ready
  useEffect(() => {
    if (institute?.institute_uuid) {
      fetchUsers();
    }
    // eslint-disable-next-line
  }, [institute]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const fetchUsers = async () => {
    const orgId = institute?.institute_uuid;
    if (!orgId) return;

    try {
      setFetchLoading(true);
      const res = await axios.get(`${BASE_URL}/api/auth/GetUserList/${orgId}`);
      if (res.data?.success) {
        setUsers(res.data.result);
      } else {
        setUsers([]);
        toast.error('No users found');
      }
    } catch (error) {
      setUsers([]);
      toast.error('Error fetching users');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const orgId = institute?.institute_uuid;
    if (!orgId) {
      toast.error('Institute ID missing.');
      return;
    }

    const dataToSend = { ...form, institute_uuid: orgId };

    try {
      if (editingId) {
        await axios.put(`${BASE_URL}/api/auth/${editingId}`, dataToSend);
        toast.success('User updated');
      } else {
        // Step 1: Register user
        const res = await axios.post(`${BASE_URL}/api/auth/register`, dataToSend);

        if (res.data === 'exist') {
          toast.error('User already exists');
          return;
        } else if (res.data === 'notexist') {
          toast.success('User added');

          // Step 2: Get "ACCOUNT" group UUID
          const groupRes = await axios.get(`${BASE_URL}/api/accountgroup/GetAccountgroupList`);
          const accountGroup = groupRes.data.result.find(g => g.Account_group === "ACCOUNT");

          if (!accountGroup) {
            toast.error('ACCOUNT group not found');
            return;
          }

          // Step 3: Create account linked to this user
          await axios.post(`${BASE_URL}/api/account/addAccount`, {
            Account_name: form.name,
            Mobile_number: form.mobile,
            Account_group: accountGroup.Account_group_uuid,
            institute_uuid: orgId
          });

          toast.success('Account also created');
        } else {
          toast.error('Unexpected user registration response');
          return;
        }
      }

      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error('Failed to submit');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this User?')) return;

    try {
      await axios.delete(`${BASE_URL}/api/auth/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (error) {
      toast.error('Error deleting user');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      name: item.name || '',
      password: item.password || '',
      mobile: item.mobile || '',
      role: item.role || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: '', password: '', mobile: '', role: '' });
  };

  // Filtered user list
  const filteredUsers = users.filter(
    (item) =>
      item.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      item.mobile?.includes(debouncedSearch) ||
      item.role?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const getRoleColor = (role) => {
    if (role === 'admin') return 'primary';
    if (role === 'owner') return 'warning';
    return 'default';
  };

  // Show loading screen if Context is still initializing
  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>Users</Typography>
          <Typography variant="body2" color="text.secondary">Manage admin and staff accounts</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => { resetForm(); setShowModal(true); }}
          sx={{ flexShrink: 0 }}
        >
          Add User
        </Button>
      </Stack>

      {/* Search */}
      <TextField
        placeholder="Search user..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        size="small"
        sx={{ mb: 3, width: { xs: '100%', sm: 320 } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      {/* Content */}
      {fetchLoading ? (
        <Box display="flex" justifyContent="center" p={6}>
          <CircularProgress />
        </Box>
      ) : filteredUsers.length === 0 ? (
        <Box textAlign="center" p={6}>
          <Typography color="text.secondary">No users found.</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 2,
          }}
        >
          {filteredUsers.map((item) => (
            <Card key={item._id} variant="outlined" sx={{ '&:hover': { boxShadow: 3 }, transition: 'box-shadow 0.2s' }}>
              <CardContent sx={{ pb: '8px !important' }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                    <Person fontSize="small" />
                  </Avatar>
                  <Typography variant="subtitle2" fontWeight={600} noWrap>
                    {item.name}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" display="block">
                  {item.mobile}
                </Typography>
                <Chip
                  label={item.role}
                  color={getRoleColor(item.role)}
                  size="small"
                  sx={{ mt: 1, mb: 1, textTransform: 'capitalize' }}
                />
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <IconButton size="small" color="warning" onClick={() => handleEdit(item)} aria-label="Edit">
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(item._id)} aria-label="Delete">
                    <Delete fontSize="small" />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit User' : 'Add New User'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label="Name"
                value={form.name}
                onChange={handleInputChange('name')}
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Password"
                value={form.password}
                onChange={handleInputChange('password')}
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Mobile No."
                value={form.mobile}
                onChange={handleInputChange('mobile')}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]{10}', maxLength: 10 }}
                required
                fullWidth
                size="small"
              />
              <FormControl fullWidth size="small" required>
                <InputLabel>Role</InputLabel>
                <Select
                  value={form.role}
                  onChange={handleInputChange('role')}
                  label="Role"
                >
                  <MenuItem value="">-- Select Role --</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="owner">Owner</MenuItem>
                </Select>
              </FormControl>
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

export default User;
