import { Box, Divider, List, ListItem, ListItemButton, Paper, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PaymentIcon from '@mui/icons-material/Payment';
import CategoryIcon from '@mui/icons-material/Category';
import SchoolIcon from '@mui/icons-material/School';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import QrCodeIcon from '@mui/icons-material/QrCode';
import BusinessIcon from '@mui/icons-material/Business';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import BalanceIcon from '@mui/icons-material/Balance';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';

function SectionHeader({ label }) {
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      fontWeight={700}
      sx={{ textTransform: 'uppercase', letterSpacing: 0.8, px: 0.5, mb: 0.5, display: 'block' }}
    >
      {label}
    </Typography>
  );
}

function AdminListItem({ icon, label, desc, color, onClick, isLast }) {
  return (
    <>
      <ListItem disablePadding>
        <ListItemButton
          onClick={onClick}
          sx={{ px: 2, py: 1.25, gap: 2, '&:active': { bgcolor: 'action.selected' } }}
        >
          <Box
            sx={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              bgcolor: `${color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }}>
              {label}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
              {desc}
            </Typography>
          </Box>
          <ChevronRightIcon sx={{ color: 'text.disabled', fontSize: 20, flexShrink: 0 }} />
        </ListItemButton>
      </ListItem>
      {!isLast && <Divider component="li" sx={{ mx: 2 }} />}
    </>
  );
}

function AdminGroup({ title, items, go }) {
  return (
    <Box mb={2.5}>
      <SectionHeader label={title} />
      <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        <List disablePadding>
          {items.map((m, i) => (
            <AdminListItem
              key={m.path}
              {...m}
              onClick={() => go(m.path)}
              isLast={i === items.length - 1}
            />
          ))}
        </List>
      </Paper>
    </Box>
  );
}

export default function AdminHub() {
  const navigate = useNavigate();
  const { username } = useParams();
  const { user } = useApp();
  const go = (path) => navigate(`/${username}/${path}`);

  const isSuperAdmin = user?.role === 'super_admin';
  const isOwner = user?.role === 'owner';

  const groups = [
    ...(isSuperAdmin ? [{
      title: 'Super Admin',
      items: [
        { icon: <SupervisorAccountIcon />, label: 'Super Admin Panel', desc: 'Manage all institutes & plans', color: '#7c3aed', path: 'tools' },
      ],
    }] : []),
    {
      title: 'Institute Settings',
      items: [
        { icon: <CorporateFareIcon />,  label: 'Institute Profile', desc: 'Edit logo, name, branding',       color: '#1a7a4a', path: 'instituteProfile' },
        { icon: <ManageAccountsIcon />, label: 'Users & Staff',     desc: 'Manage roles and accounts',       color: '#d4a017', path: 'user' },
        ...(isSuperAdmin || isOwner
          ? [{ icon: <BusinessIcon />, label: 'Institutes', desc: 'All institutes (superadmin)', color: '#0891b2', path: isSuperAdmin ? 'tools' : 'institutes' }]
          : []),
      ],
    },
    {
      title: 'Financial',
      items: [
        { icon: <PaymentIcon />,              label: 'Payment Modes', desc: 'Cash, UPI, bank settings',     color: '#10b981', path: 'paymentmode' },
        { icon: <AccountBalanceWalletIcon />, label: 'Accounts',      desc: 'Chart of accounts / ledger',   color: '#059669', path: 'addAccount' },
        { icon: <BarChartIcon />,             label: 'Transactions',  desc: 'Full transaction ledger',      color: '#374151', path: 'allTransaction3' },
        { icon: <QrCodeIcon />,               label: 'UPI Payment',   desc: 'UPI QR & collection link',     color: '#d4a017', path: 'upi-payment' },
      ],
    },
    {
      title: 'Academic Config',
      items: [
        { icon: <CategoryIcon />,       label: 'Course Categories', desc: 'Categorise your courses',      color: '#f59e0b', path: 'coursesCategory' },
        { icon: <SchoolIcon />,         label: 'Education Types',   desc: 'UG, PG, Diploma etc.',         color: '#d97706', path: 'education' },
        { icon: <AccountBalanceIcon />, label: 'Org Categories',    desc: 'Organisation structure',        color: '#25a066', path: 'orgcategories' },
      ],
    },
    {
      title: 'Reports & Data',
      items: [
        { icon: <BalanceIcon />,    label: 'Trial Balance',  desc: 'All accounts Dr/Cr summary',      color: '#1a7a4a', path: 'trial-balance' },
        { icon: <ShowChartIcon />,  label: 'Profit & Loss',  desc: 'Income vs expense statement',     color: '#10b981', path: 'profit-loss' },
        { icon: <BarChartIcon />,   label: 'Balance Report', desc: 'Account-wise balances',           color: '#0891b2', path: 'allBalance' },
        { icon: <PeopleOutlineIcon />, label: 'HR & Payroll',   desc: 'Employees, salary & payslips', color: '#d4a017', path: 'employees' },
        { icon: <UploadFileIcon />, label: 'CSV Import',     desc: 'Bulk import students/leads',      color: '#0284c7', path: 'csv-import' },
        { icon: <DownloadIcon />,   label: 'Bulk Download',  desc: 'Export ZIP of records',           color: '#64748b', path: 'bulk-download' },
      ],
    },
  ];

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h6" fontWeight={700} mb={0.5}>Administration</Typography>
        <Typography variant="body2" color="text.secondary">
          Institute settings, users, accounts, and data management tools.
        </Typography>
      </Box>

      {groups.map((g) => (
        <AdminGroup key={g.title} title={g.title} items={g.items} go={go} />
      ))}
    </Box>
  );
}
