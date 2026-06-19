import React from 'react';
import {
  FormControl, InputLabel, Select, MenuItem, Stack,
} from '@mui/material';

const AdmissionCourseBatchTab = ({ form, handleChange, courses, educations, exams, batches, setForm }) => (
  <Stack spacing={2.5}>
    <FormControl fullWidth size="small">
      <InputLabel>Education</InputLabel>
      <Select value={form.education} onChange={handleChange('education')} label="Education">
        <MenuItem value=""><em>Select Education</em></MenuItem>
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
        <MenuItem value=""><em>Select Course</em></MenuItem>
        {courses.map(c => (
          <MenuItem key={c._id} value={c.Course_uuid}>{c.name}</MenuItem>
        ))}
      </Select>
    </FormControl>

    <FormControl fullWidth size="small">
      <InputLabel>Batch</InputLabel>
      <Select value={form.batchTime} onChange={handleChange('batchTime')} label="Batch">
        <MenuItem value=""><em>Select Batch</em></MenuItem>
        {batches.map(b => (
          <MenuItem key={b._id} value={b.time || b.batchTime || b.name || ''}>
            {b.time || b.batchTime || b.name || 'Unnamed Batch'}
          </MenuItem>
        ))}
      </Select>
    </FormControl>

    <FormControl fullWidth size="small">
      <InputLabel>Exam / Event</InputLabel>
      <Select value={form.examEvent} onChange={handleChange('examEvent')} label="Exam / Event">
        <MenuItem value=""><em>Select Exam</em></MenuItem>
        {exams.map(e => (
          <MenuItem key={e._id} value={e.exam}>{e.exam}</MenuItem>
        ))}
      </Select>
    </FormControl>
  </Stack>
);

export default AdmissionCourseBatchTab;
