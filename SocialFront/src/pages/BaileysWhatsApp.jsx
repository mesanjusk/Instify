import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert, Avatar, Box, Button, Chip, CircularProgress, Divider, Fab,
  IconButton, InputAdornment, LinearProgress, ListItemIcon, ListItemText,
  Menu, MenuItem, Select, Snackbar, Stack, Switch, TextField, Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SendIcon from '@mui/icons-material/Send';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import BroadcastOnPersonalIcon from '@mui/icons-material/BroadcastOnPersonal';
import LinkIcon from '@mui/icons-material/Link';
import CheckIcon from '@mui/icons-material/Check';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import QrCodeIcon from '@mui/icons-material/QrCode';
import PhoneIcon from '@mui/icons-material/Phone';
import VideocamIcon from '@mui/icons-material/Videocam';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useApp } from '../context/AppContext';
import apiClient from '../apiClient';
import { saveChats, loadChatsCache, saveMessages, loadMessagesCache } from '../utils/offlineDB';

/* ── theme (WhatsApp Web light) ──────────────────────────────── */
const WA_GREEN      = '#075E54';
const WA_LIGHT      = '#25d366';
const WA_BG         = '#f0f2f5';
const WA_SURFACE    = '#ffffff';
const WA_TEXT       = '#111b21';
const WA_MUTED      = '#667781';
const WA_DIVIDER    = '#e9edef';
const WA_BUBBLE_OUT = '#d9fdd3';
const WA_BUBBLE_IN  = '#ffffff';
const WA_CHAT_BG    = '#efeae2';

const FILTERS = ['All', 'Unread', 'Favourites', 'Groups'];

const AUTOMATION_JOBS = [
  { key: 'followup',   label: 'Follow-up Reminders',  description: 'Daily 9:00 AM — leads with follow-up today', preview: 'Hello {{name}}, reminder for follow-up today regarding {{course}}. – Instify' },
  { key: 'fees',       label: 'Fee Due Alerts',        description: 'Daily 10:00 AM — overdue fee instalments',   preview: 'Dear {{name}}, fee of ₹{{amount}} due on {{date}}. Balance: ₹{{balance}}. – Instify' },
  { key: 'birthday',   label: 'Birthday Wishes',       description: 'Daily 8:00 AM — birthday greetings',         preview: '🎂 Happy Birthday, {{name}}! – Instify Team' },
  { key: 'magic_link', label: 'Magic Access Links',    description: 'On new user creation — one-click login',      preview: 'Hello {{name}}, access your account: {{link}} – Instify' },
];

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#f0f2f5', color: WA_TEXT,
    '& fieldset': { borderColor: WA_DIVIDER },
    '&:hover fieldset': { borderColor: '#aebac1' },
    '&.Mui-focused fieldset': { borderColor: WA_GREEN },
  },
  '& .MuiInputBase-input::placeholder': { color: WA_MUTED, opacity: 1 },
};

/* ── helpers ─────────────────────────────────────────────────── */
function avatarColor(jid = '') {
  const colors = ['#1a6b52','#4a2d6b','#1a4a6b','#6b1a1a','#4a6b1a','#6b4a1a'];
  let h = 0; for (const c of jid) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return colors[h % colors.length];
}

function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000 && now.getDate() === d.getDate())
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  if (diff < 7 * 86400000)
    return d.toLocaleDateString('en-IN', { weekday: 'short' });
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' });
}

function fmtBubbleTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

