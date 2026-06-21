import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import {
  AppBar, Avatar, Badge, Box, Breadcrumbs, Button, Card, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  IconButton, Stack, Toolbar, Tooltip, Typography, Link,
} from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';

import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import FloatingButtons from './floatingButton';
import CloudConnectDialog from '../components/CloudConnectDialog';
import { useApp } from '../context/AppContext';
import { clearUserAndInstituteData } from '../utils/storageUtils';

const DRAWER_WIDTH = 256;

const ROUTE_LABELS = {
  students: 'Students', allAdmission: 'Admissions', courses: 'Courses',
  batches: 'Batches', addAttendance: 'Attendance', allAttendance: 'Attendance Report',
  exam: 'Exams', allExams: 'Exam Results', leads: 'Leads', enquiry: 'Enquiries',
  followup: 'Follow-ups', fees: 'Fees', addPayment: 'Add Payment',
  addReciept: 'Add Receipt', allTransaction3: 'Transactions', 'trial-balance': 'Trial Balance',
  'profit-loss': 'Profit & Loss', 'funnel-report': 'Funnel Report',
  employees: 'Employees', user: 'Users', instituteProfile: 'Institute Profile',
  owner: 'Owner', paymentmode: 'Payment Modes', orgcategories: 'Org Categories',
  addAccount: 'Accounts', 'upi-payment': 'UPI Payment', 'csv-import': 'CSV Import',
  'bulk-download': 'Bulk Download', forms: 'Public Forms', idcard: 'ID Cards',
  whatsapp: 'WhatsApp', coursesCategory: 'Course Categories', education: 'Education',
  greetings: 'Achievement Greetings',
  allBalance: 'Balance Report', allLeadByAdmission: 'Lead by Admission',
  'add-lead': 'Add Lead', addNewAdd: 'New Admission',
};

