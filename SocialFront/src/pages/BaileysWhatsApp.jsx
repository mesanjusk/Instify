/**
 * WhatsApp Automation Hub
 * Three tabs: Connection | Automation | Broadcast
 * Uses Baileys (personal WhatsApp) per institute.
 * Rate-limited bulk sends to comply with WhatsApp usage policies.
 */

import { useState, useEffect, useRef } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider,
  FormControlLabel, LinearProgress, MenuItem, Select, Stack,
  Switch, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SendIcon from '@mui/icons-material/Send';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import BroadcastOnPersonalIcon from '@mui/icons-material/BroadcastOnPersonal';
import LinkIcon from '@mui/icons-material/Link';
import { useApp } from '../context/AppContext';
import apiClient from '../apiClient';

const STATUS_COLOR = { not_started: 'default', connecting: 'warning', qr: 'info', connected: 'success', disconnected: 'error', logged_out: 'error' };
const STATUS_LABEL = { not_started: 'Not Connected', connecting: 'Connecting…', qr: 'Scan QR Code', connected: '● Connected', disconnected: 'Disconnected', logged_out: 'Logged Out' };

const AUTOMATION_JOBS = [
  {
    key: 'followup',
    label: 'Follow-up Reminders',
    description: 'Daily 9:00 AM — reminds leads with follow-up scheduled today',
    preview: 'Hello [Name], this is a reminder for your follow-up today regarding the [Course] enquiry. Please contact us. – Instify',
  },
  {
    key: 'fees',
    label: 'Fee Due Alerts',
    description: 'Daily 10:00 AM — alerts students with overdue or upcoming fee instalments',
    preview: 'Dear [Name], your fee instalment of ₹[Amount] was due on [Date]. Outstanding: ₹[Balance]. Please clear dues. – Instify',
  },
  {
    key: 'birthday',
    label: 'Birthday Wishes',
    description: 'Daily 8:00 AM — sends birthday greetings to students',
    preview: '🎂 Happy Birthday, [Name]! Wishing you a wonderful day. – Instify Team',
  },
  {
    key: 'magic_link',
    label: 'Magic Access Links (on new user)',
    description: 'Sends a one-click login link via WhatsApp when a teacher or student is created',
    preview: 'Hello [Name], your Instify account is ready. Click to access: [LINK] (valid 48h). – Instify',
  },
];

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

