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
  const [courses, setCourses] = useState([
    { _id: 'test-c1', Course_uuid: 'test-c1', name: '⚡ TEST Course A', courseFees: 5000 },
    { _id: 'test-c2', Course_uuid: 'test-c2', name: '⚡ TEST Course B', courseFees: 8000 },
  ]);
  const [educations, setEducations] = useState([
    { _id: 'test-e1', education: '⚡ TEST HSC' },
    { _id: 'test-e2', education: '⚡ TEST Graduation' },
  ]);
  const [exams, setExams] = useState([
    { _id: 'test-x1', exam: '⚡ TEST Exam Jan' },
  ]);
  const [batches, setBatches] = useState([
    { _id: 'test-b1', name: '⚡ TEST Morning 7am' },
    { _id: 'test-b2', name: '⚡ TEST Evening 5pm' },
  ]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const abortRef = useRef(null);

  const fetchDropdowns = async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setFetchError(false);

    console.log('[CourseBatchTab] institute_uuid =', institute_uuid);

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
      const data = coursesRes.value.data;
      console.log('[CourseBatchTab] courses:', data);
      setCourses(Array.isArray(data) ? data : []);
    } else {
      console.error('[CourseBatchTab] courses FAILED:', coursesRes.reason?.response?.data || coursesRes.reason?.message);
      anyFailed = true;
    }

    if (educationsRes.status === 'fulfilled') {
      const data = educationsRes.value.data;
      console.log('[CourseBatchTab] educations:', data);
      setEducations(Array.isArray(data) ? data : []);
    } else {
      console.error('[CourseBatchTab] educations FAILED:', educationsRes.reason?.response?.data || educationsRes.reason?.message);
    }

    if (examsRes.status === 'fulfilled') {
      const data = examsRes.value.data;
      console.log('[CourseBatchTab] exams:', data);
      setExams(Array.isArray(data) ? data : []);
    } else {
      console.error('[CourseBatchTab] exams FAILED:', examsRes.reason?.response?.data || examsRes.reason?.message);
      anyFailed = true;
    }

    if (batchesRes.status === 'fulfilled') {
      const data = batchesRes.value.data;
      console.log('[CourseBatchTab] batches:', data);
      setBatches(Array.isArray(data) ? data : []);
    } else {
      console.error('[CourseBatchTab] batches FAILED:', batchesRes.reason?.response?.data || batchesRes.reason?.message);
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
      {/* DEBUG BANNER — remove after confirming deploy */}
      <Box sx={{ bgcolor: '#ef4444', color: '#fff', p: 1, borderRadius: 1, fontSize: 11, textAlign: 'center' }}>
        🔴 DEBUG v4 | uuid: {institute_uuid ? institute_uuid.slice(0,8)+'…' : 'MISSING'} | courses:{courses.length} batches:{batches.length} exams:{exams.length}
        {courses.length > 0 && (
          <Box sx={{ mt: 0.5 }}>
            {courses.map((c, i) => (
              <div key={i}>C{i+1}: name="{c.name}" uuid="{c.Course_uuid?.slice(0,6)}" _id="{String(c._id)?.slice(0,6)}"</div>
            ))}
          </Box>
        )}
        {batches.length > 0 && (
          <Box sx={{ mt: 0.5 }}>
            {batches.map((b, i) => (
              <div key={i}>B{i+1}: name="{b.name}" timing="{b.timing}"</div>
            ))}
          </Box>
        )}
      </Box>
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
          {courses.map(c => (
            <MenuItem key={c._id} value={c.Course_uuid}>{c.name}</MenuItem>
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
          {batches.map(b => (
            <MenuItem key={b._id} value={b.name || b.timing || ''}>
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
          {exams.map(e => (
            <MenuItem key={e._id} value={e.exam}>{e.exam}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
};

export default AdmissionCourseBatchTab;
