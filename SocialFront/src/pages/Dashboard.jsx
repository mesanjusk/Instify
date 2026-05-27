import { memo, useCallback, useEffect, useMemo, useState } from 'react';
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
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ChecklistIcon from '@mui/icons-material/Checklist';
import NorthRoundedIcon from '@mui/icons-material/NorthRounded';
import { useApp } from '../context/AppContext';
import apiClient from '../apiClient';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const StatCard = memo(function StatCard({ icon, label, value, color, gradient, onClick, loading, delay = 0 }) {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        border: '1px solid rgba(226,232,240,0.8)',
        animation: `fadeUp 0.4s ease ${delay}s both`,
        '&:hover': onClick ? {
          transform: 'translateY(-3px)',
          boxShadow: `0 12px 32px ${color}22`,
          borderColor: `${color}40`,
        } : {},
      }}
    >
      <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="caption"
              sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}
              noWrap
            >
              {label}
            </Typography>
            {loading ? (
              <Box sx={{ mt: 1 }}>
                <CircularProgress size={20} sx={{ color }} />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mt: 0.5 }}>
                <Typography
                  variant="h5"
                  fontWeight={800}
                  sx={{
                    color,
                    lineHeight: 1.1,
                    fontSize: { xs: '1.5rem', md: '1.65rem' },
                    letterSpacing: '-0.03em',
                  }}
                >
                  {value}
                </Typography>
                {!loading && value !== '—' && (
                  <NorthRoundedIcon sx={{ fontSize: 12, color: '#10b981', mb: 0.25 }} />
                )}
              </Box>
            )}
          </Box>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2.5, flexShrink: 0,
            background: gradient || `${color}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 12px ${color}20`,
          }}>
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
});

const FeatureCard = memo(function FeatureCard({ icon, iconGlow, title, desc, badge, badgeColor, gradient, onClick, delay = 0 }) {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        background: gradient,
        border: 'none',
        animation: `fadeUp 0.4s ease ${delay}s both`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -40, right: -40,
          width: 120, height: 120,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -30, left: -20,
          width: 80, height: 80,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)',
        },
        '&:hover': {
          transform: 'translateY(-4px) scale(1.01)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2.25, md: 2.5 }, '&:last-child': { pb: { xs: 2.25, md: 2.5 } }, position: 'relative', zIndex: 1 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={1.75}>
          <Box sx={{
            width: 48, height: 48, borderRadius: 3,
            bgcolor: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: iconGlow ? `0 0 20px ${iconGlow}` : 'none',
          }}>
            {icon}
          </Box>
          {badge && (
            <Chip
              label={badge}
              size="small"
              color={badgeColor || 'default'}
              sx={{
                height: 20, fontSize: '0.62rem', fontWeight: 700,
                bgcolor: 'rgba(255,255,255,0.2)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            />
          )}
        </Stack>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#fff', lineHeight: 1.25, mb: 0.5 }}>
          {title}
        </Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.4 }}>
            {desc}
          </Typography>
          <Box sx={{
            width: 24, height: 24, borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, ml: 1,
          }}>
            <ArrowForwardRoundedIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
});