export default function BaileysWhatsApp() {
  const { institute } = useApp();
  const instituteId = institute?.institute_uuid || localStorage.getItem('institute_uuid') || '';

  const [tab, setTab] = useState(0);
  const [status, setStatus] = useState('not_started');
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Automation toggles (stored in localStorage per institute)
  const storageKey = `automation_${instituteId}`;
  const [automation, setAutomation] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || { followup: true, fees: true, birthday: true, magic_link: true }; } catch { return { followup: true, fees: true, birthday: true, magic_link: true }; }
  });

  // Single message
  const [toNumber, setToNumber] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Magic link sender
  const [magicMobile, setMagicMobile] = useState('');
  const [magicUserId, setMagicUserId] = useState('');
  const [sendingMagic, setSendingMagic] = useState(false);

  // Bulk broadcast
  const [bulkNumbers, setBulkNumbers] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);
  const [bulkProgress, setBulkProgress] = useState(0);

  const esRef = useRef(null);

  function showAlert(type, text) {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 5000);
  }

  function toggleAutomation(key) {
    const next = { ...automation, [key]: !automation[key] };
    setAutomation(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  function startSession() {
    if (!instituteId) { showAlert('error', 'Institute not found'); return; }
    if (esRef.current) esRef.current.close();
    setLoading(true);
    setQr(null);
    setStatus('connecting');

    const baseUrl = import.meta.env.VITE_BASE_URL || '';
    const es = new EventSource(`${baseUrl}/api/baileys/session/${instituteId}/qr`);
    esRef.current = es;

    es.addEventListener('qr', (e) => {
      const d = JSON.parse(e.data);
      setQr(d.qr);
      setLoading(false);
    });

    es.addEventListener('status', (e) => {
      const d = JSON.parse(e.data);
      setStatus(d.status);
      if (d.status === 'connected') {
        setQr(null);
        setLoading(false);
        es.close();
        showAlert('success', 'WhatsApp connected! Automation is now active.');
      }
      if (d.status === 'disconnected' || d.status === 'logged_out') setLoading(false);
    });

    es.addEventListener('error', (e) => {
      try { const d = JSON.parse(e.data); showAlert('error', d.message || 'Connection error'); } catch (_) {}
      setLoading(false);
      es.close();
    });

    es.onerror = () => setLoading(false);
  }

  async function disconnect() {
    try {
      if (esRef.current) { esRef.current.close(); esRef.current = null; }
      await apiClient.delete(`/api/baileys/session/${instituteId}`);
      setStatus('not_started');
      setQr(null);
      showAlert('info', 'WhatsApp disconnected');
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Disconnect failed');
    }
  }

  async function sendSingle() {
    if (!toNumber || !message) return showAlert('error', 'Enter phone number and message');
    setSending(true);
    try {
      await apiClient.post('/api/baileys/send-text', { instituteId, to: toNumber, message });
      showAlert('success', 'Message sent!');
      setToNumber('');
      setMessage('');
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Send failed');
    } finally {
      setSending(false);
    }
  }

  async function sendMagicLink() {
    if (!magicMobile) return showAlert('error', 'Enter mobile number');
    setSendingMagic(true);
    try {
      await apiClient.post('/api/auth/magic-link/send', { userId: magicUserId || undefined, mobile: magicMobile, instituteId });
      showAlert('success', 'Magic link sent via WhatsApp!');
      setMagicMobile('');
      setMagicUserId('');
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to send magic link');
    } finally {
      setSendingMagic(false);
    }
  }

  async function sendBulk() {
    const numbers = bulkNumbers.split(/[\n,]+/).map(n => n.trim()).filter(Boolean);
    if (!numbers.length || !bulkMessage) return showAlert('error', 'Enter numbers and message');
    setBulkSending(true);
    setBulkResults(null);
    setBulkProgress(0);
    try {
      const res = await apiClient.post('/api/baileys/send-bulk', { instituteId, numbers, message: bulkMessage });
      setBulkResults(res.data);
      setBulkProgress(100);
      showAlert('success', `Sent: ${res.data.sent} | Failed: ${res.data.failed}`);
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Broadcast failed');
    } finally {
      setBulkSending(false);
    }
  }

  useEffect(() => {
    if (!instituteId) return;
    apiClient.get(`/api/baileys/session/${instituteId}/status`)
      .then(r => setStatus(r.data?.status || 'not_started'))
      .catch(() => {});
    return () => { if (esRef.current) esRef.current.close(); };
  }, [instituteId]);

  const isConnected = status === 'connected';

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
        <WhatsAppIcon sx={{ fontSize: 30, color: '#25d366' }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700}>WhatsApp Automation Hub</Typography>
          <Typography variant="caption" color="text.secondary">Personal WhatsApp via Baileys — policy-safe with rate limiting</Typography>
        </Box>
        <Chip
          label={STATUS_LABEL[status] || status}
          color={STATUS_COLOR[status] || 'default'}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      </Stack>

      {alert && <Alert severity={alert.type} sx={{ mb: 2 }} onClose={() => setAlert(null)}>{alert.text}</Alert>}

      {/* Tabs */}
      <Card>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: '1px solid #e2e8f0', px: 2 }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Connection" icon={<WhatsAppIcon fontSize="small" />} iconPosition="start" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 52 }} />
          <Tab label="Automation" icon={<AutorenewIcon fontSize="small" />} iconPosition="start" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 52 }} />
          <Tab label="Broadcast" icon={<BroadcastOnPersonalIcon fontSize="small" />} iconPosition="start" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 52 }} />
          <Tab label="Magic Links" icon={<LinkIcon fontSize="small" />} iconPosition="start" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 52 }} />
        </Tabs>

        <CardContent sx={{ p: { xs: 2, md: 3 } }}>

          {/* Tab 0 — Connection */}
          <TabPanel value={tab} index={0}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Connect your institute's personal WhatsApp by scanning the QR code. Each institute connects their own number. Messages are sent with a 2–4s delay between them to stay within safe usage limits.
            </Typography>

            {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

            {qr && (
              <Box textAlign="center" my={2.5}>
                <img src={qr} alt="WhatsApp QR Code" width={220} style={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Typography variant="caption" display="block" mt={1} color="text.secondary">
                  Open WhatsApp → Linked Devices → Link a Device → Scan QR
                </Typography>
              </Box>
            )}

            {isConnected && (
              <Box sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2, p: 2, mb: 2 }}>
                <Typography variant="body2" color="#15803d" fontWeight={600}>
                  ✓ WhatsApp is connected. Automated reminders are active.
                </Typography>
              </Box>
            )}

            <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
              {!isConnected && (
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <WhatsAppIcon />}
                  onClick={startSession}
                  disabled={loading}
                  sx={{ bgcolor: '#25d366', '&:hover': { bgcolor: '#1ebe57' } }}
                >
                  {status === 'not_started' ? 'Connect WhatsApp' : 'Reconnect'}
                </Button>
              )}
              {isConnected && (
                <Button variant="outlined" color="error" startIcon={<LinkOffIcon />} onClick={disconnect}>
                  Disconnect
                </Button>
              )}
            </Stack>
          </TabPanel>

          {/* Tab 1 — Automation */}
          <TabPanel value={tab} index={1}>
            <Typography variant="body2" color="text.secondary" mb={2.5}>
              Toggle automated WhatsApp messages. These run as scheduled jobs on the server and only send to enrolled users — no cold outreach. All messages use predefined templates.
            </Typography>

            {!isConnected && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                WhatsApp is not connected. Connect first to activate automation.
              </Alert>
            )}

            <Stack spacing={2}>
              {AUTOMATION_JOBS.map((job) => (
                <Card key={job.key} variant="outlined" sx={{ borderColor: automation[job.key] ? 'primary.light' : '#e2e8f0' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack direction="row" alignItems="flex-start" spacing={2}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>{job.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{job.description}</Typography>
                        <Box sx={{ mt: 1, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1.5, p: 1.25 }}>
                          <Typography variant="caption" color="text.secondary" fontStyle="italic">
                            "{job.preview}"
                          </Typography>
                        </Box>
                      </Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={automation[job.key]}
                            onChange={() => toggleAutomation(job.key)}
                            color="success"
                          />
                        }
                        label=""
                        sx={{ m: 0, flexShrink: 0 }}
                      />
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </TabPanel>

          {/* Tab 2 — Broadcast */}
          <TabPanel value={tab} index={2}>
            {!isConnected && (
              <Alert severity="warning" sx={{ mb: 2 }}>Connect WhatsApp first to send messages.</Alert>
            )}

            <Typography variant="subtitle2" fontWeight={600} mb={0.5}>Single Message</Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
              Send to one number (with country code, e.g. 919876543210)
            </Typography>
            <Stack spacing={1.5} mb={3}>
              <TextField
                label="Phone number with country code"
                value={toNumber}
                onChange={e => setToNumber(e.target.value)}
                fullWidth
                disabled={!isConnected}
              />
              <TextField
                label="Message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                multiline rows={3}
                fullWidth
                disabled={!isConnected}
              />
              <Box>
                <Button
                  startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                  onClick={sendSingle}
                  disabled={sending || !isConnected}
                >
                  Send Message
                </Button>
              </Box>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" fontWeight={600} mb={0.5}>Bulk Broadcast</Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
              One number per line or comma-separated. Messages sent with 2–4s delay to stay within safe limits. Only send to users who have opted in (enrolled students/staff).
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                label="Phone numbers (one per line)"
                value={bulkNumbers}
                onChange={e => setBulkNumbers(e.target.value)}
                multiline rows={4}
                fullWidth
                disabled={!isConnected}
                placeholder="919876543210&#10;918765432109"
              />
              <TextField
                label="Message"
                value={bulkMessage}
                onChange={e => setBulkMessage(e.target.value)}
                multiline rows={3}
                fullWidth
                disabled={!isConnected}
              />
              {bulkSending && (
                <LinearProgress variant="determinate" value={bulkProgress} sx={{ borderRadius: 1 }} />
              )}
              <Box>
                <Button
                  color="secondary"
                  startIcon={bulkSending ? <CircularProgress size={16} color="inherit" /> : <BroadcastOnPersonalIcon />}
                  onClick={sendBulk}
                  disabled={bulkSending || !isConnected}
                >
                  {bulkSending ? 'Sending…' : 'Broadcast'}
                </Button>
              </Box>
              {bulkResults && (
                <Alert severity={bulkResults.failed > 0 ? 'warning' : 'success'}>
                  Sent: {bulkResults.sent} &nbsp;|&nbsp; Failed: {bulkResults.failed}
                </Alert>
              )}
            </Stack>
          </TabPanel>

          {/* Tab 3 — Magic Links */}
          <TabPanel value={tab} index={3}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Send a one-click login link to a teacher or student via WhatsApp. They click the link and are automatically logged in to their role-specific dashboard — no password needed.
            </Typography>
            <Box sx={{ bgcolor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 2, p: 2, mb: 2.5 }}>
              <Typography variant="caption" color="#0369a1">
                <strong>How it works:</strong> A secure JWT token (48h expiry) is generated and sent as a link. The recipient clicks it → auto-login → lands on their dashboard. Automatically sent when you create a new user account.
              </Typography>
            </Box>

            {!isConnected && (
              <Alert severity="warning" sx={{ mb: 2 }}>Connect WhatsApp first to send magic links.</Alert>
            )}

            <Stack spacing={1.5}>
              <TextField
                label="User ID (optional — leave blank to just send a link)"
                value={magicUserId}
                onChange={e => setMagicUserId(e.target.value)}
                fullWidth
                disabled={!isConnected}
              />
              <TextField
                label="Mobile number with country code (e.g. 919876543210)"
                value={magicMobile}
                onChange={e => setMagicMobile(e.target.value)}
                fullWidth
                disabled={!isConnected}
              />
              <Box>
                <Button
                  startIcon={sendingMagic ? <CircularProgress size={16} color="inherit" /> : <LinkIcon />}
                  onClick={sendMagicLink}
                  disabled={sendingMagic || !isConnected}
                >
                  {sendingMagic ? 'Sending…' : 'Send Magic Link'}
                </Button>
              </Box>
            </Stack>
          </TabPanel>

        </CardContent>
      </Card>
    </Box>
  );
}
