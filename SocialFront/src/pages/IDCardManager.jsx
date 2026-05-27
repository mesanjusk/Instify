import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControlLabel, IconButton,
  MenuItem, Select, Stack, Switch, Tab, Tabs, TextField, Tooltip,
  Typography, Paper, Card, CardContent, CardActionArea, LinearProgress,
  Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ShareIcon from '@mui/icons-material/Share';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PrintIcon from '@mui/icons-material/Print';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PeopleIcon from '@mui/icons-material/People';
import DownloadIcon from '@mui/icons-material/Download';
import BlockIcon from '@mui/icons-material/Block';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FilterListIcon from '@mui/icons-material/FilterList';
import TableChartIcon from '@mui/icons-material/TableChart';
import GroupsIcon from '@mui/icons-material/Groups';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import BadgeIcon from '@mui/icons-material/Badge';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LayersIcon from '@mui/icons-material/Layers';
import * as XLSX from 'xlsx';
import apiClient from '../apiClient';
import { useNavigate } from 'react-router-dom';

const STATUS_COLOR = {
  pending: 'default',
  not_available: 'error',
  student_submitted: 'warning',
  approved: 'success',
};
const STATUS_LABEL = {
  pending: 'Pending',
  not_available: 'Not Available',
  student_submitted: 'Submitted',
  approved: 'Approved',
};

const MODE_CARDS = [
  {
    key: 'single',
    icon: <PersonAddIcon sx={{ fontSize: 32 }} />,
    title: 'Single Card',
    desc: 'Add one student manually and upload their photo',
    color: '#0ea5e9',
    bg: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
    iconBg: '#0ea5e9',
  },
  {
    key: 'bulk',
    icon: <PhotoLibraryIcon sx={{ fontSize: 32 }} />,
    title: 'Bulk Photo Upload',
    desc: 'Upload photos for multiple students at once by roll number',
    color: '#8b5cf6',
    bg: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
    iconBg: '#8b5cf6',
  },
  {
    key: 'excel',
    icon: <TableChartIcon sx={{ fontSize: 32 }} />,
    title: 'Import from Excel / CSV',
    desc: 'Import hundreds of students from a spreadsheet file',
    color: '#10b981',
    bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
    iconBg: '#10b981',
  },
  {
    key: 'classbatch',
    icon: <GroupsIcon sx={{ fontSize: 32 }} />,
    title: 'Class / Batch Wise',
    desc: 'View and manage cards filtered by class or batch',
    color: '#f59e0b',
    bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    iconBg: '#f59e0b',
  },
];