/* ── Chat list row ───────────────────────────────────────────── */
const ChatRow = memo(function ChatRow({ chat, onClick }) {
  const name = chat._id;
  return (
    <Box onClick={onClick} sx={{
      display: 'flex', alignItems: 'center', px: 2, py: 1.25, gap: 1.5,
      cursor: 'pointer', '&:hover': { bgcolor: '#f5f6f6' },
      borderBottom: `1px solid ${WA_DIVIDER}`,
    }}>
      <Avatar sx={{ bgcolor: avatarColor(chat._id), width: 50, height: 50, fontSize: '1.1rem', fontWeight: 700, flexShrink: 0 }}>
        {(chat._id || '?')[0].toUpperCase()}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={{ color: WA_TEXT, fontWeight: 500, fontSize: '0.9rem' }} noWrap>
            +{name}
          </Typography>
          <Typography sx={{ color: chat.unread > 0 ? WA_LIGHT : WA_MUTED, fontSize: '0.7rem', flexShrink: 0 }}>
            {fmtTime(chat.lastTime)}
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mt={0.3}>
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
            {chat.fromMe && <DoneAllIcon sx={{ fontSize: 14, color: '#53bdeb', flexShrink: 0 }} />}
            <Typography sx={{ color: WA_MUTED, fontSize: '0.8rem' }} noWrap>{chat.lastMessage || '…'}</Typography>
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
});

/* ── Message bubble ──────────────────────────────────────────── */
const Bubble = memo(function Bubble({ msg }) {
  const isImage    = msg.type === 'image';
  const isDocument = msg.type === 'document';
  const isVideo    = msg.type === 'video';
  const isAudio    = msg.type === 'audio';
  const hasMedia   = isImage || isDocument || isVideo || isAudio;

  const timeRow = (
    <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={0.5} sx={{ px: 1.5, pb: 0.75, mt: hasMedia && !msg.message ? 0 : 0.25 }}>
      <Typography sx={{ color: WA_MUTED, fontSize: '0.65rem' }}>{fmtBubbleTime(msg.createdAt)}</Typography>
      {msg.fromMe && <DoneAllIcon sx={{ fontSize: 12, color: msg.status === 'read' ? '#53bdeb' : WA_MUTED }} />}
    </Stack>
  );

  return (
    <Box sx={{ display: 'flex', justifyContent: msg.fromMe ? 'flex-end' : 'flex-start', mb: 0.5, px: 2 }}>
      <Box sx={{
        maxWidth: '72%', bgcolor: msg.fromMe ? WA_BUBBLE_OUT : WA_BUBBLE_IN,
        borderRadius: msg.fromMe ? '8px 0 8px 8px' : '0 8px 8px 8px',
        overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      }}>

        {/* Image */}
        {isImage && (
          <>
            {msg.mediaUrl ? (
              <Box
                component="img"
                src={msg.mediaUrl}
                alt="photo"
                onClick={() => window.open(msg.mediaUrl, '_blank')}
                sx={{ display: 'block', maxWidth: '100%', maxHeight: 260, objectFit: 'cover', cursor: 'pointer' }}
              />
            ) : (
              <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1.5, py: 1.25 }}>
                <ImageOutlinedIcon sx={{ color: WA_MUTED, fontSize: 28 }} />
                <Typography sx={{ color: WA_MUTED, fontSize: '0.82rem' }}>📷 Photo</Typography>
              </Stack>
            )}
            {msg.message && (
              <Typography sx={{ color: WA_TEXT, fontSize: '0.875rem', px: 1.5, pt: 0.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                {msg.message}
              </Typography>
            )}
            {timeRow}
          </>
        )}

        {/* Document */}
        {isDocument && (
          <>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 1.5, py: 1.25, minWidth: 230 }}>
              <Box sx={{ bgcolor: msg.fromMe ? '#b2dfdb' : '#e0e0e0', borderRadius: 2, p: 1, flexShrink: 0 }}>
                <InsertDriveFileIcon sx={{ color: msg.fromMe ? '#00695c' : '#455a64', fontSize: 26 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ color: WA_TEXT, fontSize: '0.82rem', fontWeight: 500 }} noWrap>
                  {msg.fileName || 'Document'}
                </Typography>
                <Typography sx={{ color: WA_MUTED, fontSize: '0.68rem' }}>
                  {msg.mimeType ? msg.mimeType.split('/').pop().toUpperCase() : 'FILE'}
                </Typography>
              </Box>
              {msg.mediaUrl && (
                <IconButton
                  size="small"
                  onClick={() => window.open(msg.mediaUrl, '_blank')}
                  sx={{ color: WA_GREEN, p: 0.5, flexShrink: 0 }}
                >
                  <DownloadIcon sx={{ fontSize: 18 }} />
                </IconButton>
              )}
            </Stack>
            {msg.message && (
              <Typography sx={{ color: WA_TEXT, fontSize: '0.875rem', px: 1.5, wordBreak: 'break-word' }}>
                {msg.message}
              </Typography>
            )}
            {timeRow}
          </>
        )}

        {/* Video */}
        {isVideo && (
          <>
            {msg.mediaUrl ? (
              <Box component="video" src={msg.mediaUrl} controls sx={{ display: 'block', maxWidth: '100%', maxHeight: 240 }} />
            ) : (
              <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1.5, py: 1.25 }}>
                <VideocamIcon sx={{ color: WA_MUTED, fontSize: 28 }} />
                <Typography sx={{ color: WA_MUTED, fontSize: '0.82rem' }}>Video</Typography>
              </Stack>
            )}
            {msg.message && (
              <Typography sx={{ color: WA_TEXT, fontSize: '0.875rem', px: 1.5, pt: 0.5, wordBreak: 'break-word' }}>
                {msg.message}
              </Typography>
            )}
            {timeRow}
          </>
        )}

        {/* Audio */}
        {isAudio && (
          <>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1.5, py: 1.25 }}>
              <HeadphonesIcon sx={{ color: WA_MUTED, fontSize: 24 }} />
              <Typography sx={{ color: WA_MUTED, fontSize: '0.82rem' }}>Voice / Audio</Typography>
            </Stack>
            {timeRow}
          </>
        )}

        {/* Plain text */}
        {!hasMedia && (
          <Box sx={{ px: 1.5, py: 1 }}>
            <Typography sx={{ color: WA_TEXT, fontSize: '0.875rem', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
              {msg.message}
            </Typography>
            {timeRow}
          </Box>
        )}
      </Box>
    </Box>
  );
});

