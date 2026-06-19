import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import BASE_URL from '../../config';
import {
  Box, Card, CardContent, Stack, Typography, TextField, Button,
  IconButton, Divider, FormControl, InputLabel, Select, MenuItem,
  Tabs, Tab, CircularProgress,
} from '@mui/material';
import { Close, PersonAdd, TrendingUp } from '@mui/icons-material';

const LeadFormModal = ({ onClose, onSuccess, institute_uuid }) => {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [tab, setTab] = useState(0);

  const [studentData, setStudentData] = useState({
    firstName: '',
    lastName: '',
    mobileSelf: '',
    course: '',
  });

  const todayStr = new Date().toISOString().substring(0, 10);

  const [leadData, setLeadData] = useState({
    followupDate: '',
    referredBy: '',
    followups: [{
      date: todayStr,
      status: 'follow-up',
      remark: '',
      createdBy: JSON.parse(localStorage.getItem('user'))?.name || 'System',
    }],
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/courses`);
        setCourses(Array.isArray(res.data) ? res.data : []);
      } catch {
        toast.error('Failed to load courses');
      }
    };
    fetchCourses();
  }, []);

  const handleFollowupDateChange = (dateVal) => {
    setLeadData((prev) => ({
      ...prev,
      followupDate: dateVal,
      followups: [
        { ...prev.followups[0], date: dateVal },
        ...prev.followups.slice(1),
      ],
    }));
  };

  const handleFollowupRemarkChange = (remarkVal) => {
    setLeadData((prev) => ({
      ...prev,
      followups: [
        { ...prev.followups[0], remark: remarkVal },
        ...prev.followups.slice(1),
      ],
    }));
  };

  const handleNext = () => {
    if (!studentData.firstName.trim()) {
      toast.error('Please enter first name');
      return;
    }
    if (!/^\d{10}$/.test(studentData.mobileSelf)) {
      toast.error('Mobile number must be exactly 10 digits');
      return;
    }
    setTab(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(studentData.mobileSelf)) {
      toast.error('Mobile number must be exactly 10 digits');
      return;
    }
    if (!studentData.course) {
      toast.error('Please select a course');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/leads`, {
        institute_uuid,
        course: studentData.course,
        studentData,
        referredBy: leadData.referredBy,
        followupDate: leadData.followupDate,
        followups: leadData.followups,
      });
      toast.success('Lead created successfully');
      onSuccess();
      onClose();
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('Mobile number already exists for this institute.');
      } else {
        toast.error('Error creating lead');
      }
    } finally {
      setLoading(false);
    }
  };

  const mobileInvalid = studentData.mobileSelf.length > 0 && !/^\d{10}$/.test(studentData.mobileSelf);

  return (
    <Box
      sx={{
        position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        p: 2, zIndex: 1400, overflowY: 'auto',
      }}
    >
      <Toaster />
      <Card sx={{ width: '100%', maxWidth: 480, borderRadius: 3, boxShadow: 4 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Add New Lead</Typography>
              <Typography variant="body2" color="text.secondary">Capture a new student enquiry</Typography>
            </Box>
            <IconButton onClick={onClose} size="small" aria-label="Close">
              <Close />
            </IconButton>
          </Stack>
          <Divider />

          {/* Tabs */}
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="fullWidth"
            sx={{
              mb: 2.5,
              '& .MuiTab-root': { fontSize: '0.78rem', minHeight: 48, py: 1 },
              '& .Mui-selected': { color: '#10b981', fontWeight: 700 },
              '& .MuiTabs-indicator': { backgroundColor: '#10b981' },
            }}
          >
            <Tab label="Student Info" icon={<PersonAdd fontSize="small" />} iconPosition="start" />
            <Tab label="Lead Details" icon={<TrendingUp fontSize="small" />} iconPosition="start" />
          </Tabs>

          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              {/* Tab 0: Student Info */}
              {tab === 0 && (
                <>
                  <Stack direction="row" spacing={1.5}>
                    <TextField
                      label="First Name"
                      value={studentData.firstName}
                      onChange={(e) => setStudentData({ ...studentData, firstName: e.target.value })}
                      size="small"
                      fullWidth
                      required
                    />
                    <TextField
                      label="Last Name"
                      value={studentData.lastName}
                      onChange={(e) => setStudentData({ ...studentData, lastName: e.target.value })}
                      size="small"
                      fullWidth
                    />
                  </Stack>

                  <TextField
                    label="Mobile (10 digits)"
                    value={studentData.mobileSelf}
                    onChange={(e) => setStudentData({ ...studentData, mobileSelf: e.target.value })}
                    inputProps={{ inputMode: 'numeric', maxLength: 10 }}
                    size="small"
                    fullWidth
                    required
                    error={mobileInvalid}
                    helperText={mobileInvalid ? 'Must be exactly 10 digits' : ''}
                  />

                  <Stack direction="row" justifyContent="flex-end">
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, fontWeight: 700 }}
                    >
                      Next
                    </Button>
                  </Stack>
                </>
              )}

              {/* Tab 1: Lead Details */}
              {tab === 1 && (
                <>
                  <FormControl fullWidth size="small" required>
                    <InputLabel>Course</InputLabel>
                    <Select
                      value={studentData.course}
                      onChange={(e) => setStudentData({ ...studentData, course: e.target.value })}
                      label="Course"
                    >
                      <MenuItem value=""><em>Select Course</em></MenuItem>
                      {courses.map((course) => (
                        <MenuItem key={course._id} value={course.Course_uuid}>{course.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label="Follow Up Date"
                    type="date"
                    value={leadData.followupDate}
                    onChange={e => handleFollowupDateChange(e.target.value)}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    required
                  />

                  <TextField
                    label="Referred By"
                    value={leadData.referredBy}
                    onChange={(e) => setLeadData({ ...leadData, referredBy: e.target.value })}
                    placeholder="Enter referred by"
                    size="small"
                    fullWidth
                  />

                  <TextField
                    label="Remark"
                    value={leadData.followups[0].remark}
                    onChange={(e) => handleFollowupRemarkChange(e.target.value)}
                    placeholder="Enter remark"
                    size="small"
                    fullWidth
                    multiline
                    rows={2}
                  />

                  <Stack direction="row" justifyContent="space-between" spacing={1.5}>
                    <Button variant="outlined" color="inherit" onClick={() => setTab(0)}>
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                      sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, fontWeight: 700 }}
                    >
                      {loading ? 'Saving...' : 'Save Lead'}
                    </Button>
                  </Stack>
                </>
              )}
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LeadFormModal;