function getBreadcrumb(pathname, username) {
  const seg = pathname.replace(`/${username}/`, '').split('/')[0];
  return ROUTE_LABELS[seg] || null;
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, institute, setUser, setInstitute } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const [cloudDialogOpen, setCloudDialogOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); // { state, message, lastSyncAt }

  useEffect(() => {
    if (!window.electronAPI) return;
    const unsub = window.electronAPI.onSyncStatus(setSyncStatus);
    return unsub;
  }, []);

  useEffect(() => {
    if (!window.electronAPI) return;
    // Show cloud connect dialog once if no token is stored
    Promise.all([
      window.electronAPI.getConfig('cloudAuthToken'),
      window.electronAPI.getConfig('cloudConnectDismissed'),
    ]).then(([token, dismissed]) => {
      if (!token && !dismissed) setCloudDialogOpen(true);
    }).catch(() => {});
  }, []);

  const handleCloudDialogClose = () => {
    setCloudDialogOpen(false);
    window.electronAPI?.setConfig('cloudConnectDismissed', true);
  };

  const username = user?.username || location.pathname.split('/')[1] || 'admin';
  const instituteName = institute?.institute_name || localStorage.getItem('institute_title') || 'Instify';
  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Dashboard';
  const initials = (user?.name || 'A').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const crumb = getBreadcrumb(location.pathname, username);
  const isHome = location.pathname === `/${username}` || location.pathname === `/${username}/`;

  // Trial expiry check — super_admin and paid-active institutes are never blocked
  const isTrialExpired = useMemo(() => {
    if (user?.role === 'super_admin') return false;
    const plan = institute?.plan_type || 'trial';
    const status = institute?.status || 'trial';
    if (plan === 'paid' && status === 'active') return false;
    const expiryStr = institute?.trialExpiresAt
      || localStorage.getItem('trialExpiresAt')
      || localStorage.getItem('expiry_date');
    if (!expiryStr) return false;
    return new Date(expiryStr) < new Date();
  }, [user, institute]);

  const handleLogout = () => setLogoutDialogOpen(true);

  const confirmLogout = () => {
    clearUserAndInstituteData();
    setUser(null);
    setInstitute(null);
    setLogoutDialogOpen(false);
    navigate('/');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Desktop sidebar (permanent) */}
      <Sidebar username={username} />

      {/* Mobile sidebar (drawer) */}
      <Sidebar
        username={username}
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main content column */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, maxWidth: '100%' }}>

        {/* Top AppBar — glass morphism */}
        <AppBar position="sticky" elevation={0}>
          <Toolbar sx={{
            gap: 1,
            minHeight: { xs: 58, sm: 64 },
            px: { xs: 2, md: 3 },
          }}>
            {/* Back button — mobile only, inner pages */}
            {!isHome && (
              <IconButton
                edge="start"
                onClick={() => navigate(-1)}
                sx={{
                  display: { md: 'none' },
                  mr: 0.5,
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'rgba(5,150,105,0.08)', color: 'primary.main' },
                }}
              >
                <ArrowBackIosNewRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}

            {/* Title / Breadcrumb */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Mobile */}
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ color: 'text.primary', lineHeight: 1.2 }}>
                  {crumb || instituteName}
                </Typography>
                {crumb && (
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ lineHeight: 1 }}>
                    {instituteName}
                  </Typography>
                )}
              </Box>

              {/* Desktop */}
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                {isHome ? (
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ color: 'text.primary', lineHeight: 1.2 }}>
                      {instituteName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                      {roleLabel}
                    </Typography>
                  </Box>
                ) : (
                  <Breadcrumbs
                    separator={<NavigateNextIcon sx={{ fontSize: 13, color: 'text.disabled' }} />}
                    sx={{ '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap', alignItems: 'center' } }}
                  >
                    <Link
                      component="button"
                      variant="body2"
                      color="text.secondary"
                      underline="hover"
                      onClick={() => navigate(`/${username}`)}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 0.4,
                        fontWeight: 500, fontSize: '0.8125rem',
                        '&:hover': { color: 'primary.main' },
                        transition: 'color 0.15s ease',
                      }}
                    >
                      <HomeRoundedIcon sx={{ fontSize: 14 }} />
                      Home
                    </Link>
                    <Typography variant="body2" fontWeight={600} noWrap sx={{
                      color: 'text.primary', fontSize: '0.8125rem',
                    }}>
                      {crumb}
                    </Typography>
                  </Breadcrumbs>
                )}
              </Box>
            </Box>

            {/* Right actions */}
            <Stack direction="row" spacing={0.5} alignItems="center">
              {/* Sync status — desktop only */}
              {window.electronAPI && syncStatus && (
                <Tooltip
                  title={syncStatus.message || 'Sync status'}
                  arrow
                >
                  <IconButton
                    size="small"
                    onClick={() => window.electronAPI.syncNow?.()}
                    sx={{
                      color: syncStatus.state === 'ok' ? 'primary.main'
                        : syncStatus.state === 'error' || syncStatus.state === 'partial' ? 'warning.main'
                        : 'text.secondary',
                      '&:hover': { bgcolor: 'rgba(5,150,105,0.08)' },
                    }}
                  >
                    {syncStatus.state === 'syncing'
                      ? <CircularProgress size={16} color="inherit" />
                      : <CloudSyncIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              )}

              <Tooltip title="Notifications" arrow>
                <IconButton
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { bgcolor: 'rgba(5,150,105,0.08)', color: 'primary.main' },
                  }}
                >
                  <Badge badgeContent={0} color="error">
                    <NotificationsNoneIcon fontSize="small" />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Tooltip title={user?.name || 'Profile'} arrow>
                <Avatar
                  onClick={() => navigate(`/${username}/user`)}
                  sx={{
                    width: 34, height: 34,
                    background: 'linear-gradient(135deg, #059669, #34d399)',
                    fontSize: '0.78rem', fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 0 0 2px rgba(5,150,105,0)',
                    '&:hover': {
                      transform: 'scale(1.06)',
                      boxShadow: '0 0 0 2px rgba(5,150,105,0.4)',
                    },
                  }}
                >
                  {initials}
                </Avatar>
              </Tooltip>

              <Tooltip title="Logout" arrow>
                <IconButton
                  size="small"
                  onClick={handleLogout}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { bgcolor: 'rgba(239,68,68,0.08)', color: 'error.main' },
                  }}
                >
                  <LogoutRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Hamburger — mobile only, right side */}
              <IconButton
                edge="end"
                onClick={() => setMobileOpen(true)}
                sx={{
                  display: { md: 'none' },
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'rgba(5,150,105,0.08)', color: 'primary.main' },
                }}
              >
                <MenuRoundedIcon />
              </IconButton>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            px: { xs: 2, md: 3, xl: 4 },
            pt: { xs: 2.5, md: 3 },
            pb: { xs: 10, md: 4 },
            overflowY: 'auto',
            maxWidth: { xl: 1600 },
            width: '100%',
            mx: 'auto',
          }}
        >
          {isTrialExpired ? (
            <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  Your free trial has ended. Contact support to activate your plan and continue using Instify.
                </Typography>
                <Stack spacing={1.5} alignItems="center">
                  <Button variant="contained" color="error" onClick={handleLogout} sx={{ px: 4 }}>
                    Logout
                  </Button>
                </Stack>
              </Card>
            </Box>
          ) : (
            <Outlet />
          )}
        </Box>
      </Box>

      {/* Mobile bottom navigation */}
      <BottomNav username={username} />

      {/* Cloud connect dialog — shown on first desktop launch when no token */}
      {window.electronAPI && (
        <CloudConnectDialog
          open={cloudDialogOpen}
          onClose={handleCloudDialogClose}
          onConnected={() => setCloudDialogOpen(false)}
        />
      )}

      {/* Floating quick-action */}
      <FloatingButtons
        direction="up"
        buttonsList={[
          { label: '+ Add Student', onClick: () => navigate(`/${username}/students`) },
          { label: '+ New Admission', onClick: () => navigate(`/${username}/addNewAdd`) },
          { label: '+ Add Lead', onClick: () => navigate(`/${username}/add-lead`) },
          { label: 'Collect Fee', onClick: () => navigate(`/${username}/addReciept`) },
          { label: 'Add Payment', onClick: () => navigate(`/${username}/addPayment`) },
          { label: 'Attendance', onClick: () => navigate(`/${username}/addAttendance`) },
        ]}
      />
      {/* Logout confirmation dialog (Safari-safe — no window.confirm) */}
      <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)}>
        <DialogTitle>Log out?</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to log out?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={confirmLogout} variant="contained" color="error">Log out</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
