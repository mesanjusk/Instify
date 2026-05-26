import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useFeatureGate } from '../hooks/useFeatureGate';

/**
 * Wraps premium feature pages. Shows upgrade prompt when the module is disabled.
 * Usage: <FeatureGate module="whatsapp"><WhatsAppPage /></FeatureGate>
 */
export default function FeatureGate({ module: moduleName, children }) {
  const { enabled } = useFeatureGate(moduleName);

  if (enabled) return children;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320, p: 3 }}>
      <Paper variant="outlined" sx={{ p: { xs: 3, md: 5 }, maxWidth: 420, textAlign: 'center', borderRadius: 3 }}>
        <LockIcon sx={{ fontSize: 52, color: '#d4a017', mb: 1.5 }} />
        <Typography variant="h6" fontWeight={700} mb={1}>
          Premium Feature
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2.5}>
          This feature is not included in your current plan. Contact your administrator or upgrade your plan to unlock it.
        </Typography>
        <Typography variant="caption" color="text.disabled" display="block">
          Module: <strong>{moduleName}</strong>
        </Typography>
      </Paper>
    </Box>
  );
}