/* ── Connection panel ────────────────────────────────────────── */
function ConnectionPanel({ status, qr, loading, isConnected, onConnect, onDisconnect }) {
  return (
    <Box sx={{ p: 3, color: WA_TEXT }}>
      <Typography sx={{ color: WA_MUTED, fontSize: '0.875rem', mb: 2 }}>
        Connect your institute's personal WhatsApp. Messages sent with 2–4s delays for policy compliance.
      </Typography>
      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1, bgcolor: WA_DIVIDER, '& .MuiLinearProgress-bar': { bgcolor: WA_LIGHT } }} />}
      {qr && (
        <Box textAlign="center" my={2.5}>
          <img src={qr} alt="WhatsApp QR" width={220} style={{ borderRadius: 12, border: `1px solid ${WA_DIVIDER}` }} />
          <Typography sx={{ color: WA_MUTED, fontSize: '0.75rem', mt: 1 }}>
            WhatsApp → Linked Devices → Link a Device → Scan
          </Typography>
        </Box>
      )}
      {isConnected && (
        <Box sx={{ bgcolor: '#dcfce7', border: '1px solid #86efac', borderRadius: 2, p: 2, mb: 2 }}>
          <Typography sx={{ color: '#15803d', fontWeight: 600, fontSize: '0.875rem' }}>✓ WhatsApp connected. Automation active.</Typography>
        </Box>
      )}
      <Stack direction="row" spacing={2}>
        {!isConnected && (
          <Button variant="contained" startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <WhatsAppIcon />}
            onClick={onConnect} disabled={loading}
            sx={{ bgcolor: WA_LIGHT, '&:hover': { bgcolor: '#1ebe57' }, '&:disabled': { bgcolor: WA_DIVIDER } }}>
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

/* ── Automation panel ────────────────────────────────────────── */
function AutomationPanel({ automation, isConnected, onToggle, instituteId }) {
  const [templates, setTemplates] = useState({});
  const [editing, setEditing]     = useState(null);
  const [editBody, setEditBody]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [snack, setSnack]         = useState(null);

  useEffect(() => {
    if (!instituteId) return;
    apiClient.get(`/api/message-templates?institute_uuid=${instituteId}`)
      .then(r => { const m = {}; (r.data?.result || []).forEach(t => { m[t.key] = t; }); setTemplates(m); })
      .catch(() => {});
  }, [instituteId]);

  async function saveTpl(key) {
    setSaving(true);
    try {
      await apiClient.put(`/api/message-templates/${key}`, { institute_uuid: instituteId, body: editBody });
      setTemplates(p => ({ ...p, [key]: { ...p[key], body: editBody, isCustom: true } }));
      setSnack({ type: 'success', text: 'Template saved!' });
      setEditing(null);
    } catch { setSnack({ type: 'error', text: 'Save failed' }); }
    finally { setSaving(false); }
  }

  async function resetTpl(key) {
    try {
      await apiClient.delete(`/api/message-templates/${key}?institute_uuid=${instituteId}`);
      const r = await apiClient.get(`/api/message-templates?institute_uuid=${instituteId}`);
      const m = {}; (r.data?.result || []).forEach(t => { m[t.key] = t; }); setTemplates(m);
      setSnack({ type: 'success', text: 'Reset to default' });
    } catch { setSnack({ type: 'error', text: 'Reset failed' }); }
  }

  return (
    <Box sx={{ p: 2 }}>
      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack?.type || 'info'} onClose={() => setSnack(null)}>{snack?.text}</Alert>
      </Snackbar>
      {!isConnected && (
        <Box sx={{ bgcolor: '#fff3cd', border: '1px solid #ffc10744', borderRadius: 2, p: 1.5, mb: 2 }}>
          <Typography sx={{ color: '#92400e', fontSize: '0.8rem' }}>Connect WhatsApp first.</Typography>
        </Box>
      )}
      <Stack spacing={1.5}>
        {AUTOMATION_JOBS.map(job => (
          <Box key={job.key} sx={{ bgcolor: WA_SURFACE, borderRadius: 2, p: 2, border: `1px solid ${automation[job.key] ? WA_LIGHT + '66' : WA_DIVIDER}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Stack direction="row" alignItems="flex-start" spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: WA_TEXT, fontWeight: 600, fontSize: '0.85rem' }}>{job.label}</Typography>
                <Typography sx={{ color: WA_MUTED, fontSize: '0.75rem', mt: 0.3 }}>{job.description}</Typography>
                {editing === job.key ? (
                  <Stack sx={{ mt: 1 }} spacing={1}>
                    <TextField multiline rows={4} size="small" value={editBody} onChange={e => setEditBody(e.target.value)}
                      placeholder="Use {{name}}, {{date}}, {{course}}, {{amount}}, {{balance}}, {{link}}"
                      sx={{ ...fieldSx, '& textarea': { fontSize: '0.78rem' } }} />
                    <Typography sx={{ color: WA_MUTED, fontSize: '0.65rem' }}>Variables: {'{{name}} {{date}} {{course}} {{amount}} {{balance}} {{link}}'}</Typography>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={() => saveTpl(job.key)} disabled={saving}
                        sx={{ bgcolor: WA_LIGHT, color: '#fff', '&:hover': { bgcolor: '#1ebe57' }, fontSize: '0.72rem' }}>
                        {saving ? 'Saving…' : 'Save'}
                      </Button>
                      <Button size="small" onClick={() => setEditing(null)} sx={{ color: WA_MUTED, fontSize: '0.72rem' }}>Cancel</Button>
                      {templates[job.key]?.isCustom && (
                        <Button size="small" color="error" onClick={() => resetTpl(job.key)} sx={{ fontSize: '0.72rem' }}>Reset</Button>
                      )}
                    </Stack>
                  </Stack>
                ) : (
                  <Box sx={{ mt: 1, bgcolor: '#f0f7ff', borderRadius: 1.5, p: 1.25, borderLeft: `3px solid ${WA_LIGHT}`, cursor: 'pointer' }}
                    onClick={() => { setEditing(job.key); setEditBody(templates[job.key]?.body || job.preview); }}>
                    <Typography sx={{ color: WA_MUTED, fontSize: '0.72rem', fontStyle: 'italic' }}>
                      "{templates[job.key]?.body || job.preview}"
                    </Typography>
                    <Typography sx={{ color: WA_GREEN, fontSize: '0.62rem', mt: 0.5 }}>
                      {templates[job.key]?.isCustom ? '✎ Custom — tap to edit' : '✎ Tap to customise'}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Switch checked={automation[job.key]} onChange={() => onToggle(job.key)}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: WA_LIGHT }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: WA_LIGHT } }} />
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

/* ── Broadcast panel ─────────────────────────────────────────── */
function BroadcastPanel({ isConnected, instituteId }) {
  const [to, setTo] = useState(''); const [msg, setMsg] = useState(''); const [sending, setSending] = useState(false);
  const [bulkNums, setBulkNums] = useState(''); const [bulkMsg, setBulkMsg] = useState('');
  const [bulkSending, setBulkSending] = useState(false); const [bulkRes, setBulkRes] = useState(null);
  const [snack, setSnack] = useState(null);

  async function sendSingle() {
    if (!to || !msg) return setSnack({ type: 'error', text: 'Enter number and message' });
    setSending(true);
    try { await apiClient.post('/api/baileys/send-text', { instituteId, to, message: msg }); setSnack({ type: 'success', text: 'Sent!' }); setTo(''); setMsg(''); }
    catch (err) { setSnack({ type: 'error', text: err.response?.data?.message || 'Failed' }); }
    finally { setSending(false); }
  }

  async function sendBulk() {
    const numbers = bulkNums.split(/[\n,]+/).map(n => n.trim()).filter(Boolean);
    if (!numbers.length || !bulkMsg) return setSnack({ type: 'error', text: 'Enter numbers and message' });
    setBulkSending(true); setBulkRes(null);
    try {
      const res = await apiClient.post('/api/baileys/send-bulk', { instituteId, numbers, message: bulkMsg });
      setBulkRes(res.data); setSnack({ type: 'success', text: `Sent: ${res.data.sent} | Failed: ${res.data.failed}` });
    } catch (err) { setSnack({ type: 'error', text: err.response?.data?.message || 'Failed' }); }
    finally { setBulkSending(false); }
  }

  return (
    <Box sx={{ p: 2 }}>
      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack?.type || 'info'} onClose={() => setSnack(null)}>{snack?.text}</Alert>
      </Snackbar>
      <Typography sx={{ color: WA_TEXT, fontWeight: 600, fontSize: '0.85rem', mb: 1 }}>Single Message</Typography>
      <Stack spacing={1.5} mb={3}>
        <TextField placeholder="Phone with country code (919876543210)" value={to} onChange={e => setTo(e.target.value)} fullWidth disabled={!isConnected} size="small" sx={fieldSx} />
        <TextField placeholder="Message" value={msg} onChange={e => setMsg(e.target.value)} multiline rows={3} fullWidth disabled={!isConnected} size="small" sx={fieldSx} />
        <Button variant="contained" startIcon={sending ? <CircularProgress size={14} color="inherit" /> : <SendIcon />} onClick={sendSingle} disabled={sending || !isConnected}
          sx={{ bgcolor: WA_LIGHT, '&:hover': { bgcolor: '#1ebe57' }, alignSelf: 'flex-start' }}>Send</Button>
      </Stack>
      <Divider sx={{ borderColor: WA_DIVIDER, my: 2 }} />
      <Typography sx={{ color: WA_TEXT, fontWeight: 600, fontSize: '0.85rem', mb: 0.5 }}>Bulk Broadcast</Typography>
      <Typography sx={{ color: WA_MUTED, fontSize: '0.72rem', mb: 1.5 }}>One number per line. 2–4s delay between messages. Only enrolled users.</Typography>
      <Stack spacing={1.5}>
        <TextField placeholder="Numbers (one per line)" value={bulkNums} onChange={e => setBulkNums(e.target.value)} multiline rows={4} fullWidth disabled={!isConnected} size="small" sx={fieldSx} />
        <TextField placeholder="Message" value={bulkMsg} onChange={e => setBulkMsg(e.target.value)} multiline rows={3} fullWidth disabled={!isConnected} size="small" sx={fieldSx} />
        {bulkSending && <LinearProgress sx={{ borderRadius: 1, bgcolor: WA_DIVIDER, '& .MuiLinearProgress-bar': { bgcolor: WA_LIGHT } }} />}
        <Button variant="contained" color="secondary" startIcon={bulkSending ? <CircularProgress size={14} color="inherit" /> : <BroadcastOnPersonalIcon />}
          onClick={sendBulk} disabled={bulkSending || !isConnected} sx={{ alignSelf: 'flex-start' }}>
          {bulkSending ? 'Sending…' : 'Broadcast'}
        </Button>
        {bulkRes && (
          <Box sx={{ bgcolor: '#f0fff4', borderRadius: 2, p: 1.5, borderLeft: `3px solid ${WA_LIGHT}`, border: `1px solid ${WA_DIVIDER}` }}>
            <Typography sx={{ color: WA_TEXT, fontSize: '0.8rem' }}>✓ Sent: {bulkRes.sent} &nbsp;|&nbsp; ✗ Failed: {bulkRes.failed}</Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
}

/* ── Magic links panel ───────────────────────────────────────── */
function MagicLinksPanel({ isConnected, instituteId }) {
  const [mobile, setMobile] = useState(''); const [userId, setUserId] = useState('');
  const [sending, setSending] = useState(false); const [snack, setSnack] = useState(null);

  async function send() {
    if (!mobile) return setSnack({ type: 'error', text: 'Enter mobile number' });
    setSending(true);
    try { await apiClient.post('/api/auth/magic-link/send', { userId: userId || undefined, mobile, instituteId }); setSnack({ type: 'success', text: 'Magic link sent!' }); setMobile(''); setUserId(''); }
    catch (err) { setSnack({ type: 'error', text: err.response?.data?.message || 'Failed' }); }
    finally { setSending(false); }
  }

  return (
    <Box sx={{ p: 2 }}>
      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack?.type || 'info'} onClose={() => setSnack(null)}>{snack?.text}</Alert>
      </Snackbar>
      <Box sx={{ bgcolor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 2, p: 1.5, mb: 2.5 }}>
        <Typography sx={{ color: '#1d4ed8', fontSize: '0.78rem' }}>
          A secure JWT link (48h) is sent via WhatsApp. The recipient clicks → auto-login → their dashboard. Sent automatically on new user creation.
        </Typography>
      </Box>
      {!isConnected && (
        <Box sx={{ bgcolor: '#fff3cd', border: '1px solid #ffc10744', borderRadius: 2, p: 1.5, mb: 2 }}>
          <Typography sx={{ color: '#92400e', fontSize: '0.8rem' }}>Connect WhatsApp first.</Typography>
        </Box>
      )}
      <Stack spacing={1.5}>
        <TextField placeholder="User ID (optional)" value={userId} onChange={e => setUserId(e.target.value)} fullWidth disabled={!isConnected} size="small" sx={fieldSx} />
        <TextField placeholder="Mobile with country code (919876543210)" value={mobile} onChange={e => setMobile(e.target.value)} fullWidth disabled={!isConnected} size="small" sx={fieldSx} />
        <Button variant="contained" startIcon={sending ? <CircularProgress size={14} color="inherit" /> : <LinkIcon />} onClick={send} disabled={sending || !isConnected}
          sx={{ bgcolor: WA_LIGHT, '&:hover': { bgcolor: '#1ebe57' }, alignSelf: 'flex-start' }}>
          {sending ? 'Sending…' : 'Send Magic Link'}
        </Button>
      </Stack>
    </Box>
  );
}

/* ── Nav item ────────────────────────────────────────────────── */
function NavItem({ icon, label, active, onClick }) {
  return (
    <Box onClick={onClick} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3, py: 1, cursor: 'pointer', color: active ? WA_GREEN : WA_MUTED, '&:hover': { color: WA_TEXT }, transition: 'color 0.15s' }}>
      {icon}
      <Typography sx={{ fontSize: '0.65rem', fontWeight: active ? 700 : 400 }}>{label}</Typography>
    </Box>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function BaileysWhatsApp() {
  const navigate = useNavigate();
  const { username } = useParams();
  const { institute } = useApp();
  const instituteId = institute?.institute_uuid || localStorage.getItem('institute_uuid') || '';

  const [nav, setNav]             = useState(0);
  const [filter, setFilter]       = useState(0);
  const [search, setSearch]       = useState('');
  const [status, setStatus]       = useState('not_started');
  const [qr, setQr]               = useState(null);
  const [loading, setLoading]     = useState(false);
  const [snack, setSnack]         = useState(null);
  const [panel, setPanel]         = useState(null);
  const [chats, setChats]         = useState([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages]   = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sendMsg, setSendMsg]     = useState('');
  const [sending, setSending]     = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [chatMenuAnchor, setChatMenuAnchor] = useState(null);
  const [isOnline, setIsOnline]   = useState(() => navigator.onLine);
  const messagesEndRef  = useRef(null);
  const pollRef         = useRef(null);
  const imageInputRef   = useRef(null);
  const docInputRef     = useRef(null);
  const [attachMenu, setAttachMenu]   = useState(null);
  const [mediaFile, setMediaFile]     = useState(null);
  const [mediaType, setMediaType]     = useState(null);

  const storageKey = `automation_${instituteId}`;
  const [automation, setAutomation] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || { followup: true, fees: true, birthday: true, magic_link: true }; }
    catch { return { followup: true, fees: true, birthday: true, magic_link: true }; }
  });

  const esRef = useRef(null);
  const isConnected = status === 'connected';

  /* Online/offline tracking */
  useEffect(() => {
    const up   = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  function toggleAutomation(key) {
    const next = { ...automation, [key]: !automation[key] };
    setAutomation(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  /* Load chat list — network first, IndexedDB fallback */
  const loadChats = useCallback(async () => {
    if (!instituteId) return;
    setChatsLoading(true);
    try {
      const res = await apiClient.get(`/api/baileys/chats/${instituteId}`);
      const data = res.data?.result || [];
      setChats(data);
      saveChats(instituteId, data).catch(() => {});
    } catch {
      const cached = await loadChatsCache(instituteId).catch(() => null);
      if (cached) setChats(cached);
      else setChats([]);
    } finally { setChatsLoading(false); }
  }, [instituteId]);

  /* Load messages — network first, IndexedDB fallback */
  const loadMessages = useCallback(async (jid) => {
    if (!jid || !instituteId) return;
    setMsgLoading(true);
    try {
      const res = await apiClient.get(`/api/baileys/messages/${instituteId}/${jid}`);
      const data = res.data?.result || [];
      setMessages(data);
      saveMessages(instituteId, jid, data).catch(() => {});
    } catch {
      const cached = await loadMessagesCache(instituteId, jid).catch(() => null);
      if (cached) setMessages(cached);
      else setMessages([]);
    } finally { setMsgLoading(false); }
  }, [instituteId]);

  /* Open a chat */
  function openChat(jid) {
    setSelectedChat(jid);
    setMessages([]);
    loadMessages(jid);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadMessages(jid), 5000);
  }

  function closeChat() {
    setSelectedChat(null);
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    loadChats();
  }

  /* Send message from chat screen */
  async function sendFromChat() {
    if (!sendMsg.trim() || !selectedChat) return;
    setSending(true);
    const text = sendMsg.trim();
    setSendMsg('');
    try {
      await apiClient.post('/api/baileys/send-text', { instituteId, to: selectedChat, message: text });
      await loadMessages(selectedChat);
    } catch (err) {
      setSnack({ type: 'error', text: err.response?.data?.message || 'Send failed' });
      setSendMsg(text);
    } finally { setSending(false); }
  }

  /* Delete chat */
  async function deleteChat(jid) {
    try {
      await apiClient.delete(`/api/baileys/messages/${instituteId}/${jid}`);
      closeChat();
      loadChats();
    } catch { setSnack({ type: 'error', text: 'Delete failed' }); }
  }

  /* Media attachment helpers */
  function handleFileSelect(e, type) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaType(type);
    e.target.value = '';
  }

  function clearMedia() { setMediaFile(null); setMediaType(null); }

  async function sendMediaFile() {
    if (!mediaFile || !selectedChat) return;
    setSending(true);
    try {
      const form = new FormData();
      form.append('file', mediaFile);
      form.append('instituteId', instituteId);
      form.append('to', selectedChat);
      form.append('caption', sendMsg.trim());
      await apiClient.post('/api/baileys/send-media', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      clearMedia();
      setSendMsg('');
      await loadMessages(selectedChat);
    } catch (err) {
      setSnack({ type: 'error', text: err.response?.data?.message || 'Send failed' });
    } finally { setSending(false); }
  }

  /* Connection */
  function startSession() {
    if (!instituteId) return;
    if (esRef.current) esRef.current.close();
    setLoading(true); setQr(null); setStatus('connecting');
    const baseUrl = import.meta.env.VITE_BASE_URL || '';
    const es = new EventSource(`${baseUrl}/api/baileys/session/${instituteId}/qr`);
    esRef.current = es;
    es.addEventListener('qr', e => { setQr(JSON.parse(e.data).qr); setLoading(false); });
    es.addEventListener('status', e => {
      const d = JSON.parse(e.data);
      setStatus(d.status);
      if (d.status === 'connected') { setQr(null); setLoading(false); es.close(); setSnack({ type: 'success', text: 'WhatsApp connected!' }); loadChats(); }
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
      .then(r => { setStatus(r.data?.status || 'not_started'); if (r.data?.status === 'connected') loadChats(); })
      .catch(() => {});
    return () => {
      if (esRef.current) esRef.current.close();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [instituteId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const filteredChats = chats.filter(c => {
    if (search && !c._id.includes(search.replace(/\D/g, ''))) return false;
    if (filter === 1) return c.unread > 0;
    return true;
  });

  /* ── Offline banner ─────────────────────────────────────────── */
  const offlineBanner = !isOnline && (
    <Box sx={{ bgcolor: '#fff3cd', px: 2, py: 0.75, display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
      <WifiOffIcon sx={{ fontSize: 15, color: '#d97706' }} />
      <Typography sx={{ color: '#92400e', fontSize: '0.72rem' }}>No internet — showing cached data</Typography>
    </Box>
  );

  /* ── Sub-panel view ─────────────────────────────────────────── */
  if (panel) {
    const titles = { connect: 'Connection', automation: 'Automation & Templates', broadcast: 'Broadcast', magic: 'Magic Links' };
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: WA_BG }}>
        <Box sx={{ bgcolor: WA_GREEN, px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
          <IconButton onClick={() => setPanel(null)} sx={{ color: '#fff', p: 0.5 }}><ArrowBackIcon /></IconButton>
          <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '1rem' }}>{titles[panel]}</Typography>
        </Box>
        {offlineBanner}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {panel === 'connect' && <ConnectionPanel status={status} qr={qr} loading={loading} isConnected={isConnected} onConnect={startSession} onDisconnect={disconnect} />}
          {panel === 'automation' && <AutomationPanel automation={automation} isConnected={isConnected} onToggle={toggleAutomation} instituteId={instituteId} />}
          {panel === 'broadcast' && <BroadcastPanel isConnected={isConnected} instituteId={instituteId} />}
          {panel === 'magic' && <MagicLinksPanel isConnected={isConnected} instituteId={instituteId} />}
        </Box>
      </Box>
    );
  }

  /* ── Chat / conversation screen ────────────────────────────── */
  if (selectedChat) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: WA_CHAT_BG }}>
        {/* Chat header */}
        <Box sx={{ bgcolor: WA_GREEN, px: 1.5, py: 1, display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
          <IconButton onClick={closeChat} sx={{ color: '#fff', p: 0.5 }}><ArrowBackIcon /></IconButton>
          <Avatar sx={{ bgcolor: avatarColor(selectedChat), width: 38, height: 38, fontSize: '0.9rem', fontWeight: 700 }}>
            {selectedChat[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.925rem' }} noWrap>+{selectedChat}</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.72rem' }}>{isConnected ? 'WhatsApp contact' : 'Not connected'}</Typography>
          </Box>
          <IconButton sx={{ color: 'rgba(255,255,255,0.85)' }}><PhoneIcon fontSize="small" /></IconButton>
          <IconButton sx={{ color: 'rgba(255,255,255,0.85)' }}><VideocamIcon fontSize="small" /></IconButton>
          <IconButton sx={{ color: 'rgba(255,255,255,0.85)' }} onClick={e => setChatMenuAnchor(e.currentTarget)}><MoreVertIcon fontSize="small" /></IconButton>
        </Box>

        {offlineBanner}

        {/* Chat context menu */}
        <Menu anchorEl={chatMenuAnchor} open={!!chatMenuAnchor} onClose={() => setChatMenuAnchor(null)}
          PaperProps={{ sx: { bgcolor: WA_SURFACE, color: WA_TEXT, minWidth: 180, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' } }}>
          <MenuItem onClick={() => { setChatMenuAnchor(null); setPanel('broadcast'); setSelectedChat(null); }}>
            <ListItemIcon><SendIcon sx={{ color: WA_MUTED, fontSize: 18 }} /></ListItemIcon>
            <ListItemText>Send New Message</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setChatMenuAnchor(null); deleteChat(selectedChat); }} sx={{ color: '#ef4444' }}>
            <ListItemIcon><DeleteOutlineIcon sx={{ color: '#ef4444', fontSize: 18 }} /></ListItemIcon>
            <ListItemText>Clear Chat</ListItemText>
          </MenuItem>
        </Menu>

        {/* Messages area */}
        <Box sx={{ flex: 1, overflowY: 'auto', py: 1, bgcolor: WA_CHAT_BG }}>
          {msgLoading && <Box textAlign="center" pt={3}><CircularProgress size={24} sx={{ color: WA_GREEN }} /></Box>}
          {!msgLoading && messages.length === 0 && (
            <Box sx={{ textAlign: 'center', pt: 6 }}>
              <Typography sx={{ color: WA_MUTED, fontSize: '0.875rem' }}>No messages yet</Typography>
              <Typography sx={{ color: WA_MUTED, fontSize: '0.75rem', mt: 0.5 }}>Send a message to start the conversation</Typography>
            </Box>
          )}
          {messages.map((m, i) => <Bubble key={m._id || i} msg={m} />)}
          <div ref={messagesEndRef} />
        </Box>

        {/* Hidden file inputs */}
        <input ref={imageInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }}
          onChange={e => handleFileSelect(e, e.target.files?.[0]?.type?.startsWith('video/') ? 'video' : 'image')} />
        <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" style={{ display: 'none' }}
          onChange={e => handleFileSelect(e, 'document')} />

        {/* Attach menu */}
        <Menu anchorEl={attachMenu} open={!!attachMenu} onClose={() => setAttachMenu(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          PaperProps={{ sx: { bgcolor: WA_SURFACE, color: WA_TEXT, minWidth: 180, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' } }}>
          <MenuItem onClick={() => { imageInputRef.current?.click(); setAttachMenu(null); }}>
            <ListItemIcon><ImageOutlinedIcon sx={{ color: '#a855f7', fontSize: 20 }} /></ListItemIcon>
            <ListItemText>Photo / Video</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { docInputRef.current?.click(); setAttachMenu(null); }}>
            <ListItemIcon><InsertDriveFileIcon sx={{ color: '#3b82f6', fontSize: 20 }} /></ListItemIcon>
            <ListItemText>Document</ListItemText>
          </MenuItem>
        </Menu>

        {/* Media preview bar */}
        {mediaFile && (
          <Box sx={{ bgcolor: WA_BG, px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1.5, borderTop: `1px solid ${WA_DIVIDER}`, flexShrink: 0 }}>
            {mediaType === 'image' ? (
              <Box
                component="img"
                src={URL.createObjectURL(mediaFile)}
                alt="preview"
                sx={{ height: 56, width: 56, objectFit: 'cover', borderRadius: 1.5, flexShrink: 0 }}
              />
            ) : mediaType === 'video' ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: WA_DIVIDER, borderRadius: 1.5, px: 1.5, py: 1, flex: 1 }}>
                <VideocamIcon sx={{ color: WA_MUTED, fontSize: 22 }} />
                <Typography sx={{ color: WA_TEXT, fontSize: '0.8rem' }} noWrap>{mediaFile.name}</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: WA_DIVIDER, borderRadius: 1.5, px: 1.5, py: 1, flex: 1 }}>
                <InsertDriveFileIcon sx={{ color: '#1d4ed8', fontSize: 22 }} />
                <Typography sx={{ color: WA_TEXT, fontSize: '0.8rem' }} noWrap>{mediaFile.name}</Typography>
              </Box>
            )}
            <IconButton size="small" onClick={clearMedia} sx={{ color: WA_MUTED, ml: 'auto' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        {/* Input bar */}
        <Box sx={{ bgcolor: WA_BG, px: 1.5, py: 1, display: 'flex', alignItems: 'flex-end', gap: 1, flexShrink: 0 }}>
          <IconButton
            onClick={e => setAttachMenu(e.currentTarget)}
            disabled={!isConnected}
            sx={{ color: WA_MUTED, mb: 0.25, '&:hover': { color: WA_TEXT } }}
          >
            <AttachFileIcon fontSize="small" />
          </IconButton>
          <TextField
            value={sendMsg} onChange={e => setSendMsg(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); mediaFile ? sendMediaFile() : sendFromChat(); } }}
            placeholder={mediaFile ? 'Add a caption…' : 'Message'} multiline maxRows={5} fullWidth
            disabled={!isConnected}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: WA_SURFACE, color: WA_TEXT, borderRadius: 3,
                '& fieldset': { border: 'none' },
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              },
              '& .MuiInputBase-input::placeholder': { color: WA_MUTED, opacity: 1 },
            }}
          />
          <IconButton
            onClick={mediaFile ? sendMediaFile : sendFromChat}
            disabled={(!sendMsg.trim() && !mediaFile) || !isConnected || sending}
            sx={{ bgcolor: WA_LIGHT, color: '#fff', '&:hover': { bgcolor: '#1ebe57' }, '&:disabled': { bgcolor: WA_DIVIDER }, flexShrink: 0, width: 44, height: 44 }}>
            {sending ? <CircularProgress size={18} color="inherit" /> : <SendIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>
    );
  }

  /* ── Main home screen ────────────────────────────────────────── */
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: WA_BG }}>
      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack?.type || 'info'} onClose={() => setSnack(null)}>{snack?.text}</Alert>
      </Snackbar>

      {/* Header */}
      {nav === 0 && (
        <Box sx={{ bgcolor: WA_GREEN, px: 2, pt: 2, pb: 1, flexShrink: 0 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <IconButton size="small" onClick={() => navigate(`/${username}`)} sx={{ color: 'rgba(255,255,255,0.85)', p: 0.5 }}>
                <ArrowBackIosNewIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem' }}>WhatsApp</Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Chip size="small" label={isConnected ? '● Connected' : '○ Offline'}
                sx={{ bgcolor: isConnected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)', color: isConnected ? '#dcfce7' : 'rgba(255,255,255,0.7)', fontSize: '0.65rem', height: 22 }} />
              <IconButton sx={{ color: 'rgba(255,255,255,0.85)', p: 0.75 }} size="small" onClick={e => setMenuAnchor(e.currentTarget)}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>

          {/* Search */}
          <TextField value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search" size="small" fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 18 }} /></InputAdornment> }}
            sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 3, color: '#fff', '& fieldset': { border: 'none' } }, '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.6)', opacity: 1 }, mb: 1 }}
          />

          {/* Filter pills */}
          <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
            {FILTERS.map((f, i) => (
              <Chip key={f} label={f} size="small" onClick={() => setFilter(i)}
                sx={{ bgcolor: filter === i ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: filter === i ? 700 : 400, fontSize: '0.72rem', flexShrink: 0, cursor: 'pointer' }} />
            ))}
          </Stack>
        </Box>
      )}

      {nav !== 0 && (
        <Box sx={{ bgcolor: WA_GREEN, px: 1.5, py: 1.25, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={() => setNav(0)} sx={{ color: 'rgba(255,255,255,0.85)', p: 0.5 }}>
            <ArrowBackIosNewIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>
            {nav === 1 ? 'Automation' : nav === 2 ? 'Broadcast' : 'Settings'}
          </Typography>
        </Box>
      )}

      {offlineBanner}

      {/* 3-dot dropdown menu */}
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}
        PaperProps={{ sx: { bgcolor: WA_SURFACE, color: WA_TEXT, minWidth: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' } }}>
        <MenuItem onClick={() => { setMenuAnchor(null); setPanel('broadcast'); }}>
          <ListItemIcon><AddIcon sx={{ color: WA_MUTED, fontSize: 18 }} /></ListItemIcon>
          <ListItemText>New Message</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setMenuAnchor(null); loadChats(); }}>
          <ListItemIcon><AutorenewIcon sx={{ color: WA_MUTED, fontSize: 18 }} /></ListItemIcon>
          <ListItemText>Refresh Chats</ListItemText>
        </MenuItem>
        <Divider sx={{ borderColor: WA_DIVIDER }} />
        <MenuItem onClick={() => { setMenuAnchor(null); setPanel('connect'); }}>
          <ListItemIcon><QrCodeIcon sx={{ color: WA_MUTED, fontSize: 18 }} /></ListItemIcon>
          <ListItemText>Linked Devices / QR</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setMenuAnchor(null); setPanel('automation'); }}>
          <ListItemIcon><AutorenewIcon sx={{ color: WA_MUTED, fontSize: 18 }} /></ListItemIcon>
          <ListItemText>Automation & Templates</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setMenuAnchor(null); setPanel('magic'); }}>
          <ListItemIcon><LinkIcon sx={{ color: WA_MUTED, fontSize: 18 }} /></ListItemIcon>
          <ListItemText>Magic Links</ListItemText>
        </MenuItem>
        <Divider sx={{ borderColor: WA_DIVIDER }} />
        <MenuItem onClick={() => { setMenuAnchor(null); setNav(3); }}>
          <ListItemIcon><SettingsIcon sx={{ color: WA_MUTED, fontSize: 18 }} /></ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
      </Menu>

      {/* Body */}
      <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: WA_SURFACE }}>

        {/* Chats tab */}
        {nav === 0 && (
          <>

            {chatsLoading && <Box textAlign="center" pt={3}><CircularProgress size={24} sx={{ color: WA_GREEN }} /></Box>}

            {!chatsLoading && filteredChats.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <WhatsAppIcon sx={{ fontSize: 48, color: WA_DIVIDER, mb: 1.5 }} />
                <Typography sx={{ color: WA_TEXT, fontWeight: 600, mb: 0.5 }}>No chats yet</Typography>
                <Typography sx={{ color: WA_MUTED, fontSize: '0.8rem', mb: 2 }}>
                  {isConnected ? 'Messages you send will appear here.' : 'Connect WhatsApp to see your chats.'}
                </Typography>
                {!isConnected && (
                  <Button variant="contained" size="small" startIcon={<WhatsAppIcon />} onClick={() => setPanel('connect')}
                    sx={{ bgcolor: WA_LIGHT, '&:hover': { bgcolor: '#1ebe57' } }}>
                    Connect WhatsApp
                  </Button>
                )}
              </Box>
            )}

            {filteredChats.map(c => <ChatRow key={c._id} chat={c} onClick={() => openChat(c._id)} />)}
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
              ].map(item => (
                <Box key={item.label} onClick={item.action} sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: WA_SURFACE, borderRadius: 2, p: 2, cursor: 'pointer', border: `1px solid ${WA_DIVIDER}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', '&:hover': { border: `1px solid ${WA_LIGHT}66`, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' } }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: `${WA_LIGHT}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color || WA_LIGHT, flexShrink: 0 }}>{item.icon}</Box>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: WA_SURFACE, borderRadius: 2, p: 2, border: `1px solid ${WA_DIVIDER}`, mb: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <Avatar sx={{ bgcolor: WA_GREEN, width: 56, height: 56 }}><WhatsAppIcon /></Avatar>
              <Box>
                <Typography sx={{ color: WA_TEXT, fontWeight: 600 }}>{institute?.institute_name || 'Your Institute'}</Typography>
                <Typography sx={{ color: WA_MUTED, fontSize: '0.8rem' }}>{isConnected ? '● WhatsApp Connected' : '○ Not Connected'}</Typography>
              </Box>
            </Box>

            <Stack spacing={1}>
              {[
                { label: 'Linked Devices / QR Code', icon: <QrCodeIcon />, action: () => setPanel('connect') },
                { label: 'Automation & Templates', icon: <AutorenewIcon />, action: () => setPanel('automation') },
                { label: 'Broadcast Messages', icon: <BroadcastOnPersonalIcon />, action: () => setPanel('broadcast') },
                { label: 'Magic Link Settings', icon: <LinkIcon />, action: () => setPanel('magic') },
              ].map(item => (
                <Box key={item.label} onClick={item.action} sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: WA_SURFACE, borderRadius: 2, p: 1.75, cursor: 'pointer', border: `1px solid ${WA_DIVIDER}`, '&:hover': { border: `1px solid #aebac1`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } }}>
                  <Box sx={{ color: WA_MUTED }}>{item.icon}</Box>
                  <Typography sx={{ color: WA_TEXT, fontSize: '0.875rem', flex: 1 }}>{item.label}</Typography>
                  <Typography sx={{ color: WA_MUTED }}>›</Typography>
                </Box>
              ))}
            </Stack>

            <Box sx={{ mt: 3, p: 2, bgcolor: WA_BG, borderRadius: 2, border: `1px solid ${WA_DIVIDER}` }}>
              <Typography sx={{ color: WA_MUTED, fontSize: '0.75rem', mb: 1 }}>Rate Limiting</Typography>
              <Typography sx={{ color: WA_TEXT, fontSize: '0.8rem' }}>Max 20 messages / minute · 2–4s delay between messages · Only enrolled users</Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* FAB */}
      {nav === 0 && (
        <Fab size="medium" onClick={() => setPanel('broadcast')}
          sx={{ position: 'absolute', bottom: 76, right: 16, bgcolor: WA_LIGHT, color: '#fff', '&:hover': { bgcolor: '#1ebe57' }, boxShadow: '0 4px 16px rgba(37,211,102,0.4)' }}>
          <AddIcon />
        </Fab>
      )}

      {/* Bottom Nav */}
      <Box sx={{ bgcolor: WA_SURFACE, borderTop: `1px solid ${WA_DIVIDER}`, display: 'flex', flexShrink: 0, boxShadow: '0 -1px 8px rgba(0,0,0,0.06)' }}>
        <NavItem icon={<ChatBubbleOutlineIcon fontSize="small" />} label="Chats" active={nav === 0} onClick={() => { setNav(0); if (isConnected) loadChats(); }} />
        <NavItem icon={<AutorenewIcon fontSize="small" />} label="Automation" active={nav === 1} onClick={() => setNav(1)} />
        <NavItem icon={<BroadcastOnPersonalIcon fontSize="small" />} label="Broadcast" active={nav === 2} onClick={() => setNav(2)} />
        <NavItem icon={<SettingsIcon fontSize="small" />} label="Settings" active={nav === 3} onClick={() => setNav(3)} />
      </Box>
    </Box>
  );
}
