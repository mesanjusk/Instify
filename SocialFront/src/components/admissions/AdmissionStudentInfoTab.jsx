import React from 'react';
import {
  TextField, FormControl, FormLabel, RadioGroup,
  FormControlLabel, Radio, Checkbox, Stack, Grid,
} from '@mui/material';

const AdmissionStudentInfoTab = ({ form, handleChange }) => (
  <Stack spacing={2}>
    <Grid container spacing={1.5}>
      <Grid item xs={4}>
        <TextField
          label="First Name"
          value={form.firstName}
          onChange={handleChange('firstName')}
          size="small"
          fullWidth
          required
        />
      </Grid>
      <Grid item xs={4}>
        <TextField
          label="Middle Name"
          value={form.middleName}
          onChange={handleChange('middleName')}
          size="small"
          fullWidth
        />
      </Grid>
      <Grid item xs={4}>
        <TextField
          label="Last Name"
          value={form.lastName}
          onChange={handleChange('lastName')}
          size="small"
          fullWidth
        />
      </Grid>
    </Grid>

    <TextField
      label="Date of Birth"
      type="date"
      value={form.dob?.substring(0, 10) || ''}
      onChange={handleChange('dob')}
      size="small"
      fullWidth
      InputLabelProps={{ shrink: true }}
      required
    />

    <FormControl component="fieldset">
      <FormLabel component="legend" sx={{ fontSize: '0.85rem', mb: 0.5 }}>Gender</FormLabel>
      <RadioGroup row value={form.gender} onChange={handleChange('gender')}>
        <FormControlLabel value="Male" control={<Radio size="small" />} label="Male" />
        <FormControlLabel value="Female" control={<Radio size="small" />} label="Female" />
      </RadioGroup>
    </FormControl>

    <Stack spacing={0.5}>
      <TextField
        label="Mobile (Self)"
        value={form.mobileSelf}
        onChange={handleChange('mobileSelf')}
        inputProps={{ inputMode: 'numeric', pattern: '[0-9]{10}', maxLength: 10 }}
        size="small"
        fullWidth
      />
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={!!form.mobileSelfWhatsapp}
            onChange={(e) => handleChange('mobileSelfWhatsapp')({ target: { value: e.target.checked } })}
            sx={{ p: 0.5 }}
          />
        }
        label={
          <span style={{ fontSize: '0.78rem', color: '#374151' }}>
            Student consents to receive WhatsApp notifications
          </span>
        }
      />
    </Stack>

    <Stack spacing={0.5}>
      <TextField
        label="Mobile (Parent)"
        value={form.mobileParent}
        onChange={handleChange('mobileParent')}
        inputProps={{ inputMode: 'numeric', pattern: '[0-9]{10}', maxLength: 10 }}
        size="small"
        fullWidth
      />
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={!!form.mobileParentWhatsapp}
            onChange={(e) => handleChange('mobileParentWhatsapp')({ target: { value: e.target.checked } })}
            sx={{ p: 0.5 }}
          />
        }
        label={
          <span style={{ fontSize: '0.78rem', color: '#374151' }}>
            Parent consents to receive WhatsApp notifications
          </span>
        }
      />
    </Stack>

    <TextField
      label="Address"
      value={form.address}
      onChange={handleChange('address')}
      size="small"
      fullWidth
      multiline
      rows={2}
    />
  </Stack>
);

export default AdmissionStudentInfoTab;
