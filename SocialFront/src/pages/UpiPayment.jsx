/**
 * UPI Payment Page
 * Configure institute UPI details and display a payment QR code
 * that can be shown to students/parents.
 */

import { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, CircularProgress, Divider,
  Stack, TextField, Typography, Alert, Chip,
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import SaveIcon from '@mui/icons-material/Save';
import { useApp } from '../context/AppContext';
import apiClient from '../apiClient';

export default function UpiPayment() {
  const { institute } = useApp();
  const instituteId = institute?.institute_uuid || localStorage.getItem('institute_uuid') || '';

  const [config, setConfig] = useState({ upi_id: '', merchant_name: '', description: 'Fee Payment' });
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  // QR generation
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [qr, setQr] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [upiUrl, setUpiUrl] = useState('');

  function showAlert(type, text) {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 5000);
  }

  async function fetchConfig() {
    try {
      const res = await apiClient.get(`/api/upi/config/${instituteId}`);
      if (res.data.success) setConfig(res.data.data);
    } catch (_) { /* not configured yet */ }
  }

  useEffect(() => { if (instituteId) fetchConfig(); }, [instituteId]);

  async function saveConfig() {
    if (!config.upi_id || !config.merchant_name) return showAlert('error', 'UPI ID and Merchant Name are required');
    setSaving(true);
    try {
      await apiClient.post('/api/upi/config', { ...config, institute_uuid: instituteId });
      showAlert('success', 'UPI config saved');
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function generateQR() {
    setQrLoading(true);
    setQr(null);
    try {
      const params = new URLSearchParams();
      if (amount) params.set('amount', amount);
      if (note) params.set('note', note);
      const res = await apiClient.get(`/api/upi/qr/${instituteId}?${params}`);
      setQr(res.data.qr);
      setUpiUrl(res.data.upi_url);
      showAlert('success', 'QR generated');
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'QR generation failed — save UPI config first');
    } finally {
      setQrLoading(false);
    }
  }

  function downloadQR() {
    if (!qr) return;
    const a = document.createElement('a');
    a.href = qr;
    a.download = `upi-qr-${amount || 'any'}.png`;
    a.click();
  }

  return (
    <Box sx={{ maxWidth: 680, mx: 'auto', py: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <PaymentIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h5" fontWeight={700}>UPI Payment</Typography>
      </Stack>

      {alert && <Alert severity={alert.type} sx={{ mb: 2 }}>{alert.text}</Alert>}

      {/* Config Section */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} mb={2}>UPI Configuration</Typography>
          <Stack spacing={2}>
            <TextField
              label="UPI ID (e.g. yourname@upi)"
              value={config.upi_id}
              onChange={e => setConfig(c => ({ ...c, upi_id: e.target.value }))}
              fullWidth size="small"
            />
            <TextField
              label="Merchant / Institute Name"
              value={config.merchant_name}
              onChange={e => setConfig(c => ({ ...c, merchant_name: e.target.value }))}
              fullWidth size="small"
            />
            <TextField
              label="Default Payment Note"
              value={config.description}
              onChange={e => setConfig(c => ({ ...c, description: e.target.value }))}
              fullWidth size="small"
            />
            <Box>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                onClick={saveConfig}
                disabled={saving}
              >
                Save Config
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* QR Generator */}
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <QrCode2Icon />
            <Typography variant="subtitle1" fontWeight={600}>Generate Payment QR</Typography>
          </Stack>

          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Amount (₹) — leave blank for any amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                type="number"
                size="small"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Payment Note (optional)"
                value={note}
                onChange={e => setNote(e.target.value)}
                size="small"
                sx={{ flex: 1 }}
              />
            </Stack>

            <Box>
              <Button
                variant="contained"
                startIcon={qrLoading ? <CircularProgress size={16} color="inherit" /> : <QrCode2Icon />}
                onClick={generateQR}
                disabled={qrLoading}
              >
                Generate QR
              </Button>
            </Box>

            {qr && (
              <Box textAlign="center" pt={1}>
                <img src={qr} alt="UPI QR Code" width={220} style={{ border: '1px solid #ddd', borderRadius: 8 }} />
                <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                  Scan with any UPI app — GPay, PhonePe, Paytm, etc.
                </Typography>
                {amount && (
                  <Chip label={`₹${amount}`} color="success" size="small" sx={{ mt: 1 }} />
                )}
                <Box mt={2} display="flex" justifyContent="center" gap={2}>
                  <Button size="small" variant="outlined" onClick={downloadQR}>
                    Download QR
                  </Button>
                </Box>
                <Typography variant="caption" display="block" color="text.secondary" mt={1} sx={{ wordBreak: 'break-all' }}>
                  {upiUrl}
                </Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
