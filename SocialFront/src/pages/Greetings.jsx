import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert, Avatar, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, IconButton, InputLabel,
  LinearProgress, MenuItem, Select, Snackbar, Stack, Tab, Tabs, TextField,
  Tooltip, Typography,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LinkIcon from '@mui/icons-material/Link';
import SendIcon from '@mui/icons-material/Send';
import FilterListIcon from '@mui/icons-material/FilterList';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CakeIcon from '@mui/icons-material/Cake';
import StarIcon from '@mui/icons-material/Star';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BroadcastOnPersonalIcon from '@mui/icons-material/BroadcastOnPersonal';
import { useApp } from '../context/AppContext';
import apiClient from '../apiClient';

const ACHIEVEMENT_TYPES = [
  { value: 'star_of_month',    label: 'Star of the Month',  icon: '🌟', color: '#f59e0b' },
  { value: 'top_performer',    label: 'Top Performer',      icon: '🏆', color: '#10b981' },
  { value: 'best_attendance',  label: 'Best Attendance',    icon: '✅', color: '#3b82f6' },
  { value: 'course_completion',label: 'Course Completion',  icon: '🎓', color: '#8b5cf6' },
  { value: 'exam_topper',      label: 'Exam Topper',        icon: '🥇', color: '#ef4444' },
  { value: 'anniversary',      label: 'Anniversary',        icon: '🎊', color: '#ec4899' },
  { value: 'custom',           label: 'Custom Award',       icon: '👏', color: '#6b7280' },
];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const GREEN = '#075E54';
const LIGHT = '#25d366';
const BG    = '#f0f2f5';

