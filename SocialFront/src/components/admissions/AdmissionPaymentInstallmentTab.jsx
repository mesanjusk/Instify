import React from 'react';
import {
  TextField, FormControl, InputLabel, Select, MenuItem,
  Stack, Table, TableHead, TableRow, TableCell, TableBody,
  Typography, Paper,
} from '@mui/material';

const AdmissionPaymentInstallmentTab = ({ form, handleChange, installmentPlan, paymentModes }) => (
  <Stack spacing={2.5}>
    <TextField
      label="Fees"
      type="number"
      value={form.fees}
      size="small"
      fullWidth
      InputProps={{ readOnly: true }}
    />

    <TextField
      label="Discount"
      type="number"
      value={form.discount}
      onChange={handleChange('discount')}
      size="small"
      fullWidth
      inputProps={{ min: 0 }}
    />

    <TextField
      label="Total"
      type="number"
      value={form.total}
      size="small"
      fullWidth
      InputProps={{ readOnly: true }}
    />

    <TextField
      label="Fee Paid"
      type="number"
      value={form.feePaid}
      onChange={handleChange('feePaid')}
      size="small"
      fullWidth
      inputProps={{ min: 0 }}
    />

    <FormControl fullWidth size="small">
      <InputLabel>Payment Mode</InputLabel>
      <Select value={form.paidBy} onChange={handleChange('paidBy')} label="Payment Mode" MenuProps={{ sx: { zIndex: 1500 } }}>
        <MenuItem value=""><em>Select Payment Mode</em></MenuItem>
        {paymentModes.map(p => (
          <MenuItem key={p._id} value={p.uuid}>{p.Account_name}</MenuItem>
        ))}
      </Select>
    </FormControl>

    <TextField
      label="Balance"
      type="number"
      value={form.balance}
      size="small"
      fullWidth
      InputProps={{ readOnly: true }}
    />

    <TextField
      label="Number of Installments"
      type="number"
      value={form.installment}
      onChange={handleChange('installment')}
      size="small"
      fullWidth
      inputProps={{ min: 1 }}
    />

    <TextField
      label="EMI Start Date"
      type="date"
      value={form.emiDate}
      onChange={handleChange('emiDate')}
      size="small"
      fullWidth
      InputLabelProps={{ shrink: true }}
    />

    <TextField
      label="EMI Amount"
      type="number"
      value={form.emi}
      size="small"
      fullWidth
      InputProps={{ readOnly: true }}
    />

    {installmentPlan.length > 0 && (
      <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ px: 2, pt: 1.5, pb: 1, fontWeight: 700, bgcolor: 'grey.50' }}>
          Installment Schedule
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>#</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Due Date</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {installmentPlan.map(p => (
              <TableRow key={p.installmentNo} hover>
                <TableCell sx={{ fontSize: '0.8rem' }}>{p.installmentNo}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>{new Date(p.dueDate).toLocaleDateString()}</TableCell>
                <TableCell align="right" sx={{ fontSize: '0.8rem' }}>₹{p.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    )}
  </Stack>
);

export default AdmissionPaymentInstallmentTab;
