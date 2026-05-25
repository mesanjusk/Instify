/**
 * Magic Login Page
 * Accessed via /access/:token (sent via WhatsApp)
 * Validates the token, stores session data, redirects to role dashboard.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Card, CardContent, CircularProgress, Typography, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import axios from 'axios';
import BASE_URL from '../config';
import { storeUserData, storeInstituteData } from '../utils/storageUtils';
import { fetchAndStoreMasters } from '../utils/masterUtils';

export default function MagicLogin() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState('verifying'); // verifying | success | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) { setState('error'); setErrorMsg('Invalid link — no token found.'); return; }

    axios.get(`${BASE_URL}/api/auth/magic-link/verify/${token}`)
      .then(async ({ data }) => {
        if (!data.success) {
          setState('error');
          setErrorMsg(data.message || 'Invalid or expired link.');
          return;
        }
        const { user, institute, token: authToken } = data;

        storeUserData({ id: user.id, name: user.name, role: user.role, username: user.username });
        storeInstituteData({ institute_uuid: institute.uuid, institute_name: institute.name, institute_id: institute.id, theme_color: institute.theme_color });
        if (authToken) localStorage.setItem('authToken', authToken);
        if (window.updateAppContext) {
          window.updateAppContext({
            user: JSON.parse(localStorage.getItem('user')),
            institute: JSON.parse(localStorage.getItem('institute')),
          });
        }

        try { await fetchAndStoreMasters(); } catch (_) {}

        setState('success');
        setTimeout(() => navigate(`/${user.username}`), 1200);
      })
      .catch((err) => {
        setState('error');
        setErrorMsg(err.response?.data?.message || 'Link is invalid or has expired.');
      });
  }, [token]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f1f5f9', p: 2 }}>
      <Card sx={{ maxWidth: 380, width: '100%', textAlign: 'center' }}>
        <CardContent sx={{ p: 4 }}>
          {state === 'verifying' && (
            <>
              <CircularProgress sx={{ mb: 2, color: '#1a7a4a' }} />
              <Typography variant="h6" fontWeight={700} mb={0.5}>Verifying your link…</Typography>
              <Typography variant="body2" color="text.secondary">Please wait a moment.</Typography>
            </>
          )}

          {state === 'success' && (
            <>
              <CheckCircleIcon sx={{ fontSize: 56, color: '#10b981', mb: 1.5 }} />
              <Typography variant="h6" fontWeight={700} mb={0.5}>Access Granted!</Typography>
              <Typography variant="body2" color="text.secondary">Redirecting to your dashboard…</Typography>
            </>
          )}

          {state === 'error' && (
            <>
              <ErrorIcon sx={{ fontSize: 56, color: '#ef4444', mb: 1.5 }} />
              <Typography variant="h6" fontWeight={700} mb={0.5}>Link Expired</Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>{errorMsg}</Typography>
              <Button onClick={() => navigate('/')} sx={{ bgcolor: '#1a7a4a' }}>Go to Login</Button>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