function StudentCard({ student, onSendBaileys, onOpenWA, sending }) {
  const mobile = student.mobile || student.mobileSelf || student.mobileParent;
  const hasMobile = !!mobile;

  return (
    <Box sx={{
      bgcolor: '#fff', borderRadius: 2, border: '1px solid #e9edef',
      p: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <Stack direction="row" alignItems="flex-start" spacing={1.5}>
        <Avatar sx={{ bgcolor: GREEN, width: 44, height: 44, fontSize: '1rem', fontWeight: 700, flexShrink: 0 }}>
          {(student.name || '?')[0].toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#111b21' }} noWrap>
            {student.name}
          </Typography>
          {student.course && (
            <Chip label={student.course} size="small" sx={{ fontSize: '0.65rem', height: 18, mt: 0.3, bgcolor: '#eff6ff', color: '#1d4ed8' }} />
          )}
          {student.schoolName && (
            <Typography sx={{ fontSize: '0.72rem', color: '#667781', mt: 0.3 }} noWrap>
              {student.schoolName}
            </Typography>
          )}
          {student.dob && (
            <Typography sx={{ fontSize: '0.72rem', color: '#667781' }}>
              🎂 {new Date(student.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'long' })}
            </Typography>
          )}
          {mobile && (
            <Typography sx={{ fontSize: '0.72rem', color: '#667781' }}>📱 {mobile}</Typography>
          )}
          {!hasMobile && (
            <Typography sx={{ fontSize: '0.7rem', color: '#ef4444' }}>No mobile number</Typography>
          )}
        </Box>
      </Stack>

      {/* Message preview */}
      {student.message && (
        <Box sx={{ mt: 1.5, bgcolor: '#f0fff4', borderRadius: 1.5, p: 1, borderLeft: '3px solid #25d366' }}>
          <Typography sx={{ fontSize: '0.72rem', color: '#374151', whiteSpace: 'pre-wrap', maxHeight: 80, overflow: 'hidden' }}>
            {student.message}
          </Typography>
        </Box>
      )}

      <Stack direction="row" spacing={1} mt={1.5}>
        <Button
          size="small"
          variant="contained"
          startIcon={sending === student.uuid ? <CircularProgress size={12} color="inherit" /> : <WhatsAppIcon sx={{ fontSize: 14 }} />}
          onClick={() => onSendBaileys(student)}
          disabled={!hasMobile || !!sending}
          sx={{ fontSize: '0.7rem', textTransform: 'none', bgcolor: LIGHT, '&:hover': { bgcolor: '#1ebe57' }, flex: 1 }}
        >
          Send via WA
        </Button>
        <Tooltip title="Open WhatsApp link">
          <span>
            <IconButton
              size="small"
              onClick={() => onOpenWA(student)}
              disabled={!hasMobile || !student.waLink}
              sx={{ color: GREEN, border: '1px solid #e9edef', '&:hover': { bgcolor: '#f0fff4' } }}
            >
              <LinkIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Box>
  );
}

function AchievementCard({ ach, onDelete }) {
  const typeInfo = ACHIEVEMENT_TYPES.find(t => t.value === ach.type) || ACHIEVEMENT_TYPES[ACHIEVEMENT_TYPES.length - 1];
  return (
    <Box sx={{
      bgcolor: '#fff', borderRadius: 2, border: '1px solid #e9edef',
      p: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <Stack direction="row" alignItems="flex-start" spacing={1.5}>
        <Box sx={{
          width: 44, height: 44, borderRadius: '50%', bgcolor: `${typeInfo.color}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.3rem', flexShrink: 0,
        }}>
          {typeInfo.icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#111b21' }} noWrap>
              {ach.studentName || 'Unknown'}
            </Typography>
            <IconButton size="small" onClick={() => onDelete(ach._id)} sx={{ color: '#ef4444', p: 0.25 }}>
              <DeleteIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Stack>
          <Stack direction="row" spacing={0.75} mt={0.3} flexWrap="wrap" gap={0.5}>
            <Chip label={typeInfo.label} size="small" sx={{ fontSize: '0.62rem', height: 18, bgcolor: `${typeInfo.color}22`, color: typeInfo.color }} />
            {ach.month && <Chip label={`${MONTH_NAMES[ach.month - 1]} ${ach.year || ''}`} size="small" sx={{ fontSize: '0.62rem', height: 18 }} />}
            {ach.course && <Chip label={ach.course} size="small" sx={{ fontSize: '0.62rem', height: 18, bgcolor: '#eff6ff', color: '#1d4ed8' }} />}
          </Stack>
          {ach.description && (
            <Typography sx={{ fontSize: '0.72rem', color: '#667781', mt: 0.5 }}>{ach.description}</Typography>
          )}
          {ach.mobile && (
            <Typography sx={{ fontSize: '0.68rem', color: '#667781' }}>📱 {ach.mobile}</Typography>
          )}
          {ach.messageSent && (
            <Stack direction="row" alignItems="center" spacing={0.5} mt={0.5}>
              <CheckCircleIcon sx={{ fontSize: 13, color: '#10b981' }} />
              <Typography sx={{ fontSize: '0.65rem', color: '#10b981' }}>Message sent</Typography>
            </Stack>
          )}
        </Box>
      </Stack>
    </Box>
  );
}

function FilterBar({ filters, setFilters, courses, schools, batches }) {
  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: 2, border: '1px solid #e9edef', mb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
        <FilterListIcon sx={{ fontSize: 16, color: '#667781' }} />
        <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#111b21' }}>Filters</Typography>
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 1.5 }}>
        <TextField
          label="Date"
          type="date"
          size="small"
          value={filters.date}
          onChange={e => setFilters(p => ({ ...p, date: e.target.value }))}
          InputLabelProps={{ shrink: true }}
          sx={{ '& .MuiInputLabel-root': { fontSize: '0.78rem' } }}
        />
        <FormControl size="small">
          <InputLabel sx={{ fontSize: '0.78rem' }}>Course</InputLabel>
          <Select value={filters.course} onChange={e => setFilters(p => ({ ...p, course: e.target.value }))} label="Course">
            <MenuItem value=""><em>All Courses</em></MenuItem>
            {courses.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel sx={{ fontSize: '0.78rem' }}>School</InputLabel>
          <Select value={filters.school} onChange={e => setFilters(p => ({ ...p, school: e.target.value }))} label="School">
            <MenuItem value=""><em>All Schools</em></MenuItem>
            {schools.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel sx={{ fontSize: '0.78rem' }}>Batch</InputLabel>
          <Select value={filters.batch} onChange={e => setFilters(p => ({ ...p, batch: e.target.value }))} label="Batch">
            <MenuItem value=""><em>All Batches</em></MenuItem>
            {batches.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}

function AwardDialog({ open, onClose, onAward, instituteId }) {
  const [step, setStep] = useState(0);
  const [type, setType] = useState('star_of_month');
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [description, setDescription] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) { setStep(0); setSearch(''); setSelectedStudents([]); setDescription(''); }
  }, [open]);

  useEffect(() => {
    if (!open || !instituteId) return;
    setLoadingStudents(true);
    apiClient.get(`/api/greetings/students-for-award?institute_uuid=${instituteId}&search=${search}`)
      .then(r => setStudents(r.data?.result || []))
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [open, instituteId, search]);

  function toggleStudent(uuid) {
    setSelectedStudents(p => p.includes(uuid) ? p.filter(u => u !== uuid) : [...p, uuid]);
  }

  async function handleAward() {
    if (!selectedStudents.length) return;
    setSaving(true);
    try {
      for (const uuid of selectedStudents) {
        await apiClient.post('/api/greetings/achievements', {
          institute_uuid: instituteId,
          student_uuid: uuid,
          type, description, month, year,
        });
      }
      onAward();
      onClose();
    } catch (err) {
      console.error(err);
    } finally { setSaving(false); }
  }

  const typeInfo = ACHIEVEMENT_TYPES.find(t => t.value === type);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700, color: GREEN }}>
        Award Achievement
      </DialogTitle>
      <DialogContent>
        {/* Achievement type selector */}
        <Typography sx={{ fontSize: '0.78rem', color: '#667781', mb: 1 }}>Select type</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 2 }}>
          {ACHIEVEMENT_TYPES.map(t => (
            <Box key={t.value} onClick={() => setType(t.value)}
              sx={{
                border: `2px solid ${type === t.value ? t.color : '#e9edef'}`,
                borderRadius: 1.5, p: 1, cursor: 'pointer', textAlign: 'center',
                bgcolor: type === t.value ? `${t.color}11` : '#fff',
                '&:hover': { borderColor: t.color },
              }}>
              <Typography sx={{ fontSize: '1.2rem' }}>{t.icon}</Typography>
              <Typography sx={{ fontSize: '0.62rem', fontWeight: 600, color: type === t.value ? t.color : '#667781' }}>
                {t.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Month / Year */}
        <Stack direction="row" spacing={2} mb={2}>
          <FormControl size="small" fullWidth>
            <InputLabel>Month</InputLabel>
            <Select value={month} onChange={e => setMonth(Number(e.target.value))} label="Month">
              {MONTH_NAMES.map((m, i) => <MenuItem key={m} value={i + 1}>{m}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Year" size="small" type="number" value={year} onChange={e => setYear(Number(e.target.value))} fullWidth />
        </Stack>

        {/* Description */}
        <TextField
          label="Note / Description (optional)"
          size="small" fullWidth multiline rows={2}
          value={description} onChange={e => setDescription(e.target.value)}
          sx={{ mb: 2 }}
        />

        {/* Student picker */}
        <Typography sx={{ fontSize: '0.78rem', color: '#667781', mb: 1 }}>
          Select students ({selectedStudents.length} selected)
        </Typography>
        <TextField
          placeholder="Search students…"
          size="small" fullWidth
          value={search} onChange={e => setSearch(e.target.value)}
          sx={{ mb: 1 }}
        />
        {loadingStudents && <LinearProgress sx={{ mb: 1 }} />}
        <Box sx={{ maxHeight: 240, overflowY: 'auto', border: '1px solid #e9edef', borderRadius: 1.5 }}>
          {students.map(s => (
            <Box key={s.uuid} onClick={() => toggleStudent(s.uuid)}
              sx={{
                px: 2, py: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1.5,
                bgcolor: selectedStudents.includes(s.uuid) ? '#f0fff4' : '#fff',
                borderBottom: '1px solid #f0f2f5',
                '&:hover': { bgcolor: '#f0f2f5' },
              }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: GREEN, fontSize: '0.8rem' }}>
                {s.name[0]}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 500 }} noWrap>{s.name}</Typography>
                {s.course && <Typography sx={{ fontSize: '0.68rem', color: '#667781' }}>{s.course}</Typography>}
              </Box>
              {selectedStudents.includes(s.uuid) && <CheckCircleIcon sx={{ color: LIGHT, fontSize: 18 }} />}
            </Box>
          ))}
          {!loadingStudents && students.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography sx={{ color: '#667781', fontSize: '0.8rem' }}>No students found</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: '#667781' }}>Cancel</Button>
        <Button
          onClick={handleAward}
          variant="contained"
          disabled={saving || selectedStudents.length === 0}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <EmojiEventsIcon />}
          sx={{ bgcolor: typeInfo?.color || GREEN, '&:hover': { filter: 'brightness(0.9)' } }}
        >
          {saving ? 'Awarding…' : `Award ${selectedStudents.length > 0 ? `(${selectedStudents.length})` : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function TemplateEditor({ open, onClose, instituteId }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editBody, setEditBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState(null);

  useEffect(() => {
    if (!open || !instituteId) return;
    setLoading(true);
    apiClient.get(`/api/greetings/templates?institute_uuid=${instituteId}`)
      .then(r => setTemplates(r.data?.result || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, instituteId]);

  async function save(type) {
    setSaving(true);
    try {
      await apiClient.put(`/api/greetings/templates/${type}`, { institute_uuid: instituteId, body: editBody });
      setTemplates(p => p.map(t => t.type === type ? { ...t, body: editBody, isCustom: true } : t));
      setSnack({ type: 'success', text: 'Template saved!' });
      setEditing(null);
    } catch { setSnack({ type: 'error', text: 'Save failed' }); }
    finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700, color: GREEN }}>
        Edit Greeting Templates
      </DialogTitle>
      <DialogContent>
        <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity={snack?.type || 'info'} onClose={() => setSnack(null)}>{snack?.text}</Alert>
        </Snackbar>
        {loading ? <CircularProgress size={24} /> : (
          <Stack spacing={1.5}>
            {templates.map(t => {
              const typeInfo = ACHIEVEMENT_TYPES.find(a => a.value === t.type) || { icon: '👏', label: t.type, color: '#6b7280' };
              return (
                <Box key={t.type} sx={{ border: '1px solid #e9edef', borderRadius: 2, p: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <Typography sx={{ fontSize: '1rem' }}>{typeInfo.icon}</Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.82rem', flex: 1 }}>{typeInfo.label}</Typography>
                    {t.isCustom && <Chip label="Custom" size="small" sx={{ fontSize: '0.6rem', height: 16 }} />}
                  </Stack>
                  {editing === t.type ? (
                    <Stack spacing={1}>
                      <TextField
                        multiline rows={4} size="small" fullWidth
                        value={editBody} onChange={e => setEditBody(e.target.value)}
                        placeholder="Use {{name}}, {{institute}}, {{month}}, {{year}}, {{course}}, {{exam}}, {{description}}"
                      />
                      <Typography sx={{ fontSize: '0.62rem', color: '#667781' }}>
                        Variables: {'{{name}} {{institute}} {{month}} {{year}} {{course}} {{exam}} {{description}}'}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" onClick={() => save(t.type)} disabled={saving}
                          sx={{ bgcolor: LIGHT, color: '#fff', '&:hover': { bgcolor: '#1ebe57' }, fontSize: '0.7rem' }}>
                          Save
                        </Button>
                        <Button size="small" onClick={() => setEditing(null)} sx={{ color: '#667781', fontSize: '0.7rem' }}>Cancel</Button>
                      </Stack>
                    </Stack>
                  ) : (
                    <Box sx={{ bgcolor: '#f0f2f5', borderRadius: 1, p: 1, cursor: 'pointer' }}
                      onClick={() => { setEditing(t.type); setEditBody(t.body); }}>
                      <Typography sx={{ fontSize: '0.72rem', color: '#374151', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                        "{t.body}"
                      </Typography>
                      <Typography sx={{ fontSize: '0.6rem', color: GREEN, mt: 0.5 }}>✎ Tap to edit</Typography>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: '#667781' }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Greetings() {
  const navigate = useNavigate();
  const { username } = useParams();
  const { institute, user } = useApp();
  const instituteId = institute?.institute_uuid || localStorage.getItem('institute_uuid') || '';

  const [tab, setTab] = useState(0);
  const [snack, setSnack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(null);
  const [bulkSending, setBulkSending] = useState(false);

  // Birthday tab state
  const [birthdays, setBirthdays] = useState([]);
  const [bdFilters, setBdFilters] = useState({ date: new Date().toISOString().slice(0, 10), course: '', school: '', batch: '' });

  // Achievements tab state
  const [achievements, setAchievements] = useState([]);
  const [achType, setAchType] = useState('');
  const [achMonth, setAchMonth] = useState(new Date().getMonth() + 1);
  const [achYear, setAchYear] = useState(new Date().getFullYear());
  const [achCourse, setAchCourse] = useState('');
  const [achSchool, setAchSchool] = useState('');

  // Aux data
  const [courses, setCourses] = useState([]);
  const [schools, setSchools] = useState([]);
  const [batches, setBatches] = useState([]);
  const [waConnected, setWaConnected] = useState(false);

  // Dialog states
  const [awardOpen, setAwardOpen] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);

  // Role label
  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User';

  // Load auxiliary data
  useEffect(() => {
    if (!instituteId) return;
    apiClient.get(`/api/courses?institute_uuid=${instituteId}`)
      .then(r => setCourses((r.data?.result || []).map(c => c.course_name || c.name).filter(Boolean)))
      .catch(() => {});
    apiClient.get(`/api/batches?institute_uuid=${instituteId}`)
      .then(r => setBatches((r.data?.result || []).map(b => b.batch_name).filter(Boolean)))
      .catch(() => {});
    apiClient.get(`/api/students?institute_uuid=${instituteId}&limit=500`)
      .then(r => {
        const ss = r.data?.result || [];
        const uniqueSchools = [...new Set(ss.map(s => s.schoolName).filter(Boolean))];
        setSchools(uniqueSchools);
      })
      .catch(() => {});
    apiClient.get(`/api/baileys/session/${instituteId}/status`)
      .then(r => setWaConnected(r.data?.status === 'connected'))
      .catch(() => {});
  }, [instituteId]);

  // Load birthdays
  const loadBirthdays = useCallback(() => {
    if (!instituteId) return;
    setLoading(true);
    const params = new URLSearchParams({ institute_uuid: instituteId });
    if (bdFilters.date) params.append('date', bdFilters.date);
    if (bdFilters.course) params.append('course', bdFilters.course);
    if (bdFilters.school) params.append('school', bdFilters.school);
    if (bdFilters.batch) params.append('batch', bdFilters.batch);
    apiClient.get(`/api/greetings/birthdays?${params}`)
      .then(r => setBirthdays(r.data?.result || []))
      .catch(() => setBirthdays([]))
      .finally(() => setLoading(false));
  }, [instituteId, bdFilters]);

  // Load achievements
  const loadAchievements = useCallback(() => {
    if (!instituteId) return;
    setLoading(true);
    const params = new URLSearchParams({ institute_uuid: instituteId });
    if (achType) params.append('type', achType);
    if (achMonth) params.append('month', String(achMonth));
    if (achYear) params.append('year', String(achYear));
    if (achCourse) params.append('course', achCourse);
    if (achSchool) params.append('school', achSchool);
    apiClient.get(`/api/greetings/achievements?${params}`)
      .then(r => setAchievements(r.data?.result || []))
      .catch(() => setAchievements([]))
      .finally(() => setLoading(false));
  }, [instituteId, achType, achMonth, achYear, achCourse, achSchool]);

  useEffect(() => { if (tab === 0) loadBirthdays(); }, [tab, loadBirthdays]);
  useEffect(() => { if (tab === 1) loadAchievements(); }, [tab, loadAchievements]);

  async function sendViaBaileys(student) {
    if (!waConnected) {
      setSnack({ type: 'warning', text: 'WhatsApp not connected. Go to WhatsApp Bot to connect first.' });
      return;
    }
    const mobile = student.mobile || student.mobileSelf || student.mobileParent;
    if (!mobile) return;
    setSending(student.uuid);
    try {
      await apiClient.post('/api/greetings/send-baileys', {
        institute_uuid: instituteId,
        student_uuid: student.uuid,
        type: tab === 0 ? 'birthday' : student.type,
        achievementId: student._id,
        mobile,
        message: student.message,
      });
      setSnack({ type: 'success', text: `Message sent to ${student.name}!` });
    } catch (err) {
      setSnack({ type: 'error', text: err.response?.data?.message || 'Failed to send' });
    } finally {
      setSending(null);
    }
  }

  function openWA(student) {
    const link = student.waLink;
    if (link) window.open(link, '_blank');
    else {
      const mobile = student.mobile || student.mobileSelf || student.mobileParent;
      if (mobile && student.message) {
        const jid = mobile.replace(/\D/g, '');
        const num = jid.length === 10 ? `91${jid}` : jid;
        window.open(`https://wa.me/${num}?text=${encodeURIComponent(student.message)}`, '_blank');
      }
    }
  }

  async function sendBulkBaileys(items) {
    if (!waConnected) {
      setSnack({ type: 'warning', text: 'WhatsApp not connected. Connect first.' });
      return;
    }
    const recipients = items
      .map(s => ({
        mobile: s.mobile || s.mobileSelf || s.mobileParent,
        message: s.message,
      }))
      .filter(r => r.mobile && r.message);

    if (!recipients.length) {
      setSnack({ type: 'error', text: 'No students with mobile numbers found.' });
      return;
    }
    setBulkSending(true);
    try {
      const res = await apiClient.post('/api/greetings/send-bulk-baileys', {
        institute_uuid: instituteId,
        recipients,
      });
      setSnack({ type: 'success', text: `Sent: ${res.data.sent} | Failed: ${res.data.failed}` });
    } catch (err) {
      setSnack({ type: 'error', text: err.response?.data?.message || 'Bulk send failed' });
    } finally {
      setBulkSending(false);
    }
  }

  async function deleteAchievement(id) {
    try {
      await apiClient.delete(`/api/greetings/achievements/${id}`);
      loadAchievements();
      setSnack({ type: 'success', text: 'Achievement removed' });
    } catch {
      setSnack({ type: 'error', text: 'Delete failed' });
    }
  }

  const currentItems = tab === 0 ? birthdays : achievements;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: BG, minHeight: '100vh' }}>
      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack?.type || 'info'} onClose={() => setSnack(null)}>{snack?.text}</Alert>
      </Snackbar>

      {/* Header */}
      <Box sx={{ bgcolor: GREEN, borderRadius: 3, p: 2.5, mb: 3, color: '#fff' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <EmojiEventsIcon sx={{ fontSize: 28 }} />
              <Typography sx={{ fontWeight: 700, fontSize: '1.3rem' }}>Achievement Greetings</Typography>
            </Stack>
            <Typography sx={{ fontSize: '0.8rem', opacity: 0.8, mt: 0.5 }}>
              Birthday, Star of the Month, Top Performers &amp; more · {roleLabel}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Chip
              label={waConnected ? '● WA Connected' : '○ WA Offline'}
              size="small"
              sx={{
                bgcolor: waConnected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                color: waConnected ? '#dcfce7' : 'rgba(255,255,255,0.7)',
                fontSize: '0.65rem', height: 22,
              }}
            />
          </Stack>
        </Stack>

        {/* Quick action buttons */}
        <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" gap={1}>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAwardOpen(true)}
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, fontSize: '0.75rem', textTransform: 'none' }}
          >
            Award Achievement
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<EditIcon sx={{ fontSize: 14 }} />}
            onClick={() => setTplOpen(true)}
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, fontSize: '0.75rem', textTransform: 'none' }}
          >
            Edit Templates
          </Button>
          {!waConnected && (
            <Button
              size="small"
              variant="contained"
              startIcon={<WhatsAppIcon sx={{ fontSize: 14 }} />}
              onClick={() => navigate(`/${username}/section/whatsapp`)}
              sx={{ bgcolor: LIGHT, '&:hover': { bgcolor: '#1ebe57' }, fontSize: '0.75rem', textTransform: 'none' }}
            >
              Connect WhatsApp
            </Button>
          )}
        </Stack>
      </Box>

      {/* Tabs */}
      <Box sx={{ bgcolor: '#fff', borderRadius: 2, border: '1px solid #e9edef', mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            '& .MuiTab-root': { fontSize: '0.8rem', textTransform: 'none', minHeight: 48 },
            '& .Mui-selected': { color: GREEN, fontWeight: 700 },
            '& .MuiTabs-indicator': { bgcolor: GREEN },
          }}
        >
          <Tab icon={<CakeIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Birthdays" />
          <Tab icon={<StarIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Achievements" />
        </Tabs>
      </Box>

      {/* Birthday Tab */}
      {tab === 0 && (
        <>
          <FilterBar
            filters={bdFilters}
            setFilters={setBdFilters}
            courses={courses}
            schools={schools}
            batches={batches}
          />
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={loadBirthdays}
                disabled={loading}
                sx={{ fontSize: '0.75rem', textTransform: 'none', borderColor: GREEN, color: GREEN }}
              >
                {loading ? <CircularProgress size={14} sx={{ mr: 0.5 }} /> : null}
                Search
              </Button>
              {birthdays.length > 0 && (
                <Chip
                  label={`${birthdays.length} birthday${birthdays.length !== 1 ? 's' : ''}`}
                  size="small"
                  sx={{ bgcolor: '#fef3c7', color: '#92400e', fontSize: '0.7rem' }}
                />
              )}
            </Stack>
            {birthdays.length > 0 && (
              <Button
                size="small"
                variant="contained"
                startIcon={bulkSending ? <CircularProgress size={14} color="inherit" /> : <BroadcastOnPersonalIcon />}
                onClick={() => sendBulkBaileys(birthdays)}
                disabled={bulkSending || !waConnected}
                sx={{ bgcolor: GREEN, '&:hover': { bgcolor: '#064944' }, fontSize: '0.75rem', textTransform: 'none' }}
              >
                {bulkSending ? 'Sending…' : `Send All (${birthdays.filter(s => s.mobile || s.mobileSelf || s.mobileParent).length})`}
              </Button>
            )}
          </Stack>

          {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

          {!loading && birthdays.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#fff', borderRadius: 2 }}>
              <CakeIcon sx={{ fontSize: 48, color: '#e9edef', mb: 1.5 }} />
              <Typography sx={{ color: '#667781', fontWeight: 600, mb: 0.5 }}>No birthdays found</Typography>
              <Typography sx={{ color: '#667781', fontSize: '0.8rem' }}>
                Try changing the date or filters above
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
            {birthdays.map(s => (
              <StudentCard
                key={s.uuid}
                student={s}
                onSendBaileys={sendViaBaileys}
                onOpenWA={openWA}
                sending={sending}
              />
            ))}
          </Box>
        </>
      )}

      {/* Achievements Tab */}
      {tab === 1 && (
        <>
          {/* Achievement filters */}
          <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: 2, border: '1px solid #e9edef', mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
              <FilterListIcon sx={{ fontSize: 16, color: '#667781' }} />
              <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#111b21' }}>Filters</Typography>
            </Stack>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 1.5 }}>
              <FormControl size="small">
                <InputLabel sx={{ fontSize: '0.78rem' }}>Type</InputLabel>
                <Select value={achType} onChange={e => setAchType(e.target.value)} label="Type">
                  <MenuItem value=""><em>All Types</em></MenuItem>
                  {ACHIEVEMENT_TYPES.map(t => (
                    <MenuItem key={t.value} value={t.value}>{t.icon} {t.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small">
                <InputLabel sx={{ fontSize: '0.78rem' }}>Month</InputLabel>
                <Select value={achMonth} onChange={e => setAchMonth(Number(e.target.value))} label="Month">
                  {MONTH_NAMES.map((m, i) => <MenuItem key={m} value={i + 1}>{m}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Year" size="small" type="number" value={achYear} onChange={e => setAchYear(Number(e.target.value))} />
              <FormControl size="small">
                <InputLabel sx={{ fontSize: '0.78rem' }}>Course</InputLabel>
                <Select value={achCourse} onChange={e => setAchCourse(e.target.value)} label="Course">
                  <MenuItem value=""><em>All</em></MenuItem>
                  {courses.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small">
                <InputLabel sx={{ fontSize: '0.78rem' }}>School</InputLabel>
                <Select value={achSchool} onChange={e => setAchSchool(e.target.value)} label="School">
                  <MenuItem value=""><em>All</em></MenuItem>
                  {schools.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={loadAchievements}
                disabled={loading}
                sx={{ fontSize: '0.75rem', textTransform: 'none', borderColor: GREEN, color: GREEN }}
              >
                {loading ? <CircularProgress size={14} sx={{ mr: 0.5 }} /> : null}
                Search
              </Button>
              {achievements.length > 0 && (
                <Chip
                  label={`${achievements.length} record${achievements.length !== 1 ? 's' : ''}`}
                  size="small"
                  sx={{ bgcolor: '#f0fdf4', color: '#166534', fontSize: '0.7rem' }}
                />
              )}
            </Stack>
            <Stack direction="row" spacing={1}>
              {achievements.length > 0 && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={bulkSending ? <CircularProgress size={14} color="inherit" /> : <BroadcastOnPersonalIcon />}
                  onClick={() => sendBulkBaileys(achievements.map(a => ({
                    ...a,
                    uuid: a.student_uuid,
                    name: a.studentName,
                    mobile: a.mobile,
                    message: a.message,
                    waLink: a.mobile ? `https://wa.me/${(a.mobile || '').replace(/\D/g, '').padStart(12, '91')}` : null,
                  })))}
                  disabled={bulkSending || !waConnected}
                  sx={{ bgcolor: GREEN, '&:hover': { bgcolor: '#064944' }, fontSize: '0.75rem', textTransform: 'none' }}
                >
                  {bulkSending ? 'Sending…' : 'Send All'}
                </Button>
              )}
              <Button
                size="small"
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAwardOpen(true)}
                sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' }, fontSize: '0.75rem', textTransform: 'none' }}
              >
                Award
              </Button>
            </Stack>
          </Stack>

          {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

          {!loading && achievements.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#fff', borderRadius: 2 }}>
              <EmojiEventsIcon sx={{ fontSize: 48, color: '#e9edef', mb: 1.5 }} />
              <Typography sx={{ color: '#667781', fontWeight: 600, mb: 0.5 }}>No achievements found</Typography>
              <Typography sx={{ color: '#667781', fontSize: '0.8rem', mb: 2 }}>
                Award achievements to students first
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setAwardOpen(true)}
                sx={{ bgcolor: GREEN, '&:hover': { bgcolor: '#064944' } }}
              >
                Award Achievement
              </Button>
            </Box>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
            {achievements.map(a => {
              // Build achievement message and waLink for send actions
              const typeInfo = ACHIEVEMENT_TYPES.find(t => t.value === a.type) || ACHIEVEMENT_TYPES[ACHIEVEMENT_TYPES.length - 1];
              return (
                <Box key={a._id || a.uuid}>
                  <AchievementCard ach={a} onDelete={deleteAchievement} />
                  {/* Send actions */}
                  <Stack direction="row" spacing={1} mt={1}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={sending === a.student_uuid ? <CircularProgress size={12} color="inherit" /> : <WhatsAppIcon sx={{ fontSize: 14 }} />}
                      onClick={() => sendViaBaileys({
                        uuid: a.student_uuid,
                        name: a.studentName,
                        mobile: a.mobile,
                        _id: a._id,
                        type: a.type,
                        message: `${typeInfo.icon} Congratulations, *${a.studentName}*!\nYou have been awarded *${typeInfo.label}* for ${MONTH_NAMES[(a.month || 1) - 1]} ${a.year || ''}.\n${a.description ? a.description + '\n' : ''}– Instify Team`,
                      })}
                      disabled={!a.mobile || !!sending || !waConnected}
                      sx={{ fontSize: '0.68rem', textTransform: 'none', bgcolor: LIGHT, '&:hover': { bgcolor: '#1ebe57' }, flex: 1 }}
                    >
                      Send via WA
                    </Button>
                    <Tooltip title="Open WhatsApp link">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => {
                            if (!a.mobile) return;
                            const num = a.mobile.replace(/\D/g, '');
                            const jid = num.length === 10 ? `91${num}` : num;
                            const msg = `${typeInfo.icon} Congratulations, *${a.studentName}*!\nYou have been awarded *${typeInfo.label}* for ${MONTH_NAMES[(a.month || 1) - 1]} ${a.year || ''}.\n${a.description ? a.description + '\n' : ''}– Instify Team`;
                            window.open(`https://wa.me/${jid}?text=${encodeURIComponent(msg)}`, '_blank');
                          }}
                          disabled={!a.mobile}
                          sx={{ color: GREEN, border: '1px solid #e9edef', '&:hover': { bgcolor: '#f0fff4' } }}
                        >
                          <LinkIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Box>
              );
            })}
          </Box>
        </>
      )}

      {/* Award Dialog */}
      <AwardDialog
        open={awardOpen}
        onClose={() => setAwardOpen(false)}
        onAward={loadAchievements}
        instituteId={instituteId}
      />

      {/* Template Editor Dialog */}
      <TemplateEditor
        open={tplOpen}
        onClose={() => setTplOpen(false)}
        instituteId={instituteId}
      />
    </Box>
  );
}
