import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Alert, Box, Button, CircularProgress, Stack, TextField, Typography,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import BASE_URL from '../config';

export default function IDCardStudentSelfEdit() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    axios.get(`${BASE_URL}/api/idcard/public/${token}`)
      .then(res => {
        const d = res.data.result;
        setData(d);
        setName(d.student.display_name || '');
        setPhotoPreview(d.student.active_photo_url || '');
      })
      .catch(err => setError(err.response?.data?.message || 'Invalid or expired link.'))
      .finally(() => setLoading(false));
  }, [token]);

  function onPhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError('');
    try {
      const fd = new FormData();
      if (name !== data.student.original_name) fd.append('student_name_override', name);
      if (photoFile) fd.append('photo', photoFile);
      await axios.post(`${BASE_URL}/api/idcard/public/${token}/submit`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Box minHeight="100dvh" display="flex" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box minHeight="100dvh" display="flex" alignItems="center" justifyContent="center" p={3}>
        <Alert severity="error" sx={{ maxWidth: 420 }}>{error}</Alert>
      </Box>
    );
  }

  if (submitted) {
    return (
      <Box minHeight="100dvh" display="flex" alignItems="center" justifyContent="center" p={3}
        sx={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #fafafa 100%)' }}>
        <Box textAlign="center" maxWidth={380}>
          <CheckCircleOutlineIcon sx={{ fontSize: 72, color: '#10b981', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} mb={1}>Submitted!</Typography>
          <Typography color="text.secondary">Your ID card details have been sent to your teacher for approval.</Typography>
        </Box>
      </Box>
    );
  }

  const { student, project } = data;

  return (
    <Box minHeight="100dvh" sx={{ background: 'linear-gradient(135deg, #eff6ff 0%, #fafafa 100%)' }} py={4} px={2}>
      <Box maxWidth={440} mx="auto">
        {/* Header */}
        <Box sx={{ bgcolor: '#1e40af', borderRadius: '12px 12px 0 0', p: 3, color: '#fff' }}>
          <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>{project.title} · {project.academic_year}</Typography>
          <Typography variant="h5" fontWeight={700} mt={0.5}>Your ID Card Preview</Typography>
          <Typography sx={{ opacity: 0.8, fontSize: '0.85rem' }}>Review your details, fix any mistakes, and submit.</Typography>
        </Box>

        {/* Card */}
        <Box sx={{ bgcolor: '#fff', borderRadius: '0 0 12px 12px', boxShadow: 3, p: 3 }}>
          {/* Photo */}
          <Box textAlign="center" mb={3}>
            <Box
              sx={{ width: 120, height: 140, borderRadius: 2, overflow: 'hidden', mx: 'auto', bgcolor: '#f1f5f9', mb: 1.5, border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {photoPreview
                ? <img src={photoPreview} alt="student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Typography variant="caption" color="text.secondary">No Photo</Typography>
              }
            </Box>
            <Button size="small" variant="outlined" component="label" startIcon={<UploadFileIcon />}>
              Change Photo
              <input hidden type="file" accept="image/*" onChange={onPhotoChange} />
            </Button>
            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
              Upload a clear, passport-size photo
            </Typography>
          </Box>

          {/* Details */}
          <Stack spacing={2}>
            <TextField
              label="Full Name"
              value={name}
              onChange={e => setName(e.target.value)}
              fullWidth
              size="small"
              helperText="Fix any spelling mistake in your name"
            />
            <Stack direction="row" spacing={2}>
              <TextField label="Class" value={student.class_name || '—'} size="small" fullWidth InputProps={{ readOnly: true }} />
              <TextField label="Roll No." value={student.roll_number || '—'} size="small" fullWidth InputProps={{ readOnly: true }} />
            </Stack>

            {/* Extra fields (read-only) */}
            {Object.entries(student.extra_fields || {}).filter(([k]) =>
              !['student_name','name','Name','roll_number','roll','Roll','class_name','class','Class','section','Section','Roll No','Roll Number','Student Name'].includes(k)
            ).slice(0, 4).map(([k, v]) => (
              <TextField key={k} label={k} value={String(v || '—')} size="small" fullWidth InputProps={{ readOnly: true }} />
            ))}
          </Stack>

          {/* Principal signature preview */}
          {project.principal_signature_url && (
            <Box mt={2} textAlign="right">
              <Typography variant="caption" color="text.secondary">Principal's Signature</Typography>
              <img src={project.principal_signature_url} alt="sig" style={{ height: 36, display: 'block', marginLeft: 'auto', objectFit: 'contain' }} />
            </Box>
          )}

          {submitError && <Alert severity="error" sx={{ mt: 2 }}>{submitError}</Alert>}

          <Button
            variant="contained" fullWidth size="large" sx={{ mt: 3 }}
            onClick={submit} disabled={submitting}
          >
            {submitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Submit for Approval'}
          </Button>

          <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={1.5}>
            Once submitted, your teacher will review and approve your ID card.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
