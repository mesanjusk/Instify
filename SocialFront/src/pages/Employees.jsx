import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  IconButton, MenuItem, Select, Stack, TextField, Typography, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import apiClient from '../apiClient';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function EmpForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    firstName: '', lastName: '', designation: '', department: '', mobile: '', email: '',
    joiningDate: '', status: 'active', bankAccount: '', ifsc: '', pan: '',
    salaryStructure: { basic: '', hra: '', components: [] },
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setSal = (k, v) => setForm(p => ({ ...p, salaryStructure: { ...p.salaryStructure, [k]: v } }));

  function addComponent() {
    setSal('components', [...(form.salaryStructure.components || []), { name: '', type: 'earning', amount: '', isPercent: false }]);
  }

  function updateComponent(i, field, val) {
    const comps = [...(form.salaryStructure.components || [])];
    comps[i] = { ...comps[i], [field]: val };
    setSal('components', comps);
  }

  function removeComponent(i) {
    setSal('components', form.salaryStructure.components.filter((_, idx) => idx !== i));
  }

  return (
    <DialogContent sx={{ maxWidth: 520 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2}>
          <TextField label="First Name *" value={form.firstName} onChange={e => set('firstName', e.target.value)} fullWidth size="small" />
          <TextField label="Last Name" value={form.lastName} onChange={e => set('lastName', e.target.value)} fullWidth size="small" />
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField label="Designation" value={form.designation} onChange={e => set('designation', e.target.value)} fullWidth size="small" />
          <TextField label="Department" value={form.department} onChange={e => set('department', e.target.value)} fullWidth size="small" />
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField label="Mobile" value={form.mobile} onChange={e => set('mobile', e.target.value)} fullWidth size="small" />
          <TextField label="Email" value={form.email} onChange={e => set('email', e.target.value)} fullWidth size="small" />
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField label="Joining Date" type="date" value={form.joiningDate ? form.joiningDate.slice(0,10) : ''} onChange={e => set('joiningDate', e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
          <Select value={form.status} onChange={e => set('status', e.target.value)} size="small" fullWidth>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </Stack>

        <Divider><Typography variant="caption" color="text.secondary">Salary Structure</Typography></Divider>
        <Stack direction="row" spacing={2}>
          <TextField label="Basic (₹)" type="number" value={form.salaryStructure.basic} onChange={e => setSal('basic', e.target.value)} fullWidth size="small" />
          <TextField label="HRA (₹)" type="number" value={form.salaryStructure.hra} onChange={e => setSal('hra', e.target.value)} fullWidth size="small" />
        </Stack>
        {(form.salaryStructure.components || []).map((comp, i) => (
          <Stack key={i} direction="row" spacing={1} alignItems="center">
            <TextField label="Name" value={comp.name} onChange={e => updateComponent(i, 'name', e.target.value)} size="small" sx={{ flex: 2 }} />
            <Select value={comp.type} onChange={e => updateComponent(i, 'type', e.target.value)} size="small" sx={{ flex: 1 }}>
              <MenuItem value="earning">Earning</MenuItem>
              <MenuItem value="deduction">Deduction</MenuItem>
            </Select>
            <TextField label="Amt" type="number" value={comp.amount} onChange={e => updateComponent(i, 'amount', e.target.value)} size="small" sx={{ flex: 1 }} />
            <Tooltip title="Remove"><IconButton size="small" onClick={() => removeComponent(i)}><RemoveCircleOutlineIcon fontSize="small" color="error" /></IconButton></Tooltip>
          </Stack>
        ))}
        <Button size="small" startIcon={<AddCircleOutlineIcon />} onClick={addComponent} sx={{ alignSelf: 'flex-start' }}>Add Component</Button>

        <Divider><Typography variant="caption" color="text.secondary">Bank Details</Typography></Divider>
        <Stack direction="row" spacing={2}>
          <TextField label="Bank Account" value={form.bankAccount} onChange={e => set('bankAccount', e.target.value)} fullWidth size="small" />
          <TextField label="IFSC" value={form.ifsc} onChange={e => set('ifsc', e.target.value)} fullWidth size="small" />
        </Stack>
        <TextField label="PAN" value={form.pan} onChange={e => set('pan', e.target.value)} size="small" />
      </Stack>

      <DialogActions sx={{ pt: 2, px: 0 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave(form)}>Save</Button>
      </DialogActions>
    </DialogContent>
  );
}

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null); // null | { mode: 'add'|'edit', data? }
  const [alert, setAlert] = useState(null);
  const [payrollDialog, setPayrollDialog] = useState(false);
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('employees'); // 'employees' | 'payroll'

  const uuid = localStorage.getItem('institute_uuid');

  function showAlert(type, text) { setAlert({ type, text }); setTimeout(() => setAlert(null), 4000); }

  async function load() {
    setLoading(true);
    try {
      const [empRes, payRes] = await Promise.all([
        apiClient.get(`/api/employees?institute_uuid=${uuid}`),
        apiClient.get(`/api/employees/payroll?institute_uuid=${uuid}`),
      ]);
      setEmployees(empRes.data?.result || []);
      setPayrollRuns(payRes.data?.result || []);
    } catch { showAlert('error', 'Failed to load data'); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (uuid) load(); }, []);

  async function save(form) {
    try {
      if (dialog.mode === 'add') {
        await apiClient.post('/api/employees', { ...form, institute_uuid: uuid });
      } else {
        await apiClient.put(`/api/employees/${dialog.data.employee_uuid}`, form);
      }
      setDialog(null);
      showAlert('success', 'Saved!');
      load();
    } catch (err) { showAlert('error', err.response?.data?.message || 'Save failed'); }
  }

  async function remove(emp) {
    if (!window.confirm(`Delete ${emp.firstName}?`)) return;
    try {
      await apiClient.delete(`/api/employees/${emp.employee_uuid}`);
      showAlert('success', 'Deleted');
      load();
    } catch { showAlert('error', 'Delete failed'); }
  }

  async function processPayroll() {
    setProcessing(true);
    try {
      await apiClient.post('/api/employees/payroll/process', {
        institute_uuid: uuid, month: payrollMonth, year: payrollYear,
        processedBy: localStorage.getItem('login_username') || 'admin',
      });
      setPayrollDialog(false);
      showAlert('success', 'Payroll processed!');
      load();
    } catch (err) { showAlert('error', err.response?.data?.message || 'Failed'); }
    finally { setProcessing(false); }
  }

  const grossSalary = (emp) => {
    const { basic = 0, hra = 0, components = [] } = emp.salaryStructure || {};
    const earnings = components.filter(c => c.type === 'earning').reduce((s, c) => s + Number(c.amount || 0), 0);
    return Number(basic) + Number(hra) + earnings;
  };

  return (
    <Box>
      {alert && <Alert severity={alert.type} sx={{ mb: 2 }} onClose={() => setAlert(null)}>{alert.text}</Alert>}

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h6" fontWeight={700}>HR & Payroll</Typography>
          <Typography variant="caption" color="text.secondary">{employees.length} employees</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small" onClick={() => setPayrollDialog(true)}>Process Payroll</Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setDialog({ mode: 'add' })}>Add Employee</Button>
        </Stack>
      </Stack>

      {/* Tabs */}
      <Stack direction="row" spacing={1} mb={2}>
        {['employees', 'payroll'].map(t => (
          <Chip key={t} label={t === 'employees' ? 'Employees' : 'Payroll Runs'} onClick={() => setActiveTab(t)}
            color={activeTab === t ? 'primary' : 'default'} variant={activeTab === t ? 'filled' : 'outlined'} />
        ))}
      </Stack>

      {loading ? (
        <Box textAlign="center" py={4}><CircularProgress /></Box>
      ) : activeTab === 'employees' ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)' }, gap: 2 }}>
          {employees.map(emp => (
            <Card key={emp.employee_uuid} variant="outlined">
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PersonIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography fontWeight={600} fontSize="0.875rem">{emp.firstName} {emp.lastName}</Typography>
                      <Typography variant="caption" color="text.secondary">{emp.designation || '—'}</Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row">
                    <IconButton size="small" onClick={() => setDialog({ mode: 'edit', data: emp })}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => remove(emp)}><DeleteIcon fontSize="small" color="error" /></IconButton>
                  </Stack>
                </Stack>
                <Stack direction="row" justifyContent="space-between" mt={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Department</Typography>
                    <Typography variant="body2">{emp.department || '—'}</Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary">Gross Salary</Typography>
                    <Typography variant="body2" fontWeight={600} color="success.main">₹{grossSalary(emp).toLocaleString()}</Typography>
                  </Box>
                </Stack>
                <Stack direction="row" justifyContent="space-between" mt={1}>
                  <Typography variant="caption" color="text.secondary">{emp.mobile || '—'}</Typography>
                  <Chip size="small" label={emp.status} color={emp.status === 'active' ? 'success' : 'default'} sx={{ height: 18, fontSize: '0.65rem' }} />
                </Stack>
              </CardContent>
            </Card>
          ))}
          {employees.length === 0 && (
            <Box sx={{ gridColumn: '1/-1', textAlign: 'center', py: 5 }}>
              <Typography color="text.secondary">No employees yet. Add your first employee.</Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box>
          {payrollRuns.map(run => (
            <Card key={run.run_uuid} variant="outlined" sx={{ mb: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography fontWeight={700}>{MONTHS[run.month - 1]} {run.year}</Typography>
                  <Chip size="small" label={run.status} color={run.status === 'paid' ? 'success' : run.status === 'processed' ? 'warning' : 'default'} />
                </Stack>
                <Stack direction="row" spacing={3} mb={1}>
                  <Box><Typography variant="caption" color="text.secondary">Employees</Typography><Typography fontWeight={600}>{run.payslips?.length || 0}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Total Gross</Typography><Typography fontWeight={600}>₹{(run.totalGross || 0).toLocaleString()}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Total Net</Typography><Typography fontWeight={600} color="success.main">₹{(run.totalNet || 0).toLocaleString()}</Typography></Box>
                </Stack>
                <Box sx={{ maxHeight: 180, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead><tr style={{ background: '#f1f5f9' }}>
                      {['Employee','Designation','Basic','Gross','Net'].map(h => <th key={h} style={{ padding: '4px 8px', textAlign: 'left' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>{(run.payslips || []).map((p, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '4px 8px' }}>{p.employeeName}</td>
                        <td style={{ padding: '4px 8px', color: '#64748b' }}>{p.designation}</td>
                        <td style={{ padding: '4px 8px' }}>₹{(p.basic || 0).toLocaleString()}</td>
                        <td style={{ padding: '4px 8px' }}>₹{(p.gross || 0).toLocaleString()}</td>
                        <td style={{ padding: '4px 8px', fontWeight: 600, color: '#10b981' }}>₹{(p.net || 0).toLocaleString()}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </Box>
              </CardContent>
            </Card>
          ))}
          {payrollRuns.length === 0 && <Box textAlign="center" py={5}><Typography color="text.secondary">No payroll runs yet.</Typography></Box>}
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={!!dialog} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>{dialog?.mode === 'add' ? 'Add Employee' : 'Edit Employee'}</DialogTitle>
        {dialog && <EmpForm initial={dialog.data} onSave={save} onClose={() => setDialog(null)} />}
      </Dialog>

      {/* Process Payroll Dialog */}
      <Dialog open={payrollDialog} onClose={() => setPayrollDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Process Payroll</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Select value={payrollMonth} onChange={e => setPayrollMonth(e.target.value)} size="small" fullWidth>
              {MONTHS.map((m, i) => <MenuItem key={i} value={i+1}>{m}</MenuItem>)}
            </Select>
            <TextField label="Year" type="number" value={payrollYear} onChange={e => setPayrollYear(Number(e.target.value))} size="small" fullWidth />
            <Alert severity="info" sx={{ fontSize: '0.78rem' }}>
              This will calculate salary for all {employees.filter(e => e.status === 'active').length} active employees based on their salary structure.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayrollDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={processPayroll} disabled={processing}>
            {processing ? <CircularProgress size={18} /> : 'Process'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
