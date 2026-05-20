import React from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BuildIcon from '@mui/icons-material/Build';

const ToolsPanel = () => {
  const { user } = useApp();
  const navigate = useNavigate();

  if (!user || user.role !== 'super_admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="body1" fontWeight={600}>Access Denied</Typography>
          <Typography variant="body2">You need super admin privileges to access this page.</Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <BuildIcon sx={{ color: '#4f46e5', fontSize: 28 }} />
        <Typography variant="h5" fontWeight={700}>Superadmin Tools</Typography>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Future tools will appear here.
      </Typography>
      <Button
        variant="text"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ color: '#4f46e5' }}
      >
        Go Back
      </Button>
    </Box>
  );
};

export default ToolsPanel;
