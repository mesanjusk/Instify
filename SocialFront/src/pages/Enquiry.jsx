import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import BASE_URL from '../config';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Stack,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
  Chip,
  Divider,
  Checkbox,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Close,
  Edit,
  Delete,
  CheckCircle,
  EventNote,
  Phone,
  Search,
  GridView,
  ViewList,
} from '@mui/icons-material';

const Enquiry = () => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    mobileSelf: '',
    course: '',
  });
  const [enquiries, setEnquiries] = useState([]);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpRemarks, setFollowUpRemarks] = useState('');
  const [search, setSearch] = useState('');
  const [actionModal, setActionModal] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const institute_uuid = localStorage.getItem('institute_uuid');

  const fetchEnquiries = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/record/enquiry`, {
        params: { institute_uuid, page, limit }
      });
      const { data, total: t, page: p, limit: l } = res.data;
      setEnquiries(Array.isArray(data) ? data : []);
      setTotal(t || 0);
      setPage(p ?? page);
      setLimit(l ?? limit);
    } catch (err) {
      toast.error('Failed to fetch enquiries');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.mobileSelf) {
      toast.error('First name and mobile are required');
      return;
    }
    try {
      if (isEditMode && selectedEnquiry) {
        await axios.put(`${BASE_URL}/api/record/${selectedEnquiry._id}`, {
          ...form,
          institute_uuid,
          type: 'enquiry',
        });
        toast.success('Enquiry updated');
      } else {
        await axios.post(`${BASE_URL}/api/record`, {
          ...form,
          institute_uuid,
          type: 'enquiry',
        });
        toast.success('Enquiry added');
      }
      setForm({ firstName: '', lastName: '', mobileSelf: '', course: '' });
      setShowModal(false);
      fetchEnquiries();
    } catch (err) {
      toast.error('Failed to save enquiry');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this enquiry?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/record/${id}`);
      toast.success('Enquiry deleted');
      fetchEnquiries();
    } catch (err) {
      toast.error('Failed to delete enquiry');
    }
  };

  const handleFollowUpSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE_URL}/api/followup`, {
        enquiry_uuid: selectedEnquiry.uuid,
        followUpDate,
        remarks: followUpRemarks,
        updatedBy: localStorage.getItem('name') || 'admin',
      });
      toast.success('Follow-Up saved');
      setShowFollowUpModal(false);
      setFollowUpDate('');
      setFollowUpRemarks('');
      fetchEnquiries();
    } catch (err) {
      toast.error('Failed to save follow-up');
    }
  };

  const openAddModal = () => {
    setForm({ firstName: '', lastName: '', mobileSelf: '', course: '' });
    setIsEditMode(false);
    setShowModal(true);
  };

  const openEditModal = (enquiry) => {
    setForm({
      firstName: enquiry.firstName || '',
      lastName: enquiry.lastName || '',
      mobileSelf: enquiry.mobileSelf || '',
      course: enquiry.course || '',
    });
    setSelectedEnquiry(enquiry);
    setIsEditMode(true);
    setShowModal(true);
  };

  const openFollowUpModal = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setShowFollowUpModal(true);
  };

  useEffect(() => {
    fetchEnquiries();
  }, [page, limit]);

  const filtered = enquiries.filter(
    (e) =>
      e.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      e.mobileSelf?.includes(search)
  );

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearSelection = () => { setSelectedIds(new Set()); setSelectionMode(false); };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} enquiry(s)?`)) return;
    try {
      await axios.post(`${BASE_URL}/api/record/bulk-delete`, { ids: [...selectedIds] });
      toast.success(`Deleted ${selectedIds.size} enquiry(s)`);
      clearSelection();
      fetchEnquiries();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', p: { xs: 2, sm: 3 } }}>
      {/* Page Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>Enquiries</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and track student enquiries
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="contained" startIcon={<Add />} onClick={openAddModal} sx={{ bgcolor: '#1a7a4a', '&:hover': { bgcolor: '#25a066' }, alignSelf: { xs: 'flex-start', sm: 'auto' }, textTransform: 'none' }}>Add Enquiry</Button>
        </Stack>
      </Stack>

      {/* Search + view toggle + selection */}
      <Box mb={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} flexWrap="wrap" useFlexGap>
          <TextField value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or mobile" size="small" sx={{ maxWidth: 400, bgcolor: 'white', flex: 1 }} InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }} />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Tooltip title="Card view"><IconButton onClick={() => setViewMode('card')} sx={{ bgcolor: viewMode === 'card' ? '#1a7a4a' : 'grey.200', color: viewMode === 'card' ? '#fff' : 'text.secondary', borderRadius: 1 }}><GridView fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="List view"><IconButton onClick={() => setViewMode('list')} sx={{ bgcolor: viewMode === 'list' ? '#1a7a4a' : 'grey.200', color: viewMode === 'list' ? '#fff' : 'text.secondary', borderRadius: 1 }}><ViewList fontSize="small" /></IconButton></Tooltip>
            {!selectionMode ? (
              <Button size="small" variant="outlined" onClick={() => setSelectionMode(true)} sx={{ textTransform: 'none' }}>Select</Button>
            ) : (
              <>
                <Button size="small" variant="outlined" onClick={() => allSelected ? setSelectedIds(new Set()) : setSelectedIds(new Set(filtered.map(e => e._id)))} sx={{ textTransform: 'none' }}>{allSelected ? 'Deselect All' : 'Select All'}</Button>
                {selectedIds.size > 0 && <Button size="small" variant="contained" color="error" onClick={handleBulkDelete} sx={{ textTransform: 'none' }}>Delete ({selectedIds.size})</Button>}
                <Button size="small" variant="outlined" color="inherit" onClick={clearSelection} sx={{ textTransform: 'none' }}>Cancel</Button>
              </>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* Enquiry Cards Grid / List */}
      {viewMode === 'card' ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
          {filtered.map((e) => (
            <Card key={e._id} onClick={() => selectionMode ? toggleSelect(e._id) : setActionModal(e)} sx={{ cursor: 'pointer', position: 'relative', transition: 'box-shadow 0.2s', outline: selectedIds.has(e._id) ? '2px solid #1a7a4a' : 'none', bgcolor: selectedIds.has(e._id) ? 'rgba(26,122,74,0.06)' : 'white', '&:hover': { boxShadow: 4 } }}>
              {selectionMode && (
                <Box sx={{ position: 'absolute', top: 6, left: 6, zIndex: 1 }} onClick={ev => ev.stopPropagation()}>
                  <Checkbox size="small" checked={selectedIds.has(e._id)} onChange={() => toggleSelect(e._id)} sx={{ p: 0 }} />
                </Box>
              )}
              <CardContent sx={{ pl: selectionMode ? 4.5 : 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                  <Avatar sx={{ bgcolor: '#1a7a4a', width: 40, height: 40, fontSize: 16 }}>{(e.firstName?.[0] || '?').toUpperCase()}</Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} lineHeight={1.2}>{e.firstName} {e.lastName}</Typography>
                    {e.course && <Chip label={e.course} size="small" sx={{ fontSize: 10, height: 18, mt: 0.5 }} />}
                  </Box>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">{e.mobileSelf}</Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {selectionMode && <th style={{ padding: '10px 12px', width: 40 }}><Checkbox size="small" checked={allSelected} onChange={() => allSelected ? setSelectedIds(new Set()) : setSelectedIds(new Set(filtered.map(e => e._id)))} sx={{ p: 0 }} /></th>}
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Name</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Mobile</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Course</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e._id} onClick={() => selectionMode ? toggleSelect(e._id) : setActionModal(e)} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', background: selectedIds.has(e._id) ? 'rgba(26,122,74,0.06)' : 'white' }}
                  onMouseEnter={ev => { if (!selectedIds.has(e._id)) ev.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={ev => { ev.currentTarget.style.background = selectedIds.has(e._id) ? 'rgba(26,122,74,0.06)' : 'white'; }}>
                  {selectionMode && <td style={{ padding: '8px 12px' }} onClick={ev => ev.stopPropagation()}><Checkbox size="small" checked={selectedIds.has(e._id)} onChange={() => toggleSelect(e._id)} sx={{ p: 0 }} /></td>}
                  <td style={{ padding: '8px 12px', fontWeight: 500, fontSize: 14 }}>{e.firstName} {e.lastName}</td>
                  <td style={{ padding: '8px 12px', fontSize: 13, color: '#6b7280' }}>{e.mobileSelf}</td>
                  <td style={{ padding: '8px 12px', fontSize: 13, color: '#6b7280' }}>{e.course || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}

      {/* Pagination Info */}
      <Typography variant="body2" color="text.secondary" mt={2}>
        Page {page + 1} — Showing {enquiries.length} of {total}
      </Typography>

      {/* Add/Edit Modal */}
      <Dialog
        open={showModal}
        onClose={() => setShowModal(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={700}>
            {isEditMode ? 'Edit Enquiry' : 'Add Enquiry'}
          </Typography>
          <IconButton onClick={() => setShowModal(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <Divider />
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2} pt={1}>
              <TextField
                label="First Name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Last Name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                fullWidth
                size="small"
              />
              <TextField
                label="Mobile Number"
                value={form.mobileSelf}
                onChange={(e) => setForm({ ...form, mobileSelf: e.target.value })}
                required
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />,
                }}
              />
              <TextField
                label="Course"
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                fullWidth
                size="small"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setShowModal(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#1a7a4a', '&:hover': { bgcolor: '#25a066' } }}
            >
              {isEditMode ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Follow-Up Modal */}
      <Dialog
        open={showFollowUpModal}
        onClose={() => setShowFollowUpModal(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={700}>Add Follow-Up</Typography>
          <IconButton onClick={() => setShowFollowUpModal(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <Divider />
        <form onSubmit={handleFollowUpSubmit}>
          <DialogContent>
            <Stack spacing={2} pt={1}>
              <TextField
                label="Follow-Up Date"
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                required
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <EventNote sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />,
                }}
              />
              <TextField
                label="Remarks"
                value={followUpRemarks}
                onChange={(e) => setFollowUpRemarks(e.target.value)}
                required
                fullWidth
                multiline
                rows={3}
                size="small"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setShowFollowUpModal(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#1a7a4a', '&:hover': { bgcolor: '#25a066' } }}
            >
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Action Modal */}
      <Dialog
        open={!!actionModal}
        onClose={() => setActionModal(null)}
        fullWidth
        maxWidth="sm"
      >
        {actionModal && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ bgcolor: '#1a7a4a' }}>
                  {(actionModal.firstName?.[0] || '?').toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                    {actionModal.firstName} {actionModal.lastName}
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Phone sx={{ fontSize: 13, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {actionModal.mobileSelf}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
              <IconButton onClick={() => setActionModal(null)} size="small">
                <Close />
              </IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent>
              <Stack direction="row" flexWrap="wrap" gap={1.5} pt={1}>
                <Button
                  variant="contained"
                  startIcon={<Edit />}
                  onClick={() => {
                    openEditModal(actionModal);
                    setActionModal(null);
                  }}
                  sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}
                >
                  Edit
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Delete />}
                  onClick={() => {
                    handleDelete(actionModal._id);
                    setActionModal(null);
                  }}
                  sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}
                >
                  Delete
                </Button>
                <Button
                  variant="contained"
                  startIcon={<CheckCircle />}
                  onClick={() => {
                    toast('Convert to Admission logic pending');
                    setActionModal(null);
                  }}
                  sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                >
                  Convert
                </Button>
                <Button
                  variant="contained"
                  startIcon={<EventNote />}
                  onClick={() => {
                    openFollowUpModal(actionModal);
                    setActionModal(null);
                  }}
                  sx={{ bgcolor: '#1a7a4a', '&:hover': { bgcolor: '#25a066' } }}
                >
                  Follow-Up
                </Button>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setActionModal(null)} color="inherit">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Enquiry;