const QuickAction = memo(function QuickAction({ icon, label, color, gradient, onClick }) {
  return (
    <Stack
      direction="row" spacing={1.5} alignItems="center"
      onClick={onClick}
      sx={{
        px: 2, py: 1.5, borderRadius: 2.5, cursor: 'pointer',
        transition: 'all 0.18s ease',
        '&:hover': {
          bgcolor: `${color}08`,
          transform: 'translateX(3px)',
          '& .qa-icon': { transform: 'scale(1.1)' },
        },
      }}
    >
      <Box className="qa-icon" sx={{
        width: 38, height: 38, borderRadius: 2.25,
        background: gradient || `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        transition: 'transform 0.18s ease',
        boxShadow: `0 4px 10px ${color}20`,
      }}>
        <Box sx={{ color, display: 'flex' }}>{icon}</Box>
      </Box>
      <Typography variant="body2" fontWeight={600} color="text.primary" noWrap sx={{ fontSize: '0.875rem' }}>
        {label}
      </Typography>
      <Box sx={{ ml: 'auto' }}>
        <ArrowForwardRoundedIcon sx={{ fontSize: 14, color: '#cbd5e1' }} />
      </Box>
    </Stack>
  );
});

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
        <Card sx={{ maxWidth: 400, textAlign: 'center', p: 5 }}>
          <Box sx={{
            width: 72, height: 72, borderRadius: '50%',
            bgcolor: '#fee2e2', display: 'flex', alignItems: 'center',
            justifyContent: 'center', mx: 'auto', mb: 2.5,
          }}>
            <Typography sx={{ fontSize: '2rem' }}>⏰</Typography>
          </Box>
          <Typography variant="h5" color="error" fontWeight={800} mb={1} letterSpacing="-0.02em">
            Trial Expired
          </Typography>
          <Typography color="text.secondary" mb={3} lineHeight={1.7}>
            Contact support to continue using Instify.
          </Typography>
          <Button color="error" onClick={() => navigate('/')} sx={{ px: 4 }}>
            Back to Login
          </Button>
        </Card>
      </Box>
    );
  }

  const waConnected = waStatus === 'connected';

  const navTo = useCallback((path) => navigate(path), [navigate]);

  const statCards = useMemo(() => [
    {
      label: 'Total Students', value: stats.students ?? '—',
      icon: <PeopleIcon sx={{ fontSize: 20, color: '#059669' }} />,
      color: '#059669', gradient: 'linear-gradient(135deg, #059669, #34d399)',
      onClick: () => navTo(`/${username}/students`),
    },
    {
      label: 'Admissions', value: stats.admissions ?? '—',
      icon: <SchoolIcon sx={{ fontSize: 20, color: '#3b82f6' }} />,
      color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #93c5fd)',
      onClick: () => navTo(`/${username}/allAdmission`),
    },
    {
      label: 'Enquiries', value: stats.enquiries ?? '—',
      icon: <TrendingUpIcon sx={{ fontSize: 20, color: '#f59e0b' }} />,
      color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #fcd34d)',
      onClick: () => navTo(`/${username}/leads`),
    },
    {
      label: "Today's Revenue", value: `₹${(stats.feesToday || 0).toLocaleString()}`,
      icon: <AttachMoneyIcon sx={{ fontSize: 20, color: '#10b981' }} />,
      color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #6ee7b7)',
      onClick: () => navTo(`/${username}/fees`),
    },
    {
      label: 'Follow-ups Today', value: stats.followupToday ?? '—',
      icon: <EventNoteIcon sx={{ fontSize: 20, color: '#ef4444' }} />,
      color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #fca5a5)',
      onClick: () => navTo(`/${username}/followup`),
    },
    {
      label: 'Active Courses', value: stats.courses ?? '—',
      icon: <LibraryBooksIcon sx={{ fontSize: 20, color: '#8b5cf6' }} />,
      color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #c4b5fd)',
      onClick: () => navTo(`/${username}/courses`),
    },
  ], [stats, username, navTo]);

  const quickActions = useMemo(() => [
    { icon: <AddRoundedIcon fontSize="small" />, label: 'New Admission', color: '#059669', gradient: 'linear-gradient(135deg, #059669, #34d399)', path: `/${username}/addNewAdd` },
    { icon: <PeopleIcon fontSize="small" />, label: 'Add Student', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #93c5fd)', path: `/${username}/students` },
    { icon: <ReceiptIcon fontSize="small" />, label: 'Collect Fee', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #fcd34d)', path: `/${username}/addReciept` },
    { icon: <ChecklistIcon fontSize="small" />, label: 'Attendance', color: '#0891b2', gradient: 'linear-gradient(135deg, #0891b2, #67e8f9)', path: `/${username}/addAttendance` },
    { icon: <TrendingUpIcon fontSize="small" />, label: 'Add Lead', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #fca5a5)', path: `/${username}/add-lead` },
    { icon: <EventNoteIcon fontSize="small" />, label: 'Follow-ups', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #c4b5fd)', path: `/${username}/followup` },
  ], [username]);

  return (
    <Box>
      {/* Trial banner */}
      {planType === 'trial' && daysLeft !== null && daysLeft >= 0 && (
        <Box sx={{
          background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
          border: '1px solid #fde68a',
          borderRadius: 3, px: 2.5, py: 1.5, mb: 3,
          display: 'flex', alignItems: 'center', gap: 1.5,
          animation: 'fadeIn 0.4s ease',
        }}>
          <Typography sx={{ fontSize: '1.1rem' }}>⚡</Typography>
          <Typography variant="body2" color="#92400e" fontWeight={600}>
            Trial expires in <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong> — contact support to upgrade
          </Typography>
        </Box>
      )}

      {/* Desktop two-column layout */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 290px' }, gap: { xs: 2.5, md: 3 }, alignItems: 'start' }}>

        {/* Left / main column */}
        <Box>
          {/* Greeting hero */}
          <Box sx={{
            mb: 3, p: { xs: 2.5, md: 3.5 },
            background: 'linear-gradient(135deg, #064e3b 0%, #059669 60%, #34d399 100%)',
            borderRadius: 4,
            position: 'relative', overflow: 'hidden',
            animation: 'fadeUp 0.4s ease',
            boxShadow: '0 8px 32px rgba(5,150,105,0.3)',
          }}>
            {/* Decorative circles */}
            <Box sx={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.07)' }} />
            <Box sx={{ position: 'absolute', bottom: -60, right: 80, width: 140, height: 140, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                <Box>
                  <Typography variant="h5" fontWeight={800} sx={{ color: '#fff', letterSpacing: '-0.025em', mb: 0.5 }}>
                    {getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'} 👋
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', fontWeight: 500 }}>
                    {instituteName}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1.5} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                  {[['📚', 'Academic'], ['💳', 'Finance'], ['💬', 'WhatsApp']].map(([emoji, label]) => (
                    <Box key={label} sx={{
                      px: 1.5, py: 1, borderRadius: 2.5,
                      bgcolor: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(8px)',
                      textAlign: 'center',
                      minWidth: 64,
                    }}>
                      <Typography sx={{ fontSize: '1.2rem', lineHeight: 1.2 }}>{emoji}</Typography>
                      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600, letterSpacing: '0.04em' }}>{label}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Stack>
            </Box>
          </Box>

          {/* Stats grid */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', xl: 'repeat(3, 1fr)' },
            gap: { xs: 1.5, md: 2 },
            mb: 3,
          }}>
            {statCards.map((card, i) => (
              <StatCard key={i} {...card} loading={loading} delay={i * 0.06} />
            ))}
          </Box>

          {/* Feature / Quick section cards */}
          <Typography variant="subtitle1" fontWeight={700} mb={1.75} sx={{ color: 'text.primary', letterSpacing: '-0.01em' }}>
            Quick Sections
          </Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
            gap: { xs: 1.5, md: 2 },
          }}>
            <FeatureCard
              icon={<MenuBookIcon sx={{ color: '#fff', fontSize: 24 }} />}
              title="Academic"
              desc="Students, admissions, courses"
              gradient="linear-gradient(135deg, #064e3b 0%, #059669 100%)"
              onClick={() => navigate(`/${username}/section/academic`)}
              delay={0.25}
            />
            <FeatureCard
              icon={<WhatsAppIcon sx={{ color: '#fff', fontSize: 24 }} />}
              iconGlow="rgba(37,211,102,0.5)"
              title="WhatsApp"
              desc="Automation & broadcasts"
              gradient="linear-gradient(135deg, #064e3b 0%, #128C7E 100%)"
              badge={waConnected ? '● Live' : undefined}
              onClick={() => navigate(`/${username}/section/whatsapp`)}
              delay={0.31}
            />
            <FeatureCard
              icon={<BadgeIcon sx={{ color: '#fff', fontSize: 24 }} />}
              title="ID Card Maker"
              desc="Single, bulk, class-wise cards"
              gradient="linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)"
              badge="New"
              onClick={() => navigate(`/${username}/idcard`)}
              delay={0.37}
            />
            <FeatureCard
              icon={<AdminPanelSettingsIcon sx={{ color: '#fff', fontSize: 24 }} />}
              title="Admin"
              desc="Settings & accounts"
              gradient="linear-gradient(135deg, #1e293b 0%, #475569 100%)"
              onClick={() => navigate(`/${username}/section/admin`)}
              delay={0.43}
            />
          </Box>
        </Box>

        {/* Right column — desktop quick actions */}
        <Box sx={{ display: { xs: 'none', lg: 'flex' }, flexDirection: 'column', gap: 2 }}>

          {/* Quick Actions card */}
          <Card sx={{ animation: 'fadeUp 0.4s ease 0.15s both', overflow: 'hidden' }}>
            {/* Card header gradient strip */}
            <Box sx={{
              height: 4,
              background: 'linear-gradient(90deg, #059669, #34d399, #f59e0b)',
            }} />
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #f1f5f9' }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ letterSpacing: '-0.01em' }}>
                  Quick Actions
                </Typography>
                <Typography variant="caption" color="text.secondary">Jump to key tasks</Typography>
              </Box>
              {quickActions.map((a, i) => (
                <Box key={i}>
                  <QuickAction {...a} onClick={() => navigate(a.path)} />
                  {i < quickActions.length - 1 && (
                    <Box sx={{ mx: 2, height: '1px', bgcolor: '#f8fafc' }} />
                  )}
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* WhatsApp status */}
          <Card sx={{
            animation: 'fadeUp 0.4s ease 0.25s both',
            background: waConnected
              ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
              : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            border: waConnected ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
          }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <WhatsAppIcon sx={{ color: waConnected ? '#059669' : '#94a3b8', fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={700} color="text.primary">WhatsApp</Typography>
                </Stack>
                <Chip
                  label={waConnected ? 'Connected' : 'Offline'}
                  size="small"
                  color={waConnected ? 'success' : 'default'}
                  sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700 }}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block" mb={2} lineHeight={1.6}>
                {waConnected
                  ? 'Your WhatsApp bot is live and ready to send messages.'
                  : 'Connect WhatsApp to send automated messages to students.'}
              </Typography>
              <Button
                size="small"
                variant={waConnected ? 'outlined' : 'contained'}
                startIcon={<WhatsAppIcon sx={{ fontSize: 16 }} />}
                onClick={() => navigate(`/${username}/section/whatsapp`)}
                fullWidth
                sx={{ fontSize: '0.8125rem', py: 1 }}
              >
                {waConnected ? 'Manage Bot' : 'Connect Now'}
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
