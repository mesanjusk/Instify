import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, CircularProgress, Chip, Stack, Typography,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import jsPDF from 'jspdf';
import apiClient from '../apiClient';

// ── Single ID card face (front or back) ───────────────────────────────────────
function CardFace({ student, project, side = 'front' }) {
  const photo = student.use_bg_removed ? student.bg_removed_url : student.photo_url;
  const displayName = student.student_name_override || student.student_name;

  if (side === 'back') {
    return (
      <Box sx={{
        width: 242, height: 153, borderRadius: 1.5, border: '1px solid #cbd5e1',
        bgcolor: '#1e3a5f', color: '#fff', p: 1.5,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        fontSize: '0.65rem', boxSizing: 'border-box',
      }}>
        <Box>
          <Typography fontWeight={800} fontSize="0.7rem" letterSpacing={1}>{project?.title || 'ID CARD'}</Typography>
          <Typography fontSize="0.6rem" sx={{ opacity: 0.7 }}>{project?.academic_year}</Typography>
        </Box>
        <Box>
          {project?.principal_signature_url && (
            <Box>
              <img src={project.principal_signature_url} alt="sig" style={{ height: 28, filter: 'brightness(10)', objectFit: 'contain' }} />
              <Typography fontSize="0.55rem" sx={{ opacity: 0.7 }}>Principal's Signature</Typography>
            </Box>
          )}
        </Box>
        <Typography fontSize="0.55rem" sx={{ opacity: 0.6 }}>
          If found, please return to {project?.title || 'the institute'}.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      width: 242, height: 153, borderRadius: 1.5, border: '1px solid #cbd5e1',
      bgcolor: '#fff', display: 'flex', overflow: 'hidden', boxSizing: 'border-box',
    }}>
      {/* Photo strip */}
      <Box sx={{ width: 90, bgcolor: '#1e3a5f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 1 }}>
        <Box sx={{ width: 64, height: 76, borderRadius: 1, overflow: 'hidden', bgcolor: '#f1f5f9', border: '2px solid #fff', mb: 0.5 }}>
          {photo
            ? <img src={photo} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Box sx={{ width: '100%', height: '100%', bgcolor: '#e2e8f0' }} />
          }
        </Box>
        <Typography fontSize="0.5rem" color="#fff" textAlign="center" fontWeight={600} lineHeight={1.2}>
          {student.class_name}{student.section ? `-${student.section}` : ''}
        </Typography>
        <Typography fontSize="0.5rem" color="rgba(255,255,255,0.7)">Roll: {student.roll_number}</Typography>
      </Box>

      {/* Info */}
      <Box flex={1} p={1} display="flex" flexDirection="column" justifyContent="space-between">
        <Box>
          <Typography fontWeight={800} fontSize="0.55rem" color="#1e3a5f" letterSpacing={0.5} textTransform="uppercase" mb={0.25}>
            {project?.title || 'Student ID Card'}
          </Typography>
          <Typography fontWeight={700} fontSize="0.72rem" color="#0f172a" lineHeight={1.2}>{displayName}</Typography>
          {student.extra_fields?.father_name && (
            <Typography fontSize="0.58rem" color="text.secondary" mt={0.25}>F: {student.extra_fields.father_name}</Typography>
          )}
          {(student.extra_fields?.dob || student.extra_fields?.DOB || student.extra_fields?.['Date of Birth']) && (
            <Typography fontSize="0.58rem" color="text.secondary">
              DOB: {student.extra_fields.dob || student.extra_fields.DOB || student.extra_fields['Date of Birth']}
            </Typography>
          )}
        </Box>

        <Box>
          {project?.principal_signature_url && (
            <Box mb={0.25}>
              <img src={project.principal_signature_url} alt="sig" style={{ height: 20, objectFit: 'contain' }} />
              <Typography fontSize="0.5rem" color="text.secondary">Principal</Typography>
            </Box>
          )}
          <Typography fontSize="0.5rem" color="#1e3a5f" fontWeight={600}>{project?.academic_year}</Typography>
        </Box>
      </Box>
    </Box>
  );
}

// ── Print layout ──────────────────────────────────────────────────────────────
export default function IDCardPrint() {
  const { projectUuid } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('front'); // 'front' | 'back' | 'both'
  const printRef = useRef(null);

  useEffect(() => {
    apiClient.get(`/api/idcard/projects/${projectUuid}/print`)
      .then(res => setData(res.data.result))
      .catch(err => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [projectUuid]);

  function print() {
    window.print();
  }

  if (loading) return <Box textAlign="center" py={8}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  const { students = [], project } = data;

  return (
    <Box>
      {/* Controls — hidden on print */}
      <Box className="no-print" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Back</Button>
          <Box flex={1}>
            <Typography variant="h6" fontWeight={700}>Print Layout — {project?.title}</Typography>
            <Typography variant="caption" color="text.secondary">{students.length} approved cards</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            {['front', 'back', 'both'].map(m => (
              <Chip key={m} label={m.charAt(0).toUpperCase() + m.slice(1)} onClick={() => setMode(m)}
                color={mode === m ? 'primary' : 'default'} variant={mode === m ? 'filled' : 'outlined'} size="small" />
            ))}
          </Stack>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={print}>Print</Button>
        </Stack>

        <Alert severity="info" sx={{ mb: 2, fontSize: '0.78rem' }}>
          Use browser Print → set paper to A4, margins to None, enable background graphics. Each row fits 2 cards across (front + back side by side when "Both" is selected).
        </Alert>
      </Box>

      {/* Print area */}
      <Box ref={printRef} sx={{
        '@media print': { margin: 0 },
        display: 'flex', flexWrap: 'wrap', gap: '6mm',
        justifyContent: 'flex-start',
        p: 1,
      }}>
        {students.map(s => (
          <Box key={s.idcard_uuid} sx={{ display: 'flex', gap: '3mm', pageBreakInside: 'avoid' }}>
            {(mode === 'front' || mode === 'both') && (
              <CardFace student={s} project={project} side="front" />
            )}
            {(mode === 'back' || mode === 'both') && (
              <CardFace student={s} project={project} side="back" />
            )}
          </Box>
        ))}
        {students.length === 0 && (
          <Box textAlign="center" width="100%" py={6}>
            <Typography color="text.secondary">No approved cards yet. Approve students from the manager first.</Typography>
          </Box>
        )}
      </Box>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
      `}</style>
    </Box>
  );
}
