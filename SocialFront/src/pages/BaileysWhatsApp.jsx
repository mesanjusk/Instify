/**
 * Baileys WhatsApp Page
 * QR-scan based WhatsApp connection for the institute.
 * Connects via Server-Sent Events, shows QR, then a send interface once connected.
 */

import { useState, useEffect, useRef } from 'react';
import {
  Box, Button, Card, CardContent, Chip, CircularProgress,
  Divider, Stack, TextField, Typography, Alert, LinearProgress,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SendIcon from '@mui/icons-material/Send';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { useApp } from '../context/AppContext';
import apiClient from '../apiClient';

const STATUS_COLOR = {
  not_started: 'default',
  connecting: 'warning',
  qr: 'info',
  connected: 'success',
  disconnected: 'error',
  logged_out: 'error',
};

const STATUS_LABEL = {
  not_started: 'Not Started',
  connecting: 'Connecting…',
  qr: 'Scan QR Code',
  connected: 'Connected',
  disconnected: 'Disconnected',
  logged_out: 'Logged Out',
};

export default function BaileysWhatsApp() {
  const { institute } = useApp();
  const instituteId = institute?.institute_uuid || localStorage.getItem('institute_uuid') || '';

  const [status, setStatus] = useState('not_started');
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Send single message
  const [toNumber, setToNumber] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Bulk message
  const [bulkNumbers, setBulkNumbers] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);

  const esRef = useRef(null);

  function showAlert(type, text) {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 5000);
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
      const data = JSON.parse(e.data);
      setQr(data.qr);
      setLoading(false);
    });

    es.addEventListener('status', (e) => {
      const data = JSON.parse(e.data);
      setStatus(data.status);
      if (data.status === 'connected') {
        setQr(null);
        setLoading(false);
        es.close();
        showAlert('success', 'WhatsApp connected successfully!');
      }
      if (data.status === 'disconnected' || data.status === 'logged_out') {
        setLoading(false);
      }
    });

    es.addEventListener('error', (e) => {
      try {
        const data = JSON.parse(e.data);
        showAlert('error', data.message || 'Connection error');
      } catch (_) { /* SSE close */ }
      setLoading(false);
      es.close();
    });

    es.onerror = () => {
      setLoading(false);
    };
  }

  async function disconnect() {
    try {
      if (esRef.current) { esRef.current.close(); esRef.current = null; }
      await apiClient.delete(`/api/baileys/session/${instituteId}`);
      setStatus('not_started');
      setQr(null);
      showAlert('success', 'Disconnected');
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Disconnect failed');
    }
  }

  async function sendMessage() {
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

  async function sendBulk() {
    const numbers = bulkNumbers.split(/[\n,]+/).map(n => n.trim()).filter(Boolean);
    if (!numbers.length || !bulkMessage) return showAlert('error', 'Enter numbers and message');
    setBulkSending(true);
    setBulkResults(null);
    try {
      const res = await apiClient.post('/api/baileys/send-bulk', { instituteId, numbers, message: bulkMessage });
      setBulkResults(res.data);
      showAlert('success', `Sent: ${res.data.sent}, Failed: ${res.data.failed}`);
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Bulk send failed');
    } finally {
      setBulkSending(false);
    }
  }

  useEffect(() => {
    return () => { if (esRef.current) esRef.current.close(); };
  }, []);

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', py: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <WhatsAppIcon color="success" sx={{ fontSize: 32 }} />
        <Typography variant="h5" fontWeight={700}>WhatsApp (Personal)</Typography>
        <Chip
          label={STATUS_LABEL[status] || status}
          color={STATUS_COLOR[status] || 'default'}
          size="small"
          sx={{ ml: 'auto' }}
        />
      </Stack>

      {alert && <Alert severity={alert.type} sx={{ mb: 2 }}>{alert.text}</Alert>}

      {/* Connection Card */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} mb={1}>Connection</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Connect your WhatsApp number by scanning the QR code below with your phone.
          </Typography>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {qr && (
            <Box textAlign="center" my={2}>
              <img src={qr} alt="WhatsApp QR Code" width={220} />
              <Typography variant="caption" display="block" mt={1} color="text.secondary">
                Open WhatsApp → Linked Devices → Scan QR
              </Typography>
            </Box>
          )}

          <Stack direction="row" spacing={2} mt={2}>
            {status !== 'connected' && (
              <Button
                variant="contained"
                color="success"
                startIcon={<WhatsAppIcon />}
                onClick={startSession}
                disabled={loading}
              >
                {status === 'not_started' ? 'Connect WhatsApp' : 'Reconnect'}
              </Button>
            )}
            {status === 'connected' && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<LinkOffIcon />}
                onClick={disconnect}
              >
                Disconnect
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Send Single Message */}
      {status === 'connected' && (
        <>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Send Message</Typography>
              <Stack spacing={2}>
                <TextField
                  label="Phone Number (with country code, e.g. 919876543210)"
                  value={toNumber}
                  onChange={e => setToNumber(e.target.value)}
                  fullWidth size="small"
                />
                <TextField
                  label="Message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  multiline rows={3} fullWidth size="small"
                />
                <Box>
                  <Button
                    variant="contained"
                    endIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                    onClick={sendMessage}
                    disabled={sending}
                  >
                    Send
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>Bulk Broadcast</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Enter one number per line or comma-separated. Numbers with country code.
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Phone Numbers"
                  value={bulkNumbers}
                  onChange={e => setBulkNumbers(e.target.value)}
                  multiline rows={4} fullWidth size="small"
                  placeholder="919876543210&#10;918765432109"
                />
                <TextField
                  label="Message"
                  value={bulkMessage}
                  onChange={e => setBulkMessage(e.target.value)}
                  multiline rows={3} fullWidth size="small"
                />
                <Box>
                  <Button
                    variant="contained"
                    color="secondary"
                    endIcon={bulkSending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                    onClick={sendBulk}
                    disabled={bulkSending}
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
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
