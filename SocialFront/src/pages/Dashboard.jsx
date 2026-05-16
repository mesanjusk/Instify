import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar, Box, Button, Card, CardContent, Chip, CircularProgress,
  Stack, Typography,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import BadgeIcon from '@mui/icons-material/Badge';
import EventNoteIcon from '@mui/icons-material/EventNote';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useApp } from '../context/AppContext';
import apiClient from '../apiClient';

const API_URL = 'https://socialbackend-iucy.onrender.com/api/dashboard-stats';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function StatCard({ icon, label, value, color, onClick, loading }) {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s',
        '&:hover': onClick ? { boxShadow: '0 4px 16px rgba(79,70,229,0.15)' } : {},
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap>
              {label}
            </Typography>
            {loading ? (
              <Box sx={{ mt: 0.5 }}><CircularProgress size={18} sx={{ color }} /></Box>
            ) : (
              <Typography variant="h5" fontWeight={700} sx={{ color, mt: 0.25, lineHeight: 1.2 }}>
                {value}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}18`, width: 40, height: 40, flexShrink: 0 }}>
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
}

function FeatureWidget({ icon, iconColor, title, description, buttonLabel, buttonColor, onClick, badge, badgeColor }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
          <Avatar sx={{ bgcolor: `${iconColor}18`, width: 48, height: 48 }}>
            {icon}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>{title}</Typography>
            {badge && (
              <Chip label={badge} size="small" color={badgeColor || 'default'} sx={{ mt: 0.5, height: 18, fontSize: '0.65rem' }} />
            )}
          </Box>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1, mb: 2, lineHeight: 1.6 }}>
          {description}
        </Typography>
        <Button
          fullWidth
          onClick={onClick}
          endIcon={<ArrowForwardIcon />}
          sx={{
            bgcolor: buttonColor,
            color: '#fff',
            '&:hover': { bgcolor: buttonColor, filter: 'brightness(0.9)' },
          }}
        >
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
}


export default function Dashboard() {
  const navigate = useNavigate();
  const { user, institute } = useApp();

  const instituteName = institute?.institute_name || localStorage.getItem('institute_title') || 'Your Institute';
  const username = user?.username || localStorage.getItem('login_username') || 'admin';
  const expiryDateStr = localStorage.getItem('expiry_date') || localStorage.getItem('trialExpiresAt');
  const planType = localStorage.getItem('plan_type');

  const [stats, setStats] = useState({ students: null, admissions: null, courses: null, enquiries: null, feesToday: null, followupToday: null });
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [daysLeft, setDaysLeft] = useState(null);
  const [waStatus, setWaStatus] = useState('not_started');

  useEffect(() => {
    if (expiryDateStr) {
      const diff = Math.ceil((new Date(expiryDateStr) - new Date()) / 86400000);
      setDaysLeft(diff);
      if (diff < 0) setExpired(true);
    }
  }, [expiryDateStr]);

  useEffect(() => {
    const uuid = localStorage.getItem('institute_uuid');
    if (!uuid) { setLoading(false); return; }
    fetch(`${API_URL}?institute_uuid=${uuid}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setStats({ students: d.students ?? 0, admissions: d.admissions ?? 0, courses: d.courses ?? 0, enquiries: d.enquiries ?? 0, feesToday: d.feesToday ?? 0, followupToday: d.followupToday ?? 0 }))
      .catch(() => setStats({ students: 0, admissions: 0, courses: 0, enquiries: 0, feesToday: 0, followupToday: 0 }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const uuid = localStorage.getItem('institute_uuid');
    if (!uuid) return;
    apiClient.get(`/api/baileys/session/${uuid}/status`)
      .then(r => setWaStatus(r.data?.status || 'not_started'))
      .catch(() => setWaStatus('not_started'));
  }, []);

  if (expired) {
    return (
      <Box sx={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card sx={{ maxWidth: 380, textAlign: 'center', p: 4 }}>
          <Typography variant="h5" color="error" fontWeight={700} mb={1}>Trial Expired</Typography>
          <Typography color="text.secondary" mb={3}>Contact support to continue using Instify.</Typography>
          <Button color="error" onClick={() => navigate('/')}>Back to Login</Button>
        </Card>
      </Box>
    );
  }

  const waConnected = waStatus === 'connected';

  const statCards = [
    { label: 'Total Students', value: stats.students ?? '—', icon: <PeopleIcon sx={{ color: '#4f46e5', fontSize: 20 }} />, color: '#4f46e5', onClick: () => navigate(`/${username}/students`) },
    { label: 'Admissions', value: stats.admissions ?? '—', icon: <SchoolIcon sx={{ color: '#10b981', fontSize: 20 }} />, color: '#10b981', onClick: () => navigate(`/${username}/allAdmission`) },
    { label: 'Enquiries', value: stats.enquiries ?? '—', icon: <TrendingUpIcon sx={{ color: '#f59e0b', fontSize: 20 }} />, color: '#f59e0b', onClick: () => navigate(`/${username}/leads`) },
    { label: "Today's Revenue", value: `₹${(stats.feesToday || 0).toLocaleString()}`, icon: <AttachMoneyIcon sx={{ color: '#10b981', fontSize: 20 }} />, color: '#10b981', onClick: () => navigate(`/${username}/fees`) },
    { label: 'Follow-ups Today', value: stats.followupToday ?? '—', icon: <EventNoteIcon sx={{ color: '#ef4444', fontSize: 20 }} />, color: '#ef4444', onClick: () => navigate(`/${username}/followup`) },
    { label: 'Active Courses', value: stats.courses ?? '—', icon: <LibraryBooksIcon sx={{ color: '#7c3aed', fontSize: 20 }} />, color: '#7c3aed', onClick: () => navigate(`/${username}/courses`) },
  ];

  return (
    <Box>
      {/* Trial banner */}
      {planType === 'trial' && daysLeft !== null && daysLeft >= 0 && (
        <Box sx={{ bgcolor: '#fef3c7', border: '1px solid #fde68a', borderRadius: 2, px: 2, py: 1.25, mb: 2.5 }}>
          <Typography variant="body2" color="#92400e" fontWeight={500}>
            Trial expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''} — contact support to upgrade
          </Typography>
        </Box>
      )}

      {/* Greeting */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700}>
          {getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'} 👋
        </Typography>
        <Typography variant="body2" color="text.secondary">{instituteName}</Typography>
      </Box>

      {/* Stats grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {statCards.map((card, i) => (
          <StatCard key={i} {...card} loading={loading} />
        ))}
      </Box>

      {/* Feature Widgets */}
      <Typography variant="subtitle1" fontWeight={700} mb={1.5}>Featured Tools</Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <FeatureWidget
          icon={<WhatsAppIcon sx={{ color: '#25d366', fontSize: 26 }} />}
          iconColor="#25d366"
          title="WhatsApp Automation"
          description={
            waConnected
              ? 'Connected! Automate fee reminders, follow-ups, birthday wishes, and send magic access links to teachers & students.'
              : 'Connect your institute WhatsApp to automate reminders, send access links, and broadcast to batches — all from one hub.'
          }
          buttonLabel={waConnected ? 'Open Automation Hub' : 'Connect WhatsApp'}
          buttonColor="#25d366"
          badge={waConnected ? 'Connected' : 'Not Connected'}
          badgeColor={waConnected ? 'success' : 'default'}
          onClick={() => navigate(`/${username}/whatsapp-personal`)}
        />
        <FeatureWidget
          icon={<BadgeIcon sx={{ color: '#7c3aed', fontSize: 26 }} />}
          iconColor="#7c3aed"
          title="Document Maker"
          description="Generate student ID cards, completion certificates, result/mark sheets, and exam admit cards. Select a batch to create documents for all students at once."
          buttonLabel="Create Documents"
          buttonColor="#7c3aed"
          onClick={() => navigate(`/${username}/canvas-editor`)}
        />
      </Box>

    </Box>
  );
}
