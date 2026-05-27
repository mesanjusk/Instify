import { useEffect, useState } from 'react';
import { Alert, Button, Snackbar, Stack, Typography } from '@mui/material';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';

const api = window.electronAPI;

export default function UpdateNotifier() {
  const [updateReady, setUpdateReady] = useState(null); // { version }
  const [updateAvailable, setUpdateAvailable] = useState(null);

  useEffect(() => {
    if (!api) return;
    const unsubAvail = api.onUpdateAvailable?.((data) => setUpdateAvailable(data));
    const unsubReady = api.onUpdateDownloaded?.((data) => setUpdateReady(data));
    return () => { unsubAvail?.(); unsubReady?.(); };
  }, []);

  if (!api) return null;

  return (
    <>
      {/* Update downloaded — prompt to restart */}
      <Snackbar
        open={!!updateReady}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 72, sm: 24 } }}
      >
        <Alert
          severity="success"
          icon={<SystemUpdateAltIcon />}
          sx={{ width: '100%', alignItems: 'center' }}
          action={
            <Stack direction="row" spacing={1}>
              <Button size="small" color="inherit" onClick={() => setUpdateReady(null)}>Later</Button>
              <Button size="small" variant="contained" sx={{ bgcolor: '#1a7a4a' }} onClick={() => api.installUpdate?.()}>
                Restart & Update
              </Button>
            </Stack>
          }
        >
          <Typography variant="body2" fontWeight={600}>
            Instify {updateReady?.version} is ready — restart to apply
          </Typography>
        </Alert>
      </Snackbar>

      {/* Update downloading */}
      <Snackbar
        open={!!updateAvailable && !updateReady}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        autoHideDuration={6000}
        onClose={() => setUpdateAvailable(null)}
        sx={{ bottom: { xs: 72, sm: 24 } }}
        message={`Instify ${updateAvailable?.version} is downloading…`}
      />
    </>
  );
}
