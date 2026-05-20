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
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openAddModal}
          sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, alignSelf: { xs: 'flex-start', sm: 'auto' } }}
        >
          Add Enquiry
        </Button>
      </Stack>

      {/* Search Bar */}
      <Box mb={3}>
        <TextField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or mobile"
          size="small"
          fullWidth
          sx={{ maxWidth: 400, bgcolor: 'white' }}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
      </Box>

      {/* Enquiry Cards Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2,
        }}
      >
        {filtered.map((e) => (
          <Card
            key={e._id}
            sx={{
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
              '&:hover': { boxShadow: 4 },
            }}
          >
            <CardActionArea onClick={() => setActionModal(e)} sx={{ p: 0 }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                  <Avatar sx={{ bgcolor: '#4f46e5', width: 40, height: 40, fontSize: 16 }}>
                    {(e.firstName?.[0] || '?').toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} lineHeight={1.2}>
                      {e.firstName} {e.lastName}
                    </Typography>
                    {e.course && (
                      <Chip
                        label={e.course}
                        size="small"
                        sx={{ fontSize: 10, height: 18, mt: 0.5 }}
                      />
                    )}
                  </Box>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {e.mobileSelf}
                  </Typography>
                </Stack>
                {!e.course && (
                  <Typography variant="caption" color="text.disabled">
                    No course selected
                  </Typography>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>

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
              sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
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
              sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
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
                <Avatar sx={{ bgcolor: '#4f46e5' }}>
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
                  sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
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
