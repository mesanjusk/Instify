import { useEffect, useState } from 'react';
import { Button, Chip, Stack, Tooltip, Typography } from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ComputerIcon from '@mui/icons-material/Computer';

const api = window.electronAPI;

export default function SyncStatusBar() {
  const [status, setStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [storageMode, setStorageMode] = useState('cloud_only');

  useEffect(() => {
    if (!api) return;
    api.getStorageMode?.().then((m) => setStorageMode(m || 'cloud_only'));
    const unsub = api.onSyncStatus((data) => {
      setStatus(data);
      if (data.state !== 'syncing') setSyncing(false);
    });
    return () => unsub?.();
  }, []);

  async function handleSyncNow() {
    setSyncing(true);
    await api.syncNow();
  }

  if (!api) return null;

  const isLocalOnly = storageMode === 'local_only';

  const icon = isLocalOnly
    ? <ComputerIcon sx={{ fontSize: 14, color: '#b45309' }} />
    : !status ? <CloudOffIcon sx={{ fontSize: 14 }} />
    : status.state === 'ok' ? <CloudDoneIcon sx={{ fontSize: 14, color: '#059669' }} />
    : status.state === 'syncing' ? <SyncIcon sx={{ fontSize: 14, animation: 'spin 1s linear infinite' }} />
    : status.state === 'error' ? <ErrorOutlineIcon sx={{ fontSize: 14, color: '#ef4444' }} />
    : <CloudOffIcon sx={{ fontSize: 14 }} />;

  const label = isLocalOnly ? 'Local only'
    : !status ? 'Not synced'
    : status.state === 'syncing' ? 'Syncing…'
    : status.lastSyncAt ? `Synced ${new Date(status.lastSyncAt).toLocaleTimeString()}`
    : status.message;

  return (
    <Stack
      direction="row" alignItems="center" spacing={1}
      sx={{
        position: 'fixed', bottom: 12, right: 12, zIndex: 1300,
        bgcolor: 'rgba(255,255,255,0.96)', border: '1px solid #e2e8f0',
        borderRadius: 2, px: 1.5, py: 0.75, boxShadow: 2,
        backdropFilter: 'blur(8px)',
      }}
    >
      {icon}
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
        {label}
      </Typography>
      {status?.state === 'partial' && (
        <Tooltip title={status.message}>
          <Chip label="Partial" size="small" color="warning" sx={{ height: 16, fontSize: '0.65rem' }} />
        </Tooltip>
      )}
      {!isLocalOnly && (
        <Button
          size="small"
          onClick={handleSyncNow}
          disabled={syncing || status?.state === 'syncing'}
          sx={{ minWidth: 0, fontSize: '0.7rem', px: 1, py: 0.25, lineHeight: 1.4 }}
        >
          Sync now
        </Button>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Stack>
  );
}
