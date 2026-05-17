import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, IconButton, MenuItem, Select,
  Stack, Switch, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import TableRowsIcon from '@mui/icons-material/TableRows';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';

const FIELD_TYPES = ['text', 'email', 'phone', 'number', 'textarea', 'dropdown', 'radio', 'checkbox', 'date'];
const HAS_OPTIONS = ['dropdown', 'radio', 'checkbox'];

function newField() {
  return { field_uuid: crypto.randomUUID(), label: '', type: 'text', options: [], required: false, order: 0 };
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function FormDialog({ initial, onSave, onClose }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [successMessage, setSuccessMessage] = useState(initial?.successMessage || 'Thank you! Your response has been recorded.');
  const [fields, setFields] = useState(initial?.fields?.length ? initial.fields : [newField()]);
  const [slugManual, setSlugManual] = useState(!!initial?.slug);

  function handleTitle(v) {
    setTitle(v);
    if (!slugManual) setSlug(slugify(v));
  }

  function addField() {
    setFields(p => [...p, { ...newField(), order: p.length }]);
  }

  function removeField(idx) {
    setFields(p => p.filter((_, i) => i !== idx));
  }

  function updateField(idx, key, val) {
    setFields(p => p.map((f, i) => i === idx ? { ...f, [key]: val } : f));
  }

  function addOption(idx) {
    setFields(p => p.map((f, i) => i === idx ? { ...f, options: [...f.options, ''] } : f));
  }

  function updateOption(fIdx, oIdx, val) {
    setFields(p => p.map((f, i) => {
      if (i !== fIdx) return f;
      const opts = [...f.options];
      opts[oIdx] = val;
      return { ...f, options: opts };
    }));
  }

  function removeOption(fIdx, oIdx) {
    setFields(p => p.map((f, i) => i !== fIdx ? f : { ...f, options: f.options.filter((_, j) => j !== oIdx) }));
  }

  function save() {
    onSave({ title, description, slug: slugify(slug), successMessage, fields: fields.map((f, i) => ({ ...f, order: i })) });
  }

  return (
    <DialogContent sx={{ maxWidth: 580 }}>
      <Stack spacing={2}>
        <TextField label="Form Title *" value={title} onChange={e => handleTitle(e.target.value)} fullWidth size="small" />
        <TextField label="Description" value={description} onChange={e => setDescription(e.target.value)} fullWidth size="small" multiline minRows={2} />
        <TextField
          label="URL Slug *" value={slug}
          onChange={e => { setSlugManual(true); setSlug(slugify(e.target.value)); }}
          fullWidth size="small"
          helperText={`Public link: /f/${slug || 'your-slug'}`}
        />
        <TextField label="Success Message" value={successMessage} onChange={e => setSuccessMessage(e.target.value)} fullWidth size="small" />

        <Divider><Typography variant="caption" color="text.secondary">Form Fields</Typography></Divider>

        {fields.map((field, idx) => (
          <Box key={field.field_uuid} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
              <DragIndicatorIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
              <TextField
                label="Field Label *" value={field.label} size="small" sx={{ flex: 2 }}
                onChange={e => updateField(idx, 'label', e.target.value)}
              />
              <Select value={field.type} size="small" sx={{ flex: 1 }} onChange={e => updateField(idx, 'type', e.target.value)}>
                {FIELD_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="caption">Req</Typography>
                <Switch size="small" checked={field.required} onChange={e => updateField(idx, 'required', e.target.checked)} />
              </Stack>
              <Tooltip title="Remove field">
                <IconButton size="small" onClick={() => removeField(idx)} disabled={fields.length === 1}>
                  <RemoveCircleOutlineIcon fontSize="small" color="error" />
                </IconButton>
              </Tooltip>
            </Stack>

            {HAS_OPTIONS.includes(field.type) && (
              <Box pl={3.5}>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Options</Typography>
                <Stack spacing={1}>
                  {field.options.map((opt, oIdx) => (
                    <Stack key={oIdx} direction="row" spacing={1}>
                      <TextField value={opt} size="small" placeholder={`Option ${oIdx + 1}`} fullWidth
                        onChange={e => updateOption(idx, oIdx, e.target.value)} />
                      <IconButton size="small" onClick={() => removeOption(idx, oIdx)}>
                        <RemoveCircleOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))}
                  <Button size="small" startIcon={<AddCircleOutlineIcon />} onClick={() => addOption(idx)} sx={{ alignSelf: 'flex-start' }}>
                    Add option
                  </Button>
                </Stack>
              </Box>
            )}
          </Box>
        ))}

        <Button startIcon={<AddIcon />} onClick={addField} variant="outlined" size="small">Add Field</Button>
      </Stack>

      <DialogActions sx={{ px: 0, pt: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={!title || !slug}>Save Form</Button>
      </DialogActions>
    </DialogContent>
  );
}

export default function Forms() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();
  const instituteUuid = localStorage.getItem('institute_uuid');
  const username = localStorage.getItem('login_username') || localStorage.getItem('username') || 'admin';

  const publicBase = window.location.origin;

  function showAlert(type, text) { setAlert({ type, text }); setTimeout(() => setAlert(null), 4000); }

  async function load() {
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/forms?institute_uuid=${instituteUuid}`);
      setForms(res.data?.result || []);
    } catch { showAlert('error', 'Failed to load forms'); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (instituteUuid) load(); }, []);

  async function save(data) {
    try {
      if (dialog.mode === 'add') {
        await apiClient.post('/api/forms', { ...data, institute_uuid: instituteUuid, createdBy: username });
      } else {
        await apiClient.put(`/api/forms/${dialog.data.form_uuid}`, data);
      }
      setDialog(null);
      showAlert('success', 'Form saved!');
      load();
    } catch (err) { showAlert('error', err.response?.data?.message || 'Save failed'); }
  }

  async function toggleActive(form) {
    try {
      await apiClient.put(`/api/forms/${form.form_uuid}`, { isActive: !form.isActive });
      load();
    } catch { showAlert('error', 'Update failed'); }
  }

  async function remove(form) {
    if (!window.confirm(`Delete "${form.title}"? All responses will also be deleted.`)) return;
    try {
      await apiClient.delete(`/api/forms/${form.form_uuid}`);
      showAlert('success', 'Deleted');
      load();
    } catch { showAlert('error', 'Delete failed'); }
  }

  function copyLink(slug) {
    const url = `${publicBase}/f/${slug}`;
    navigator.clipboard.writeText(url);
    showAlert('success', 'Link copied!');
  }

  return (
    <Box>
      {alert && <Alert severity={alert.type} sx={{ mb: 2 }} onClose={() => setAlert(null)}>{alert.text}</Alert>}

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Public Forms</Typography>
          <Typography variant="caption" color="text.secondary">{forms.length} form{forms.length !== 1 ? 's' : ''}</Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setDialog({ mode: 'add' })}>
          Create Form
        </Button>
      </Stack>

      {loading ? (
        <Box textAlign="center" py={4}><CircularProgress /></Box>
      ) : forms.length === 0 ? (
        <Box textAlign="center" py={6}>
          <Typography color="text.secondary">No forms yet. Create your first public form.</Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {forms.map(form => (
            <Box key={form.form_uuid} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2, bgcolor: '#fff' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box flex={1} minWidth={0}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                    <Typography fontWeight={700} noWrap>{form.title}</Typography>
                    <Chip size="small" label={form.isActive ? 'Active' : 'Inactive'}
                      color={form.isActive ? 'success' : 'default'} sx={{ height: 18, fontSize: '0.65rem' }} />
                  </Stack>
                  {form.description && <Typography variant="body2" color="text.secondary" mb={0.5} noWrap>{form.description}</Typography>}
                  <Typography variant="caption" color="primary" sx={{ wordBreak: 'break-all' }}>
                    /f/{form.slug}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" ml={1}>
                    · {form.fields?.length || 0} field{form.fields?.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.5} ml={1} flexShrink={0}>
                  <Tooltip title="Copy public link">
                    <IconButton size="small" onClick={() => copyLink(form.slug)}><ContentCopyIcon fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title="View responses">
                    <IconButton size="small" onClick={() => navigate(`/${username}/forms/${form.form_uuid}/responses`)}>
                      <TableRowsIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={form.isActive ? 'Deactivate' : 'Activate'}>
                    <Switch size="small" checked={form.isActive} onChange={() => toggleActive(form)} />
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => setDialog({ mode: 'edit', data: form })}><EditIcon fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => remove(form)}><DeleteIcon fontSize="small" color="error" /></IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}

      <Dialog open={!!dialog} onClose={() => setDialog(null)} fullWidth maxWidth="sm" scroll="paper">
        <DialogTitle>{dialog?.mode === 'add' ? 'Create Form' : 'Edit Form'}</DialogTitle>
        {dialog && <FormDialog initial={dialog.data} onSave={save} onClose={() => setDialog(null)} />}
      </Dialog>
    </Box>
  );
}
