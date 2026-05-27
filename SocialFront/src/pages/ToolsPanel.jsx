import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import BASE_URL from '../config';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControlLabel, Grid, IconButton, Stack, Switch,
  TextField, Tooltip, Typography, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import {
  Business, CheckCircle, DeleteForever, Download, Edit, HourglassEmpty,
  ManageAccounts, PauseCircle, Refresh, School, SupervisorAccount,
  Cloud, SyncAlt, Computer, DesktopWindows,
} from '@mui/icons-material';
import { formatDisplayDate } from '../utils/dateUtils';

const ALL_MODULES = [
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'idcard', label: 'ID Card' },
  { key: 'payroll', label: 'HR & Payroll' },
  { key: 'csv_import', label: 'CSV Import' },
  { key: 'bulk_download', label: 'Bulk Download' },
  { key: 'forms', label: 'Custom Forms' },
  { key: 'exam', label: 'Exam Module' },
  { key: 'advanced_accounts', label: 'Advanced Accounts' },
  { key: 'funnel', label: 'Funnel Report' },
  { key: 'canvas', label: 'Document Maker' },
  { key: 'academic', label: 'Academic Hub' },
];

const PLAN_COLORS = { paid: '#10b981', trial: '#f59e0b', free: '#6b7280' };
const STATUS_COLORS = { active: '#10b981', trial: '#f59e0b', expired: '#ef4444' };
const STORAGE_MODE_META = {
  cloud_only: { label: 'Cloud', color: '#0891b2', Icon: Cloud },
  hybrid: { label: 'Hybrid', color: '#7c3aed', Icon: SyncAlt },
  local_only: { label: 'Local', color: '#b45309', Icon: Computer },
};

