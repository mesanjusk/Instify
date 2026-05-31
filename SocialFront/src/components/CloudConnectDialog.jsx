import { useState } from 'react';
import {
  Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Stack, TextField, Typography, Alert,
} from '@mui/material';
import CloudSyncIcon from '@mui/icons-material/CloudSync';

const DEFAULT_CLOUD_URL = 'https://instify-kfpm.onrender.com';

/**
 * Shown on desktop when no cloud account is connected.
 * Lets the user link their cloud account so the desktop gets
 * the correct license plan and enables future data sync.
 */
export default function CloudConnectDialog({ open, onClose, onConnected }) {
  const [cloudUrl, setCloudUrl] = useState(DEFAULT_CLOUD_URL);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    if (!email || !password) { setError('Email and password are required.'); return; }
    setLoading(true);
    setError('');
    try {
      const result = await window.electronAPI.connectCloud({ email, password, cloudUrl: cloudUrl.trim() });
      if (!result.ok) { setError(result.error || 'Connection failed.'); return; }
      onConnected?.(result.license);
      onClose();
    } catch (err) {
      setError(err.message || 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CloudSyncIcon sx={{ color: '#1a7a4a' }} />
        Connect Cloud Account
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Link your cloud account to sync your license plan and enable data backup.
          Your desktop data stays local — we only read your license status.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2}>
          <TextField
            label="Cloud Server URL"
            value={cloudUrl}
            onChange={e => setCloudUrl(e.target.value)}
            size="small"
            fullWidth
            helperText="Leave as default unless you have a custom server"
          />
          <TextField
            label="Email / Username"
            value={email}
            onChange={e => setEmail(e.target.value)}
            size="small"
            fullWidth
            autoComplete="email"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            size="small"
            fullWidth
            autoComplete="current-password"
            onKeyDown={e => { if (e.key === 'Enter') handleConnect(); }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none' }}>
          Skip for now
        </Button>
        <Button
          onClick={handleConnect}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CloudSyncIcon />}
          sx={{ bgcolor: '#1a7a4a', '&:hover': { bgcolor: '#25a066' }, textTransform: 'none' }}
        >
          {loading ? 'Connecting…' : 'Connect'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
