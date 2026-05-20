import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  AppBar, Avatar, Badge, Box, Breadcrumbs, IconButton,
  Stack, Toolbar, Tooltip, Typography, Link,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import FloatingButtons from './floatingButton';
import { useApp } from '../context/AppContext';

const DRAWER_WIDTH = 260;

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
  const { user, institute } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const username = user?.username || location.pathname.split('/')[1] || 'admin';
  const instituteName = institute?.institute_name || localStorage.getItem('institute_title') || 'Instify';
  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Dashboard';
  const initials = (user?.name || 'A').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const crumb = getBreadcrumb(location.pathname, username);
  const isHome = location.pathname === `/${username}` || location.pathname === `/${username}/`;

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('user');
      localStorage.removeItem('institute');
      navigate('/');
    }
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
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          maxWidth: '100%',
        }}
      >
        {/* Top AppBar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ bgcolor: 'background.paper', color: 'text.primary' }}
        >
          <Toolbar sx={{ gap: 1, minHeight: { xs: 56, sm: 64 }, px: { xs: 2, md: 3 } }}>
            {/* Hamburger for mobile */}
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ display: { md: 'none' }, mr: 0.5 }}
            >
              <MenuIcon />
            </IconButton>

            {/* Breadcrumb / Title area */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Mobile: just institute name */}
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Typography variant="subtitle1" fontWeight={700} noWrap>
                  {crumb || instituteName}
                </Typography>
                {crumb && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {instituteName}
                  </Typography>
                )}
              </Box>

              {/* Desktop: breadcrumb */}
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                {isHome ? (
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>{instituteName}</Typography>
                    <Typography variant="caption" color="text.secondary">{roleLabel}</Typography>
                  </Box>
                ) : (
                  <Breadcrumbs
                    separator={<NavigateNextIcon sx={{ fontSize: 14 }} />}
                    sx={{ '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' } }}
                  >
                    <Link
                      component="button"
                      variant="body2"
                      color="text.secondary"
                      underline="hover"
                      onClick={() => navigate(`/${username}`)}
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.4, fontWeight: 500 }}
                    >
                      <HomeRoundedIcon sx={{ fontSize: 15 }} />
                      Home
                    </Link>
                    <Typography variant="body2" color="text.primary" fontWeight={600} noWrap>
                      {crumb}
                    </Typography>
                  </Breadcrumbs>
                )}
              </Box>
            </Box>

            {/* Right actions */}
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Tooltip title="Notifications">
                <IconButton size="small">
                  <Badge badgeContent={0} color="error">
                    <NotificationsNoneIcon fontSize="small" />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Tooltip title={user?.name || 'Profile'}>
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: 'primary.main',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'opacity 0.15s',
                    '&:hover': { opacity: 0.85 },
                  }}
                  onClick={() => navigate(`/${username}/user`)}
                >
                  {initials}
                </Avatar>
              </Tooltip>

              <Tooltip title="Logout">
                <IconButton size="small" onClick={handleLogout} color="error">
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            px: { xs: 2, md: 3, xl: 4 },
            pt: { xs: 2, md: 3 },
            pb: { xs: 10, md: 4 },
            overflowY: 'auto',
            maxWidth: { xl: 1600 },
            width: '100%',
            mx: 'auto',
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Mobile bottom navigation */}
      <BottomNav username={username} />

      {/* Floating quick-action button */}
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
    </Box>
  );
}
