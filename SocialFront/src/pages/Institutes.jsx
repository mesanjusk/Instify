import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Box, Typography, Alert, Button } from '@mui/material';
import { SupervisorAccount } from '@mui/icons-material';

/**
 * Institutes page — redirects super_admin to the full Tools/SuperAdmin panel.
 * For owner/admin it shows a read-only institute list via ToolsPanel.
 */
const Institutes = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const { username } = (() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return { username: parts[0] || '' };
  })();

  useEffect(() => {
    if (!user) return;
    if (user.role === 'super_admin' || user.role === 'owner' || user.role === 'admin') {
      navigate(`/${username}/tools`, { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate, username]);

  if (!user || (user.role !== 'super_admin' && user.role !== 'owner' && user.role !== 'admin')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Access denied.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <SupervisorAccount sx={{ fontSize: 48, color: '#1a7a4a' }} />
      <Typography variant="h6">Redirecting to Super Admin Dashboard…</Typography>
      <Button variant="outlined" onClick={() => navigate(`/${username}/tools`)}>
        Go to Dashboard
      </Button>
    </Box>
  );
};

export default Institutes;
