import { Box, Divider, List, ListItem, ListItemButton, Paper, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
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
import UploadFileIcon from '@mui/icons-material/UploadFile';

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

function ModuleListItem({ icon, label, desc, color, onClick, isLast }) {
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

function ModuleGroup({ title, items, go }) {
  return (
    <Box mb={2.5}>
      <SectionHeader label={title} />
      <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        <List disablePadding>
          {items.map((m, i) => (
            <ModuleListItem
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

export default function AcademicHub() {
  const navigate = useNavigate();
  const { username } = useParams();
  const go = (path) => navigate(`/${username}/${path}`);

  const groups = [
    {
      title: 'Students & Admissions',
      items: [
        { icon: <PeopleIcon />,       label: 'Students',    desc: 'Manage student records',    color: '#1a7a4a', path: 'students' },
        { icon: <SchoolIcon />,       label: 'Admissions',  desc: 'Admissions & enrolments',   color: '#10b981', path: 'allAdmission' },
      ],
    },
    {
      title: 'Courses & Batches',
      items: [
        { icon: <LibraryBooksIcon />, label: 'Courses',     desc: 'Course catalogue & fees',   color: '#d4a017', path: 'courses' },
        { icon: <GroupsIcon />,       label: 'Batches',     desc: 'Manage and view batches',   color: '#0891b2', path: 'batches' },
      ],
    },
    {
      title: 'Attendance & Exams',
      items: [
        { icon: <ChecklistIcon />,    label: 'Attendance',         desc: 'Mark & view attendance',  color: '#059669', path: 'addAttendance' },
        { icon: <BarChartIcon />,     label: 'Attendance Report',  desc: 'Full attendance board',   color: '#0d9488', path: 'allAttendance' },
        { icon: <QuizIcon />,         label: 'Exams',              desc: 'Exam setup & records',    color: '#d97706', path: 'exam' },
        { icon: <AssignmentIcon />,   label: 'Exam Results',       desc: 'View all exam results',   color: '#b45309', path: 'allExams' },
      ],
    },
    {
      title: 'Leads & Fees',
      items: [
        { icon: <TrendingUpIcon />,   label: 'Leads',        desc: 'Enquiry & lead tracking',        color: '#f59e0b', path: 'leads' },
        { icon: <EventNoteIcon />,    label: 'Follow-ups',   desc: "Today's follow-up list",         color: '#ef4444', path: 'followup' },
        { icon: <PaymentIcon />,      label: 'Fees',         desc: "Today's fee collections",        color: '#10b981', path: 'fees' },
        { icon: <ReceiptLongIcon />,  label: 'Collect Fee',  desc: 'Record a fee receipt',           color: '#0ea5e9', path: 'addReciept' },
        { icon: <UploadFileIcon />,   label: 'Bulk Import',  desc: 'Import from CSV / Excel / JSON', color: '#7c3aed', path: 'academic-bulk-import' },
      ],
    },
  ];

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h6" fontWeight={700} mb={0.5}>Academic Management</Typography>
        <Typography variant="body2" color="text.secondary">
          Students, courses, batches, attendance, exams and fees — all in one place.
        </Typography>
      </Box>

      {groups.map((g) => (
        <ModuleGroup key={g.title} title={g.title} items={g.items} go={go} />
      ))}
    </Box>
  );
}
