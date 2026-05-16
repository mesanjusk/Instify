import { useState, useEffect, useRef } from 'react';
import {
  Alert, Avatar, Box, Chip, CircularProgress, Divider, Fab,
  IconButton, InputAdornment, LinearProgress, MenuItem,
  Select, Snackbar, Stack, Switch, TextField, Tooltip,
  Typography, Button, FormControlLabel,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import UpdateIcon from '@mui/icons-material/Update';
import GroupsIcon from '@mui/icons-material/Groups';
import CallIcon from '@mui/icons-material/Call';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SendIcon from '@mui/icons-material/Send';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import BroadcastOnPersonalIcon from '@mui/icons-material/BroadcastOnPersonal';
import LinkIcon from '@mui/icons-material/Link';
import ArchiveIcon from '@mui/icons-material/Archive';
import CheckIcon from '@mui/icons-material/Check';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import PushPinIcon from '@mui/icons-material/PushPin';
import SettingsIcon from '@mui/icons-material/Settings';
import { useApp } from '../context/AppContext';
import apiClient from '../apiClient';

const WA_GREEN = '#075E54';
const WA_LIGHT = '#25d366';
const WA_BG    = '#111b21';
const WA_SURFACE = '#202c33';
const WA_CARD  = '#202c33';
const WA_TEXT  = '#e9edef';
const WA_MUTED = '#8696a0';
const WA_DIVIDER = '#2a3942';

const FILTERS = ['All', 'Unread', 'Favourites', 'Groups'];

const AUTOMATION_JOBS = [
  {
    key: 'followup',
    label: 'Follow-up Reminders',
    description: 'Daily 9:00 AM — reminds leads with follow-up scheduled today',
    preview: 'Hello [Name], this is a reminder for your follow-up today regarding the [Course] enquiry. – Instify',
  },
  {
    key: 'fees',
    label: 'Fee Due Alerts',
    description: 'Daily 10:00 AM — alerts students with overdue or upcoming fee instalments',
    preview: 'Dear [Name], your fee instalment of ₹[Amount] was due on [Date]. – Instify',
  },
  {
    key: 'birthday',
    label: 'Birthday Wishes',
    description: 'Daily 8:00 AM — sends birthday greetings to students',
    preview: '🎂 Happy Birthday, [Name]! Wishing you a wonderful day. – Instify Team',
  },
  {
    key: 'magic_link',
    label: 'Magic Access Links',
    description: 'Sends a one-click login link when a teacher or student is created',
    preview: 'Hello [Name], your Instify account is ready. Click to access: [LINK] – Instify',
  },
];

const MOCK_CHATS = [
  { id: 1, name: 'Rahul Sharma', last: 'Fee reminder sent successfully', time: '10:32 AM', unread: 0, pinned: true, avatar: 'R', status: 'read' },
  { id: 2, name: 'Priya Patel', last: 'Birthday wish delivered', time: '8:00 AM', unread: 2, pinned: false, avatar: 'P', status: 'delivered' },
  { id: 3, name: 'Amit Kumar', last: 'Magic link sent', time: 'Yesterday', unread: 0, pinned: false, avatar: 'A', status: 'read' },
  { id: 4, name: 'Sneha Joshi', last: 'Follow-up reminder sent', time: 'Yesterday', unread: 1, pinned: false, avatar: 'S', status: 'delivered' },
  { id: 5, name: 'Vikram Singh', last: 'Exam admit card shared', time: 'Mon', unread: 0, pinned: false, avatar: 'V', status: 'sent' },
  { id: 6, name: 'Kavya Nair', last: 'Fee reminder sent', time: 'Sun', unread: 0, pinned: false, avatar: 'K', status: 'read' },
];

function NavItem({ icon, label, active, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 0.3, py: 1, cursor: 'pointer',
        color: active ? WA_LIGHT : WA_MUTED,
        '&:hover': { color: WA_TEXT },
        transition: 'color 0.15s',
      }}
    >
      {icon}
      <Typography sx={{ fontSize: '0.65rem', fontWeight: active ? 700 : 400 }}>{label}</Typography>
    </Box>
  );
}