function StatCard({ icon, label, value, color }) {
  return (
    <Card variant="outlined" sx={{ flex: 1, minWidth: 120 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ color, fontSize: 28 }}>{icon}</Box>
          <Box>
            <Typography variant="h5" fontWeight={700}>{value}</Typography>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

const AUTH_HEADER = () => ({ Authorization: `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}` });

export default function ToolsPanel() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const isSuperAdmin = user?.role === 'super_admin';
  const canView = isSuperAdmin || user?.role === 'owner';

  // Desktop app download state
  const [desktopApp, setDesktopApp] = useState(null);
  const [desktopLoading, setDesktopLoading] = useState(true);
  const [desktopDialog, setDesktopDialog] = useState(false);
  const [desktopForm, setDesktopForm] = useState({ version: '', url: '', releaseNotes: '' });
  const [desktopSaving, setDesktopSaving] = useState(false);

  useEffect(() => {
    if (canView) {
      fetchInstitutes();
      fetchDesktopApp();
    }
  }, [canView]);

  const fetchDesktopApp = async () => {
    setDesktopLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/admin/desktop-app`, { headers: AUTH_HEADER() });
      setDesktopApp(res.data);
    } catch {
      setDesktopApp({ available: false });
    } finally {
      setDesktopLoading(false);
    }
  };

  const openDesktopDialog = () => {
    setDesktopForm({
      version: desktopApp?.version || '',
      url: desktopApp?.url || '',
      releaseNotes: desktopApp?.releaseNotes || '',
    });
    setDesktopDialog(true);
  };

  const saveDesktopApp = async () => {
    if (!desktopForm.url.trim()) { toast.error('Download URL is required'); return; }
    setDesktopSaving(true);
    try {
      await axios.put(`${BASE_URL}/api/admin/desktop-app`, desktopForm, { headers: AUTH_HEADER() });
      toast.success('Desktop app info updated');
      setDesktopDialog(false);
      fetchDesktopApp();
    } catch {
      toast.error('Failed to save');
    } finally {
      setDesktopSaving(false);
    }
  };

  if (!user || !canView) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="body1" fontWeight={600}>Access Denied</Typography>
          <Typography variant="body2">Super admin or owner privileges required.</Typography>
        </Alert>
      </Box>
    );
  }

  const fetchInstitutes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/institute/GetOrganizList`, { headers: AUTH_HEADER() });
      if (res.data?.success) setInstitutes(res.data.result);
      else toast.error('Failed to load institutes');
    } catch {
      toast.error('Failed to load institutes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uuid, name) => {
    if (!window.confirm(`Delete "${name}" and all its data? This cannot be undone.`)) return;
    try {
      await axios.delete(`${BASE_URL}/api/institute/${uuid}`, { headers: AUTH_HEADER() });
      toast.success('Institute deleted');
      fetchInstitutes();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const openEdit = (inst) => {
    setEditTarget({
      ...inst,
      modulesEnabled: inst.modulesEnabled || [],
      storage_mode: inst.storage_mode || 'cloud_only',
      trialExpiresAt: inst.trialExpiresAt
        ? new Date(inst.trialExpiresAt).toISOString().slice(0, 10)
        : '',
    });
  };

  const toggleModule = (key) => {
    setEditTarget(prev => ({
      ...prev,
      modulesEnabled: prev.modulesEnabled.includes(key)
        ? prev.modulesEnabled.filter(m => m !== key)
        : [...prev.modulesEnabled, key],
    }));
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const payload = {
        plan_type: editTarget.plan_type,
        status: editTarget.status,
        modulesEnabled: editTarget.modulesEnabled,
        trialExpiresAt: editTarget.trialExpiresAt || undefined,
        storage_mode: editTarget.storage_mode || 'cloud_only',
      };
      const res = await axios.put(
        `${BASE_URL}/api/institute/manage/${editTarget.institute_uuid}`,
        payload,
        { headers: AUTH_HEADER() }
      );
      if (res.data?.success) {
        toast.success('Institute updated');
        setEditTarget(null);
        fetchInstitutes();
      } else {
        toast.error('Update failed');
      }
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    total: institutes.length,
    active: institutes.filter(i => i.status === 'active').length,
    trial: institutes.filter(i => i.status === 'trial').length,
    expired: institutes.filter(i => i.status === 'expired').length,
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={1}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <SupervisorAccount sx={{ color: '#1a7a4a', fontSize: 30 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>{isSuperAdmin ? 'Super Admin Dashboard' : 'All Institutes'}</Typography>
            <Typography variant="body2" color="text.secondary">{isSuperAdmin ? 'Manage all institutions, plans & premium features' : 'View all registered institutes'}</Typography>
          </Box>
        </Stack>
        <IconButton onClick={fetchInstitutes} title="Refresh">
          <Refresh />
        </IconButton>
      </Stack>

      {/* Stats */}
      <Stack direction="row" spacing={2} mb={3} flexWrap="wrap" useFlexGap>
        <StatCard icon={<Business />} label="Total Institutes" value={stats.total} color="#0891b2" />
        <StatCard icon={<CheckCircle />} label="Active (Paid)" value={stats.active} color="#10b981" />
        <StatCard icon={<HourglassEmpty />} label="On Trial" value={stats.trial} color="#f59e0b" />
        <StatCard icon={<PauseCircle />} label="Expired" value={stats.expired} color="#ef4444" />
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* Desktop App Download */}
      <Card variant="outlined" sx={{ mb: 3, background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', borderColor: '#bae6fd' }}>
        <CardContent sx={{ p: { xs: 2, md: 2.5 }, '&:last-child': { pb: { xs: 2, md: 2.5 } } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <DesktopWindows sx={{ color: '#fff', fontSize: 22 }} />
              </Box>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Typography variant="subtitle1" fontWeight={700} color="#0c4a6e">
                    Instify Desktop App
                  </Typography>
                  <Chip label="Windows" size="small" sx={{ bgcolor: '#0369a1', color: '#fff', fontSize: '0.65rem', height: 18, fontWeight: 600 }} />
                  {desktopApp?.available && desktopApp.version && (
                    <Chip label={`v${desktopApp.version}`} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 18, borderColor: '#0369a1', color: '#0369a1' }} />
                  )}
                </Stack>
                {desktopLoading ? (
                  <Typography variant="caption" color="text.secondary">Loading…</Typography>
                ) : desktopApp?.available ? (
                  <>
                    <Typography variant="caption" color="text.secondary">
                      {desktopApp.publishedAt ? `Published ${new Date(desktopApp.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Available for download'}
                    </Typography>
                    {desktopApp.releaseNotes && (
                      <Typography variant="caption" color="#0369a1" display="block" sx={{ whiteSpace: 'pre-line', mt: 0.5, maxWidth: 480 }}>
                        {desktopApp.releaseNotes}
                      </Typography>
                    )}
                  </>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    {isSuperAdmin ? 'No installer published yet — click Set Link to add one.' : 'Desktop installer not yet available.'}
                  </Typography>
                )}
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} flexShrink={0}>
              {desktopApp?.available && (
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  component="a"
                  href={desktopApp.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ bgcolor: '#0369a1', '&:hover': { bgcolor: '#075985' }, fontWeight: 600, whiteSpace: 'nowrap' }}
                >
                  Download .exe
                </Button>
              )}
              {isSuperAdmin && (
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={openDesktopDialog}
                  sx={{ borderColor: '#0369a1', color: '#0369a1', '&:hover': { borderColor: '#075985', bgcolor: '#f0f9ff' }, whiteSpace: 'nowrap' }}
                >
                  {desktopApp?.available ? 'Update Link' : 'Set Link'}
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Desktop App Edit Dialog (super_admin only) */}
      <Dialog open={desktopDialog} onClose={() => setDesktopDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <DesktopWindows color="primary" />
            <Box>
              <Typography fontWeight={700}>Desktop App Download Link</Typography>
              <Typography variant="caption" color="text.secondary">Paste the installer URL after uploading to GitHub Releases or any hosting</Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} pt={0.5}>
            <TextField
              label="Version"
              size="small"
              fullWidth
              placeholder="e.g. 1.2.0"
              value={desktopForm.version}
              onChange={e => setDesktopForm(p => ({ ...p, version: e.target.value }))}
            />
            <TextField
              label="Download URL (.exe)"
              size="small"
              fullWidth
              required
              placeholder="https://github.com/mesanjusk/Instify/releases/download/v1.2.0/Instify.Setup.1.2.0.exe"
              value={desktopForm.url}
              onChange={e => setDesktopForm(p => ({ ...p, url: e.target.value }))}
            />
            <TextField
              label="Release Notes (optional)"
              size="small"
              fullWidth
              multiline
              rows={3}
              placeholder="• JWT refresh tokens&#10;• Offline sync queue&#10;• 15s sync interval"
              value={desktopForm.releaseNotes}
              onChange={e => setDesktopForm(p => ({ ...p, releaseNotes: e.target.value }))}
            />
            <Alert severity="info" sx={{ fontSize: '0.78rem' }}>
              Build the installer with <code>cd electron &amp;&amp; npm run dist:win</code>, upload the <code>.exe</code> to GitHub Releases, then paste the direct download URL above.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDesktopDialog(false)} disabled={desktopSaving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={saveDesktopApp}
            disabled={desktopSaving}
            sx={{ bgcolor: '#0369a1', '&:hover': { bgcolor: '#075985' } }}
          >
            {desktopSaving ? <CircularProgress size={18} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Divider sx={{ mb: 3 }} />

      {/* Institute Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#1a7a4a' }} />
        </Box>
      ) : institutes.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" py={4}>No institutes found.</Typography>
      ) : (
        <Stack spacing={1.5}>
          {institutes.map((inst) => (
            <Card key={inst.institute_uuid} variant="outlined" sx={{ '&:hover': { boxShadow: 2 } }}>
              <CardContent sx={{ p: { xs: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1.5, md: 2 } } }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} justifyContent="space-between">
                  {/* Info */}
                  <Stack spacing={0.5} flex={1} minWidth={0}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <School sx={{ fontSize: 18, color: '#1a7a4a' }} />
                      <Typography variant="subtitle2" fontWeight={700} noWrap>{inst.institute_title}</Typography>
                      <Chip
                        label={inst.plan_type || 'trial'}
                        size="small"
                        sx={{ bgcolor: `${PLAN_COLORS[inst.plan_type] || '#6b7280'}22`, color: PLAN_COLORS[inst.plan_type] || '#6b7280', fontWeight: 600, fontSize: '0.7rem' }}
                      />
                      <Chip
                        label={inst.status || 'trial'}
                        size="small"
                        sx={{ bgcolor: `${STATUS_COLORS[inst.status] || '#f59e0b'}22`, color: STATUS_COLORS[inst.status] || '#f59e0b', fontWeight: 600, fontSize: '0.7rem' }}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Code: {inst.center_code} &nbsp;·&nbsp; {inst.institute_call_number}
                      {inst.trialExpiresAt && ` · Expires: ${formatDisplayDate(inst.trialExpiresAt)}`}
                    </Typography>
                    {inst.storage_mode && (() => {
                      const meta = STORAGE_MODE_META[inst.storage_mode] || STORAGE_MODE_META.cloud_only;
                      return (
                        <Chip
                          icon={<meta.Icon sx={{ fontSize: '0.75rem !important', color: `${meta.color} !important` }} />}
                          label={meta.label}
                          size="small"
                          sx={{ bgcolor: `${meta.color}15`, color: meta.color, fontWeight: 600, fontSize: '0.65rem', height: 18, mt: 0.25 }}
                        />
                      );
                    })()}
                    {inst.modulesEnabled?.length > 0 && (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap mt={0.5}>
                        {inst.modulesEnabled.map(m => (
                          <Chip key={m} label={m} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                        ))}
                      </Stack>
                    )}
                  </Stack>

                  {/* Actions — edit/delete only for super_admin */}
                  {isSuperAdmin && (
                    <Stack direction="row" spacing={0.5} flexShrink={0}>
                      <Tooltip title="Manage plan & modules">
                        <IconButton size="small" color="primary" onClick={() => openEdit(inst)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete institute">
                        <IconButton size="small" color="error" onClick={() => handleDelete(inst.institute_uuid, inst.institute_title)}>
                          <DeleteForever fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <ManageAccounts color="primary" />
            <Box>
              <Typography fontWeight={700}>{editTarget?.institute_title}</Typography>
              <Typography variant="caption" color="text.secondary">Manage plan, status & modules</Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {editTarget && (
            <Stack spacing={2.5}>
              {/* Plan & Status */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Plan Type</InputLabel>
                  <Select
                    value={editTarget.plan_type || 'trial'}
                    label="Plan Type"
                    onChange={e => setEditTarget(p => ({ ...p, plan_type: e.target.value }))}
                  >
                    <MenuItem value="free">Free</MenuItem>
                    <MenuItem value="trial">Trial</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={editTarget.status || 'trial'}
                    label="Status"
                    onChange={e => setEditTarget(p => ({ ...p, status: e.target.value }))}
                  >
                    <MenuItem value="trial">Trial</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="expired">Expired</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              {/* Expiry Date */}
              <TextField
                label="Trial / Plan Expiry Date"
                type="date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={editTarget.trialExpiresAt}
                onChange={e => setEditTarget(p => ({ ...p, trialExpiresAt: e.target.value }))}
              />

              {/* Storage Mode */}
              <FormControl fullWidth size="small">
                <InputLabel>Storage Mode</InputLabel>
                <Select
                  value={editTarget.storage_mode || 'cloud_only'}
                  label="Storage Mode"
                  onChange={e => setEditTarget(p => ({ ...p, storage_mode: e.target.value }))}
                >
                  <MenuItem value="cloud_only">☁️ Cloud Only — Web & Mobile</MenuItem>
                  <MenuItem value="hybrid">🔄 Hybrid — Desktop + Cloud Sync</MenuItem>
                  <MenuItem value="local_only">💻 Local Only — Fully Offline Desktop</MenuItem>
                </Select>
              </FormControl>

              {/* Modules */}
              <Box>
                <Typography variant="subtitle2" fontWeight={700} mb={1}>
                  Premium Modules
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                  Enable modules for <strong>paid</strong> plan. During trial all are active automatically.
                </Typography>
                <Grid container spacing={1}>
                  {ALL_MODULES.map(mod => (
                    <Grid item xs={6} sm={4} key={mod.key}>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={editTarget.modulesEnabled.includes(mod.key)}
                            onChange={() => toggleModule(mod.key)}
                            sx={{ '& .MuiSwitch-thumb': { bgcolor: editTarget.modulesEnabled.includes(mod.key) ? '#1a7a4a' : undefined } }}
                          />
                        }
                        label={<Typography variant="caption">{mod.label}</Typography>}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTarget(null)} disabled={saving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={saveEdit}
            disabled={saving}
            sx={{ bgcolor: '#1a7a4a', '&:hover': { bgcolor: '#145c38' } }}
          >
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
