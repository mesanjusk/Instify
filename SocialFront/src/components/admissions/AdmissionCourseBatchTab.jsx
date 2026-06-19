import React from 'react';
import {
  FormControl, InputLabel, Select, MenuItem, Stack, CircularProgress,
} from '@mui/material';

const AdmissionCourseBatchTab = ({ form, handleChange, courses, educations, exams, batches, setForm, loading }) => (
  <Stack spacing={2.5}>
    <FormControl fullWidth size="small">
      <InputLabel>Education</InputLabel>
      <Select value={form.education} onChange={handleChange('education')} label="Education">
        <MenuItem value=""><em>{loading ? 'Loading…' : 'Select Education'}</em></MenuItem>
        {loading && <MenuItem disabled><CircularProgress size={14} sx={{ mr: 1 }} />Loading…</MenuItem>}
        {educations.map(e => (
          <MenuItem key={e._id} value={e.education}>{e.education}</MenuItem>
        ))}
      </Select>
    </FormControl>

    <FormControl fullWidth size="small" required>
      <InputLabel>Course</InputLabel>
      <Select
        value={form.course}
        onChange={(e) => {
          const selectedCourse = courses.find(c => c.Course_uuid === e.target.value);
          const courseFee = Number(selectedCourse?.courseFees || 0);
          const discount = Number(form.discount || 0);
          const feePaid = Number(form.feePaid || 0);
          const total = courseFee - discount;
          const balance = total - feePaid;
          setForm(prev => ({ ...prev, course: e.target.value, fees: courseFee, total, balance }));
        }}
        label="Course"
      >
        <MenuItem value=""><em>{loading ? 'Loading…' : courses.length === 0 ? 'No courses found' : 'Select Course'}</em></MenuItem>
        {loading && <MenuItem disabled><CircularProgress size={14} sx={{ mr: 1 }} />Loading…</MenuItem>}
        {courses.map(c => (
          <MenuItem key={c._id} value={c.Course_uuid}>{c.name}</MenuItem>
        ))}
      </Select>
    </FormControl>

    <FormControl fullWidth size="small">
      <InputLabel>Batch</InputLabel>
      <Select value={form.batchTime} onChange={handleChange('batchTime')} label="Batch">
        <MenuItem value=""><em>{loading ? 'Loading…' : batches.length === 0 ? 'No batches found' : 'Select Batch'}</em></MenuItem>
        {loading && <MenuItem disabled><CircularProgress size={14} sx={{ mr: 1 }} />Loading…</MenuItem>}
        {batches.map(b => (
          <MenuItem key={b._id} value={b.name || b.time || b.batchTime || ''}>
            {b.name || b.time || b.batchTime || 'Unnamed Batch'}
          </MenuItem>
        ))}
      </Select>
    </FormControl>

    <FormControl fullWidth size="small">
      <InputLabel>Exam / Event</InputLabel>
      <Select value={form.examEvent} onChange={handleChange('examEvent')} label="Exam / Event">
        <MenuItem value=""><em>{loading ? 'Loading…' : exams.length === 0 ? 'No exams found' : 'Select Exam'}</em></MenuItem>
        {loading && <MenuItem disabled><CircularProgress size={14} sx={{ mr: 1 }} />Loading…</MenuItem>}
        {exams.map(e => (
          <MenuItem key={e._id} value={e.exam}>{e.exam}</MenuItem>
        ))}
      </Select>
    </FormControl>
  </Stack>
);

export default AdmissionCourseBatchTab;
