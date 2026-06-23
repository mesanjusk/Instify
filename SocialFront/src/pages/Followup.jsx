import React, { useState, useEffect } from 'react';
import apiClient from '../apiClient';
import toast from 'react-hot-toast';
import { FaWhatsapp } from 'react-icons/fa';
import { useApp } from '../context/AppContext';

import {
  PictureAsPdf,
  FileDownload,
  Delete,
  Phone,
  SwapHoriz,
  Close,
  GridView,
  ViewList,
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
  Alert,
  Paper,
} from '@mui/material';

import { useMetadata } from '../context/MetadataContext';

const Followup = () => {
  const { institute_uuid: ctxInstituteUuid } = useApp();

  const admissionTemplate = {
    admissionDate: '', firstName: '', middleName: '', lastName: '', dob: '',
    gender: '', mobileSelf: '', mobileParent: '', address: '', education: '',
    course: '', batchTime: '', examEvent: '',
    installment: '', fees: '', discount: '', total: '', feePaid: '',
    paidBy: '', balance: ''
  };

  const [admissionForm, setAdmissionForm] = useState(admissionTemplate);
  const [enquiries, setEnquiries] = useState([]);
  const [showAdmission, setShowAdmission] = useState(false);
  const [enquiryToDeleteId, setEnquiryToDeleteId] = useState(null);
  const { courses, educations, exams, batches, paymentModes, refresh: refreshMeta } = useMetadata();
  const [search, setSearch] = useState('');
  const [actionModal, setActionModal] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const institute_uuid = ctxInstituteUuid || localStorage.getItem('institute_uuid');
  const today = new Date().toISOString().substring(0, 10);

  const todaysFollowups = enquiries.filter(e => {
    const followDate = e.followupDate?.substring(0, 10);
    return followDate === today;
  });

  const handleAdmissionChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    let updated = { ...admissionForm, [field]: value };

    const fees = Number(field === 'fees' ? value : updated.fees || 0);
    const discount = Number(field === 'discount' ? value : updated.discount || 0);
    const feePaid = Number(field === 'feePaid' ? value : updated.feePaid || 0);

    updated.total = fees - discount;
    updated.balance = updated.total - feePaid;

    setAdmissionForm(updated);
  };

  const fetchLeads = async () => {
    try {
      const res = await apiClient.get(`/api/leads`, { params: { institute_uuid } });
      const { data } = res.data;
      setEnquiries(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to fetch leads');
    }
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

  const handleConvert = (e) => {
    const sd = e.studentData || {};
    const fill = {
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
      course: e.course || sd.course || '',
      admissionDate: new Date().toISOString().split('T')[0],
    };
    setAdmissionForm(fill);
    setEnquiryToDeleteId(e.Lead_uuid);
    setShowAdmission(true);
  };

  const exportPDF = () => {
    if (filtered.length === 0) return toast.error('No data to export');
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Name', 'Mobile']],
      body: filtered.map(e => [`${e.firstName} ${e.lastName}`, e.mobileSelf])
    });
    doc.save('followups.pdf');
  };

  const exportExcel = () => {
    if (filtered.length === 0) return toast.error('No data to export');
    const sheet = XLSX.utils.json_to_sheet(filtered.map(e => ({
      Name: `${e.firstName} ${e.lastName}`,
      Mobile: e.mobileSelf
    })));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Followups');
    XLSX.writeFile(book, 'followups.xlsx');
  };

  const submitAdmission = async (e) => {
    e.preventDefault();
    if (!institute_uuid) return toast.error("Missing institute ID");

    const payload = {
      institute_uuid: institute_uuid,
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
        createdBy: localStorage.getItem('name') || 'admin'
      }
    };

    try {
      await apiClient.post(`/api/record/convert/${enquiryToDeleteId}`, payload);
      toast.success('Admission saved and enquiry updated');
      setAdmissionForm(admissionTemplate);
      setShowAdmission(false);
      fetchLeads();
    } catch (err) {
      toast.error('Failed to convert to admission');
    }
  };

  useEffect(() => {
    fetchLeads();
    refreshMeta();
  }, []);

  // Re-trigger metadata load when institute_uuid becomes available from context
  useEffect(() => {
    if (institute_uuid) refreshMeta();
  }, [institute_uuid]);

  const filtered = enquiries.filter(e =>
    e.studentData?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    e.studentData?.mobileSelf?.includes(search)
  );

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;

  const toggleSelect = (id) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const clearSelection = () => { setSelectedIds(new Set()); setSelectionMode(false); };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
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
      {/* Header toolbar */}
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
                <Phone fontSize="small" />
              </InputAdornment>
            )
          }}
        />
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Tooltip title="Export PDF">
            <Button variant="contained" color="error" size="small" onClick={exportPDF} startIcon={<PictureAsPdf />}>PDF</Button>
          </Tooltip>
          <Tooltip title="Export Excel">
            <Button variant="contained" color="success" size="small" onClick={exportExcel} startIcon={<FileDownload />}>Excel</Button>
          </Tooltip>
          <Tooltip title="Card view"><IconButton size="small" onClick={() => setViewMode('card')} sx={{ bgcolor: viewMode === 'card' ? '#1a7a4a' : 'grey.200', color: viewMode === 'card' ? '#fff' : 'text.secondary', borderRadius: 1 }}><GridView fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="List view"><IconButton size="small" onClick={() => setViewMode('list')} sx={{ bgcolor: viewMode === 'list' ? '#1a7a4a' : 'grey.200', color: viewMode === 'list' ? '#fff' : 'text.secondary', borderRadius: 1 }}><ViewList fontSize="small" /></IconButton></Tooltip>
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

      {/* Today's follow-ups banner */}
      {todaysFollowups.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={600}>
            {todaysFollowups.length} follow-up{todaysFollowups.length > 1 ? 's' : ''} scheduled for today
          </Typography>
        </Alert>
      )}

      {/* Cards grid / list */}
      {viewMode === 'card' ? (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' } }}>
          {filtered.map((e) => (
            <Card key={e._id} onClick={() => selectionMode ? toggleSelect(e._id) : setActionModal(e)}
              sx={{ cursor: 'pointer', position: 'relative', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 6 }, borderLeft: '4px solid #1a7a4a', outline: selectedIds.has(e._id) ? '2px solid #1a7a4a' : 'none', bgcolor: selectedIds.has(e._id) ? 'rgba(26,122,74,0.06)' : 'white' }}>
              {selectionMode && (
                <Box sx={{ position: 'absolute', top: 6, left: 6, zIndex: 1 }} onClick={ev => ev.stopPropagation()}>
                  <Checkbox size="small" checked={selectedIds.has(e._id)} onChange={() => toggleSelect(e._id)} sx={{ p: 0 }} />
                </Box>
              )}
              <CardContent sx={{ pb: '12px !important', pl: selectionMode ? 4.5 : 2 }}>
                <Typography variant="subtitle1" fontWeight={700} noWrap>{e.studentData?.firstName || ''} {e.studentData?.lastName || ''}</Typography>
                <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                  <Typography component="a" href={`tel:${e.studentData?.mobileSelf || ''}`} onClick={ev => ev.stopPropagation()} variant="body2" color="text.secondary" sx={{ textDecoration: 'none', '&:hover': { color: '#1a7a4a' } }}>{e.studentData?.mobileSelf}</Typography>
                  <IconButton component="a" href={`https://wa.me/${e.studentData?.mobileSelf}`} target="_blank" rel="noopener noreferrer" onClick={ev => ev.stopPropagation()} size="small" sx={{ color: '#25d366', p: 0.5 }}><FaWhatsapp size={18} /></IconButton>
                </Stack>
                {e.studentData?.course && <Chip label={e.studentData.course} size="small" sx={{ mt: 1 }} />}
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
                  <td style={{ padding: '8px 12px', fontWeight: 500, fontSize: 14 }}>{e.studentData?.firstName} {e.studentData?.lastName}</td>
                  <td style={{ padding: '8px 12px', fontSize: 13, color: '#6b7280' }}>{e.studentData?.mobileSelf}</td>
                  <td style={{ padding: '8px 12px', fontSize: 13, color: '#6b7280' }}>{e.studentData?.course || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}

      {filtered.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
          <Typography color="text.secondary">No follow-ups found.</Typography>
        </Paper>
      )}

      {/* Convert to Admission Dialog */}
      <Dialog
        open={showAdmission}
        onClose={() => setShowAdmission(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { mx: 2 } }}
        scroll="paper"
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={700} color="success.main">
              Convert to Admission
            </Typography>
            <IconButton onClick={() => setShowAdmission(false)} size="small">
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Box component="form" id="admission-form" onSubmit={submitAdmission}>
            <Stack spacing={2} mt={1}>
              <TextField
                label="Admission Date"
                type="date"
                size="small"
                value={admissionForm.admissionDate}
                onChange={handleAdmissionChange('admissionDate')}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="First Name"
                size="small"
                value={admissionForm.firstName}
                onChange={handleAdmissionChange('firstName')}
                fullWidth
              />
              <TextField
                label="Middle Name"
                size="small"
                value={admissionForm.middleName}
                onChange={handleAdmissionChange('middleName')}
                fullWidth
              />
              <TextField
                label="Last Name"
                size="small"
                value={admissionForm.lastName}
                onChange={handleAdmissionChange('lastName')}
                fullWidth
              />
              <TextField
                label="Date of Birth"
                type="date"
                size="small"
                value={admissionForm.dob?.substring(0, 10) || ''}
                onChange={handleAdmissionChange('dob')}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <FormControl>
                <Typography variant="body2" mb={0.5}>Gender</Typography>
                <RadioGroup
                  row
                  value={admissionForm.gender}
                  onChange={handleAdmissionChange('gender')}
                >
                  <FormControlLabel value="Male" control={<Radio size="small" />} label="Male" />
                  <FormControlLabel value="Female" control={<Radio size="small" />} label="Female" />
                </RadioGroup>
              </FormControl>
              <TextField
                label="Mobile (Self)"
                size="small"
                value={admissionForm.mobileSelf}
                onChange={handleAdmissionChange('mobileSelf')}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]{10}', maxLength: 10 }}
                fullWidth
              />
              <TextField
                label="Mobile (Parent)"
                size="small"
                value={admissionForm.mobileParent}
                onChange={handleAdmissionChange('mobileParent')}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]{10}', maxLength: 10 }}
                fullWidth
              />
              <TextField
                label="Address"
                size="small"
                value={admissionForm.address}
                onChange={handleAdmissionChange('address')}
                fullWidth
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Education</InputLabel>
                <Select
                  value={admissionForm.education}
                  label="Education"
                  onChange={handleAdmissionChange('education')}
                >
                  <MenuItem value="">-- Select Education --</MenuItem>
                  {educations.map(e => (
                    <MenuItem key={e._id} value={e.education}>{e.education}</MenuItem>
                  ))}
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
                    const balance = total - feePaid;
                    setAdmissionForm(prev => ({
                      ...prev,
                      course: e.target.value,
                      fees: courseFee,
                      total,
                      balance
                    }));
                  }}
                >
                  <MenuItem value="">-- Select Course --</MenuItem>
                  {courses.map(c => (
                    <MenuItem key={c._id} value={c.name}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Batch</InputLabel>
                <Select
                  value={admissionForm.batchTime}
                  label="Batch"
                  onChange={handleAdmissionChange('batchTime')}
                >
                  <MenuItem value="">-- Select Batch --</MenuItem>
                  {batches.map(b => (
                    <MenuItem key={b._id} value={b.time || b.batchTime || b.name || ''}>
                      {b.time || b.batchTime || b.name || 'Unnamed Batch'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Exam</InputLabel>
                <Select
                  value={admissionForm.examEvent}
                  label="Exam"
                  onChange={handleAdmissionChange('examEvent')}
                >
                  <MenuItem value="">-- Select Exam --</MenuItem>
                  {exams.map(e => (
                    <MenuItem key={e._id} value={e.exam}>{e.exam}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Installment"
                size="small"
                value={admissionForm.installment}
                onChange={handleAdmissionChange('installment')}
                fullWidth
              />
              <TextField
                label="Fees"
                type="number"
                size="small"
                value={admissionForm.fees}
                InputProps={{ readOnly: true }}
                fullWidth
              />
              <TextField
                label="Discount"
                type="number"
                size="small"
                value={admissionForm.discount}
                onChange={handleAdmissionChange('discount')}
                fullWidth
              />
              <TextField
                label="Total"
                type="number"
                size="small"
                value={admissionForm.total}
                InputProps={{ readOnly: true }}
                fullWidth
              />
              <TextField
                label="Fee Paid"
                type="number"
                size="small"
                value={admissionForm.feePaid}
                onChange={handleAdmissionChange('feePaid')}
                fullWidth
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Payment Mode</InputLabel>
                <Select
                  value={admissionForm.paidBy}
                  label="Payment Mode"
                  onChange={handleAdmissionChange('paidBy')}
                >
                  <MenuItem value="">-- Select Payment Mode --</MenuItem>
                  {paymentModes.map(p => (
                    <MenuItem key={p._id} value={p.mode}>{p.mode}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Balance"
                type="number"
                size="small"
                value={admissionForm.balance}
                InputProps={{ readOnly: true }}
                fullWidth
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShowAdmission(false)} color="inherit">Cancel</Button>
          <Button
            type="submit"
            form="admission-form"
            variant="contained"
            color="success"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Modal */}
      <Dialog
        open={Boolean(actionModal)}
        onClose={() => setActionModal(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { mx: 2 } }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={700}>
              {actionModal?.studentData?.firstName} {actionModal?.studentData?.lastName}
            </Typography>
            <IconButton onClick={() => setActionModal(null)} size="small">
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={1.5} pt={1}>
            <Button
              variant="contained"
              color="error"
              startIcon={<Delete />}
              fullWidth
              onClick={() => {
                handleDelete(actionModal._id);
                setActionModal(null);
              }}
            >
              Delete
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<SwapHoriz />}
              fullWidth
              onClick={() => {
                handleConvert(actionModal);
                setActionModal(null);
              }}
            >
              Convert to Admission
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setActionModal(null)} color="inherit" fullWidth>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Followup;