// ── Webcam capture dialog ─────────────────────────────────────────────────────
function WebcamDialog({ open, onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {});
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [open]);

  function capture() {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(blob => { onCapture(blob); onClose(); }, 'image/jpeg', 0.92);
    streamRef.current?.getTracks().forEach(t => t.stop());
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Capture Photo</DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: 8, maxHeight: 340, background: '#000' }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" startIcon={<PhotoCameraIcon />} onClick={capture}>Capture</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Single student card in the grid ──────────────────────────────────────────
function StudentCard({ student, onPhotoUpload, onWebcam, onRemoveBg, onStatusChange, onShare, onApprove, onReject, tab }) {
  const photo = student.use_bg_removed ? student.bg_removed_url : student.photo_url;
  const displayName = student.student_name_override || student.student_name;
  const [bgLoading, setBgLoading] = useState(false);

  async function handleRemoveBg() {
    setBgLoading(true);
    await onRemoveBg(student.idcard_uuid);
    setBgLoading(false);
  }

  return (
    <Box sx={{
      border: '1px solid #e2e8f0', borderRadius: 2, p: 1.5, bgcolor: '#fff',
      display: 'flex', flexDirection: 'column', gap: 1,
      transition: 'box-shadow 0.15s', '&:hover': { boxShadow: 3 },
    }}>
      <Box sx={{ position: 'relative', width: '100%', paddingTop: '100%', borderRadius: 1.5, overflow: 'hidden', bgcolor: '#f1f5f9' }}>
        {photo ? (
          <img src={photo} alt={displayName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PeopleIcon sx={{ fontSize: 40, color: '#cbd5e1' }} />
          </Box>
        )}
        <Chip
          label={STATUS_LABEL[student.card_status]}
          color={STATUS_COLOR[student.card_status]}
          size="small"
          sx={{ position: 'absolute', top: 6, right: 6, height: 18, fontSize: '0.6rem' }}
        />
      </Box>

      <Box>
        <Typography fontWeight={600} fontSize="0.8rem" noWrap>{displayName}</Typography>
        <Typography variant="caption" color="text.secondary">
          {student.class_name}{student.section ? ` - ${student.section}` : ''} · Roll {student.roll_number || '—'}
        </Typography>
      </Box>

      {tab === 0 && (
        <Stack direction="row" flexWrap="wrap" gap={0.5}>
          <Tooltip title="Upload photo">
            <IconButton size="small" component="label">
              <UploadFileIcon fontSize="small" />
              <input hidden type="file" accept="image/*" onChange={e => onPhotoUpload(student.idcard_uuid, e.target.files[0], 'teacher')} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Webcam capture">
            <IconButton size="small" onClick={() => onWebcam(student.idcard_uuid)}>
              <PhotoCameraIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {photo && (
            <Tooltip title="Remove background">
              <IconButton size="small" onClick={handleRemoveBg} disabled={bgLoading}>
                {bgLoading ? <CircularProgress size={14} /> : <AutoFixHighIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
          {photo && student.bg_removed_url && (
            <Tooltip title={student.use_bg_removed ? 'Using BG removed' : 'Using original'}>
              <Switch size="small" checked={student.use_bg_removed}
                onChange={e => onStatusChange(student.idcard_uuid, { use_bg_removed: e.target.checked })} />
            </Tooltip>
          )}
          <Tooltip title="Share link with student">
            <IconButton size="small" onClick={() => onShare(student.idcard_uuid)} disabled={!photo}>
              <ShareIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={student.card_status === 'not_available' ? 'Mark available' : 'Mark not available'}>
            <IconButton size="small"
              onClick={() => onStatusChange(student.idcard_uuid, { card_status: student.card_status === 'not_available' ? 'pending' : 'not_available' })}
              color={student.card_status === 'not_available' ? 'error' : 'default'}>
              <BlockIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )}

      {tab === 1 && student.card_status === 'student_submitted' && (
        <Stack direction="row" spacing={0.5}>
          <Button size="small" variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => onApprove(student.idcard_uuid)}>
            Approve
          </Button>
          <Button size="small" variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => onReject(student.idcard_uuid)}>
            Reject
          </Button>
        </Stack>
      )}
    </Box>
  );
}

// ── Create Project dialog ─────────────────────────────────────────────────────
function CreateProjectDialog({ open, onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [year, setYear] = useState(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
  const [sigUrl, setSigUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  async function uploadSig(file) {
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await apiClient.post('/api/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSigUrl(res.data.url || '');
    } catch { }
    setUploading(false);
  }

  function handleClose() {
    setTitle(''); setYear(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
    setSigUrl(''); onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Create New ID Card Project</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Project Title *" value={title} onChange={e => setTitle(e.target.value)} size="small" fullWidth placeholder="e.g. 2025-26 Student ID Cards" />
          <TextField label="Academic Year" value={year} onChange={e => setYear(e.target.value)} size="small" fullWidth />
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Principal Signature (PNG preferred)</Typography>
            <Button variant="outlined" size="small" component="label" startIcon={uploading ? <CircularProgress size={14} /> : <UploadFileIcon />} disabled={uploading}>
              {sigUrl ? 'Change Signature' : 'Upload Signature'}
              <input hidden type="file" accept="image/*" onChange={e => uploadSig(e.target.files[0])} />
            </Button>
            {sigUrl && <img src={sigUrl} alt="sig" style={{ height: 40, marginLeft: 12, verticalAlign: 'middle', objectFit: 'contain' }} />}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" disabled={!title} onClick={() => onSave({ title, academic_year: year, principal_signature_url: sigUrl })}>
          Create Project
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Add Single Student dialog ─────────────────────────────────────────────────
function AddSingleStudentDialog({ open, onSave, onClose, batches = [] }) {
  const [form, setForm] = useState({ student_name: '', class_name: '', section: '', roll_number: '' });

  function handleClose() { setForm({ student_name: '', class_name: '', section: '', roll_number: '' }); onClose(); }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Add Single Student</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Student Name *" value={form.student_name} onChange={e => setForm(f => ({ ...f, student_name: e.target.value }))} size="small" fullWidth />
          <Stack direction="row" spacing={1.5}>
            {batches.length > 0 ? (
              <Select
                value={form.class_name}
                onChange={e => setForm(f => ({ ...f, class_name: e.target.value }))}
                size="small" fullWidth displayEmpty
              >
                <MenuItem value=""><em style={{ color: '#94a3b8' }}>Select Class / Batch *</em></MenuItem>
                {batches.map(b => (
                  <MenuItem key={b._id || b.Batch_uuid} value={b.name}>
                    {b.name}{b.timing ? ` — ${b.timing}` : ''}
                  </MenuItem>
                ))}
              </Select>
            ) : (
              <TextField label="Class *" value={form.class_name} onChange={e => setForm(f => ({ ...f, class_name: e.target.value }))} size="small" fullWidth placeholder="e.g. Class 2" />
            )}
            <TextField label="Section" value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} size="small" fullWidth />
          </Stack>
          <TextField label="Roll Number" value={form.roll_number} onChange={e => setForm(f => ({ ...f, roll_number: e.target.value }))} size="small" fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" disabled={!form.student_name || !form.class_name} onClick={() => onSave(form)}>
          Add Student
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ label, value, color = 'text.primary', bg = '#f8fafc' }) {
  return (
    <Box sx={{ bgcolor: bg, borderRadius: 2, px: 2, py: 1, minWidth: 80, textAlign: 'center', border: '1px solid #e2e8f0' }}>
      <Typography fontWeight={700} color={color} fontSize="1.1rem">{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function IDCardManager() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [tab, setTab] = useState(0);
  const [classFilter, setClassFilter] = useState('');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [createDialog, setCreateDialog] = useState(false);
  const [addSingleDialog, setAddSingleDialog] = useState(false);
  const [bulkDialog, setBulkDialog] = useState(false);
  const [excelDialog, setExcelDialog] = useState(false);
  const [webcamTarget, setWebcamTarget] = useState(null);
  const [linkDialog, setLinkDialog] = useState(null);
  const [bulkClass, setBulkClass] = useState('');
  const [bulkUploading, setBulkUploading] = useState(false);
  const [excelRows, setExcelRows] = useState([]);
  const [excelPreview, setExcelPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const navigate = useNavigate();
  const instituteUuid = localStorage.getItem('institute_uuid');
  const username = localStorage.getItem('login_username') || 'admin';

  function showAlert(type, text) { setAlert({ type, text }); setTimeout(() => setAlert(null), 5000); }

  async function loadProjects() {
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/idcard/projects?institute_uuid=${instituteUuid}`);
      setProjects(res.data.result || []);
    } catch { showAlert('error', 'Failed to load projects'); }
    finally { setLoading(false); }
  }

  async function loadStudents(projectUuid, cls = classFilter) {
    setStudentsLoading(true);
    try {
      const params = new URLSearchParams();
      if (cls) params.set('class_name', cls);
      const tabStatus = tab === 1 ? 'student_submitted' : tab === 2 ? 'approved' : '';
      if (tabStatus) params.set('card_status', tabStatus);
      const res = await apiClient.get(`/api/idcard/projects/${projectUuid}/students?${params}`);
      const list = res.data.result || [];
      setStudents(list);
      const uniqueClasses = [...new Set(list.map(s => s.class_name).filter(Boolean))].sort();
      if (!cls) setClasses(uniqueClasses);
    } catch { showAlert('error', 'Failed to load students'); }
    finally { setStudentsLoading(false); }
  }

  useEffect(() => {
    loadProjects();
    const uuid = instituteUuid;
    if (uuid) {
      apiClient.get(`/api/batches?institute_uuid=${uuid}`)
        .then(r => {
          const list = Array.isArray(r.data) ? r.data : (r.data?.result || r.data?.data || []);
          setBatches(list);
        })
        .catch(() => {});
    }
  }, []);
  useEffect(() => {
    if (selectedProject) loadStudents(selectedProject.project_uuid, classFilter);
  }, [selectedProject, classFilter, tab]);

  async function createProject(data) {
    try {
      const res = await apiClient.post('/api/idcard/projects', { ...data, institute_uuid: instituteUuid, createdBy: username });
      setCreateDialog(false);
      showAlert('success', 'Project created!');
      setProjects(p => [res.data.result, ...p]);
    } catch (err) { showAlert('error', err.response?.data?.message || 'Failed'); }
  }

  async function addSingleStudent(data) {
    try {
      await apiClient.post(`/api/idcard/projects/${selectedProject.project_uuid}/students`, { students: [data] });
      setAddSingleDialog(false);
      showAlert('success', 'Student added!');
      loadStudents(selectedProject.project_uuid);
    } catch (err) { showAlert('error', err.response?.data?.message || 'Failed'); }
  }

  function parseExcel(file) {
    const reader = new FileReader();
    reader.onload = e => {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      setExcelRows(rows);
      setExcelPreview(rows.slice(0, 5));
      setExcelDialog(true);
    };
    reader.readAsArrayBuffer(file);
  }

  async function importStudents() {
    setImporting(true);
    try {
      const res = await apiClient.post(`/api/idcard/projects/${selectedProject.project_uuid}/students`, { students: excelRows });
      setExcelDialog(false);
      setExcelRows([]);
      showAlert('success', `Imported ${res.data.count} students!`);
      loadStudents(selectedProject.project_uuid);
    } catch (err) { showAlert('error', err.response?.data?.message || 'Import failed'); }
    finally { setImporting(false); }
  }

  async function uploadPhoto(idcardUuid, file, source = 'teacher') {
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    fd.append('source', source);
    try {
      await apiClient.post(`/api/idcard/students/${idcardUuid}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showAlert('success', 'Photo updated');
      loadStudents(selectedProject.project_uuid);
    } catch { showAlert('error', 'Photo upload failed'); }
  }

  async function handleWebcamCapture(blob) {
    if (!webcamTarget) return;
    const file = new File([blob], 'webcam.jpg', { type: 'image/jpeg' });
    await uploadPhoto(webcamTarget, file, 'webcam');
    setWebcamTarget(null);
  }

  async function bulkUpload(files) {
    setBulkUploading(true);
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append('photos', f));
    if (bulkClass) fd.append('class_name', bulkClass);
    try {
      const res = await apiClient.post(`/api/idcard/projects/${selectedProject.project_uuid}/photos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setBulkDialog(false);
      showAlert('success', `Matched ${res.data.matched} / ${res.data.matched + res.data.unmatched} photos`);
      loadStudents(selectedProject.project_uuid);
    } catch { showAlert('error', 'Bulk upload failed'); }
    finally { setBulkUploading(false); }
  }

  async function removeBg(idcardUuid) {
    try {
      const res = await apiClient.post(`/api/idcard/students/${idcardUuid}/remove-bg`);
      showAlert('success', 'Background removed!');
      setStudents(p => p.map(s => s.idcard_uuid === idcardUuid ? { ...s, bg_removed_url: res.data.bg_removed_url, use_bg_removed: true } : s));
    } catch (err) { showAlert('error', err.response?.data?.message || 'BG removal failed'); }
  }

  async function updateStatus(idcardUuid, update) {
    try {
      await apiClient.put(`/api/idcard/students/${idcardUuid}/status`, update);
      setStudents(p => p.map(s => s.idcard_uuid === idcardUuid ? { ...s, ...update } : s));
    } catch { showAlert('error', 'Update failed'); }
  }

  async function shareLink(idcardUuid) {
    try {
      const res = await apiClient.post(`/api/idcard/students/${idcardUuid}/magic-link`);
      setLinkDialog({ link: res.data.link });
    } catch { showAlert('error', 'Failed to generate link'); }
  }

  async function approveStudent(idcardUuid) {
    try {
      await apiClient.put(`/api/idcard/students/${idcardUuid}/approve`, { approved_by: username });
      showAlert('success', 'Approved!');
      loadStudents(selectedProject.project_uuid);
    } catch { showAlert('error', 'Approve failed'); }
  }

  async function rejectStudent(idcardUuid) {
    try {
      await apiClient.put(`/api/idcard/students/${idcardUuid}/reject`);
      showAlert('success', 'Sent back for revision');
      loadStudents(selectedProject.project_uuid);
    } catch { showAlert('error', 'Reject failed'); }
  }

  function handleModeClick(key) {
    if (!selectedProject) { showAlert('info', 'Please open or create a project first.'); return; }
    if (key === 'single') setAddSingleDialog(true);
    else if (key === 'bulk') setBulkDialog(true);
    else if (key === 'excel') document.getElementById('excel-file-input')?.click();
    else if (key === 'classbatch') setClassFilter(classes[0] || '');
  }

  const filteredStudents = tab === 1
    ? students.filter(s => s.card_status === 'student_submitted')
    : tab === 2
    ? students.filter(s => s.card_status === 'approved')
    : students;

  const photoReady = students.filter(s => s.photo_url).length;
  const missing = students.filter(s => !s.photo_url && s.card_status !== 'not_available').length;
  const approved = students.filter(s => s.card_status === 'approved').length;
  const submitted = students.filter(s => s.card_status === 'student_submitted').length;
  const notAvailable = students.filter(s => s.card_status === 'not_available').length;

  // ── Landing / Projects list ────────────────────────────────────────────────
  if (!selectedProject) {
    return (
      <Box>
        {alert && <Alert severity={alert.type} sx={{ mb: 2 }} onClose={() => setAlert(null)}>{alert.text}</Alert>}

        {/* Hero banner */}
        <Box sx={{
          background: 'linear-gradient(135deg, #064e3b 0%, #059669 60%, #34d399 100%)',
          borderRadius: 3, p: { xs: 3, md: 4 }, mb: 3, color: '#fff', position: 'relative', overflow: 'hidden',
        }}>
          <Box sx={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <Box sx={{ position: 'absolute', bottom: -20, right: 60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
                <BadgeIcon sx={{ fontSize: 28 }} />
                <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">ID Card Maker</Typography>
              </Stack>
              <Typography sx={{ opacity: 0.85, fontSize: '0.93rem', maxWidth: 520 }}>
                Create professional student ID cards — single, bulk, class-wise, or from Excel/CSV. Perfect for school &amp; college re-opening season.
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialog(true)}
              sx={{ bgcolor: '#fff', color: '#059669', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0, '&:hover': { bgcolor: '#f0fdf4' } }}
            >
              New Project
            </Button>
          </Stack>
        </Box>

        {/* 4 creation mode cards */}
        <Typography variant="subtitle1" fontWeight={700} color="text.primary" mb={1.5}>
          How would you like to create ID cards?
        </Typography>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2, mb: 4,
        }}>
          {MODE_CARDS.map(m => (
            <Paper
              key={m.key}
              variant="outlined"
              onClick={() => handleModeClick(m.key)}
              sx={{
                borderRadius: 2.5, overflow: 'hidden', cursor: 'pointer',
                transition: 'all 0.18s', border: '1.5px solid #e2e8f0',
                '&:hover': { boxShadow: `0 4px 20px ${m.color}33`, borderColor: m.color, transform: 'translateY(-2px)' },
              }}
            >
              <Box sx={{ background: m.bg, px: 2.5, py: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: m.iconBg, width: 48, height: 48, color: '#fff' }}>
                  {m.icon}
                </Avatar>
                <Box>
                  <Typography fontWeight={700} fontSize="0.92rem" color={m.color}>{m.title}</Typography>
                  <Typography variant="caption" color="text.secondary" lineHeight={1.4}>{m.desc}</Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: m.color }}>
                  <Typography variant="caption" fontWeight={600}>Get started</Typography>
                  <ChevronRightIcon sx={{ fontSize: 14 }} />
                </Stack>
              </Box>
            </Paper>
          ))}
        </Box>

        {/* Projects list */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1" fontWeight={700}>My Projects</Typography>
          <Chip label={`${projects.length} project${projects.length !== 1 ? 's' : ''}`} size="small" variant="outlined" />
        </Stack>

        {loading ? (
          <Box textAlign="center" py={6}><CircularProgress /></Box>
        ) : projects.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, border: '2px dashed #e2e8f0', borderRadius: 3 }}>
            <BadgeIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
            <Typography color="text.secondary" mb={2}>No projects yet. Create your first ID card project to get started.</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialog(true)}>Create Project</Button>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)' }, gap: 2 }}>
            {projects.map(p => (
              <Paper
                key={p.project_uuid} variant="outlined"
                sx={{ borderRadius: 2.5, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s', '&:hover': { boxShadow: 4, borderColor: '#059669' } }}
                onClick={() => setSelectedProject(p)}
              >
                <Box sx={{ height: 5, background: p.status === 'active' ? 'linear-gradient(90deg,#059669,#34d399)' : '#e2e8f0' }} />
                <Box sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Box flex={1} mr={1}>
                      <Typography fontWeight={700} fontSize="0.97rem">{p.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{p.academic_year}</Typography>
                    </Box>
                    <Chip size="small" label={p.status === 'active' ? 'Active' : 'Completed'} color={p.status === 'active' ? 'success' : 'default'} />
                  </Stack>
                  {p.principal_signature_url && (
                    <Box mt={1.5} p={1} bgcolor="#f8fafc" borderRadius={1}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Principal Signature</Typography>
                      <img src={p.principal_signature_url} alt="sig" style={{ height: 28, objectFit: 'contain' }} />
                    </Box>
                  )}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5} color="primary.main">
                      <Typography variant="caption" fontWeight={600}>Open</Typography>
                      <ChevronRightIcon sx={{ fontSize: 14 }} />
                    </Stack>
                  </Stack>
                </Box>
              </Paper>
            ))}
          </Box>
        )}

        <CreateProjectDialog open={createDialog} onSave={createProject} onClose={() => setCreateDialog(false)} />
      </Box>
    );
  }

  // ── Project detail view ──────────────────────────────────────────────────────
  return (
    <Box>
      {alert && <Alert severity={alert.type} sx={{ mb: 2 }} onClose={() => setAlert(null)}>{alert.text}</Alert>}

      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
        <IconButton size="small" onClick={() => { setSelectedProject(null); setStudents([]); setClasses([]); setClassFilter(''); setTab(0); }}>
          <ArrowBackIcon />
        </IconButton>
        <Box flex={1}>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>{selectedProject.title}</Typography>
          <Typography variant="caption" color="text.secondary">{selectedProject.academic_year} · {students.length} students</Typography>
        </Box>
        <Chip size="small" label={selectedProject.status === 'active' ? 'Active' : 'Completed'} color={selectedProject.status === 'active' ? 'success' : 'default'} />
      </Stack>

      {/* 4 Action cards */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
        gap: 1.5, mb: 3,
      }}>
        {/* Single card */}
        <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, cursor: 'pointer', border: '1.5px solid #e0f2fe', bgcolor: '#f0f9ff', '&:hover': { boxShadow: 2, borderColor: '#0ea5e9' } }}
          onClick={() => setAddSingleDialog(true)}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: '#0ea5e9', width: 36, height: 36 }}><PersonAddIcon sx={{ fontSize: 18 }} /></Avatar>
            <Box>
              <Typography fontWeight={700} fontSize="0.82rem" color="#0369a1">Single Card</Typography>
              <Typography variant="caption" color="text.secondary">Add one student</Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Bulk photos */}
        <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, cursor: 'pointer', border: '1.5px solid #ede9fe', bgcolor: '#faf5ff', '&:hover': { boxShadow: 2, borderColor: '#8b5cf6' } }}
          onClick={() => setBulkDialog(true)}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: '#8b5cf6', width: 36, height: 36 }}><PhotoLibraryIcon sx={{ fontSize: 18 }} /></Avatar>
            <Box>
              <Typography fontWeight={700} fontSize="0.82rem" color="#6d28d9">Bulk Photos</Typography>
              <Typography variant="caption" color="text.secondary">Upload all at once</Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Excel / CSV */}
        <Paper variant="outlined" component="label" sx={{ borderRadius: 2, p: 2, cursor: 'pointer', border: '1.5px solid #d1fae5', bgcolor: '#f0fdf4', '&:hover': { boxShadow: 2, borderColor: '#10b981' } }}>
          <input id="excel-file-input" hidden type="file" accept=".xlsx,.xls,.csv" onChange={e => parseExcel(e.target.files[0])} />
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: '#10b981', width: 36, height: 36 }}><TableChartIcon sx={{ fontSize: 18 }} /></Avatar>
            <Box>
              <Typography fontWeight={700} fontSize="0.82rem" color="#065f46">Excel / CSV</Typography>
              <Typography variant="caption" color="text.secondary">Import from file</Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Print */}
        <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, cursor: 'pointer', border: '1.5px solid #fef3c7', bgcolor: '#fffbeb', '&:hover': { boxShadow: 2, borderColor: '#f59e0b' } }}
          onClick={() => navigate(`/${username}/idcard/${selectedProject.project_uuid}/print`)}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: '#f59e0b', width: 36, height: 36 }}><PrintIcon sx={{ fontSize: 18 }} /></Avatar>
            <Box>
              <Typography fontWeight={700} fontSize="0.82rem" color="#92400e">Print Cards</Typography>
              <Typography variant="caption" color="text.secondary">Print / export PDF</Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>

      {/* Stats row */}
      <Stack direction="row" spacing={1.5} mb={3} flexWrap="wrap" useFlexGap>
        <StatPill label="Total" value={students.length} />
        <StatPill label="Photo Ready" value={photoReady} color="success.main" bg="#f0fdf4" />
        <StatPill label="Missing Photo" value={missing} color="error.main" bg="#fef2f2" />
        <StatPill label="Submitted" value={submitted} color="warning.main" bg="#fffbeb" />
        <StatPill label="Approved" value={approved} color="primary.main" bg="#eff6ff" />
        <StatPill label="Not Available" value={notAvailable} color="text.secondary" />
      </Stack>

      {/* Photo progress bar */}
      {students.length > 0 && (
        <Box mb={2.5}>
          <Stack direction="row" justifyContent="space-between" mb={0.5}>
            <Typography variant="caption" color="text.secondary">Photo completion</Typography>
            <Typography variant="caption" fontWeight={600} color="success.main">{Math.round((photoReady / students.length) * 100)}%</Typography>
          </Stack>
          <LinearProgress variant="determinate" value={(photoReady / students.length) * 100} sx={{ height: 6, borderRadius: 3, bgcolor: '#e2e8f0' }} color="success" />
        </Box>
      )}

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: '1px solid #e2e8f0' }}>
        <Tab label={`All Students (${students.length})`} />
        <Tab label={submitted > 0 ? `Approvals (${submitted})` : 'Approvals'} />
        <Tab label={approved > 0 ? `Print Ready (${approved})` : 'Print Ready'} />
      </Tabs>

      {/* Class / Batch filter */}
      {classes.length > 0 && (
        <Box mb={2}>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="center">
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mr: 0.5 }}>
              <FilterListIcon sx={{ fontSize: 13, mr: 0.25, verticalAlign: 'middle' }} />
              Class / Batch:
            </Typography>
            <Chip label="All" onClick={() => setClassFilter('')} color={!classFilter ? 'primary' : 'default'} variant={!classFilter ? 'filled' : 'outlined'} size="small" />
            {classes.map(c => (
              <Chip key={c} label={c} onClick={() => setClassFilter(c === classFilter ? '' : c)} color={classFilter === c ? 'primary' : 'default'} variant={classFilter === c ? 'filled' : 'outlined'} size="small" />
            ))}
          </Stack>
        </Box>
      )}

      {/* Student grid */}
      {studentsLoading ? (
        <Box textAlign="center" py={6}><CircularProgress /></Box>
      ) : filteredStudents.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, border: '2px dashed #e2e8f0', borderRadius: 3 }}>
          <PeopleIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
          <Typography color="text.secondary" mb={2}>
            {tab === 1 ? 'No pending approvals.' : tab === 2 ? 'No approved cards yet.' : 'No students yet. Use the options above to add students.'}
          </Typography>
          {tab === 0 && (
            <Stack direction="row" spacing={1.5} justifyContent="center">
              <Button size="small" variant="outlined" startIcon={<PersonAddIcon />} onClick={() => setAddSingleDialog(true)}>Add Single</Button>
              <Button size="small" variant="outlined" component="label" startIcon={<TableChartIcon />}>
                Import Excel
                <input hidden type="file" accept=".xlsx,.xls,.csv" onChange={e => parseExcel(e.target.files[0])} />
              </Button>
            </Stack>
          )}
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)', md: 'repeat(4,1fr)', lg: 'repeat(5,1fr)', xl: 'repeat(6,1fr)' }, gap: 1.5 }}>
          {filteredStudents.map(s => (
            <StudentCard
              key={s.idcard_uuid}
              student={s}
              tab={tab}
              onPhotoUpload={uploadPhoto}
              onWebcam={uuid => setWebcamTarget(uuid)}
              onRemoveBg={removeBg}
              onStatusChange={updateStatus}
              onShare={shareLink}
              onApprove={approveStudent}
              onReject={rejectStudent}
            />
          ))}
        </Box>
      )}

      {/* Webcam */}
      <WebcamDialog open={!!webcamTarget} onCapture={handleWebcamCapture} onClose={() => setWebcamTarget(null)} />

      {/* Add single student dialog */}
      <AddSingleStudentDialog open={addSingleDialog} onSave={addSingleStudent} onClose={() => setAddSingleDialog(false)} batches={batches} />

      {/* Bulk photo upload dialog */}
      <Dialog open={bulkDialog} onClose={() => setBulkDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Bulk Photo Upload</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ fontSize: '0.78rem' }}>
              Photos are auto-matched by filename = roll number (e.g. <strong>01.jpg</strong>) or student name. Upload one class at a time for best results.
            </Alert>
            {(classes.length > 0 || batches.length > 0) && (
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Filter by Class / Batch (optional)</Typography>
                <Select value={bulkClass} onChange={e => setBulkClass(e.target.value)} size="small" displayEmpty fullWidth>
                  <MenuItem value="">All Classes</MenuItem>
                  {(classes.length > 0 ? classes : batches.map(b => b.name)).map(c => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </Box>
            )}
            <Button variant="outlined" component="label" startIcon={bulkUploading ? <CircularProgress size={16} /> : <UploadFileIcon />} disabled={bulkUploading} size="large">
              {bulkUploading ? 'Uploading…' : 'Select Photos'}
              <input hidden type="file" accept="image/*" multiple onChange={e => bulkUpload(e.target.files)} />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setBulkDialog(false)}>Close</Button></DialogActions>
      </Dialog>

      {/* Excel preview dialog */}
      <Dialog open={excelDialog} onClose={() => setExcelDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Import Students — Preview
          <Chip label={`${excelRows.length} rows`} size="small" sx={{ ml: 1.5 }} color="primary" />
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2, fontSize: '0.78rem' }}>
            Columns auto-detected: <strong>student_name, roll_number, class, section</strong>. All other columns are stored as extra fields.
          </Alert>
          {excelPreview.length > 0 && (
            <Box sx={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 1 }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    {Object.keys(excelPreview[0]).map(k => <th key={k} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>{k}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {excelPreview.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      {Object.values(row).map((v, j) => <td key={j} style={{ padding: '6px 12px', borderBottom: '1px solid #f1f5f9' }}>{String(v)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              {excelRows.length > 5 && (
                <Box sx={{ px: 2, py: 1, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" color="text.secondary">…and {excelRows.length - 5} more rows</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExcelDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={importStudents} disabled={importing} startIcon={importing ? <CircularProgress size={16} /> : <DownloadIcon />}>
            {importing ? 'Importing…' : `Import ${excelRows.length} Students`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Magic link dialog */}
      <Dialog open={!!linkDialog} onClose={() => setLinkDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Student Self-Edit Link</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>Link generated! Share this with the student so they can upload their own photo.</Alert>
          <Box sx={{ bgcolor: '#f8fafc', borderRadius: 1, p: 1.5, wordBreak: 'break-all', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>
            {linkDialog?.link}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button startIcon={<ContentCopyIcon />} onClick={() => { navigator.clipboard.writeText(linkDialog?.link); showAlert('success', 'Copied!'); }}>
            Copy Link
          </Button>
          <Button onClick={() => setLinkDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
