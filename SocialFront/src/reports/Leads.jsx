import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../apiClient';
import toast, { Toaster } from 'react-hot-toast';
import { FaWhatsapp } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import { saveRecords, getAllRecords } from '../db/dbService';

import {
  PictureAsPdf,
  FileDownload,
  Delete,
  SwapHoriz,
  Close,
  GridView,
  ViewList,
  PersonAdd,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Paper,
} from '@mui/material';

import { useMetadata } from '../context/MetadataContext';

const STATUS_COLORS = {
  'follow-up': 'warning',
  'interested': 'success',
  'not-interested': 'error',
  'converted': 'info',
  'new': 'default',
};

const Leads = () => {
  const { institute_uuid: ctxInstituteUuid } = useApp();
  const { username } = useParams();
  const navigate = useNavigate();

  const admissionTemplate = {
    admissionDate: '', firstName: '', middleName: '', lastName: '', dob: '',
    gender: '', mobileSelf: '', mobileParent: '', address: '', education: '',
    course: '', batchTime: '', examEvent: '',
    installment: '', fees: '', discount: '', total: '', feePaid: '',
    paidBy: '', balance: ''
  };

  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('card');
  const [actionModal, setActionModal] = useState(null);
  const [showAdmission, setShowAdmission] = useState(false);
  const [admissionForm, setAdmissionForm] = useState(admissionTemplate);
  const [enquiryToDeleteId, setEnquiryToDeleteId] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const { courses, educations, exams, batches, paymentModes, refresh: refreshMeta } = useMetadata();
  const institute_uuid = ctxInstituteUuid || localStorage.getItem('institute_uuid');

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get(`/api/leads`, { params: { institute_uuid } });
      const list = Array.isArray(data?.data) ? data.data : [];
      setLeads(list);
      await saveRecords('leads', list, ['studentData']);
    } catch {
      toast.error('Error fetching leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadCached = async () => {
      const cached = await getAllRecords('leads', ['studentData']);
      if (cached.length) setLeads(cached);
    };
    loadCached();
    fetchLeads();
    refreshMeta();
  }, []);

  useEffect(() => {
    if (institute_uuid) refreshMeta();
  }, [institute_uuid]);

  const getCourseName = (uuid) => {
    if (!uuid) return '';
    const course = courses.find(c => c.Course_uuid === uuid || c.name === uuid);
    return course?.name || uuid;
  };

  const filtered = useMemo(() =>
    leads.filter(lead => {
      const name = `${lead.studentData?.firstName || ''} ${lead.studentData?.lastName || ''}`.toLowerCase();
      const mobile = lead.studentData?.mobileSelf || '';
      return name.includes(search.toLowerCase()) || mobile.includes(search);
    }),
    [leads, search]
  );

  const getLatestStatus = (lead) => {
    if (!Array.isArray(lead.followups) || lead.followups.length === 0) return 'new';
    return [...lead.followups].sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.status || 'new';
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await apiClient.delete(`/api/leads/${id}`);
      toast.success('Deleted');
      fetchLeads();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleConvert = (lead) => {
    const sd = lead.studentData || {};
    setAdmissionForm({
      ...admissionTemplate,
      firstName: sd.firstName || '',
      middleName: sd.middleName || '',
      lastName: sd.lastName || '',
      dob: sd.dob ? String(sd.dob).substring(0, 10) : '',
      gender: sd.gender || '',
      mobileSelf: sd.mobileSelf || '',
      mobileParent: sd.mobileParent || '',
      address: sd.address || '',
      education: sd.education || '',
      course: getCourseName(lead.course || sd.course || ''),
      admissionDate: new Date().toISOString().split('T')[0],
    });
    setEnquiryToDeleteId(lead.Lead_uuid);
    setShowAdmission(true);
  };

  const handleAdmissionChange = (field) => (e) => {
    const value = e.target.value;
    let updated = { ...admissionForm, [field]: value };
    const fees = Number(field === 'fees' ? value : updated.fees || 0);
    const discount = Number(field === 'discount' ? value : updated.discount || 0);
    const feePaid = Number(field === 'feePaid' ? value : updated.feePaid || 0);
    updated.total = fees - discount;
    updated.balance = updated.total - feePaid;
    setAdmissionForm(updated);
  };

  const submitAdmission = async (e) => {
    e.preventDefault();
    if (!institute_uuid) return toast.error('Missing institute ID');
    try {
      await apiClient.post(`/api/record/convert/${enquiryToDeleteId}`, {
        institute_uuid,
        admissionData: {
          admissionDate: admissionForm.admissionDate,
          course: admissionForm.course,
          batchTime: admissionForm.batchTime,
          examEvent: admissionForm.examEvent,
          installment: admissionForm.installment,
          fees: Number(admissionForm.fees || 0),
          discount: Number(admissionForm.discount || 0),
          total: Number(admissionForm.total || 0),
          feePaid: Number(admissionForm.feePaid || 0),
          paidBy: admissionForm.paidBy,
          balance: Number(admissionForm.balance || 0),
          createdBy: localStorage.getItem('name') || 'admin',
        },
      });
      toast.success('Converted to admission');
      setAdmissionForm(admissionTemplate);
      setShowAdmission(false);
      fetchLeads();
    } catch {
      toast.error('Failed to convert to admission');
    }
  };

  const exportPDF = () => {
    if (!filtered.length) return toast.error('No data to export');
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Name', 'Mobile', 'Course', 'Status']],
      body: filtered.map(l => [
        `${l.studentData?.firstName || ''} ${l.studentData?.lastName || ''}`,
        l.studentData?.mobileSelf || '',
        getCourseName(l.course),
        getLatestStatus(l),
      ]),
    });
    doc.save('leads.pdf');
  };

  const exportExcel = () => {
    if (!filtered.length) return toast.error('No data to export');
    const sheet = XLSX.utils.json_to_sheet(filtered.map(l => ({
      Name: `${l.studentData?.firstName || ''} ${l.studentData?.lastName || ''}`,
      Mobile: l.studentData?.mobileSelf || '',
      Course: getCourseName(l.course),
      Status: getLatestStatus(l),
    })));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Leads');
    XLSX.writeFile(book, 'leads.xlsx');
  };

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
    if (!selectedIds.size) return;
    if (!window.confirm(`Delete ${selectedIds.size} lead(s)?`)) return;
    try {
      await apiClient.post(`/api/leads/bulk-delete`, { uuids: [...selectedIds] });
      toast.success(`Deleted ${selectedIds.size} lead(s)`);
      clearSelection();
      fetchLeads();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 3 }, bgcolor: '#f5f5f5' }}>
      <Toaster />

      {/* Toolbar */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        mb={3}
      >
        <TextField
          size="small"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or mobile"
          sx={{ maxWidth: { sm: 300 }, width: '100%' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonAdd fontSize="small" sx={{ color: '#1a7a4a' }} />
              </InputAdornment>
            ),
          }}
        />
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
          <Button
            variant="contained"
            size="small"
            onClick={() => navigate(`/${username}/add-lead`)}
            sx={{ bgcolor: '#1a7a4a', '&:hover': { bgcolor: '#145c37' }, textTransform: 'none' }}
            startIcon={<PersonAdd />}
          >
            Add Lead
          </Button>
          <Tooltip title="Export PDF">
            <Button variant="contained" color="error" size="small" onClick={exportPDF} startIcon={<PictureAsPdf />}>PDF</Button>
          </Tooltip>
          <Tooltip title="Export Excel">
            <Button variant="contained" color="success" size="small" onClick={exportExcel} startIcon={<FileDownload />}>Excel</Button>
          </Tooltip>
          <Tooltip title="Card view">
            <IconButton size="small" onClick={() => setViewMode('card')} sx={{ bgcolor: viewMode === 'card' ? '#1a7a4a' : 'grey.200', color: viewMode === 'card' ? '#fff' : 'text.secondary', borderRadius: 1 }}>
              <GridView fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="List view">
            <IconButton size="small" onClick={() => setViewMode('list')} sx={{ bgcolor: viewMode === 'list' ? '#1a7a4a' : 'grey.200', color: viewMode === 'list' ? '#fff' : 'text.secondary', borderRadius: 1 }}>
              <ViewList fontSize="small" />
            </IconButton>
          </Tooltip>
          {!selectionMode ? (
            <Button size="small" variant="outlined" onClick={() => setSelectionMode(true)} sx={{ textTransform: 'none' }}>Select</Button>
          ) : (
            <>
              <Button size="small" variant="outlined" onClick={() => allSelected ? setSelectedIds(new Set()) : setSelectedIds(new Set(filtered.map(l => l.Lead_uuid)))} sx={{ textTransform: 'none' }}>
                {allSelected ? 'Deselect All' : 'Select All'}
              </Button>
              {selectedIds.size > 0 && (
                <Button size="small" variant="contained" color="error" onClick={handleBulkDelete} sx={{ textTransform: 'none' }}>
                  Delete ({selectedIds.size})
                </Button>
              )}
              <Button size="small" variant="outlined" color="inherit" onClick={clearSelection} sx={{ textTransform: 'none' }}>Cancel</Button>
            </>
          )}
        </Stack>
      </Stack>

      {/* Count */}
      {!loading && (
        <Typography variant="body2" color="text.secondary" mb={2}>
          {filtered.length} lead{filtered.length !== 1 ? 's' : ''}
        </Typography>
      )}

      {loading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Loading leads…</Typography>
        </Paper>
      )}

      {/* Card view */}
      {!loading && viewMode === 'card' && (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', md: 'repeat(3,1fr)', lg: 'repeat(4,1fr)' } }}>
          {filtered.map(lead => {
            const status = getLatestStatus(lead);
            return (
              <Card
                key={lead._id}
                onClick={() => selectionMode ? toggleSelect(lead.Lead_uuid) : setActionModal(lead)}
                sx={{
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: 6 },
                  borderLeft: '4px solid #1a7a4a',
                  outline: selectedIds.has(lead.Lead_uuid) ? '2px solid #1a7a4a' : 'none',
                  bgcolor: selectedIds.has(lead.Lead_uuid) ? 'rgba(26,122,74,0.06)' : 'white',
                }}
              >
                {selectionMode && (
                  <Box sx={{ position: 'absolute', top: 6, left: 6, zIndex: 1 }} onClick={ev => ev.stopPropagation()}>
                    <Checkbox size="small" checked={selectedIds.has(lead.Lead_uuid)} onChange={() => toggleSelect(lead.Lead_uuid)} sx={{ p: 0 }} />
                  </Box>
                )}
                <CardContent sx={{ pb: '12px !important', pl: selectionMode ? 4.5 : 2 }}>
                  <Typography variant="subtitle1" fontWeight={700} noWrap>
                    {lead.studentData?.firstName || ''} {lead.studentData?.lastName || ''}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                    <Typography
                      component="a"
                      href={`tel:${lead.studentData?.mobileSelf || ''}`}
                      onClick={ev => ev.stopPropagation()}
                      variant="body2"
                      color="text.secondary"
                      sx={{ textDecoration: 'none', '&:hover': { color: '#1a7a4a' } }}
                    >
                      {lead.studentData?.mobileSelf}
                    </Typography>
                    <IconButton
                      component="a"
                      href={`https://wa.me/91${lead.studentData?.mobileSelf}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={ev => ev.stopPropagation()}
                      size="small"
                      sx={{ color: '#25d366', p: 0.5 }}
                    >
                      <FaWhatsapp size={16} />
                    </IconButton>
                  </Stack>
                  {getCourseName(lead.course) && (
                    <Chip label={getCourseName(lead.course)} size="small" sx={{ mt: 1, mr: 0.5 }} />
                  )}
                  <Chip
                    label={status}
                    size="small"
                    color={STATUS_COLORS[status] || 'default'}
                    sx={{ mt: 1, textTransform: 'capitalize' }}
                  />
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* List view */}
      {!loading && viewMode === 'list' && (
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {selectionMode && (
                  <th style={{ padding: '10px 12px', width: 40 }}>
                    <Checkbox size="small" checked={allSelected} onChange={() => allSelected ? setSelectedIds(new Set()) : setSelectedIds(new Set(filtered.map(l => l.Lead_uuid)))} sx={{ p: 0 }} />
                  </th>
                )}
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Name</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Mobile</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Course</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => {
                const status = getLatestStatus(lead);
                return (
                  <tr
                    key={lead._id}
                    onClick={() => selectionMode ? toggleSelect(lead.Lead_uuid) : setActionModal(lead)}
                    style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', background: selectedIds.has(lead.Lead_uuid) ? 'rgba(26,122,74,0.06)' : 'white' }}
                    onMouseEnter={ev => { if (!selectedIds.has(lead.Lead_uuid)) ev.currentTarget.style.background = '#f9fafb'; }}
                    onMouseLeave={ev => { ev.currentTarget.style.background = selectedIds.has(lead.Lead_uuid) ? 'rgba(26,122,74,0.06)' : 'white'; }}
                  >
                    {selectionMode && (
                      <td style={{ padding: '8px 12px' }} onClick={ev => ev.stopPropagation()}>
                        <Checkbox size="small" checked={selectedIds.has(lead.Lead_uuid)} onChange={() => toggleSelect(lead.Lead_uuid)} sx={{ p: 0 }} />
                      </td>
                    )}
                    <td style={{ padding: '8px 12px', fontWeight: 500, fontSize: 14 }}>
                      {lead.studentData?.firstName} {lead.studentData?.lastName}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 13, color: '#6b7280' }}>
                      {lead.studentData?.mobileSelf}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 13, color: '#6b7280' }}>
                      {getCourseName(lead.course) || '-'}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <Chip label={status} size="small" color={STATUS_COLORS[status] || 'default'} sx={{ textTransform: 'capitalize' }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Box>
      )}

      {!loading && filtered.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
          <Typography color="text.secondary">No leads found.</Typography>
        </Paper>
      )}

      {/* Action Modal */}
      <Dialog open={Boolean(actionModal)} onClose={() => setActionModal(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { mx: 2 } }}>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={700}>
              {actionModal?.studentData?.firstName} {actionModal?.studentData?.lastName}
            </Typography>
            <IconButton onClick={() => setActionModal(null)} size="small"><Close /></IconButton>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={1.5} pt={1}>
            <Button
              variant="contained"
              color="success"
              startIcon={<SwapHoriz />}
              fullWidth
              onClick={() => { handleConvert(actionModal); setActionModal(null); }}
            >
              Convert to Admission
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Delete />}
              fullWidth
              onClick={() => { handleDelete(actionModal.Lead_uuid || actionModal._id); setActionModal(null); }}
            >
              Delete
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setActionModal(null)} color="inherit" fullWidth>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Convert to Admission Dialog */}
      <Dialog open={showAdmission} onClose={() => setShowAdmission(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { mx: 2 } }} scroll="paper">
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={700} color="success.main">Convert to Admission</Typography>
            <IconButton onClick={() => setShowAdmission(false)} size="small"><Close /></IconButton>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Box component="form" id="admission-form" onSubmit={submitAdmission}>
            <Stack spacing={2} mt={1}>
              <TextField label="Admission Date" type="date" size="small" value={admissionForm.admissionDate} onChange={handleAdmissionChange('admissionDate')} InputLabelProps={{ shrink: true }} fullWidth />
              <TextField label="First Name" size="small" value={admissionForm.firstName} onChange={handleAdmissionChange('firstName')} fullWidth />
              <TextField label="Middle Name" size="small" value={admissionForm.middleName} onChange={handleAdmissionChange('middleName')} fullWidth />
              <TextField label="Last Name" size="small" value={admissionForm.lastName} onChange={handleAdmissionChange('lastName')} fullWidth />
              <TextField label="Date of Birth" type="date" size="small" value={admissionForm.dob?.substring(0, 10) || ''} onChange={handleAdmissionChange('dob')} InputLabelProps={{ shrink: true }} fullWidth />
              <FormControl>
                <Typography variant="body2" mb={0.5}>Gender</Typography>
                <RadioGroup row value={admissionForm.gender} onChange={handleAdmissionChange('gender')}>
                  <FormControlLabel value="Male" control={<Radio size="small" />} label="Male" />
                  <FormControlLabel value="Female" control={<Radio size="small" />} label="Female" />
                </RadioGroup>
              </FormControl>
              <TextField label="Mobile (Self)" size="small" value={admissionForm.mobileSelf} onChange={handleAdmissionChange('mobileSelf')} inputProps={{ inputMode: 'numeric', maxLength: 10 }} fullWidth />
              <TextField label="Mobile (Parent)" size="small" value={admissionForm.mobileParent} onChange={handleAdmissionChange('mobileParent')} inputProps={{ inputMode: 'numeric', maxLength: 10 }} fullWidth />
              <TextField label="Address" size="small" value={admissionForm.address} onChange={handleAdmissionChange('address')} fullWidth />
              <FormControl size="small" fullWidth>
                <InputLabel>Education</InputLabel>
                <Select value={admissionForm.education} label="Education" onChange={handleAdmissionChange('education')}>
                  <MenuItem value="">-- Select Education --</MenuItem>
                  {educations.map(e => <MenuItem key={e._id} value={e.education}>{e.education}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Course</InputLabel>
                <Select
                  value={admissionForm.course}
                  label="Course"
                  onChange={(e) => {
                    const selectedCourse = courses.find(c => c.name === e.target.value);
                    const courseFee = Number(selectedCourse?.courseFees || 0);
                    const discount = Number(admissionForm.discount || 0);
                    const feePaid = Number(admissionForm.feePaid || 0);
                    const total = courseFee - discount;
                    setAdmissionForm(prev => ({ ...prev, course: e.target.value, fees: courseFee, total, balance: total - feePaid }));
                  }}
                >
                  <MenuItem value="">-- Select Course --</MenuItem>
                  {courses.map(c => <MenuItem key={c._id} value={c.name}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Batch</InputLabel>
                <Select value={admissionForm.batchTime} label="Batch" onChange={handleAdmissionChange('batchTime')}>
                  <MenuItem value="">-- Select Batch --</MenuItem>
                  {batches.map(b => <MenuItem key={b._id} value={b.time || b.batchTime || b.name || ''}>{b.time || b.batchTime || b.name || 'Unnamed Batch'}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Exam</InputLabel>
                <Select value={admissionForm.examEvent} label="Exam" onChange={handleAdmissionChange('examEvent')}>
                  <MenuItem value="">-- Select Exam --</MenuItem>
                  {exams.map(e => <MenuItem key={e._id} value={e.exam}>{e.exam}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Installment" size="small" value={admissionForm.installment} onChange={handleAdmissionChange('installment')} fullWidth />
              <TextField label="Fees" type="number" size="small" value={admissionForm.fees} InputProps={{ readOnly: true }} fullWidth />
              <TextField label="Discount" type="number" size="small" value={admissionForm.discount} onChange={handleAdmissionChange('discount')} fullWidth />
              <TextField label="Total" type="number" size="small" value={admissionForm.total} InputProps={{ readOnly: true }} fullWidth />
              <TextField label="Fee Paid" type="number" size="small" value={admissionForm.feePaid} onChange={handleAdmissionChange('feePaid')} fullWidth />
              <FormControl size="small" fullWidth>
                <InputLabel>Payment Mode</InputLabel>
                <Select value={admissionForm.paidBy} label="Payment Mode" onChange={handleAdmissionChange('paidBy')}>
                  <MenuItem value="">-- Select Payment Mode --</MenuItem>
                  {paymentModes.map(p => <MenuItem key={p._id} value={p.mode}>{p.mode}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Balance" type="number" size="small" value={admissionForm.balance} InputProps={{ readOnly: true }} fullWidth />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShowAdmission(false)} color="inherit">Cancel</Button>
          <Button type="submit" form="admission-form" variant="contained" color="success">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Leads;