function ChatRow({ chat }) {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', px: 2, py: 1.25, gap: 1.5,
      cursor: 'pointer', '&:hover': { bgcolor: WA_SURFACE },
      borderBottom: `1px solid ${WA_DIVIDER}`,
    }}>
      <Avatar sx={{ bgcolor: `hsl(${chat.id * 60}, 50%, 35%)`, width: 50, height: 50, fontSize: '1.1rem', fontWeight: 700, flexShrink: 0 }}>
        {chat.avatar}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={0.5}>
            {chat.pinned && <PushPinIcon sx={{ fontSize: 12, color: WA_MUTED, transform: 'rotate(45deg)' }} />}
            <Typography sx={{ color: WA_TEXT, fontWeight: 500, fontSize: '0.9rem' }} noWrap>{chat.name}</Typography>
          </Stack>
          <Typography sx={{ color: chat.unread > 0 ? WA_LIGHT : WA_MUTED, fontSize: '0.7rem', flexShrink: 0 }}>
            {chat.time}
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mt={0.3}>
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
            {chat.status === 'read' && <DoneAllIcon sx={{ fontSize: 14, color: '#53bdeb', flexShrink: 0 }} />}
            {chat.status === 'delivered' && <DoneAllIcon sx={{ fontSize: 14, color: WA_MUTED, flexShrink: 0 }} />}
            {chat.status === 'sent' && <CheckIcon sx={{ fontSize: 14, color: WA_MUTED, flexShrink: 0 }} />}
            <Typography sx={{ color: WA_MUTED, fontSize: '0.8rem' }} noWrap>{chat.last}</Typography>
          </Stack>
          {chat.unread > 0 && (
            <Box sx={{ bgcolor: WA_LIGHT, borderRadius: '50%', minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Typography sx={{ fontSize: '0.65rem', color: '#fff', fontWeight: 700 }}>{chat.unread}</Typography>
            </Box>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

/* ── Panel views ───────────────────────────────────────────── */

function ConnectionPanel({ status, qr, loading, isConnected, onConnect, onDisconnect }) {
  return (
    <Box sx={{ p: 3, color: WA_TEXT }}>
      <Typography variant="body2" sx={{ color: WA_MUTED, mb: 2 }}>
        Connect your institute's personal WhatsApp by scanning the QR code. Messages are sent with a 2–4s delay to stay within WhatsApp's safe usage limits.
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1, bgcolor: WA_DIVIDER, '& .MuiLinearProgress-bar': { bgcolor: WA_LIGHT } }} />}

      {qr && (
        <Box textAlign="center" my={2.5}>
          <img src={qr} alt="WhatsApp QR Code" width={220} style={{ borderRadius: 12, border: `1px solid ${WA_DIVIDER}` }} />
          <Typography variant="caption" display="block" mt={1} sx={{ color: WA_MUTED }}>
            Open WhatsApp → Linked Devices → Link a Device → Scan QR
          </Typography>
        </Box>
      )}

      {isConnected && (
        <Box sx={{ bgcolor: '#1a3a2a', border: '1px solid #15803d55', borderRadius: 2, p: 2, mb: 2 }}>
          <Typography variant="body2" sx={{ color: '#4ade80', fontWeight: 600 }}>
            ✓ WhatsApp connected. Automation is active.
          </Typography>
        </Box>
      )}

      <Stack direction="row" spacing={2}>
        {!isConnected && (
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <WhatsAppIcon />}
            onClick={onConnect}
            disabled={loading}
            sx={{ bgcolor: WA_LIGHT, color: '#fff', '&:hover': { bgcolor: '#1ebe57' }, '&:disabled': { bgcolor: WA_DIVIDER } }}
          >
            {status === 'not_started' ? 'Connect WhatsApp' : 'Reconnect'}
          </Button>
        )}
        {isConnected && (
          <Button variant="outlined" color="error" startIcon={<LinkOffIcon />} onClick={onDisconnect}
            sx={{ borderColor: '#ef4444', color: '#ef4444' }}>
            Disconnect
          </Button>
        )}
      </Stack>
    </Box>
  );
}

