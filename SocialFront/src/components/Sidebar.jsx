import { useState } from 'react';
import {
  Avatar, Box, Chip, Collapse, Drawer, List, ListItemButton,
  ListItemIcon, ListItemText, Stack, Typography,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
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
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const DRAWER_WIDTH = 256;

const S = {
  bg: '#071a0e',
  bgGradient: 'linear-gradient(180deg, #071a0e 0%, #091f11 100%)',
  border: 'rgba(5,150,105,0.15)',
  text: 'rgba(255,255,255,0.88)',
  textMuted: 'rgba(255,255,255,0.38)',
  textSub: 'rgba(255,255,255,0.55)',
  hover: 'rgba(255,255,255,0.07)',
  activeBg: 'rgba(5,150,105,0.22)',
  activeText: '#6ee7b7',
  activeBorder: '#059669',
  activeGlow: 'rgba(5,150,105,0.30)',
};

export default function Sidebar({ username, open, onClose, variant = 'permanent' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useApp();
  const [expanded, setExpanded] = useState({
    academic: true, finance: false, crm: false, features: true,
    hr: false, reports: false, settings: false,
  });

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const go = (path) => {
    navigate(path);
    if (variant === 'temporary') onClose?.();
  };

  const isActive = (path) => {
    if (path === `/${username}`) return location.pathname === path || location.pathname === `/${username}/`;
    return location.pathname.startsWith(path);
  };

  const initials = (user?.name || 'A').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User';

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
        { label: 'WhatsApp Bot', icon: <WhatsAppIcon fontSize="small" sx={{ color: '#25d366' }} />, path: `/${username}/section/whatsapp`, badge: 'Live', highlight: true },
        { label: 'Greetings', icon: <EmojiEventsIcon fontSize="small" sx={{ color: '#f59e0b' }} />, path: `/${username}/greetings`, badge: 'New', highlight: true },
        { label: 'Document Maker', icon: <BadgeIcon fontSize="small" sx={{ color: '#fcd34d' }} />, path: `/${username}/section/canvas`, badge: 'Pro', highlight: true },
        { label: 'Public Forms', icon: <DynamicFormIcon fontSize="small" sx={{ color: '#93c5fd' }} />, path: `/${username}/forms`, badge: 'New', highlight: true },
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

  const navItemSx = (item) => {
    const active = isActive(item.path);
    return {
      borderRadius: 2,
      mb: 0.25,
      pl: 1.75,
      minHeight: 38,
      color: active ? S.activeText : S.text,
      borderLeft: `2.5px solid ${active ? S.activeBorder : 'transparent'}`,
      transition: 'all 0.15s ease',
      '&:hover': { bgcolor: S.hover, color: '#fff', borderLeftColor: 'rgba(5,150,105,0.5)' },
      '&.Mui-selected': {
        bgcolor: S.activeBg,
        boxShadow: `inset 3px 0 0 ${S.activeBorder}`,
        '&:hover': { bgcolor: S.activeGlow },
      },
    };
  };

  const content = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: S.bgGradient, overflow: 'hidden' }}>

      {/* Brand Header */}
      <Box
        onClick={() => go(`/${username}`)}
        sx={{
          px: 3, py: 2.75,
          background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
          '&::before': {
            content: '""', position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 110% 50%, rgba(52,211,153,0.25) 0%, transparent 60%)',
          },
          '&::after': {
            content: '""', position: 'absolute',
            top: -30, right: -30, width: 100, height: 100,
            borderRadius: '50%', background: 'rgba(255,255,255,0.07)',
          },
          '&:hover': { opacity: 0.92 },
          transition: 'opacity 0.15s ease',
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={0.25}>
            <Box sx={{
              width: 28, height: 28, borderRadius: 1.5,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}>
              <Typography sx={{ fontSize: '0.95rem', lineHeight: 1 }}>⚡</Typography>
            </Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', letterSpacing: '-0.5px', fontSize: '1.05rem' }}>
              Instify
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.04em', pl: 4.5 }}>
            Institute Management
          </Typography>
        </Box>
      </Box>

      {/* Dashboard shortcut */}
      <Box sx={{ pt: 2, px: 1.5, flexShrink: 0 }}>
        <ListItemButton
          selected={isActive(`/${username}`) && location.pathname.split('/').length <= 2}
          onClick={() => go(`/${username}`)}
          sx={{
            borderRadius: 2, mb: 0.5,
            color: S.text,
            borderLeft: '2.5px solid transparent',
            transition: 'all 0.15s ease',
            '&:hover': { bgcolor: S.hover, color: '#fff', borderLeftColor: 'rgba(5,150,105,0.5)' },
            '&.Mui-selected': {
              bgcolor: S.activeBg, color: S.activeText,
              borderLeftColor: S.activeBorder,
              '&:hover': { bgcolor: S.activeGlow },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
            <DashboardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Dashboard"
            primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem', color: 'inherit' }}
          />
        </ListItemButton>
      </Box>

      {/* Thin divider */}
      <Box sx={{ mx: 2, mb: 1, height: '1px', background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

      {/* Scrollable nav */}
      <Box sx={{
        flex: 1, overflowY: 'auto', px: 1.5, pb: 1,
        '&::-webkit-scrollbar': { width: 3 },
        '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: 99 },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
      }}>
        {groups.map((group) => (
          <Box key={group.key} sx={{ mb: 0.25 }}>
            {/* Group header */}
            <Box
              onClick={() => toggle(group.key)}
              sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: 1.5, py: 0.875, cursor: 'pointer', borderRadius: 1.5, mb: 0.25,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                transition: 'background 0.15s ease',
              }}
            >
              <Typography sx={{
                fontSize: '0.62rem', fontWeight: 700, color: S.textMuted,
                textTransform: 'uppercase', letterSpacing: '0.12em',
              }}>
                {group.label}
              </Typography>
              {expanded[group.key]
                ? <ExpandLessIcon sx={{ fontSize: 12, color: S.textMuted }} />
                : <ExpandMoreIcon sx={{ fontSize: 12, color: S.textMuted }} />}
            </Box>

            <Collapse in={expanded[group.key]}>
              <List dense disablePadding sx={{ mt: 0.25 }}>
                {group.items.map((item) => (
                  <ListItemButton
                    key={item.path}
                    selected={isActive(item.path)}
                    onClick={() => go(item.path)}
                    sx={navItemSx(item)}
                  >
                    <ListItemIcon sx={{ minWidth: 30, color: isActive(item.path) ? S.activeText : S.textSub }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.825rem',
                        fontWeight: isActive(item.path) ? 600 : 400,
                        color: 'inherit',
                        ...(item.highlight && !isActive(item.path) && {
                          background: 'linear-gradient(90deg, #6ee7b7, #fcd34d)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }),
                      }}
                    />
                    {item.badge && (
                      <Chip
                        label={item.badge}
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: '0.58rem',
                          fontWeight: 700,
                          letterSpacing: '0.03em',
                          bgcolor: item.badge === 'Live'
                            ? 'rgba(16,185,129,0.2)'
                            : item.badge === 'Pro'
                            ? 'rgba(245,158,11,0.2)'
                            : 'rgba(59,130,246,0.2)',
                          color: item.badge === 'Live'
                            ? '#6ee7b7'
                            : item.badge === 'Pro'
                            ? '#fcd34d'
                            : '#93c5fd',
                          border: 'none',
                          '& .MuiChip-label': { px: 0.75 },
                          ...(item.badge === 'Live' && {
                            '&::before': {
                              content: '""',
                              display: 'inline-block',
                              width: 5, height: 5,
                              borderRadius: '50%',
                              bgcolor: '#6ee7b7',
                              mr: 0.4,
                              animation: 'livePulse 2s ease-in-out infinite',
                            },
                          }),
                        }}
                      />
                    )}
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </Box>
        ))}
      </Box>

      {/* User info footer */}
      <Box sx={{
        p: 2, flexShrink: 0,
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(0,0,0,0.25)',
      }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar sx={{
            width: 34, height: 34,
            background: 'linear-gradient(135deg, #059669, #34d399)',
            fontSize: '0.75rem', fontWeight: 800,
            boxShadow: '0 0 0 2px rgba(5,150,105,0.4)',
          }}>
            {initials}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: S.text, lineHeight: 1.25 }} noWrap>
              {user?.name || 'Admin'}
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: S.textMuted, lineHeight: 1, mt: 0.125 }} noWrap>
              {roleLabel}
            </Typography>
          </Box>
          <Box sx={{
            width: 8, height: 8, borderRadius: '50%',
            bgcolor: '#34d399',
            boxShadow: '0 0 6px #34d399',
            flexShrink: 0,
          }} />
        </Stack>
      </Box>
    </Box>
  );

  if (variant === 'temporary') {
    return (
      <Drawer
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
          },
        }}
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
        },
      }}
    >
      {content}
    </Drawer>
  );
}
