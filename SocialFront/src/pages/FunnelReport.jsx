import { useEffect, useState } from 'react';
import {
  Alert, Box, CircularProgress, Chip, LinearProgress,
  Stack, Typography,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ForumIcon from '@mui/icons-material/Forum';
import SchoolIcon from '@mui/icons-material/School';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import apiClient from '../apiClient';

function FunnelBar({ label, value, max, color, icon, sublabel }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.75}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ color }}>{icon}</Box>
          <Typography fontWeight={600} fontSize="0.875rem">{label}</Typography>
          {sublabel && <Typography variant="caption" color="text.secondary">{sublabel}</Typography>}
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography fontWeight={700} sx={{ color }}>{value.toLocaleString()}</Typography>
          <Typography variant="caption" color="text.secondary">({pct}%)</Typography>
        </Stack>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 10, borderRadius: 5, bgcolor: '#f1f5f9',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 5 },
        }}
      />
    </Box>
  );
}

function SourcePill({ source, count }) {
  const labels = { walk_in: 'Walk-in', referral: 'Referral', website: 'Website', social_media: 'Social', phone: 'Phone', other: 'Other' };
  return (
    <Box sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2, p: 1.5, textAlign: 'center', minWidth: 80 }}>
      <Typography fontWeight={700} fontSize="1.1rem">{count}</Typography>
      <Typography variant="caption" color="text.secondary">{labels[source] || source}</Typography>
    </Box>
  );
}

export default function FunnelReport() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const uuid = localStorage.getItem('institute_uuid');

  useEffect(() => {
    if (!uuid) return;
    apiClient.get(`/api/leads/reports/funnel?institute_uuid=${uuid}`)
      .then(r => { if (r.data?.success) setData(r.data.result); else setError('No data'); })
      .catch(() => setError('Failed to load funnel report'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box textAlign="center" py={5}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  const max = Math.max(data.enquiries, data.leads, data.admissions, 1);

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} mb={0.5}>CRM Funnel Report</Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={3}>
        Enquiry → Lead → Admission conversion pipeline
      </Typography>

      {/* Funnel stages */}
      <Box sx={{ bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: 2, p: 2.5, mb: 3 }}>
        <FunnelBar
          label="Enquiries" value={data.enquiries} max={max} color="#6366f1"
          icon={<ForumIcon fontSize="small" />}
        />
        <FunnelBar
          label="Leads" value={data.leads} max={max} color="#f59e0b"
          icon={<TrendingUpIcon fontSize="small" />}
        />
        <FunnelBar
          label="Admissions" value={data.admissions} max={max} color="#10b981"
          icon={<SchoolIcon fontSize="small" />}
          sublabel={`${data.conversionRate}% conversion`}
        />
      </Box>

      {/* Conversion highlight */}
      <Box sx={{ bgcolor: data.conversionRate >= 50 ? '#f0fdf4' : '#fef3c7', border: `1px solid ${data.conversionRate >= 50 ? '#bbf7d0' : '#fde68a'}`, borderRadius: 2, p: 2, mb: 3 }}>
        <Typography fontWeight={700} fontSize="1.5rem" color={data.conversionRate >= 50 ? '#15803d' : '#92400e'}>
          {data.conversionRate}% Conversion Rate
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {data.admissions} of {data.leads} leads converted to admissions
        </Typography>
      </Box>

      {/* Lead scoring */}
      <Typography fontWeight={700} fontSize="0.875rem" mb={1.5}>Lead Quality Distribution</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1.5, mb: 3 }}>
        <Box sx={{ bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 2, p: 2, textAlign: 'center' }}>
          <Stack direction="row" justifyContent="center" spacing={0.5} alignItems="center" mb={0.5}>
            <WhatshotIcon sx={{ color: '#ef4444', fontSize: 18 }} />
            <Typography fontWeight={700} fontSize="0.75rem" color="#dc2626">HOT</Typography>
          </Stack>
          <Typography fontWeight={800} fontSize="1.5rem" color="#ef4444">{data.scores?.hot || 0}</Typography>
          <Typography variant="caption" color="text.secondary">High intent</Typography>
        </Box>
        <Box sx={{ bgcolor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 2, p: 2, textAlign: 'center' }}>
          <Stack direction="row" justifyContent="center" spacing={0.5} alignItems="center" mb={0.5}>
            <TrendingUpIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
            <Typography fontWeight={700} fontSize="0.75rem" color="#b45309">WARM</Typography>
          </Stack>
          <Typography fontWeight={800} fontSize="1.5rem" color="#f59e0b">{data.scores?.warm || 0}</Typography>
          <Typography variant="caption" color="text.secondary">Considering</Typography>
        </Box>
        <Box sx={{ bgcolor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 2, p: 2, textAlign: 'center' }}>
          <Stack direction="row" justifyContent="center" spacing={0.5} alignItems="center" mb={0.5}>
            <AcUnitIcon sx={{ color: '#0284c7', fontSize: 18 }} />
            <Typography fontWeight={700} fontSize="0.75rem" color="#0369a1">COLD</Typography>
          </Stack>
          <Typography fontWeight={800} fontSize="1.5rem" color="#0284c7">{data.scores?.cold || 0}</Typography>
          <Typography variant="caption" color="text.secondary">Low intent</Typography>
        </Box>
      </Box>

      {/* Source breakdown */}
      {data.bySource?.length > 0 && (
        <>
          <Typography fontWeight={700} fontSize="0.875rem" mb={1.5}>Lead Sources</Typography>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {data.bySource.map(s => (
              <SourcePill key={s._id} source={s._id || 'other'} count={s.count} />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