function AutomationPanel({ automation, isConnected, onToggle, instituteId }) {
  const [templates, setTemplates] = useState({});
  const [editing, setEditing]     = useState(null); // key being edited
  const [editBody, setEditBody]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [snack, setSnack]         = useState(null);

  useEffect(() => {
    if (!instituteId) return;
    apiClient.get(`/api/message-templates?institute_uuid=${instituteId}`)
      .then(r => {
        const map = {};
        (r.data?.result || []).forEach(t => { map[t.key] = t; });
        setTemplates(map);
      })
      .catch(() => {});
  }, [instituteId]);

  async function saveTemplate(key) {
    setSaving(true);
    try {
      await apiClient.put(`/api/message-templates/${key}`, { institute_uuid: instituteId, body: editBody });
      setTemplates(prev => ({ ...prev, [key]: { ...prev[key], body: editBody, isCustom: true } }));
      setSnack({ type: 'success', text: 'Template saved!' });
      setEditing(null);
    } catch { setSnack({ type: 'error', text: 'Save failed' }); }
    finally { setSaving(false); }
  }

  async function resetTemplate(key) {
    try {
      await apiClient.delete(`/api/message-templates/${key}?institute_uuid=${instituteId}`);
      const res = await apiClient.get(`/api/message-templates?institute_uuid=${instituteId}`);
      const map = {};
      (res.data?.result || []).forEach(t => { map[t.key] = t; });
      setTemplates(map);
      setSnack({ type: 'success', text: 'Reset to default' });
    } catch { setSnack({ type: 'error', text: 'Reset failed' }); }
  }

  return (
    <Box sx={{ p: 2 }}>
      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack?.type || 'info'} onClose={() => setSnack(null)}>{snack?.text}</Alert>
      </Snackbar>
      {!isConnected && (
        <Box sx={{ bgcolor: '#2d2000', border: '1px solid #f59e0b55', borderRadius: 2, p: 1.5, mb: 2 }}>
          <Typography variant="caption" sx={{ color: '#fbbf24' }}>Connect WhatsApp first to activate automation.</Typography>
        </Box>
      )}
      <Stack spacing={1.5}>
        {AUTOMATION_JOBS.map((job) => (
          <Box key={job.key} sx={{
            bgcolor: WA_SURFACE, borderRadius: 2, p: 2,
            border: `1px solid ${automation[job.key] ? WA_LIGHT + '44' : WA_DIVIDER}`,
          }}>
            <Stack direction="row" alignItems="flex-start" spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: WA_TEXT, fontWeight: 600, fontSize: '0.85rem' }}>{job.label}</Typography>
                <Typography sx={{ color: WA_MUTED, fontSize: '0.75rem', mt: 0.3 }}>{job.description}</Typography>

                {editing === job.key ? (
                  <Stack sx={{ mt: 1 }} spacing={1}>
                    <TextField
                      multiline rows={4} size="small" value={editBody}
                      onChange={e => setEditBody(e.target.value)}
                      placeholder="Use {{name}}, {{date}}, {{course}}, {{amount}}, {{balance}}, {{link}}"
                      sx={{ ...fieldSx, '& .MuiOutlinedInput-root': { ...fieldSx['& .MuiOutlinedInput-root'], fontSize: '0.78rem' } }}
                    />
                    <Typography sx={{ color: WA_MUTED, fontSize: '0.65rem' }}>Variables: {'{{name}} {{date}} {{course}} {{amount}} {{balance}} {{link}}'}</Typography>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={() => saveTemplate(job.key)} disabled={saving}
                        sx={{ bgcolor: WA_LIGHT, color: '#fff', '&:hover': { bgcolor: '#1ebe57' }, fontSize: '0.72rem' }}>
                        {saving ? 'Saving…' : 'Save'}
                      </Button>
                      <Button size="small" onClick={() => setEditing(null)} sx={{ color: WA_MUTED, fontSize: '0.72rem' }}>Cancel</Button>
                      {templates[job.key]?.isCustom && (
                        <Button size="small" color="error" onClick={() => resetTemplate(job.key)} sx={{ fontSize: '0.72rem' }}>Reset</Button>
                      )}
                    </Stack>
                  </Stack>
                ) : (
                  <Box sx={{ mt: 1, bgcolor: '#1a2530', borderRadius: 1.5, p: 1.25, borderLeft: `3px solid ${WA_LIGHT}`, cursor: 'pointer' }}
                    onClick={() => { setEditing(job.key); setEditBody(templates[job.key]?.body || job.preview); }}>
                    <Typography sx={{ color: WA_MUTED, fontSize: '0.72rem', fontStyle: 'italic' }}>
                      "{templates[job.key]?.body || job.preview}"
                    </Typography>
                    <Typography sx={{ color: WA_LIGHT, fontSize: '0.62rem', mt: 0.5 }}>
                      {templates[job.key]?.isCustom ? '✎ Custom template — tap to edit' : '✎ Tap to customise'}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Switch
                checked={automation[job.key]}
                onChange={() => onToggle(job.key)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: WA_LIGHT },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: WA_LIGHT },
                }}
              />
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function BroadcastPanel({ isConnected, instituteId }) {
  const [toNumber, setToNumber]   = useState('');
  const [message, setMessage]     = useState('');
  const [sending, setSending]     = useState(false);
  const [bulkNums, setBulkNums]   = useState('');
  const [bulkMsg, setBulkMsg]     = useState('');
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);
  const [snack, setSnack]         = useState(null);

  async function sendSingle() {
    if (!toNumber || !message) return setSnack({ type: 'error', text: 'Enter phone number and message' });
    setSending(true);
    try {
      await apiClient.post('/api/baileys/send-text', { instituteId, to: toNumber, message });
      setSnack({ type: 'success', text: 'Message sent!' });
      setToNumber(''); setMessage('');
    } catch (err) {
      setSnack({ type: 'error', text: err.response?.data?.message || 'Send failed' });
    } finally { setSending(false); }
  }

  async function sendBulk() {
    const numbers = bulkNums.split(/[\n,]+/).map(n => n.trim()).filter(Boolean);
    if (!numbers.length || !bulkMsg) return setSnack({ type: 'error', text: 'Enter numbers and message' });
    setBulkSending(true); setBulkResults(null);
    try {
      const res = await apiClient.post('/api/baileys/send-bulk', { instituteId, numbers, message: bulkMsg });
      setBulkResults(res.data);
      setSnack({ type: 'success', text: `Sent: ${res.data.sent} | Failed: ${res.data.failed}` });
    } catch (err) {
      setSnack({ type: 'error', text: err.response?.data?.message || 'Broadcast failed' });
    } finally { setBulkSending(false); }
  }

  return (
    <Box sx={{ p: 2 }}>
      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack?.type || 'info'} onClose={() => setSnack(null)}>{snack?.text}</Alert>
      </Snackbar>

      <Typography sx={{ color: WA_TEXT, fontWeight: 600, fontSize: '0.85rem', mb: 0.5 }}>Single Message</Typography>
      <Stack spacing={1.5} mb={3}>
        <TextField
          placeholder="Phone with country code (e.g. 919876543210)"
          value={toNumber} onChange={e => setToNumber(e.target.value)}
          fullWidth disabled={!isConnected} size="small"
          sx={fieldSx}
        />
        <TextField
          placeholder="Message"
          value={message} onChange={e => setMessage(e.target.value)}
          multiline rows={3} fullWidth disabled={!isConnected} size="small"
          sx={fieldSx}
        />
        <Button
          variant="contained"
          startIcon={sending ? <CircularProgress size={14} color="inherit" /> : <SendIcon />}
          onClick={sendSingle} disabled={sending || !isConnected}
          sx={{ bgcolor: WA_LIGHT, '&:hover': { bgcolor: '#1ebe57' }, alignSelf: 'flex-start' }}
        >
          Send
        </Button>
      </Stack>

      <Divider sx={{ borderColor: WA_DIVIDER, my: 2 }} />

      <Typography sx={{ color: WA_TEXT, fontWeight: 600, fontSize: '0.85rem', mb: 0.3 }}>Bulk Broadcast</Typography>
      <Typography sx={{ color: WA_MUTED, fontSize: '0.72rem', mb: 1.5 }}>
        One number per line. Sent with 2–4s delays. Only enrolled users.
      </Typography>
      <Stack spacing={1.5}>
        <TextField placeholder="Numbers (one per line)" value={bulkNums} onChange={e => setBulkNums(e.target.value)}
          multiline rows={4} fullWidth disabled={!isConnected} size="small" sx={fieldSx} />
        <TextField placeholder="Message" value={bulkMsg} onChange={e => setBulkMsg(e.target.value)}
          multiline rows={3} fullWidth disabled={!isConnected} size="small" sx={fieldSx} />
        {bulkSending && <LinearProgress sx={{ borderRadius: 1, bgcolor: WA_DIVIDER, '& .MuiLinearProgress-bar': { bgcolor: WA_LIGHT } }} />}
        <Button
          variant="contained" color="secondary"
          startIcon={bulkSending ? <CircularProgress size={14} color="inherit" /> : <BroadcastOnPersonalIcon />}
          onClick={sendBulk} disabled={bulkSending || !isConnected}
          sx={{ alignSelf: 'flex-start' }}
        >
          {bulkSending ? 'Sending…' : 'Broadcast'}
        </Button>
        {bulkResults && (
          <Box sx={{ bgcolor: WA_SURFACE, borderRadius: 2, p: 1.5, borderLeft: `3px solid ${WA_LIGHT}` }}>
            <Typography sx={{ color: WA_TEXT, fontSize: '0.8rem' }}>
              ✓ Sent: {bulkResults.sent} &nbsp;|&nbsp; ✗ Failed: {bulkResults.failed}
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
}

function MagicLinksPanel({ isConnected, instituteId }) {
  const [mobile, setMobile]     = useState('');
  const [userId, setUserId]     = useState('');
  const [sending, setSending]   = useState(false);
  const [snack, setSnack]       = useState(null);

  async function send() {
    if (!mobile) return setSnack({ type: 'error', text: 'Enter mobile number' });
    setSending(true);
    try {
      await apiClient.post('/api/auth/magic-link/send', { userId: userId || undefined, mobile, instituteId });
      setSnack({ type: 'success', text: 'Magic link sent via WhatsApp!' });
      setMobile(''); setUserId('');
    } catch (err) {
      setSnack({ type: 'error', text: err.response?.data?.message || 'Failed' });
    } finally { setSending(false); }
  }

  return (
    <Box sx={{ p: 2 }}>
      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack?.type || 'info'} onClose={() => setSnack(null)}>{snack?.text}</Alert>
      </Snackbar>

      <Box sx={{ bgcolor: '#1a2530', border: `1px solid #53bdeb44`, borderRadius: 2, p: 1.5, mb: 2.5 }}>
        <Typography sx={{ color: '#53bdeb', fontSize: '0.78rem' }}>
          A secure JWT link (48h) is sent via WhatsApp. The recipient clicks → auto-login → their dashboard. Sent automatically when you create a new user.
        </Typography>
      </Box>

      {!isConnected && (
        <Box sx={{ bgcolor: '#2d2000', border: '1px solid #f59e0b55', borderRadius: 2, p: 1.5, mb: 2 }}>
          <Typography variant="caption" sx={{ color: '#fbbf24' }}>Connect WhatsApp first.</Typography>
        </Box>
      )}

      <Stack spacing={1.5}>
        <TextField placeholder="User ID (optional)" value={userId} onChange={e => setUserId(e.target.value)}
          fullWidth disabled={!isConnected} size="small" sx={fieldSx} />
        <TextField placeholder="Mobile with country code (919876543210)" value={mobile} onChange={e => setMobile(e.target.value)}
          fullWidth disabled={!isConnected} size="small" sx={fieldSx} />
        <Button
          variant="contained"
          startIcon={sending ? <CircularProgress size={14} color="inherit" /> : <LinkIcon />}
          onClick={send} disabled={sending || !isConnected}
          sx={{ bgcolor: WA_LIGHT, '&:hover': { bgcolor: '#1ebe57' }, alignSelf: 'flex-start' }}
        >
          {sending ? 'Sending…' : 'Send Magic Link'}
        </Button>
      </Stack>
    </Box>
  );
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: WA_SURFACE,
    color: WA_TEXT,
    '& fieldset': { borderColor: WA_DIVIDER },
    '&:hover fieldset': { borderColor: WA_MUTED },
    '&.Mui-focused fieldset': { borderColor: WA_LIGHT },
  },
  '& .MuiInputBase-input::placeholder': { color: WA_MUTED, opacity: 1 },
};

