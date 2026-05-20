import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import GroupsIcon from '@mui/icons-material/Groups';
import ChecklistIcon from '@mui/icons-material/Checklist';
import QuizIcon from '@mui/icons-material/Quiz';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaymentIcon from '@mui/icons-material/Payment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';

function ModuleCard({ icon, label, desc, color, onClick }) {
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

export default function AcademicHub() {
  const navigate = useNavigate();
  const { username } = useParams();
  const go = (path) => navigate(`/${username}/${path}`);

  const modules = [
    { icon: <PeopleIcon />,         label: 'Students',      desc: 'Manage student records',         color: '#4f46e5', path: 'students' },
    { icon: <SchoolIcon />,         label: 'Admissions',    desc: 'Admissions & enrolments',         color: '#10b981', path: 'allAdmission' },
    { icon: <LibraryBooksIcon />,   label: 'Courses',       desc: 'Course catalogue & fees',         color: '#7c3aed', path: 'courses' },
    { icon: <GroupsIcon />,         label: 'Batches',       desc: 'Manage and view batches',         color: '#0891b2', path: 'batches' },
    { icon: <ChecklistIcon />,      label: 'Attendance',    desc: 'Mark & view attendance',          color: '#059669', path: 'addAttendance' },
    { icon: <BarChartIcon />,       label: 'Attendance Report', desc: 'Full attendance board',       color: '#0d9488', path: 'allAttendance' },
    { icon: <QuizIcon />,           label: 'Exams',         desc: 'Exam setup & records',            color: '#d97706', path: 'exam' },
    { icon: <AssignmentIcon />,     label: 'Exam Results',  desc: 'View all exam results',           color: '#b45309', path: 'allExams' },
    { icon: <TrendingUpIcon />,     label: 'Leads',         desc: 'Enquiry & lead tracking',         color: '#f59e0b', path: 'leads' },
    { icon: <EventNoteIcon />,      label: 'Follow-ups',    desc: "Today's follow-up list",          color: '#ef4444', path: 'followup' },
    { icon: <PaymentIcon />,        label: 'Fees',          desc: "Today's fee collections",         color: '#10b981', path: 'fees' },
    { icon: <ReceiptLongIcon />,    label: 'Collect Fee',   desc: 'Record a fee receipt',            color: '#0ea5e9', path: 'addReciept' },
  ];

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700} mb={0.5}>Academic Management</Typography>
        <Typography variant="body2" color="text.secondary">
          Students, courses, batches, attendance, exams and fees — all in one place.
        </Typography>
      </Box>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(6, 1fr)' },
        gap: { xs: 1.25, md: 1.5 },
      }}>
        {modules.map((m) => (
          <ModuleCard key={m.path} {...m} onClick={() => go(m.path)} />
        ))}
      </Box>
    </Box>
  );
}
