import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Alert, Box, Button, Checkbox, CircularProgress, FormControlLabel,
  FormGroup, FormLabel, MenuItem, Radio, RadioGroup, Select,
  Stack, TextField, Typography,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BASE_URL from '../config';

function getInstituteId() {
  const q = new URLSearchParams(window.location.search).get('i');
  if (q) return q;
  const parts = window.location.hostname.split('.');
  const sub = parts.length > 2 ? parts[0] : null;
  return sub && sub !== 'www' && sub !== 'instify' ? sub : null;
}

function FieldInput({ field, value, onChange }) {
  const { label, type, options = [], required } = field;

  if (type === 'textarea') {
    return (
      <TextField
        label={label} required={required} multiline minRows={3}
        fullWidth size="small" value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
    );
  }

  if (type === 'dropdown') {
    return (
      <Box>
        <FormLabel sx={{ fontSize: '0.85rem', mb: 0.5, display: 'block' }}>{label}{required && ' *'}</FormLabel>
        <Select value={value || ''} onChange={e => onChange(e.target.value)} size="small" fullWidth displayEmpty>
          <MenuItem value=""><em>Select…</em></MenuItem>
          {options.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
        </Select>
      </Box>
    );
  }

  if (type === 'radio') {
    return (
      <Box>
        <FormLabel sx={{ fontSize: '0.85rem' }}>{label}{required && ' *'}</FormLabel>
        <RadioGroup value={value || ''} onChange={e => onChange(e.target.value)}>
          {options.map(o => <FormControlLabel key={o} value={o} control={<Radio size="small" />} label={o} />)}
        </RadioGroup>
      </Box>
    );
  }

  if (type === 'checkbox') {
    const selected = Array.isArray(value) ? value : [];
    const toggle = (o) => {
      const next = selected.includes(o) ? selected.filter(x => x !== o) : [...selected, o];
      onChange(next);
    };
    return (
      <Box>
        <FormLabel sx={{ fontSize: '0.85rem' }}>{label}{required && ' *'}</FormLabel>
        <FormGroup>
          {options.map(o => (
            <FormControlLabel key={o} control={<Checkbox size="small" checked={selected.includes(o)} onChange={() => toggle(o)} />} label={o} />
          ))}
        </FormGroup>
      </Box>
    );
  }

  const inputType = type === 'email' ? 'email' : type === 'phone' ? 'tel' : type === 'number' ? 'number' : type === 'date' ? 'date' : 'text';
  return (
    <TextField
      label={label} required={required} type={inputType}
      fullWidth size="small" value={value || ''}
      onChange={e => onChange(e.target.value)}
      InputLabelProps={type === 'date' ? { shrink: true } : undefined}
    />
  );
}

export default function PublicForm() {
  const { slug } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [branding, setBranding] = useState({ institute: '', color: '#1976d2', logo: '' });
  const instituteId = getInstituteId();

  useEffect(() => {
    async function load() {
      try {
        const [formRes, brandRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/forms/public/${slug}${instituteId ? `?i=${instituteId}` : ''}`),
          axios.get(`${BASE_URL}/api/branding${instituteId ? `?i=${instituteId}` : ''}`),
        ]);
        setForm(formRes.data.result);
        const b = brandRes.data;
        setBranding({
          institute: b.institute || '',
          color: b.theme?.color ? `#${b.theme.color}` : '#1976d2',
          logo: b.logo || '',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Form not found or unavailable.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  function set(fieldUuid, val) {
    setValues(p => ({ ...p, [fieldUuid]: val }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form) return;

    // Validate required fields
    for (const f of form.fields) {
      const v = values[f.field_uuid];
      if (f.required) {
        const empty = v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
        if (empty) { setError(`"${f.label}" is required.`); return; }
      }
    }
    setError('');
    setSubmitting(true);

    // Build payload keyed by field label for readability
    const payload = {};
    for (const f of form.fields) {
      payload[f.label] = values[f.field_uuid] ?? '';
    }

    try {
      await axios.post(`${BASE_URL}/api/forms/public/${slug}/submit${instituteId ? `?i=${instituteId}` : ''}`, payload);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
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

  if (error && !form) {
    return (
      <Box minHeight="100dvh" display="flex" alignItems="center" justifyContent="center" p={3}>
        <Alert severity="error" sx={{ maxWidth: 480 }}>{error}</Alert>
      </Box>
    );
  }

  if (submitted) {
    return (
      <Box minHeight="100dvh" display="flex" alignItems="center" justifyContent="center" p={3}
        sx={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #fafafa 100%)' }}>
        <Box textAlign="center" maxWidth={420}>
          <CheckCircleOutlineIcon sx={{ fontSize: 64, color: branding.color, mb: 2 }} />
          <Typography variant="h5" fontWeight={700} mb={1}>{form.successMessage}</Typography>
          <Typography color="text.secondary">{branding.institute}</Typography>
        </Box>
      </Box>
    );
  }

  const sorted = [...(form?.fields || [])].sort((a, b) => a.order - b.order);

  return (
    <Box minHeight="100dvh" sx={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #fafafa 100%)' }} py={5} px={2}>
      <Box maxWidth={600} mx="auto">
        {/* Header card */}
        <Box sx={{ background: branding.color, borderRadius: '12px 12px 0 0', p: 3 }}>
          {branding.logo && (
            <Box mb={1.5}>
              <img src={branding.logo} alt="logo" style={{ height: 40, objectFit: 'contain' }} />
            </Box>
          )}
          <Typography variant="h5" fontWeight={700} color="#fff">{form.title}</Typography>
          {form.description && <Typography color="rgba(255,255,255,0.85)" mt={0.5}>{form.description}</Typography>}
        </Box>

        {/* Form card */}
        <Box component="form" onSubmit={submit}
          sx={{ bgcolor: '#fff', borderRadius: '0 0 12px 12px', boxShadow: 3, p: 3 }}>
          <Stack spacing={2.5}>
            {sorted.map(f => (
              <FieldInput key={f.field_uuid} field={f} value={values[f.field_uuid]} onChange={v => set(f.field_uuid, v)} />
            ))}
          </Stack>

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

          <Button type="submit" variant="contained" fullWidth size="large"
            disabled={submitting}
            sx={{ mt: 3, bgcolor: branding.color, '&:hover': { bgcolor: branding.color, filter: 'brightness(0.9)' } }}>
            {submitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Submit'}
          </Button>

          <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={2}>
            Powered by {branding.institute || 'Instify'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