/* ── Main component ──────────────────────────────────────────── */
export default function BaileysWhatsApp() {
  const { institute } = useApp();
  const instituteId = institute?.institute_uuid || localStorage.getItem('institute_uuid') || '';

  const [nav, setNav]       = useState(0); // 0=Chats 1=Automation 2=Broadcast 3=Settings
  const [filter, setFilter] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('not_started');
  const [qr, setQr]         = useState(null);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack]   = useState(null);
  const [panel, setPanel]   = useState(null); // null | 'connect' | 'automation' | 'broadcast' | 'magic'

  const storageKey = `automation_${instituteId}`;
  const [automation, setAutomation] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || { followup: true, fees: true, birthday: true, magic_link: true }; }
    catch { return { followup: true, fees: true, birthday: true, magic_link: true }; }
  });

  const esRef = useRef(null);
  const isConnected = status === 'connected';

  function toggleAutomation(key) {
    const next = { ...automation, [key]: !automation[key] };
    setAutomation(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  function startSession() {
    if (!instituteId) return;
    if (esRef.current) esRef.current.close();
    setLoading(true); setQr(null); setStatus('connecting');
    const baseUrl = import.meta.env.VITE_BASE_URL || '';
    const es = new EventSource(`${baseUrl}/api/baileys/session/${instituteId}/qr`);
    esRef.current = es;
    es.addEventListener('qr', (e) => { setQr(JSON.parse(e.data).qr); setLoading(false); });
    es.addEventListener('status', (e) => {
      const d = JSON.parse(e.data);
      setStatus(d.status);
      if (d.status === 'connected') { setQr(null); setLoading(false); es.close(); setSnack({ type: 'success', text: 'WhatsApp connected!' }); }
      if (d.status === 'disconnected' || d.status === 'logged_out') setLoading(false);
    });
    es.onerror = () => setLoading(false);
  }

  async function disconnect() {
    try {
      if (esRef.current) { esRef.current.close(); esRef.current = null; }
      await apiClient.delete(`/api/baileys/session/${instituteId}`);
      setStatus('not_started'); setQr(null);
      setSnack({ type: 'info', text: 'WhatsApp disconnected' });
    } catch { setSnack({ type: 'error', text: 'Disconnect failed' }); }
  }

  useEffect(() => {
    if (!instituteId) return;
    apiClient.get(`/api/baileys/session/${instituteId}/status`)
      .then(r => setStatus(r.data?.status || 'not_started'))
      .catch(() => {});
    return () => { if (esRef.current) esRef.current.close(); };
  }, [instituteId]);

  const filteredChats = MOCK_CHATS.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 1) return c.unread > 0;
    if (filter === 2) return c.pinned;
    return true;
  });

  /* If a sub-panel is open, render it with a back header */
  if (panel) {
    const panelTitle = { connect: 'Connection', automation: 'Automation', broadcast: 'Broadcast', magic: 'Magic Links' }[panel];
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: WA_BG }}>
        <Box sx={{ bgcolor: WA_GREEN, px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
          <IconButton onClick={() => setPanel(null)} sx={{ color: WA_TEXT, p: 0.5 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography sx={{ color: WA_TEXT, fontWeight: 600, fontSize: '1rem' }}>{panelTitle}</Typography>
        </Box>
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {panel === 'connect' && <ConnectionPanel status={status} qr={qr} loading={loading} isConnected={isConnected} onConnect={startSession} onDisconnect={disconnect} />}
          {panel === 'automation' && <AutomationPanel automation={automation} isConnected={isConnected} onToggle={toggleAutomation} instituteId={instituteId} />}
          {panel === 'broadcast' && <BroadcastPanel isConnected={isConnected} instituteId={instituteId} />}
          {panel === 'magic' && <MagicLinksPanel isConnected={isConnected} instituteId={instituteId} />}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: WA_BG }}>
      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack?.type || 'info'} onClose={() => setSnack(null)}>{snack?.text}</Alert>
      </Snackbar>

      {/* ── Header ─────────────────────────────────────────────── */}
      {nav === 0 && (
        <Box sx={{ bgcolor: WA_GREEN, px: 2, pt: 2, pb: 1, flexShrink: 0 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography sx={{ color: WA_TEXT, fontWeight: 700, fontSize: '1.25rem' }}>WhatsApp</Typography>
            <Stack direction="row" spacing={0.5}>
              <Chip
                size="small"
                label={isConnected ? '● Connected' : '○ Offline'}
                sx={{ bgcolor: isConnected ? '#15803d44' : '#ffffff22', color: isConnected ? '#4ade80' : WA_MUTED, fontSize: '0.65rem', height: 22 }}
              />
              <IconButton sx={{ color: WA_TEXT, p: 0.75 }} size="small"><CameraAltIcon fontSize="small" /></IconButton>
              <IconButton sx={{ color: WA_TEXT, p: 0.75 }} size="small"><MoreVertIcon fontSize="small" /></IconButton>
            </Stack>
          </Stack>
          {/* Search */}
          <TextField
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Ask Meta AI or Search"
            size="small" fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: WA_MUTED, fontSize: 18 }} /></InputAdornment>,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#1f2c33', borderRadius: 3, color: WA_TEXT,
                '& fieldset': { border: 'none' },
              },
              '& .MuiInputBase-input::placeholder': { color: WA_MUTED, opacity: 1 },
              mb: 1,
            }}
          />
          {/* Filter pills */}
          <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
            {FILTERS.map((f, i) => (
              <Chip
                key={f} label={f} size="small"
                onClick={() => setFilter(i)}
                sx={{
                  bgcolor: filter === i ? WA_LIGHT : '#1f2c33',
                  color: filter === i ? '#fff' : WA_MUTED,
                  fontWeight: filter === i ? 700 : 400,
                  fontSize: '0.72rem',
                  flexShrink: 0,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: filter === i ? WA_LIGHT : '#2a3942' },
                }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {nav !== 0 && (
        <Box sx={{ bgcolor: WA_GREEN, px: 2, py: 1.75, flexShrink: 0 }}>
          <Typography sx={{ color: WA_TEXT, fontWeight: 700, fontSize: '1.25rem' }}>
            {nav === 1 ? 'Automation' : nav === 2 ? 'Broadcast' : 'Settings'}
          </Typography>
        </Box>
      )}

      {/* ── Body ───────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>

        {/* Chats tab */}
        {nav === 0 && (
          <>
            {/* Archived row */}
            <Box sx={{
              display: 'flex', alignItems: 'center', px: 2, py: 1.25, gap: 2,
              bgcolor: WA_SURFACE, borderBottom: `1px solid ${WA_DIVIDER}`, cursor: 'pointer',
              '&:hover': { bgcolor: '#2a3942' },
            }}>
              <ArchiveIcon sx={{ color: WA_LIGHT, fontSize: 22 }} />
              <Typography sx={{ color: WA_TEXT, fontWeight: 500, fontSize: '0.9rem', flex: 1 }}>Archived</Typography>
              <Chip size="small" label="3" sx={{ bgcolor: WA_LIGHT + '33', color: WA_LIGHT, fontSize: '0.65rem', height: 20 }} />
            </Box>

            {/* Pinned chats */}
            {filteredChats.filter(c => c.pinned).map(c => <ChatRow key={c.id} chat={c} />)}

            {filteredChats.filter(c => !c.pinned).length > 0 && (
              <Box sx={{ px: 2, py: 0.75, bgcolor: WA_BG }}>
                <Typography sx={{ color: WA_MUTED, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recent</Typography>
              </Box>
            )}
            {filteredChats.filter(c => !c.pinned).map(c => <ChatRow key={c.id} chat={c} />)}

            {filteredChats.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography sx={{ color: WA_MUTED, fontSize: '0.9rem' }}>No chats found</Typography>
              </Box>
            )}
          </>
        )}

        {/* Automation tab */}
        {nav === 1 && (
          <Box sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              {[
                { label: 'Connect WhatsApp', desc: isConnected ? '● Connected' : '○ Not connected', icon: <WhatsAppIcon />, action: () => setPanel('connect'), color: isConnected ? WA_LIGHT : WA_MUTED },
                { label: 'Automation & Templates', desc: `${Object.values(automation).filter(Boolean).length} of ${AUTOMATION_JOBS.length} active`, icon: <AutorenewIcon />, action: () => setPanel('automation') },
                { label: 'Broadcast Messages', desc: 'Send to individuals or bulk', icon: <BroadcastOnPersonalIcon />, action: () => setPanel('broadcast') },
                { label: 'Magic Links', desc: 'One-click login via WhatsApp', icon: <LinkIcon />, action: () => setPanel('magic') },
              ].map((item) => (
                <Box
                  key={item.label}
                  onClick={item.action}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    bgcolor: WA_SURFACE, borderRadius: 2, p: 2, cursor: 'pointer',
                    border: `1px solid ${WA_DIVIDER}`,
                    '&:hover': { border: `1px solid ${WA_LIGHT}44` },
                  }}
                >
                  <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: `${WA_LIGHT}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color || WA_LIGHT, flexShrink: 0 }}>
                    {item.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ color: WA_TEXT, fontWeight: 600, fontSize: '0.875rem' }}>{item.label}</Typography>
                    <Typography sx={{ color: WA_MUTED, fontSize: '0.75rem' }}>{item.desc}</Typography>
                  </Box>
                  <Typography sx={{ color: WA_MUTED, fontSize: '1.2rem' }}>›</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* Broadcast tab */}
        {nav === 2 && <BroadcastPanel isConnected={isConnected} instituteId={instituteId} />}

        {/* Settings tab */}
        {nav === 3 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 2, bgcolor: WA_SURFACE, borderRadius: 2, p: 2,
              border: `1px solid ${WA_DIVIDER}`, mb: 2,
            }}>
              <Avatar sx={{ bgcolor: WA_LIGHT, width: 56, height: 56 }}>
                <WhatsAppIcon />
              </Avatar>
              <Box>
                <Typography sx={{ color: WA_TEXT, fontWeight: 600 }}>{institute?.institute_name || 'Your Institute'}</Typography>
                <Typography sx={{ color: WA_MUTED, fontSize: '0.8rem' }}>
                  {isConnected ? '● Connected' : '○ Not Connected'}
                </Typography>
              </Box>
            </Box>

            <Stack spacing={1}>
              {[
                { label: 'Connection Settings', icon: <WhatsAppIcon />, action: () => setPanel('connect') },
                { label: 'Automation', icon: <AutorenewIcon />, action: () => setPanel('automation') },
                { label: 'Magic Link Settings', icon: <LinkIcon />, action: () => setPanel('magic') },
              ].map(item => (
                <Box key={item.label} onClick={item.action} sx={{
                  display: 'flex', alignItems: 'center', gap: 2,
                  bgcolor: WA_SURFACE, borderRadius: 2, p: 1.75, cursor: 'pointer',
                  border: `1px solid ${WA_DIVIDER}`,
                  '&:hover': { border: `1px solid ${WA_MUTED}` },
                }}>
                  <Box sx={{ color: WA_MUTED }}>{item.icon}</Box>
                  <Typography sx={{ color: WA_TEXT, fontSize: '0.875rem', flex: 1 }}>{item.label}</Typography>
                  <Typography sx={{ color: WA_MUTED }}>›</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </Box>

      {/* ── FAB ────────────────────────────────────────────────── */}
      {nav === 0 && (
        <Fab
          size="medium"
          onClick={() => setPanel('broadcast')}
          sx={{
            position: 'absolute', bottom: 76, right: 16,
            bgcolor: WA_LIGHT, color: '#fff',
            '&:hover': { bgcolor: '#1ebe57' },
            boxShadow: '0 4px 16px rgba(37,211,102,0.4)',
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* ── Bottom Nav ─────────────────────────────────────────── */}
      <Box sx={{
        bgcolor: WA_SURFACE, borderTop: `1px solid ${WA_DIVIDER}`,
        display: 'flex', flexShrink: 0,
      }}>
        <NavItem icon={<ChatBubbleOutlineIcon fontSize="small" />} label="Chats" active={nav === 0} onClick={() => setNav(0)} />
        <NavItem icon={<AutorenewIcon fontSize="small" />} label="Automation" active={nav === 1} onClick={() => setNav(1)} />
        <NavItem icon={<BroadcastOnPersonalIcon fontSize="small" />} label="Broadcast" active={nav === 2} onClick={() => setNav(2)} />
        <NavItem icon={<SettingsIcon fontSize="small" />} label="Settings" active={nav === 3} onClick={() => setNav(3)} />
      </Box>
    </Box>
  );
}
