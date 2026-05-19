import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControlLabel, IconButton,
  MenuItem, Select, Stack, Switch, Tab, Tabs, TextField, Tooltip,
  Typography, Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
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
    <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.5, bgcolor: '#fff', display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* Photo */}
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

      {/* Info */}
      <Box>
        <Typography fontWeight={600} fontSize="0.8rem" noWrap>{displayName}</Typography>
        <Typography variant="caption" color="text.secondary">
          {student.class_name}{student.section ? ` - ${student.section}` : ''} · Roll {student.roll_number || '—'}
        </Typography>
      </Box>

      {/* Actions */}
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

// ── Create Project dialog ──────────────────────────────────────────────────────
function CreateProjectDialog({ open, onSave, onClose, instituteUuid }) {
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Create ID Card Project</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Project Title *" value={title} onChange={e => setTitle(e.target.value)} size="small" fullWidth placeholder="e.g. 2024-25 Student ID Cards" />
          <TextField label="Academic Year" value={year} onChange={e => setYear(e.target.value)} size="small" fullWidth />
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Principal Signature (PNG)</Typography>
            <Button variant="outlined" size="small" component="label" startIcon={uploading ? <CircularProgress size={14} /> : <UploadFileIcon />} disabled={uploading}>
              {sigUrl ? 'Change Signature' : 'Upload Signature'}
              <input hidden type="file" accept="image/*" onChange={e => uploadSig(e.target.files[0])} />
            </Button>
            {sigUrl && <img src={sigUrl} alt="sig" style={{ height: 40, marginLeft: 12, verticalAlign: 'middle', objectFit: 'contain' }} />}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!title} onClick={() => onSave({ title, academic_year: year, principal_signature_url: sigUrl })}>Create</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function IDCardManager() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [students, setStudents] = useState([]);
  const [tab, setTab] = useState(0); // 0=students 1=approvals 2=print
  const [classFilter, setClassFilter] = useState('');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [createDialog, setCreateDialog] = useState(false);
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

  // Load projects
  async function loadProjects() {
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/idcard/projects?institute_uuid=${instituteUuid}`);
      setProjects(res.data.result || []);
    } catch { showAlert('error', 'Failed to load projects'); }
    finally { setLoading(false); }
  }

  // Load students for selected project
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

  useEffect(() => { loadProjects(); }, []);

  useEffect(() => {
    if (selectedProject) loadStudents(selectedProject.project_uuid, classFilter);
  }, [selectedProject, classFilter, tab]);

  // Create project
  async function createProject(data) {
    try {
      const res = await apiClient.post('/api/idcard/projects', { ...data, institute_uuid: instituteUuid, createdBy: username });
      setCreateDialog(false);
      showAlert('success', 'Project created!');
      setProjects(p => [res.data.result, ...p]);
    } catch (err) { showAlert('error', err.response?.data?.message || 'Failed'); }
  }

  // Excel parse
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

  // Import students
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

  // Single photo upload
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

  // Webcam capture
  async function handleWebcamCapture(blob) {
    if (!webcamTarget) return;
    const file = new File([blob], 'webcam.jpg', { type: 'image/jpeg' });
    await uploadPhoto(webcamTarget, file, 'webcam');
    setWebcamTarget(null);
  }

  // Bulk photo upload
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

  // Remove BG
  async function removeBg(idcardUuid) {
    try {
      const res = await apiClient.post(`/api/idcard/students/${idcardUuid}/remove-bg`);
      showAlert('success', 'Background removed!');
      setStudents(p => p.map(s => s.idcard_uuid === idcardUuid ? { ...s, bg_removed_url: res.data.bg_removed_url, use_bg_removed: true } : s));
    } catch (err) { showAlert('error', err.response?.data?.message || 'BG removal failed'); }
  }

  // Status change
  async function updateStatus(idcardUuid, update) {
    try {
      await apiClient.put(`/api/idcard/students/${idcardUuid}/status`, update);
      setStudents(p => p.map(s => s.idcard_uuid === idcardUuid ? { ...s, ...update } : s));
    } catch { showAlert('error', 'Update failed'); }
  }

  // Share magic link
  async function shareLink(idcardUuid) {
    try {
      const res = await apiClient.post(`/api/idcard/students/${idcardUuid}/magic-link`);
      setLinkDialog({ link: res.data.link });
    } catch { showAlert('error', 'Failed to generate link'); }
  }

  // Approve / Reject
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

  const filteredStudents = tab === 1
    ? students.filter(s => s.card_status === 'student_submitted')
    : tab === 2
    ? students.filter(s => s.card_status === 'approved')
    : students;

  // ── Projects list ────────────────────────────────────────────────────────────
  if (!selectedProject) {
    return (
      <Box>
        {alert && <Alert severity={alert.type} sx={{ mb: 2 }} onClose={() => setAlert(null)}>{alert.text}</Alert>}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h6" fontWeight={700}>ID Card Manager</Typography>
            <Typography variant="caption" color="text.secondary">Create and manage student ID card projects</Typography>
          </Box>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setCreateDialog(true)}>New Project</Button>
        </Stack>

        {loading ? <Box textAlign="center" py={6}><CircularProgress /></Box> : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)' }, gap: 2 }}>
            {projects.map(p => (
              <Paper key={p.project_uuid} variant="outlined" sx={{ p: 2, borderRadius: 2, cursor: 'pointer', '&:hover': { boxShadow: 3 } }} onClick={() => setSelectedProject(p)}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography fontWeight={700}>{p.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{p.academic_year}</Typography>
                  </Box>
                  <Chip size="small" label={p.status} color={p.status === 'active' ? 'success' : 'default'} />
                </Stack>
                {p.principal_signature_url && (
                  <Box mt={1.5}>
                    <Typography variant="caption" color="text.secondary">Principal Signature</Typography>
                    <img src={p.principal_signature_url} alt="sig" style={{ height: 32, display: 'block', objectFit: 'contain' }} />
                  </Box>
                )}
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  Created {new Date(p.createdAt).toLocaleDateString()}
                </Typography>
              </Paper>
            ))}
            {projects.length === 0 && (
              <Box sx={{ gridColumn: '1/-1', textAlign: 'center', py: 6 }}>
                <Typography color="text.secondary">No projects yet. Create your first ID card project.</Typography>
              </Box>
            )}
          </Box>
        )}

        <CreateProjectDialog open={createDialog} onSave={createProject} onClose={() => setCreateDialog(false)} />
      </Box>
    );
  }

  // ── Project detail view ───────────────────────────────────────────────────────
  return (
    <Box>
      {alert && <Alert severity={alert.type} sx={{ mb: 2 }} onClose={() => setAlert(null)}>{alert.text}</Alert>}

      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <IconButton size="small" onClick={() => setSelectedProject(null)}><ArrowBackIcon /></IconButton>
        <Box flex={1}>
          <Typography variant="h6" fontWeight={700}>{selectedProject.title}</Typography>
          <Typography variant="caption" color="text.secondary">{selectedProject.academic_year}</Typography>
        </Box>
        <Button size="small" variant="outlined" startIcon={<UploadFileIcon />} component="label">
          Import Excel
          <input hidden type="file" accept=".xlsx,.xls,.csv" onChange={e => parseExcel(e.target.files[0])} />
        </Button>
        <Button size="small" variant="outlined" startIcon={<PhotoCameraIcon />} onClick={() => setBulkDialog(true)}>
          Bulk Photos
        </Button>
        <Button size="small" variant="contained" startIcon={<PrintIcon />}
          onClick={() => navigate(`/${username}/idcard/${selectedProject.project_uuid}/print`)}>
          Print
        </Button>
      </Stack>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`All Students (${students.length})`} />
        <Tab label={`Approvals (${students.filter(s => s.card_status === 'student_submitted').length})`} />
        <Tab label={`Print Ready (${students.filter(s => s.card_status === 'approved').length})`} />
      </Tabs>

      {/* Class filter */}
      {tab === 0 && classes.length > 0 && (
        <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
          <Chip label="All" onClick={() => setClassFilter('')} color={!classFilter ? 'primary' : 'default'} variant={!classFilter ? 'filled' : 'outlined'} size="small" icon={<FilterListIcon />} />
          {classes.map(c => (
            <Chip key={c} label={c} onClick={() => setClassFilter(c === classFilter ? '' : c)} color={classFilter === c ? 'primary' : 'default'} variant={classFilter === c ? 'filled' : 'outlined'} size="small" />
          ))}
        </Stack>
      )}

      {/* Stats row */}
      {tab === 0 && (
        <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
          {[
            { label: 'Total', val: students.length, color: 'text.primary' },
            { label: 'Photo Ready', val: students.filter(s => s.photo_url).length, color: 'success.main' },
            { label: 'Missing Photo', val: students.filter(s => !s.photo_url && s.card_status !== 'not_available').length, color: 'error.main' },
            { label: 'Not Available', val: students.filter(s => s.card_status === 'not_available').length, color: 'text.secondary' },
            { label: 'Approved', val: students.filter(s => s.card_status === 'approved').length, color: 'primary.main' },
          ].map(({ label, val, color }) => (
            <Box key={label} sx={{ bgcolor: '#f8fafc', borderRadius: 2, px: 2, py: 1, minWidth: 80, textAlign: 'center' }}>
              <Typography fontWeight={700} color={color}>{val}</Typography>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Box>
          ))}
        </Stack>
      )}

      {/* Student grid */}
      {studentsLoading ? (
        <Box textAlign="center" py={6}><CircularProgress /></Box>
      ) : filteredStudents.length === 0 ? (
        <Box textAlign="center" py={6}>
          <Typography color="text.secondary">
            {tab === 1 ? 'No pending approvals.' : tab === 2 ? 'No approved cards yet.' : 'No students. Import an Excel file to get started.'}
          </Typography>
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

      {/* Bulk upload dialog */}
      <Dialog open={bulkDialog} onClose={() => setBulkDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Bulk Photo Upload</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ fontSize: '0.78rem' }}>
              Photos are auto-matched by filename = roll number (e.g. 01.jpg) or student name. Upload one class at a time for best results.
            </Alert>
            {classes.length > 0 && (
              <Select value={bulkClass} onChange={e => setBulkClass(e.target.value)} size="small" displayEmpty>
                <MenuItem value="">All Classes</MenuItem>
                {classes.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            )}
            <Button variant="outlined" component="label" startIcon={bulkUploading ? <CircularProgress size={16} /> : <UploadFileIcon />} disabled={bulkUploading}>
              {bulkUploading ? 'Uploading…' : 'Select Photos'}
              <input hidden type="file" accept="image/*" multiple onChange={e => bulkUpload(e.target.files)} />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setBulkDialog(false)}>Close</Button></DialogActions>
      </Dialog>

      {/* Excel preview dialog */}
      <Dialog open={excelDialog} onClose={() => setExcelDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import Students — Preview ({excelRows.length} rows)</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2, fontSize: '0.78rem' }}>
            System will auto-detect columns for name, roll number, class, and section. All other columns are stored as extra fields.
          </Alert>
          {excelPreview.length > 0 && (
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    {Object.keys(excelPreview[0]).map(k => <th key={k} style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{k}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {excelPreview.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((v, j) => <td key={j} style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9' }}>{String(v)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              {excelRows.length > 5 && <Typography variant="caption" color="text.secondary">…and {excelRows.length - 5} more rows</Typography>}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExcelDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={importStudents} disabled={importing}>
            {importing ? <CircularProgress size={18} /> : `Import ${excelRows.length} Students`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Magic link dialog */}
      <Dialog open={!!linkDialog} onClose={() => setLinkDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Student Self-Edit Link</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>Link generated! Share this with the student.</Alert>
          <Box sx={{ bgcolor: '#f8fafc', borderRadius: 1, p: 1.5, wordBreak: 'break-all', fontSize: '0.8rem' }}>
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
