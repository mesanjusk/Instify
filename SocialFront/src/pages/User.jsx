import { useState, useEffect, useRef } from 'react';
import apiClient from '../apiClient';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
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
import { Add, Edit, Delete, Search, Person, Work, AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import { Divider, Tooltip } from '@mui/material';

const empFormDefault = {
  firstName: '', lastName: '', designation: '', department: '', mobile: '', email: '',
  joiningDate: '', status: 'active', bankAccount: '', ifsc: '', pan: '',
  salaryStructure: { basic: '', hra: '', components: [] },
};

const User = () => {
  const { user, institute, loading } = useApp();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', mobile: '', password: '', role: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [fetchLoading, setFetchLoading] = useState(true);
  const navigate = useNavigate();
  const searchTimeout = useRef();

  // HR / Employee dialog state
  const [hrDialog, setHrDialog] = useState(null); // { user_uuid, name }
  const [empForm, setEmpForm] = useState(empFormDefault);
  const [empLoading, setEmpLoading] = useState(false);

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
      const res = await apiClient.get(`/api/auth/GetUserList/${orgId}`);
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
        await apiClient.put(`/api/auth/${editingId}`, dataToSend);
        toast.success('User updated');
      } else {
        // Step 1: Register user
        const res = await apiClient.post(`/api/auth/register`, dataToSend);

        if (res.status === 409 || res.data?.success === false) {
          toast.error(res.data?.message || 'User already exists');
          return;
        }

        toast.success('User added');

        // Step 2: Get "ACCOUNT" group UUID
        try {
          const groupRes = await apiClient.get(`/api/accountgroup/GetAccountgroupList`);
          const accountGroup = groupRes.data.result?.find(g => g.Account_group === "ACCOUNT");
          if (accountGroup) {
            await apiClient.post(`/api/account/addAccount`, {
              Account_name: form.name,
              Mobile_number: form.mobile,
              Account_group: accountGroup.Account_group_uuid,
              institute_uuid: orgId
            });
          }
        } catch {
          // non-critical — user was already saved
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
      await apiClient.delete(`/api/auth/${id}`);
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

  const openHrDialog = async (item) => {
    setHrDialog({ user_uuid: item.user_uuid, name: item.name });
    setEmpLoading(true);
    try {
      const res = await apiClient.get(`/api/employees/by-user/${item.user_uuid}`);
      const emp = res.data?.result;
      setEmpForm(emp ? {
        firstName: emp.firstName || '',
        lastName: emp.lastName || '',
        designation: emp.designation || '',
        department: emp.department || '',
        mobile: emp.mobile || '',
        email: emp.email || '',
        joiningDate: emp.joiningDate ? emp.joiningDate.slice(0, 10) : '',
        status: emp.status || 'active',
        bankAccount: emp.bankAccount || '',
        ifsc: emp.ifsc || '',
        pan: emp.pan || '',
        salaryStructure: emp.salaryStructure || { basic: '', hra: '', components: [] },
      } : { ...empFormDefault, firstName: item.name.split(' ')[0] || '', lastName: item.name.split(' ').slice(1).join(' ') || '', mobile: item.mobile || '' });
    } catch {
      setEmpForm({ ...empFormDefault, firstName: item.name.split(' ')[0] || '', mobile: item.mobile || '' });
    } finally {
      setEmpLoading(false);
    }
  };

  const saveHrDetails = async () => {
    if (!hrDialog) return;
    try {
      await apiClient.put(`/api/employees/by-user/${hrDialog.user_uuid}`, {
        ...empForm,
        institute_uuid: institute?.institute_uuid,
        salaryStructure: {
          basic: Number(empForm.salaryStructure?.basic || 0),
          hra: Number(empForm.salaryStructure?.hra || 0),
          components: (empForm.salaryStructure?.components || []).map(c => ({ ...c, amount: Number(c.amount || 0) })),
        },
      });
      toast.success('HR details saved');
      setHrDialog(null);
    } catch {
      toast.error('Failed to save HR details');
    }
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
                  <Tooltip title="HR / Payroll Details">
                    <IconButton size="small" color="primary" onClick={() => openHrDialog(item)} aria-label="HR Details">
                      <Work fontSize="small" />
                    </IconButton>
                  </Tooltip>
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

      {/* HR / Employee Details Dialog */}
      <Dialog open={Boolean(hrDialog)} onClose={() => setHrDialog(null)} maxWidth="sm" fullWidth scroll="paper">
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" fontWeight={700}>HR Details</Typography>
              <Typography variant="caption" color="text.secondary">{hrDialog?.name}</Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {empLoading ? (
            <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
          ) : (
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <TextField label="First Name" value={empForm.firstName} onChange={e => setEmpForm(p => ({ ...p, firstName: e.target.value }))} fullWidth size="small" />
                <TextField label="Last Name" value={empForm.lastName} onChange={e => setEmpForm(p => ({ ...p, lastName: e.target.value }))} fullWidth size="small" />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField label="Designation" value={empForm.designation} onChange={e => setEmpForm(p => ({ ...p, designation: e.target.value }))} fullWidth size="small" />
                <TextField label="Department" value={empForm.department} onChange={e => setEmpForm(p => ({ ...p, department: e.target.value }))} fullWidth size="small" />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField label="Mobile" value={empForm.mobile} onChange={e => setEmpForm(p => ({ ...p, mobile: e.target.value }))} fullWidth size="small" />
                <TextField label="Email" value={empForm.email} onChange={e => setEmpForm(p => ({ ...p, email: e.target.value }))} fullWidth size="small" />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField label="Joining Date" type="date" value={empForm.joiningDate} onChange={e => setEmpForm(p => ({ ...p, joiningDate: e.target.value }))} fullWidth size="small" InputLabelProps={{ shrink: true }} />
                <Select value={empForm.status} onChange={e => setEmpForm(p => ({ ...p, status: e.target.value }))} size="small" fullWidth>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </Stack>

              <Divider><Typography variant="caption" color="text.secondary">Salary Structure</Typography></Divider>
              <Stack direction="row" spacing={2}>
                <TextField label="Basic (₹)" type="number" value={empForm.salaryStructure?.basic || ''} onChange={e => setEmpForm(p => ({ ...p, salaryStructure: { ...p.salaryStructure, basic: e.target.value } }))} fullWidth size="small" />
                <TextField label="HRA (₹)" type="number" value={empForm.salaryStructure?.hra || ''} onChange={e => setEmpForm(p => ({ ...p, salaryStructure: { ...p.salaryStructure, hra: e.target.value } }))} fullWidth size="small" />
              </Stack>
              {(empForm.salaryStructure?.components || []).map((comp, i) => (
                <Stack key={i} direction="row" spacing={1} alignItems="center">
                  <TextField label="Name" value={comp.name} onChange={e => { const c = [...empForm.salaryStructure.components]; c[i] = { ...c[i], name: e.target.value }; setEmpForm(p => ({ ...p, salaryStructure: { ...p.salaryStructure, components: c } })); }} size="small" sx={{ flex: 2 }} />
                  <Select value={comp.type} onChange={e => { const c = [...empForm.salaryStructure.components]; c[i] = { ...c[i], type: e.target.value }; setEmpForm(p => ({ ...p, salaryStructure: { ...p.salaryStructure, components: c } })); }} size="small" sx={{ flex: 1 }}>
                    <MenuItem value="earning">Earning</MenuItem>
                    <MenuItem value="deduction">Deduction</MenuItem>
                  </Select>
                  <TextField label="Amt" type="number" value={comp.amount} onChange={e => { const c = [...empForm.salaryStructure.components]; c[i] = { ...c[i], amount: e.target.value }; setEmpForm(p => ({ ...p, salaryStructure: { ...p.salaryStructure, components: c } })); }} size="small" sx={{ flex: 1 }} />
                  <Tooltip title="Remove"><IconButton size="small" onClick={() => { const c = empForm.salaryStructure.components.filter((_, idx) => idx !== i); setEmpForm(p => ({ ...p, salaryStructure: { ...p.salaryStructure, components: c } })); }}><RemoveCircleOutline fontSize="small" color="error" /></IconButton></Tooltip>
                </Stack>
              ))}
              <Button size="small" startIcon={<AddCircleOutline />} onClick={() => setEmpForm(p => ({ ...p, salaryStructure: { ...p.salaryStructure, components: [...(p.salaryStructure?.components || []), { name: '', type: 'earning', amount: '', isPercent: false }] } }))} sx={{ alignSelf: 'flex-start' }}>
                Add Component
              </Button>

              <Divider><Typography variant="caption" color="text.secondary">Bank Details</Typography></Divider>
              <Stack direction="row" spacing={2}>
                <TextField label="Bank Account" value={empForm.bankAccount} onChange={e => setEmpForm(p => ({ ...p, bankAccount: e.target.value }))} fullWidth size="small" />
                <TextField label="IFSC" value={empForm.ifsc} onChange={e => setEmpForm(p => ({ ...p, ifsc: e.target.value }))} fullWidth size="small" />
              </Stack>
              <TextField label="PAN" value={empForm.pan} onChange={e => setEmpForm(p => ({ ...p, pan: e.target.value }))} size="small" />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHrDialog(null)} color="inherit">Cancel</Button>
          <Button variant="contained" color="primary" startIcon={<Work />} onClick={saveHrDetails}>Save HR Details</Button>
        </DialogActions>
      </Dialog>

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
                inputProps={{ minLength: 4 }}
                helperText="Minimum 4 characters"
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
