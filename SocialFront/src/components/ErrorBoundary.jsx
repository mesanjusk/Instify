import React from 'react';
import { Box, Button, Typography, Alert, Stack } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleHardReload = async () => {
    // Clear all SW caches so stale chunk hashes don't survive the reload
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch (_) {
      // ignore — still reload even if cache clearing failed
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.message?.includes('dynamically imported module')
        || this.state.error?.message?.includes('Failed to fetch');

      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 3,
            background: '#f0fdf9',
          }}
        >
          <Stack spacing={3} alignItems="center" sx={{ maxWidth: 420, textAlign: 'center' }}>
            <ErrorOutline sx={{ fontSize: 72, color: '#ef4444' }} />
            <Box>
              <Typography variant="h5" fontWeight={700} mb={1}>
                Something went wrong
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isChunkError
                  ? 'A new version of the app is available. Click Reload App to update.'
                  : 'An unexpected error occurred in this section of the app.'}
              </Typography>
            </Box>
            {this.state.error?.message && (
              <Alert severity="error" sx={{ width: '100%', textAlign: 'left' }}>
                {this.state.error.message}
              </Alert>
            )}
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                onClick={this.handleReset}
                sx={{ borderColor: '#1a7a4a', color: '#1a7a4a' }}
              >
                Try Again
              </Button>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={this.handleHardReload}
                sx={{ bgcolor: '#1a7a4a', '&:hover': { bgcolor: '#145c38' } }}
              >
                Reload App
              </Button>
            </Stack>
          </Stack>
        </Box>
      );
    }
    return this.props.children;
  }
}
