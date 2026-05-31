import React, { useEffect, useState, useMemo } from 'react';
import apiClient from '../apiClient';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControlLabel, Grid, IconButton, InputAdornment,
  Stack, Switch, TextField, Tooltip, Typography, MenuItem,
  Select, FormControl, InputLabel, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import {
  Business, CheckCircle, DeleteForever, Download, Edit, HourglassEmpty,
  ManageAccounts, PauseCircle, Refresh, School, SupervisorAccount,
  Cloud, SyncAlt, Computer, DesktopWindows, Search, Warning,
  EventAvailable, AccessTime,
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

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function ExpiryBadge({ dateStr }) {
  const days = daysUntil(dateStr);
  if (days === null) return null;
  if (days < 0) return (
    <Chip size="small" label="Expired" icon={<Warning sx={{ fontSize: '0.7rem !important' }} />}
      sx={{ bgcolor: '#fef2f2', color: '#ef4444', fontWeight: 700, fontSize: '0.65rem', height: 18 }} />
  );
  if (days <= 7) return (
    <Chip size="small" label={`${days}d left`} icon={<Warning sx={{ fontSize: '0.7rem !important' }} />}
      sx={{ bgcolor: '#fff7ed', color: '#ea580c', fontWeight: 700, fontSize: '0.65rem', height: 18 }} />
  );
  if (days <= 30) return (
    <Chip size="small" label={`${days}d left`} icon={<AccessTime sx={{ fontSize: '0.7rem !important' }} />}
      sx={{ bgcolor: '#fefce8', color: '#ca8a04', fontWeight: 700, fontSize: '0.65rem', height: 18 }} />
  );
  return (
    <Chip size="small" label={`${days}d left`} icon={<EventAvailable sx={{ fontSize: '0.7rem !important' }} />}
      sx={{ bgcolor: '#f0fdf4', color: '#16a34a', fontWeight: 600, fontSize: '0.65rem', height: 18 }} />
  );
}

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

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function addYears(years) {
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

export default function ToolsPanel() {
  const { user } = useApp();
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const isSuperAdmin = user?.role === 'super_admin';
  const canView = isSuperAdmin || user?.role === 'owner';

  // Search + filter
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Desktop app
  const [desktopApp, setDesktopApp] = useState(null);
  const [desktopLoading, setDesktopLoading] = useState(true);
  const [desktopDialog, setDesktopDialog] = useState(false);
  const [desktopForm, setDesktopForm] = useState({ version: '', url: '', releaseNotes: '' });
  const [desktopSaving, setDesktopSaving] = useState(false);

  useEffect(() => {
    if (canView) { fetchInstitutes(); fetchDesktopApp(); }
  }, [canView]);

  const fetchInstitutes = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/institute/GetOrganizList');
      if (res.data?.success) setInstitutes(res.data.result);
      else toast.error('Failed to load institutes');
    } catch { toast.error('Failed to load institutes'); }
    finally { setLoading(false); }
  };

  const fetchDesktopApp = async () => {
    setDesktopLoading(true);
    try {
      const res = await apiClient.get('/api/admin/desktop-app');
      setDesktopApp(res.data);
    } catch { setDesktopApp({ available: false }); }
    finally { setDesktopLoading(false); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return institutes.filter(i => {
      const matchSearch = !q ||
        i.institute_title?.toLowerCase().includes(q) ||
        i.center_code?.toLowerCase().includes(q) ||
        i.institute_call_number?.includes(q) ||
        i.contactEmail?.toLowerCase().includes(q) ||
        i.center_head_name?.toLowerCase().includes(q);
      const matchPlan = filterPlan === 'all' || i.plan_type === filterPlan;
      const matchStatus = filterStatus === 'all' || i.status === filterStatus;
      return matchSearch && matchPlan && matchStatus;
    });
  }, [institutes, search, filterPlan, filterStatus]);

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

  const handleDelete = async (uuid, name) => {
    if (!window.confirm(`Delete "${name}" and all its data? This cannot be undone.`)) return;
    try {
      await apiClient.delete(`/api/institute/${uuid}`);
      toast.success('Institute deleted');
      fetchInstitutes();
    } catch { toast.error('Failed to delete'); }
  };

  const openEdit = (inst) => {
    setEditTarget({
      ...inst,
      modulesEnabled: inst.modulesEnabled || [],
      storage_mode: inst.storage_mode || 'cloud_only',
      trialExpiresAt: inst.trialExpiresAt
        ? new Date(inst.trialExpiresAt).toISOString().slice(0, 10) : '',
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
      const res = await apiClient.put(`/api/institute/manage/${editTarget.institute_uuid}`, payload);
      if (res.data?.success) {
        toast.success('Institute updated');
        setEditTarget(null);
        fetchInstitutes();
      } else { toast.error('Update failed'); }
    } catch { toast.error('Failed to save changes'); }
    finally { setSaving(false); }
  };

  const openDesktopDialog = () => {
    setDesktopForm({ version: desktopApp?.version || '', url: desktopApp?.url || '', releaseNotes: desktopApp?.releaseNotes || '' });
    setDesktopDialog(true);
  };

  const saveDesktopApp = async () => {
    if (!desktopForm.url.trim()) { toast.error('Download URL is required'); return; }
    setDesktopSaving(true);
    try {
      await apiClient.put('/api/admin/desktop-app', desktopForm);
      toast.success('Desktop app info updated');
      setDesktopDialog(false);
      fetchDesktopApp();
    } catch { toast.error('Failed to save'); }
    finally { setDesktopSaving(false); }
  };

  const stats = {
    total: institutes.length,
    active: institutes.filter(i => i.status === 'active').length,
    trial: institutes.filter(i => i.status === 'trial').length,
    expired: institutes.filter(i => i.status === 'expired').length,
    expiringSoon: institutes.filter(i => { const d = daysUntil(i.trialExpiresAt); return d !== null && d >= 0 && d <= 30; }).length,
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={1}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <SupervisorAccount sx={{ color: '#1a7a4a', fontSize: 30 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>{isSuperAdmin ? 'Super Admin Dashboard' : 'All Institutes'}</Typography>
            <Typography variant="body2" color="text.secondary">
              {isSuperAdmin ? 'Manage all institutions, plans & premium features' : 'View all registered institutes'}
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={fetchInstitutes} title="Refresh"><Refresh /></IconButton>
      </Stack>

      {/* Stats */}
      <Stack direction="row" spacing={2} mb={3} flexWrap="wrap" useFlexGap>
        <StatCard icon={<Business />} label="Total" value={stats.total} color="#0891b2" />
        <StatCard icon={<CheckCircle />} label="Active (Paid)" value={stats.active} color="#10b981" />
        <StatCard icon={<HourglassEmpty />} label="On Trial" value={stats.trial} color="#f59e0b" />
        <StatCard icon={<PauseCircle />} label="Expired" value={stats.expired} color="#ef4444" />
        {stats.expiringSoon > 0 && (
          <StatCard icon={<Warning />} label="Expiring ≤30d" value={stats.expiringSoon} color="#ea580c" />
        )}
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* Desktop App */}
      <Card variant="outlined" sx={{ mb: 3, background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', borderColor: '#bae6fd' }}>
        <CardContent sx={{ p: { xs: 2, md: 2.5 }, '&:last-child': { pb: { xs: 2, md: 2.5 } } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <DesktopWindows sx={{ color: '#fff', fontSize: 22 }} />
              </Box>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Typography variant="subtitle1" fontWeight={700} color="#0c4a6e">Instify Desktop App</Typography>
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
                      {desktopApp.publishedAt ? `Published ${new Date(desktopApp.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Available'}
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
                <Button variant="contained" startIcon={<Download />} component="a" href={desktopApp.url} download target="_blank" rel="noopener noreferrer"
                  sx={{ bgcolor: '#0369a1', '&:hover': { bgcolor: '#075985' }, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  Download .exe
                </Button>
              )}
              {isSuperAdmin && (
                <Button variant="outlined" startIcon={<Edit />} onClick={openDesktopDialog}
                  sx={{ borderColor: '#0369a1', color: '#0369a1', '&:hover': { borderColor: '#075985', bgcolor: '#f0f9ff' }, whiteSpace: 'nowrap' }}>
                  {desktopApp?.available ? 'Update Link' : 'Set Link'}
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Divider sx={{ mb: 3 }} />

      {/* Search + filter */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={2} alignItems={{ sm: 'center' }}>
        <TextField
          size="small"
          placeholder="Search by name, code, phone, email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
          }}
        />
        <ToggleButtonGroup size="small" value={filterPlan} exclusive onChange={(_, v) => v && setFilterPlan(v)}>
          <ToggleButton value="all" sx={{ px: 1.5, fontSize: '0.75rem' }}>All Plans</ToggleButton>
          <ToggleButton value="trial" sx={{ px: 1.5, fontSize: '0.75rem', color: '#b45309' }}>Trial</ToggleButton>
          <ToggleButton value="paid" sx={{ px: 1.5, fontSize: '0.75rem', color: '#059669' }}>Paid</ToggleButton>
          <ToggleButton value="free" sx={{ px: 1.5, fontSize: '0.75rem', color: '#6b7280' }}>Free</ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup size="small" value={filterStatus} exclusive onChange={(_, v) => v && setFilterStatus(v)}>
          <ToggleButton value="all" sx={{ px: 1.5, fontSize: '0.75rem' }}>All Status</ToggleButton>
          <ToggleButton value="active" sx={{ px: 1.5, fontSize: '0.75rem', color: '#059669' }}>Active</ToggleButton>
          <ToggleButton value="trial" sx={{ px: 1.5, fontSize: '0.75rem', color: '#b45309' }}>Trial</ToggleButton>
          <ToggleButton value="expired" sx={{ px: 1.5, fontSize: '0.75rem', color: '#dc2626' }}>Expired</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Typography variant="caption" color="text.secondary" mb={1} display="block">
        Showing {filtered.length} of {institutes.length} institutes
      </Typography>

      {/* Institute list */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#1a7a4a' }} />
        </Box>
      ) : filtered.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" py={4}>No institutes match your filters.</Typography>
      ) : (
        <Stack spacing={1.5}>
          {filtered.map((inst) => (
            <Card key={inst.institute_uuid} variant="outlined" sx={{ '&:hover': { boxShadow: 2 } }}>
              <CardContent sx={{ p: { xs: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1.5, md: 2 } } }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} justifyContent="space-between">
                  <Stack spacing={0.4} flex={1} minWidth={0}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <School sx={{ fontSize: 18, color: '#1a7a4a' }} />
                      <Typography variant="subtitle2" fontWeight={700} noWrap>{inst.institute_title}</Typography>
                      <Chip label={inst.plan_type || 'trial'} size="small"
                        sx={{ bgcolor: `${PLAN_COLORS[inst.plan_type] || '#6b7280'}22`, color: PLAN_COLORS[inst.plan_type] || '#6b7280', fontWeight: 600, fontSize: '0.7rem' }} />
                      <Chip label={inst.status || 'trial'} size="small"
                        sx={{ bgcolor: `${STATUS_COLORS[inst.status] || '#f59e0b'}22`, color: STATUS_COLORS[inst.status] || '#f59e0b', fontWeight: 600, fontSize: '0.7rem' }} />
                      <ExpiryBadge dateStr={inst.trialExpiresAt} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Code: <strong>{inst.center_code}</strong> &nbsp;·&nbsp; {inst.institute_call_number}
                      {inst.center_head_name && ` · ${inst.center_head_name}`}
                    </Typography>
                    {inst.contactEmail && (
                      <Typography variant="caption" color="text.secondary">{inst.contactEmail}</Typography>
                    )}
                    {inst.trialExpiresAt && (
                      <Typography variant="caption" color="text.secondary">
                        Expiry: {formatDisplayDate(inst.trialExpiresAt)}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap mt={0.25}>
                      {inst.storage_mode && (() => {
                        const meta = STORAGE_MODE_META[inst.storage_mode] || STORAGE_MODE_META.cloud_only;
                        return (
                          <Chip icon={<meta.Icon sx={{ fontSize: '0.75rem !important', color: `${meta.color} !important` }} />}
                            label={meta.label} size="small"
                            sx={{ bgcolor: `${meta.color}15`, color: meta.color, fontWeight: 600, fontSize: '0.65rem', height: 18 }} />
                        );
                      })()}
                      {inst.modulesEnabled?.map(m => (
                        <Chip key={m} label={m} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
                      ))}
                    </Stack>
                  </Stack>

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

      {/* Desktop App Edit Dialog */}
      <Dialog open={desktopDialog} onClose={() => setDesktopDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <DesktopWindows color="primary" />
            <Box>
              <Typography fontWeight={700}>Desktop App Download Link</Typography>
              <Typography variant="caption" color="text.secondary">Paste installer URL after uploading to GitHub Releases</Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} pt={0.5}>
            <TextField label="Version" size="small" fullWidth placeholder="e.g. 1.1.1"
              value={desktopForm.version} onChange={e => setDesktopForm(p => ({ ...p, version: e.target.value }))} />
            <TextField label="Download URL (.exe)" size="small" fullWidth required
              placeholder="https://github.com/mesanjusk/Instify/releases/download/v1.1.1/Instify.Setup.1.1.1.exe"
              value={desktopForm.url} onChange={e => setDesktopForm(p => ({ ...p, url: e.target.value }))} />
            <TextField label="Release Notes (optional)" size="small" fullWidth multiline rows={3}
              placeholder={`• Cloud sync\n• License control\n• Offline 30-day grace period`}
              value={desktopForm.releaseNotes} onChange={e => setDesktopForm(p => ({ ...p, releaseNotes: e.target.value }))} />
            <Alert severity="info" sx={{ fontSize: '0.78rem' }}>
              Build with <code>cd electron &amp;&amp; npm run dist:win</code>, upload to GitHub Releases, paste URL above.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDesktopDialog(false)} disabled={desktopSaving}>Cancel</Button>
          <Button variant="contained" onClick={saveDesktopApp} disabled={desktopSaving}
            sx={{ bgcolor: '#0369a1', '&:hover': { bgcolor: '#075985' } }}>
            {desktopSaving ? <CircularProgress size={18} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Institute Dialog */}
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
              {/* Quick Actions */}
              <Box>
                <Typography variant="subtitle2" fontWeight={700} mb={1}>Quick Actions</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button size="small" variant="contained"
                    sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, fontSize: '0.75rem', textTransform: 'none' }}
                    onClick={() => setEditTarget(p => ({ ...p, plan_type: 'paid', status: 'active', trialExpiresAt: addYears(1), modulesEnabled: ALL_MODULES.map(m => m.key) }))}>
                    ✅ Activate 1 Year (All Modules)
                  </Button>
                  <Button size="small" variant="outlined" color="warning"
                    sx={{ fontSize: '0.75rem', textTransform: 'none' }}
                    onClick={() => setEditTarget(p => ({ ...p, plan_type: 'trial', status: 'trial', trialExpiresAt: addDays(30) }))}>
                    +30 days Trial
                  </Button>
                  <Button size="small" variant="outlined" color="warning"
                    sx={{ fontSize: '0.75rem', textTransform: 'none' }}
                    onClick={() => setEditTarget(p => ({ ...p, plan_type: 'trial', status: 'trial', trialExpiresAt: addDays(15) }))}>
                    +15 days Trial
                  </Button>
                  <Button size="small" variant="outlined" color="error"
                    sx={{ fontSize: '0.75rem', textTransform: 'none' }}
                    onClick={() => setEditTarget(p => ({ ...p, plan_type: 'free', status: 'expired', modulesEnabled: [] }))}>
                    🚫 Deactivate
                  </Button>
                </Stack>
              </Box>

              <Divider />

              {/* Plan & Status */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Plan Type</InputLabel>
                  <Select value={editTarget.plan_type || 'trial'} label="Plan Type"
                    onChange={e => setEditTarget(p => ({ ...p, plan_type: e.target.value }))}>
                    <MenuItem value="free">Free</MenuItem>
                    <MenuItem value="trial">Trial</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={editTarget.status || 'trial'} label="Status"
                    onChange={e => setEditTarget(p => ({ ...p, status: e.target.value }))}>
                    <MenuItem value="trial">Trial</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="expired">Expired</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <TextField label="Plan Expiry Date" type="date" size="small" fullWidth
                InputLabelProps={{ shrink: true }}
                value={editTarget.trialExpiresAt}
                onChange={e => setEditTarget(p => ({ ...p, trialExpiresAt: e.target.value }))}
                helperText={editTarget.trialExpiresAt ? `${daysUntil(editTarget.trialExpiresAt)} days from today` : ''}
              />

              <FormControl fullWidth size="small">
                <InputLabel>Storage Mode</InputLabel>
                <Select value={editTarget.storage_mode || 'cloud_only'} label="Storage Mode"
                  onChange={e => setEditTarget(p => ({ ...p, storage_mode: e.target.value }))}>
                  <MenuItem value="cloud_only">☁️ Cloud Only — Web & Mobile</MenuItem>
                  <MenuItem value="hybrid">🔄 Hybrid — Desktop + Cloud Sync</MenuItem>
                  <MenuItem value="local_only">💻 Local Only — Fully Offline Desktop</MenuItem>
                </Select>
              </FormControl>

              {/* Modules */}
              <Box>
                <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Premium Modules</Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                  Active for <strong>paid</strong> plan. All modules open automatically during trial.
                </Typography>
                <Grid container spacing={1}>
                  {ALL_MODULES.map(mod => (
                    <Grid item xs={6} sm={4} key={mod.key}>
                      <FormControlLabel
                        control={
                          <Switch size="small" checked={editTarget.modulesEnabled.includes(mod.key)}
                            onChange={() => toggleModule(mod.key)}
                            sx={{ '& .MuiSwitch-thumb': { bgcolor: editTarget.modulesEnabled.includes(mod.key) ? '#1a7a4a' : undefined } }} />
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
          <Button variant="contained" onClick={saveEdit} disabled={saving}
            sx={{ bgcolor: '#1a7a4a', '&:hover': { bgcolor: '#145c38' } }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
