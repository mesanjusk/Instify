import React, { useState, useEffect } from 'react';
import apiClient from '../apiClient';
import toast from 'react-hot-toast';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Stack, Typography, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Tooltip, InputAdornment, CircularProgress, Checkbox,
} from '@mui/material';
import { Add, Search, GridView, ViewList } from '@mui/icons-material';

const AllAdmission = () => {
  const [admissions, setAdmissions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [selectedUuids, setSelectedUuids] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const navigate = useNavigate();
  const { username } = useParams();
  const institute_uuid = localStorage.getItem('institute_uuid');

  const fetchCourses = async () => {
    try {
      const { data } = await apiClient.get(`/api/courses`, { params: { institute_uuid } });
      setCourses(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load courses');
    }
  };

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get(`/api/admissions`, { params: { institute_uuid } });
      setAdmissions(Array.isArray(data?.data) ? data.data : []);
    } catch {
      toast.error('Error fetching admissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
    fetchCourses();
  }, []);

  const filteredAdmissions = admissions.filter((a) => {
    const name = `${a.student?.firstName || ''} ${a.student?.lastName || ''}`.toLowerCase();
    const mobile = a.student?.mobileSelf || '';
    return name.includes(search.toLowerCase()) || mobile.includes(search);
  });

  const handleWhatsApp = (mobile, name) => {
    if (!mobile) return toast.error('Mobile number not available');
    const message = `Hello ${name || ''}, we are contacting you regarding your admission.`;
    window.open(`https://wa.me/91${mobile}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCall = (mobile) => {
    if (!mobile) return toast.error('Mobile number not available');
    window.open(`tel:${mobile}`);
  };

  const getCourseName = (courseUuid) => {
    const course = courses.find((c) => c.uuid === courseUuid || c.Course_uuid === courseUuid);
    return course ? course.name : 'Course N/A';
  };

  const toggleSelect = (uuid) => {
    setSelectedUuids(prev => {
      const next = new Set(prev);
      if (next.has(uuid)) next.delete(uuid); else next.add(uuid);
      return next;
    });
  };

  const selectAll = () => setSelectedUuids(new Set(filteredAdmissions.map(a => a.uuid)));

  const clearSelection = () => {
    setSelectedUuids(new Set());
    setSelectionMode(false);
  };

  const handleBulkDelete = async () => {
    if (selectedUuids.size === 0) return;
    if (!window.confirm(`Delete ${selectedUuids.size} admission(s)?`)) return;
    try {
      await apiClient.post(`/api/admissions/bulk-delete`, { uuids: [...selectedUuids] });
      toast.success(`Deleted ${selectedUuids.size} admission(s)`);
      clearSelection();
      fetchAdmissions();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleDelete = async (admission) => {
    if (!window.confirm('Delete this admission?')) return;
    try {
      await apiClient.delete(`/api/admissions/${admission.uuid}`);
      toast.success('Admission deleted');
      setSelectedAdmission(null);
      fetchAdmissions();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const allSelected = filteredAdmissions.length > 0 && selectedUuids.size === filteredAdmissions.length;

  return (
    <Box>
      {/* Detail Dialog */}
      <Dialog open={!!selectedAdmission} onClose={() => setSelectedAdmission(null)} fullWidth maxWidth="xs">
        {selectedAdmission && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              {selectedAdmission.student?.firstName} {selectedAdmission.student?.lastName}
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary">
                Course: {getCourseName(selectedAdmission.course)}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 2, pb: 2, gap: 1, flexWrap: 'wrap' }}>
              <Button variant="contained" color="error" onClick={() => handleDelete(selectedAdmission)} sx={{ textTransform: 'none' }}>Delete</Button>
              <Button variant="contained" onClick={() => navigate(`/${username}/edit-admission/${selectedAdmission._id}`)} sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' }, textTransform: 'none' }}>Edit</Button>
              <Button variant="outlined" onClick={() => setSelectedAdmission(null)} sx={{ textTransform: 'none', ml: 'auto' }}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Toolbar */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1} sx={{ mb: 3 }}>
        <TextField
          placeholder="Search by name or mobile"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: { xs: '100%', sm: 280 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
        />
        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: 'flex-end' }} useFlexGap>
          <Tooltip title="Card view">
            <IconButton onClick={() => setViewMode('card')} sx={{ bgcolor: viewMode === 'card' ? '#1a7a4a' : 'grey.200', color: viewMode === 'card' ? '#fff' : 'text.secondary', borderRadius: 1 }}>
              <GridView fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="List view">
            <IconButton onClick={() => setViewMode('list')} sx={{ bgcolor: viewMode === 'list' ? '#1a7a4a' : 'grey.200', color: viewMode === 'list' ? '#fff' : 'text.secondary', borderRadius: 1 }}>
              <ViewList fontSize="small" />
            </IconButton>
          </Tooltip>
          {!selectionMode ? (
            <Button size="small" variant="outlined" onClick={() => setSelectionMode(true)} sx={{ textTransform: 'none' }}>Select</Button>
          ) : (
            <>
              <Button size="small" variant="outlined" onClick={() => allSelected ? setSelectedUuids(new Set()) : selectAll()} sx={{ textTransform: 'none' }}>
                {allSelected ? 'Deselect All' : 'Select All'}
              </Button>
              {selectedUuids.size > 0 && (
                <Button size="small" variant="contained" color="error" onClick={handleBulkDelete} sx={{ textTransform: 'none' }}>
                  Delete ({selectedUuids.size})
                </Button>
              )}
              <Button size="small" variant="outlined" color="inherit" onClick={clearSelection} sx={{ textTransform: 'none' }}>Cancel</Button>
            </>
          )}
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate(`/${username}/addNewAdd`)}
            sx={{ bgcolor: '#1a7a4a', '&:hover': { bgcolor: '#25a066' }, textTransform: 'none', whiteSpace: 'nowrap' }}
          >
            New Admission
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress sx={{ color: '#1a7a4a' }} />
        </Box>
      ) : filteredAdmissions.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 6 }}>
          <Typography color="text.secondary">No admissions found.</Typography>
        </Box>
      ) : viewMode === 'card' ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 1.5 }}>
          {filteredAdmissions.map((admission) => (
            <Card
              key={admission._id}
              onClick={() => selectionMode ? toggleSelect(admission.uuid) : setSelectedAdmission(admission)}
              sx={{ cursor: 'pointer', position: 'relative', outline: selectedUuids.has(admission.uuid) ? '2px solid #1a7a4a' : 'none', bgcolor: selectedUuids.has(admission.uuid) ? 'rgba(26,122,74,0.06)' : 'white', '&:hover': { boxShadow: '0 4px 16px rgba(26,122,74,0.12)' } }}
            >
              {selectionMode && (
                <Box sx={{ position: 'absolute', top: 4, left: 4 }} onClick={e => e.stopPropagation()}>
                  <Checkbox size="small" checked={selectedUuids.has(admission.uuid)} onChange={() => toggleSelect(admission.uuid)} sx={{ p: 0 }} />
                </Box>
              )}
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, pl: selectionMode ? 4 : 2 }}>
                <Typography variant="subtitle2" fontWeight={700} noWrap>
                  {admission.student?.firstName} {admission.student?.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  {getCourseName(admission.course)}
                </Typography>
                {!selectionMode && (
                  <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                    <Tooltip title="WhatsApp">
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleWhatsApp(admission.student?.mobileSelf, admission.student?.firstName); }}
                        sx={{ bgcolor: '#25d366', color: '#fff', '&:hover': { bgcolor: '#128c7e' }, width: 28, height: 28 }}
                      >
                        <WhatsAppIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Call">
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleCall(admission.student?.mobileSelf); }}
                        sx={{ bgcolor: '#1a7a4a', color: '#fff', '&:hover': { bgcolor: '#25a066' }, width: 28, height: 28 }}
                      >
                        <PhoneIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {selectionMode && (
                  <th style={{ padding: '10px 12px', width: 40 }}>
                    <Checkbox size="small" checked={allSelected} onChange={() => allSelected ? setSelectedUuids(new Set()) : selectAll()} sx={{ p: 0 }} />
                  </th>
                )}
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Name</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Course</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmissions.map((admission) => (
                <tr
                  key={admission._id}
                  onClick={() => selectionMode ? toggleSelect(admission.uuid) : setSelectedAdmission(admission)}
                  style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', background: selectedUuids.has(admission.uuid) ? 'rgba(26,122,74,0.06)' : 'white' }}
                  onMouseEnter={e => { if (!selectedUuids.has(admission.uuid)) e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = selectedUuids.has(admission.uuid) ? 'rgba(26,122,74,0.06)' : 'white'; }}
                >
                  {selectionMode && (
                    <td style={{ padding: '8px 12px' }} onClick={e => e.stopPropagation()}>
                      <Checkbox size="small" checked={selectedUuids.has(admission.uuid)} onChange={() => toggleSelect(admission.uuid)} sx={{ p: 0 }} />
                    </td>
                  )}
                  <td style={{ padding: '8px 12px', fontWeight: 500, fontSize: 14 }}>
                    {admission.student?.firstName} {admission.student?.lastName}
                  </td>
                  <td style={{ padding: '8px 12px', fontSize: 13, color: '#6b7280' }}>
                    {getCourseName(admission.course)}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="WhatsApp">
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); handleWhatsApp(admission.student?.mobileSelf, admission.student?.firstName); }}
                          sx={{ bgcolor: '#25d366', color: '#fff', '&:hover': { bgcolor: '#128c7e' }, width: 26, height: 26 }}
                        >
                          <WhatsAppIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Call">
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); handleCall(admission.student?.mobileSelf); }}
                          sx={{ bgcolor: '#1a7a4a', color: '#fff', '&:hover': { bgcolor: '#25a066' }, width: 26, height: 26 }}
                        >
                          <PhoneIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}
    </Box>
  );
};

export default AllAdmission;
