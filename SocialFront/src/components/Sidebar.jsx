import { useState } from 'react';
import {
  Box, Collapse, Drawer, List, ListItemButton,
  ListItemIcon, ListItemText, Typography, Divider, Chip,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import GroupsIcon from '@mui/icons-material/Groups';
import ChecklistIcon from '@mui/icons-material/Checklist';
import PaymentIcon from '@mui/icons-material/Payment';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ForumIcon from '@mui/icons-material/Forum';
import EventNoteIcon from '@mui/icons-material/EventNote';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import BadgeIcon from '@mui/icons-material/Badge';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import QuizIcon from '@mui/icons-material/Quiz';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import BalanceIcon from '@mui/icons-material/Balance';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import FunnelIcon from '@mui/icons-material/FilterAlt';
import DynamicFormIcon from '@mui/icons-material/DynamicForm';

const DRAWER_WIDTH = 256;

export default function Sidebar({ username, open, onClose, variant = 'permanent' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState({ academic: true, finance: false, crm: false, features: true, hr: false, reports: false, settings: false });

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const go = (path) => {
    navigate(path);
    if (variant === 'temporary') onClose?.();
  };

  const isActive = (path) => {
    if (path === `/${username}`) return location.pathname === path || location.pathname === `/${username}/`;
    return location.pathname.startsWith(path);
  };

  const groups = [
    {
      key: 'academic',
      label: 'Academic',
      items: [
        { label: 'Students', icon: <PeopleIcon fontSize="small" />, path: `/${username}/students` },
        { label: 'Admissions', icon: <SchoolIcon fontSize="small" />, path: `/${username}/allAdmission` },
        { label: 'Courses', icon: <LibraryBooksIcon fontSize="small" />, path: `/${username}/courses` },
        { label: 'Batches', icon: <GroupsIcon fontSize="small" />, path: `/${username}/batches` },
        { label: 'Attendance', icon: <ChecklistIcon fontSize="small" />, path: `/${username}/addAttendance` },
        { label: 'Exams', icon: <QuizIcon fontSize="small" />, path: `/${username}/exam` },
      ],
    },
    {
      key: 'finance',
      label: 'Finance',
      items: [
        { label: 'Fees', icon: <PaymentIcon fontSize="small" />, path: `/${username}/fees` },
        { label: 'Add Payment', icon: <AccountBalanceWalletIcon fontSize="small" />, path: `/${username}/addPayment` },
        { label: 'Add Receipt', icon: <ReceiptLongIcon fontSize="small" />, path: `/${username}/addReciept` },
        { label: 'Transactions', icon: <AccountBalanceIcon fontSize="small" />, path: `/${username}/allTransaction3` },
        { label: 'Trial Balance', icon: <BalanceIcon fontSize="small" />, path: `/${username}/trial-balance` },
        { label: 'Profit & Loss', icon: <ShowChartIcon fontSize="small" />, path: `/${username}/profit-loss` },
      ],
    },
    {
      key: 'hr',
      label: 'HR & Payroll',
      items: [
        { label: 'Employees', icon: <PeopleOutlineIcon fontSize="small" />, path: `/${username}/employees` },
      ],
    },
    {
      key: 'crm',
      label: 'CRM',
      items: [
        { label: 'Leads', icon: <TrendingUpIcon fontSize="small" />, path: `/${username}/leads` },
        { label: 'Enquiries', icon: <ForumIcon fontSize="small" />, path: `/${username}/enquiry` },
        { label: 'Follow-ups', icon: <EventNoteIcon fontSize="small" />, path: `/${username}/followup` },
        { label: 'Funnel Report', icon: <FunnelIcon fontSize="small" />, path: `/${username}/funnel-report` },
      ],
    },
    {
      key: 'features',
      label: 'Features',
      items: [
        {
          label: 'WhatsApp Bot',
          icon: <WhatsAppIcon fontSize="small" sx={{ color: '#25d366' }} />,
          path: `/${username}/section/whatsapp`,
          badge: 'Live',
          highlight: true,
        },
        {
          label: 'Document Maker',
          icon: <BadgeIcon fontSize="small" sx={{ color: '#7c3aed' }} />,
          path: `/${username}/section/canvas`,
          badge: 'Pro',
          highlight: true,
        },
        {
          label: 'Public Forms',
          icon: <DynamicFormIcon fontSize="small" sx={{ color: '#0ea5e9' }} />,
          path: `/${username}/forms`,
          badge: 'New',
          highlight: true,
        },
        { label: 'Academic Hub', icon: <UploadFileIcon fontSize="small" />, path: `/${username}/section/academic`, highlight: true },
        { label: 'Admin Hub', icon: <DownloadIcon fontSize="small" />, path: `/${username}/section/admin`, highlight: true },
        { label: 'CSV Import', icon: <UploadFileIcon fontSize="small" />, path: `/${username}/csv-import` },
        { label: 'Bulk Download', icon: <DownloadIcon fontSize="small" />, path: `/${username}/bulk-download` },
      ],
    },
    {
      key: 'settings',
      label: 'Settings',
      items: [
        { label: 'Institute Profile', icon: <CorporateFareIcon fontSize="small" />, path: `/${username}/instituteProfile` },
        { label: 'Users', icon: <ManageAccountsIcon fontSize="small" />, path: `/${username}/user` },
      ],
    },
  ];

  const itemSx = (item) => ({
    borderRadius: 2,
    mb: 0.25,
    pl: 2,
    minHeight: 38,
    ...(item.highlight && !isActive(item.path) && {
      background: 'linear-gradient(90deg, rgba(79,70,229,0.05), rgba(124,58,237,0.05))',
    }),
    '&.Mui-selected': {
      bgcolor: 'primary.main',
      color: '#fff',
      '& .MuiListItemIcon-root': { color: '#fff' },
      '&:hover': { bgcolor: 'primary.dark' },
    },
  });

  const content = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      {/* Brand */}
      <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #e2e8f0' }}>
        <Typography variant="h6" fontWeight={800} sx={{ color: 'primary.main', letterSpacing: '-0.5px' }}>
          Instify
        </Typography>
        <Typography variant="caption" color="text.secondary">Institute Management System</Typography>
      </Box>

      {/* Dashboard */}
      <List dense sx={{ pt: 1.5, px: 1.5 }}>
        <ListItemButton
          selected={isActive(`/${username}`) && location.pathname.split('/').length <= 2}
          onClick={() => go(`/${username}`)}
          sx={{
            borderRadius: 2,
            mb: 0.5,
            '&.Mui-selected': { bgcolor: 'primary.main', color: '#fff', '& .MuiListItemIcon-root': { color: '#fff' }, '&:hover': { bgcolor: 'primary.dark' } },
          }}
        >
          <ListItemIcon sx={{ minWidth: 34 }}><DashboardIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Dashboard" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }} />
        </ListItemButton>
      </List>

      <Divider sx={{ mx: 2 }} />

      {/* Grouped Nav */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1 }}>
        {groups.map((group) => (
          <Box key={group.key} sx={{ mb: 0.5 }}>
            <ListItemButton onClick={() => toggle(group.key)} sx={{ borderRadius: 2, py: 0.5 }}>
              <ListItemText
                primary={group.label}
                primaryTypographyProps={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              />
              {expanded[group.key]
                ? <ExpandLessIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                : <ExpandMoreIcon sx={{ fontSize: 14, color: 'text.secondary' }} />}
            </ListItemButton>

            <Collapse in={expanded[group.key]}>
              <List dense disablePadding>
                {group.items.map((item) => (
                  <ListItemButton
                    key={item.path}
                    selected={isActive(item.path)}
                    onClick={() => go(item.path)}
                    sx={itemSx(item)}
                  >
                    <ListItemIcon sx={{ minWidth: 30 }}>{item.icon}</ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.825rem',
                        fontWeight: isActive(item.path) ? 600 : 400,
                      }}
                    />
                    {item.badge && (
                      <Chip
                        label={item.badge}
                        size="small"
                        color={item.badge === 'Live' ? 'success' : 'secondary'}
                        sx={{ height: 16, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.75 } }}
                      />
                    )}
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </Box>
        ))}
      </Box>
    </Box>
  );

  if (variant === 'temporary') {
    return (
      <Drawer
        open={open}
        onClose={onClose}
        sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          border: 'none',
          borderRight: '1px solid #e2e8f0',
        },
      }}
    >
      {content}
    </Drawer>
  );
}
