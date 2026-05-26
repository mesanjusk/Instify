import { useEffect, useState } from 'react';
import {
  Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle,
  Stack, TextField, Typography, Alert, Divider, InputAdornment, IconButton,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SyncIcon from '@mui/icons-material/Sync';
import CloudIcon from '@mui/icons-material/Cloud';
import StorageIcon from '@mui/icons-material/Storage';

const api = window.electronAPI;

export default function DesktopSetup({ open, onComplete }) {
  const [remoteUri, setRemoteUri] = useState('');
  const [cloudName, setCloudName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !api) return;
    Promise.all([
      api.getConfig('remoteMongoUri'),
      api.getConfig('cloudinary.cloudName'),
      api.getConfig('cloudinary.apiKey'),
      api.getConfig('cloudinary.apiSecret'),
    ]).then(([uri, cn, ak, as]) => {
      if (uri) setRemoteUri(uri);
      if (cn) setCloudName(cn);
      if (ak) setApiKey(ak);
      if (as) setApiSecret(as);
    });
  }, [open]);

  async function save() {
    if (!remoteUri.startsWith('mongodb')) {
      setError('Remote URI must start with mongodb:// or mongodb+srv://');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.setConfig('remoteMongoUri', remoteUri);
      await api.setConfig('cloudinary.cloudName', cloudName);
      await api.setConfig('cloudinary.apiKey', apiKey);
      await api.setConfig('cloudinary.apiSecret', apiSecret);
      onComplete?.();
    } catch (e) {
      setError(e.message || 'Failed to save settings');
    }
    setSaving(false);
  }

  function skipCloudinary() {
    api.setConfig('remoteMongoUri', remoteUri).then(onComplete);
  }

  return (
    <Dialog open={open} maxWidth="sm" fullWidth disableEscapeKeyDown>
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
        Desktop Setup — Connect to Cloud
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Alert severity="info" sx={{ fontSize: '0.82rem' }}>
            Your data is stored <strong>locally</strong> on this PC. Configure a cloud database below to keep everything synced across devices and backed up.
          </Alert>

          {/* Remote MongoDB */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <StorageIcon sx={{ color: '#059669', fontSize: 18 }} />
              <Typography fontWeight={700} fontSize="0.9rem">MongoDB Atlas URI</Typography>
              <Typography variant="caption" sx={{ bgcolor: '#d1fae5', color: '#065f46', px: 0.75, py: 0.25, borderRadius: 1, fontWeight: 600 }}>FREE</Typography>
            </Stack>
            <TextField
              fullWidth size="small"
              placeholder="mongodb+srv://user:pass@cluster.mongodb.net/instify"
              value={remoteUri}
              onChange={e => setRemoteUri(e.target.value)}
              helperText="Get a free M0 cluster at mongodb.com/atlas — no credit card required"
            />
          </Box>

          <Divider />

          {/* Cloudinary */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <CloudIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
              <Typography fontWeight={700} fontSize="0.9rem">Cloudinary (photos & media)</Typography>
              <Typography variant="caption" sx={{ bgcolor: '#fef3c7', color: '#92400e', px: 0.75, py: 0.25, borderRadius: 1, fontWeight: 600 }}>FREE TIER</Typography>
            </Stack>
            <Stack spacing={1.5}>
              <TextField fullWidth size="small" label="Cloud Name" value={cloudName} onChange={e => setCloudName(e.target.value)} />
              <TextField fullWidth size="small" label="API Key" value={apiKey} onChange={e => setApiKey(e.target.value)} />
              <TextField
                fullWidth size="small" label="API Secret"
                type={showSecret ? 'text' : 'password'}
                value={apiSecret} onChange={e => setApiSecret(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowSecret(s => !s)}>
                        {showSecret ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                helperText="Find these at cloudinary.com → Dashboard. Free tier = 25 GB storage."
              />
            </Stack>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button variant="text" size="small" onClick={skipCloudinary} disabled={!remoteUri || saving}>
              Skip Cloudinary for now
            </Button>
            <Button
              variant="contained" size="large"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
              onClick={save}
              disabled={!remoteUri || saving}
              sx={{ fontWeight: 700 }}
            >
              {saving ? 'Saving…' : 'Save & Start Sync'}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
