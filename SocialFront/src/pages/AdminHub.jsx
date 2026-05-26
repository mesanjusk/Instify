import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
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

function AdminCard({ icon, label, desc, color, onClick }) {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:active': { transform: 'scale(0.97)' },
        '&:hover': { boxShadow: `0 4px 20px ${color}22`, transform: 'translateY(-1px)' },
      }}
    >
      <CardContent sx={{ p: { xs: 1.75, md: 2 }, '&:last-child': { pb: { xs: 1.75, md: 2 } } }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: { xs: 40, md: 44 }, height: { xs: 40, md: 44 },
              borderRadius: 2.5, flexShrink: 0,
              bgcolor: `${color}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ fontSize: { xs: '0.82rem', md: '0.875rem' } }}>
              {label}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: { xs: '0.72rem', md: '0.75rem' } }}>
              {desc}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function AdminHub() {
  const navigate = useNavigate();
  const { username } = useParams();
  const { user } = useApp();
  const go = (path) => navigate(`/${username}/${path}`);

  const items = [
    { icon: <CorporateFareIcon />,         label: 'Institute Profile',    desc: 'Edit logo, name, branding',        color: '#1a7a4a', path: 'instituteProfile' },
    { icon: <ManageAccountsIcon />,        label: 'Users & Staff',        desc: 'Manage roles and accounts',         color: '#d4a017', path: 'user' },
    { icon: <BusinessIcon />,             label: 'Institutes',           desc: 'All institutes (superadmin)',        color: '#0891b2', path: 'institutes' },
    { icon: <PaymentIcon />,              label: 'Payment Modes',        desc: 'Cash, UPI, bank settings',           color: '#10b981', path: 'paymentmode' },
    { icon: <CategoryIcon />,             label: 'Course Categories',    desc: 'Categorise your courses',            color: '#f59e0b', path: 'coursesCategory' },
    { icon: <SchoolIcon />,              label: 'Education Types',      desc: 'UG, PG, Diploma etc.',               color: '#d97706', path: 'education' },
    { icon: <AccountBalanceIcon />,       label: 'Org Categories',       desc: 'Organisation structure',             color: '#25a066', path: 'orgcategories' },
    { icon: <AccountBalanceWalletIcon />, label: 'Accounts',             desc: 'Chart of accounts / ledger',         color: '#059669', path: 'addAccount' },
    { icon: <BarChartIcon />,            label: 'Transactions',         desc: 'Full transaction ledger',            color: '#0a1a0f', path: 'allTransaction3' },
    { icon: <BarChartIcon />,            label: 'Balance Report',       desc: 'Account-wise balances',              color: '#374151', path: 'allBalance' },
    { icon: <QrCodeIcon />,              label: 'UPI Payment',          desc: 'UPI QR & collection link',           color: '#d4a017', path: 'upi-payment' },
    { icon: <UploadFileIcon />,          label: 'CSV Import',           desc: 'Bulk import students/leads',         color: '#0284c7', path: 'csv-import' },
    { icon: <DownloadIcon />,            label: 'Bulk Download',        desc: 'Export ZIP of records',              color: '#64748b', path: 'bulk-download' },
    { icon: <PeopleOutlineIcon />,       label: 'HR & Payroll',         desc: 'Employees, salary & payslips',       color: '#d4a017', path: 'employees' },
    { icon: <BalanceIcon />,             label: 'Trial Balance',        desc: 'All accounts Dr/Cr summary',         color: '#1a7a4a', path: 'trial-balance' },
    { icon: <ShowChartIcon />,           label: 'Profit & Loss',        desc: 'Income vs expense statement',        color: '#10b981', path: 'profit-loss' },
  ];

  const superAdminItems = user?.role === 'super_admin' ? [
    { icon: <SupervisorAccountIcon />, label: 'Super Admin', desc: 'Manage all institutes & plans', color: '#7c3aed', path: 'tools' },
  ] : [];

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700} mb={0.5}>Administration</Typography>
        <Typography variant="body2" color="text.secondary">
          Institute settings, users, accounts, and data management tools.
        </Typography>
      </Box>

      {superAdminItems.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Super Admin
          </Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' },
            gap: { xs: 1.25, md: 1.5 },
            mt: 1,
          }}>
            {superAdminItems.map((m) => (
              <AdminCard key={m.path} {...m} onClick={() => go(m.path)} />
            ))}
          </Box>
        </Box>
      )}

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' },
        gap: { xs: 1.25, md: 1.5 },
      }}>
        {items.map((m) => (
          <AdminCard key={m.path} {...m} onClick={() => go(m.path)} />
        ))}
      </Box>
    </Box>
  );
}
