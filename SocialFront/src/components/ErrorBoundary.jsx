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

  render() {
    if (this.state.hasError) {
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
                An unexpected error occurred in this section of the app.
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
                onClick={() => window.location.reload()}
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
