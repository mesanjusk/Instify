import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar, Box, Card, CardContent, Chip, CircularProgress,
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
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
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

function SectionCard({ icon, iconBg, title, desc, badge, badgeColor, gradient, onClick }) {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        background: gradient,
        border: 'none',
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:active': { transform: 'scale(0.98)' },
        '&:hover': { boxShadow: '0 8px 32px rgba(0,0,0,0.18)' },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
          <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </Box>
          {badge && (
            <Chip label={badge} size="small" color={badgeColor || 'default'} sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }} />
          )}
        </Stack>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#fff', lineHeight: 1.2, mb: 0.4 }}>
          {title}
        </Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>
            {desc}
          </Typography>
          <ArrowForwardIosIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', flexShrink: 0, ml: 1 }} />
        </Stack>
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

      {/* Section cards — Amazon-style entry points */}
      <Typography variant="subtitle1" fontWeight={700} mb={1.5}>Sections</Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 1.5,
          mb: 3,
        }}
      >
        <SectionCard
          icon={<MenuBookIcon sx={{ color: '#fff', fontSize: 24 }} />}
          iconBg="rgba(255,255,255,0.2)"
          title="Academic"
          desc="Students, admissions, courses, attendance"
          gradient="linear-gradient(135deg, #4f46e5, #7c3aed)"
          onClick={() => navigate(`/${username}/section/academic`)}
        />
        <SectionCard
          icon={<WhatsAppIcon sx={{ color: '#fff', fontSize: 24 }} />}
          iconBg="rgba(255,255,255,0.2)"
          title="WhatsApp"
          desc="Automation, broadcast & magic links"
          gradient="linear-gradient(135deg, #075E54, #128C7E)"
          badge={waConnected ? 'Live' : undefined}
          badgeColor="success"
          onClick={() => navigate(`/${username}/section/whatsapp`)}
        />
        <SectionCard
          icon={<BadgeIcon sx={{ color: '#fff', fontSize: 24 }} />}
          iconBg="rgba(255,255,255,0.2)"
          title="Documents"
          desc="ID cards, certificates, results"
          gradient="linear-gradient(135deg, #7c3aed, #a855f7)"
          onClick={() => navigate(`/${username}/section/canvas`)}
        />
        <SectionCard
          icon={<AdminPanelSettingsIcon sx={{ color: '#fff', fontSize: 24 }} />}
          iconBg="rgba(255,255,255,0.2)"
          title="Admin"
          desc="Users, settings & accounts"
          gradient="linear-gradient(135deg, #0f172a, #334155)"
          onClick={() => navigate(`/${username}/section/admin`)}
        />
      </Box>

    </Box>
  );
}
