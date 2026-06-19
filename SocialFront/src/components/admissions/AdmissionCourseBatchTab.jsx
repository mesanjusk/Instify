import React, { useState, useEffect, useRef } from 'react';
import {
  FormControl, InputLabel, Select, MenuItem, Stack, CircularProgress, Box, Button,
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import apiClient from '../../apiClient';
import toast from 'react-hot-toast';

const AdmissionCourseBatchTab = ({
  form,
  handleChange,
  setForm,
  // Props from parent hook — used as fast-path if already loaded
  courses: propCourses,
  educations: propEducations,
  exams: propExams,
  batches: propBatches,
}) => {
  const institute_uuid = localStorage.getItem('institute_uuid');
  const [courses, setCourses] = useState([]);
  const [educations, setEducations] = useState([]);
  const [exams, setExams] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const abortRef = useRef(null);

  const fetchDropdowns = async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setFetchError(false);

    const params = { institute_uuid };
    const [coursesRes, educationsRes, examsRes, batchesRes] = await Promise.allSettled([
      apiClient.get('/api/courses', { params, signal: controller.signal }),
      apiClient.get('/api/education', { signal: controller.signal }),
      apiClient.get('/api/exams', { params, signal: controller.signal }),
      apiClient.get('/api/batches', { params, signal: controller.signal }),
    ]);

    if (controller.signal.aborted) return;

    let anyFailed = false;

    if (coursesRes.status === 'fulfilled') {
      setCourses(Array.isArray(coursesRes.value.data) ? coursesRes.value.data : []);
    } else {
      anyFailed = true;
    }

    if (educationsRes.status === 'fulfilled') {
      setEducations(Array.isArray(educationsRes.value.data) ? educationsRes.value.data : []);
    }

    if (examsRes.status === 'fulfilled') {
      setExams(Array.isArray(examsRes.value.data) ? examsRes.value.data : []);
    } else {
      anyFailed = true;
    }

    if (batchesRes.status === 'fulfilled') {
      setBatches(Array.isArray(batchesRes.value.data) ? batchesRes.value.data : []);
    } else {
      anyFailed = true;
    }

    if (anyFailed) {
      setFetchError(true);
      toast.error('Some options failed to load — tap Retry');
    }

    setLoading(false);
  };

  // Fetch when tab mounts (each time user navigates to this tab)
  useEffect(() => {
    fetchDropdowns();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, []);

  // If parent hook already has data, merge it in (fast-path)
  useEffect(() => {
    if (Array.isArray(propCourses) && propCourses.length > 0) setCourses(propCourses);
  }, [propCourses]);
  useEffect(() => {
    if (Array.isArray(propEducations) && propEducations.length > 0) setEducations(propEducations);
  }, [propEducations]);
  useEffect(() => {
    if (Array.isArray(propExams) && propExams.length > 0) setExams(propExams);
  }, [propExams]);
  useEffect(() => {
    if (Array.isArray(propBatches) && propBatches.length > 0) setBatches(propBatches);
  }, [propBatches]);

  return (
    <Stack spacing={2.5}>
      {fetchError && (
        <Box sx={{ textAlign: 'center' }}>
          <Button
            size="small"
            startIcon={loading ? <CircularProgress size={14} /> : <Refresh />}
            onClick={fetchDropdowns}
            disabled={loading}
            variant="outlined"
            sx={{ color: '#ef4444', borderColor: '#ef4444' }}
          >
            Retry Loading Options
          </Button>
        </Box>
      )}

      <FormControl fullWidth size="small">
        <InputLabel>Education</InputLabel>
        <Select value={form.education} onChange={handleChange('education')} label="Education">
          <MenuItem value="">
            <em>{loading ? 'Loading…' : 'Select Education'}</em>
          </MenuItem>
          {loading && (
            <MenuItem disabled>
              <CircularProgress size={14} sx={{ mr: 1 }} />Loading…
            </MenuItem>
          )}
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
            const selected = courses.find(c => c.Course_uuid === e.target.value);
            const courseFee = Number(selected?.courseFees || 0);
            const discount = Number(form.discount || 0);
            const feePaid = Number(form.feePaid || 0);
            const total = courseFee - discount;
            const balance = total - feePaid;
            setForm(prev => ({ ...prev, course: e.target.value, fees: courseFee, total, balance }));
          }}
          label="Course"
        >
          <MenuItem value="">
            <em>
              {loading ? 'Loading…' : courses.length === 0 ? 'No courses found' : 'Select Course'}
            </em>
          </MenuItem>
          {loading && (
            <MenuItem disabled>
              <CircularProgress size={14} sx={{ mr: 1 }} />Loading…
            </MenuItem>
          )}
          {courses.map((c, i) => (
            <MenuItem key={c._id || c.Course_uuid || i} value={c.Course_uuid || c._id}>
              {c.name || c.title || 'Unnamed Course'}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth size="small">
        <InputLabel>Batch</InputLabel>
        <Select value={form.batchTime} onChange={handleChange('batchTime')} label="Batch">
          <MenuItem value="">
            <em>
              {loading ? 'Loading…' : batches.length === 0 ? 'No batches found' : 'Select Batch'}
            </em>
          </MenuItem>
          {loading && (
            <MenuItem disabled>
              <CircularProgress size={14} sx={{ mr: 1 }} />Loading…
            </MenuItem>
          )}
          {batches.map((b, i) => (
            <MenuItem key={b._id || b.Batch_uuid || i} value={b.name || b.timing || ''}>
              {b.name || b.timing || 'Unnamed Batch'}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth size="small">
        <InputLabel>Exam / Event</InputLabel>
        <Select value={form.examEvent} onChange={handleChange('examEvent')} label="Exam / Event">
          <MenuItem value="">
            <em>
              {loading ? 'Loading…' : exams.length === 0 ? 'No exams found' : 'Select Exam'}
            </em>
          </MenuItem>
          {loading && (
            <MenuItem disabled>
              <CircularProgress size={14} sx={{ mr: 1 }} />Loading…
            </MenuItem>
          )}
          {exams.map((e, i) => (
            <MenuItem key={e._id || i} value={e.exam || e._id}>
              {e.exam || 'Unnamed Exam'}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
};

export default AdmissionCourseBatchTab;
