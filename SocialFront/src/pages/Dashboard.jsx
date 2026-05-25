import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar, Box, Button, Card, CardContent, Chip, CircularProgress,
  Divider, Stack, Typography,
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
import AddIcon from '@mui/icons-material/Add';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ChecklistIcon from '@mui/icons-material/Checklist';
import { useApp } from '../context/AppContext';
import apiClient from '../apiClient';

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
        transition: 'box-shadow 0.15s, transform 0.15s',
        '&:hover': onClick ? { boxShadow: `0 4px 20px ${color}22`, transform: 'translateY(-1px)' } : {},
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap sx={{ fontSize: '0.72rem' }}>
              {label}
            </Typography>
            {loading ? (
              <Box sx={{ mt: 0.5 }}><CircularProgress size={18} sx={{ color }} /></Box>
            ) : (
              <Typography variant="h5" fontWeight={800} sx={{ color, mt: 0.25, lineHeight: 1.1, fontSize: { xs: '1.4rem', md: '1.6rem' } }}>
                {value}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}15`, width: 40, height: 40, flexShrink: 0 }}>
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
        '&:hover': { boxShadow: '0 8px 32px rgba(0,0,0,0.22)', transform: 'translateY(-2px)' },
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 }, '&:last-child': { pb: { xs: 2, md: 2.5 } } }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
          <Box sx={{ width: 46, height: 46, borderRadius: 3, bgcolor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </Box>
          {badge && (
            <Chip label={badge} size="small" color={badgeColor || 'default'} sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />
          )}
        </Stack>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#fff', lineHeight: 1.2, mb: 0.4 }}>
          {title}
        </Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>
            {desc}
          </Typography>
          <ArrowForwardIosIcon sx={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', flexShrink: 0, ml: 1 }} />
        </Stack>
      </CardContent>
    </Card>
  );
}

function QuickAction({ icon, label, color, onClick }) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      onClick={onClick}
      sx={{
        px: 2, py: 1.5, borderRadius: 2.5, cursor: 'pointer',
        transition: 'background 0.15s',
        '&:hover': { bgcolor: `${color}0d` },
      }}
    >
      <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        {icon}
      </Box>
      <Typography variant="body2" fontWeight={600} color="text.primary" noWrap>{label}</Typography>
    </Stack>
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
    apiClient.get('/api/dashboard-stats', { params: { institute_uuid: uuid } })
      .then(({ data: d }) => setStats({ students: d.students ?? 0, admissions: d.admissions ?? 0, courses: d.courses ?? 0, enquiries: d.enquiries ?? 0, feesToday: d.feesToday ?? 0, followupToday: d.followupToday ?? 0 }))
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

  const quickActions = [
    { icon: <AddIcon fontSize="small" />, label: 'New Admission', color: '#10b981', path: `/${username}/addNewAdd` },
    { icon: <PeopleIcon fontSize="small" />, label: 'Add Student', color: '#4f46e5', path: `/${username}/students` },
    { icon: <ReceiptIcon fontSize="small" />, label: 'Collect Fee', color: '#f59e0b', path: `/${username}/addReciept` },
    { icon: <ChecklistIcon fontSize="small" />, label: 'Attendance', color: '#0891b2', path: `/${username}/addAttendance` },
    { icon: <TrendingUpIcon fontSize="small" />, label: 'Add Lead', color: '#ef4444', path: `/${username}/add-lead` },
    { icon: <EventNoteIcon fontSize="small" />, label: 'Follow-ups', color: '#7c3aed', path: `/${username}/followup` },
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

      {/* Desktop two-column layout */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 280px' }, gap: 3, alignItems: 'start' }}>
        {/* Left/main column */}
        <Box>
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
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', xl: 'repeat(6, 1fr)' },
              gap: { xs: 1.5, md: 2 },
              mb: 3,
            }}
          >
            {statCards.map((card, i) => (
              <StatCard key={i} {...card} loading={loading} />
            ))}
          </Box>

          {/* Section cards */}
          <Typography variant="subtitle1" fontWeight={700} mb={1.5}>Quick Sections</Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
              gap: { xs: 1.25, md: 1.5 },
            }}
          >
            <SectionCard
              icon={<MenuBookIcon sx={{ color: '#fff', fontSize: 22 }} />}
              iconBg="rgba(255,255,255,0.2)"
              title="Academic"
              desc="Students, admissions, courses"
              gradient="linear-gradient(135deg, #4f46e5, #7c3aed)"
              onClick={() => navigate(`/${username}/section/academic`)}
            />
            <SectionCard
              icon={<WhatsAppIcon sx={{ color: '#fff', fontSize: 22 }} />}
              iconBg="rgba(255,255,255,0.2)"
              title="WhatsApp"
              desc="Automation & broadcasts"
              gradient="linear-gradient(135deg, #075E54, #128C7E)"
              badge={waConnected ? 'Live' : undefined}
              badgeColor="success"
              onClick={() => navigate(`/${username}/section/whatsapp`)}
            />
            <SectionCard
              icon={<BadgeIcon sx={{ color: '#fff', fontSize: 22 }} />}
              iconBg="rgba(255,255,255,0.2)"
              title="Documents"
              desc="ID cards, certificates"
              gradient="linear-gradient(135deg, #7c3aed, #a855f7)"
              onClick={() => navigate(`/${username}/section/canvas`)}
            />
            <SectionCard
              icon={<AdminPanelSettingsIcon sx={{ color: '#fff', fontSize: 22 }} />}
              iconBg="rgba(255,255,255,0.2)"
              title="Admin"
              desc="Settings & accounts"
              gradient="linear-gradient(135deg, #0f172a, #334155)"
              onClick={() => navigate(`/${username}/section/admin`)}
            />
          </Box>
        </Box>

        {/* Right column — desktop only quick actions */}
        <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
          <Card>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <Box sx={{ px: 2, py: 1.75, borderBottom: '1px solid #f1f5f9' }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.primary">Quick Actions</Typography>
              </Box>
              {quickActions.map((a, i) => (
                <Box key={i}>
                  <QuickAction {...a} onClick={() => navigate(a.path)} />
                  {i < quickActions.length - 1 && <Divider sx={{ mx: 2 }} />}
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* WhatsApp status card */}
          <Card sx={{ mt: 2 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2" fontWeight={700}>WhatsApp</Typography>
                <Chip
                  label={waConnected ? 'Connected' : 'Offline'}
                  size="small"
                  color={waConnected ? 'success' : 'default'}
                  sx={{ height: 20, fontSize: '0.68rem' }}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                {waConnected ? 'Your WhatsApp bot is live and ready.' : 'Connect WhatsApp to send automated messages.'}
              </Typography>
              <Button
                size="small"
                variant={waConnected ? 'outlined' : 'contained'}
                startIcon={<WhatsAppIcon sx={{ fontSize: 16 }} />}
                onClick={() => navigate(`/${username}/section/whatsapp`)}
                sx={{ fontSize: '0.78rem' }}
              >
                {waConnected ? 'Manage' : 'Connect Now'}
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
