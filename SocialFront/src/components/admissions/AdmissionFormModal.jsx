import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import useAdmissionForm from './useAdmissionForm';
import AdmissionStudentInfoTab from './AdmissionStudentInfoTab';
import AdmissionCourseBatchTab from './AdmissionCourseBatchTab';
import AdmissionPaymentInstallmentTab from './AdmissionPaymentInstallmentTab';
import toast from 'react-hot-toast';
import apiClient from '../../apiClient';
import {
  Box, Card, CardContent, Stack, Typography, Tabs, Tab,
  Button, IconButton, Divider,
} from '@mui/material';
import { Close, Person, School, Payment } from '@mui/icons-material';

const AdmissionFormModal = ({ onClose, onSuccess, editingData, leadData, studentData }) => {
  const {
    form, setForm, tab, setTab, handleChange, handleSubmit,
    installmentPlan, courses, educations, exams, batches,
    paymentModes, loadingDropdowns, editingId, handleEdit, themeColor,
  } = useAdmissionForm({});

  useEffect(() => {
    if (!leadData || !studentData) return;
    setForm((prev) => ({
      ...prev,
      firstName: studentData.firstName || '',
      middleName: studentData.middleName || '',
      lastName: studentData.lastName || '',
      dob: studentData.dob ? new Date(studentData.dob).toISOString().split('T')[0] : '',
      gender: studentData.gender || '',
      mobileSelf: studentData.mobileSelf || '',
      mobileParent: studentData.mobileParent || '',
      address: studentData.address || '',
      course: leadData.course || '',
      referredBy: leadData.referredBy || '',
      student_uuid: leadData.student_uuid || '',
    }));
  }, [leadData, studentData]);

  useEffect(() => {
    if (editingData) handleEdit(editingData);
  }, [editingData]);

  const handleNext = async () => {
    if (tab === 0) {
      try {
        const res = await apiClient.get('/api/students/check-mobile', {
          params: { mobileSelf: form.mobileSelf },
        });
        if (res.data.exists && !form.student_uuid) {
          toast.error('Mobile number already exists in student records');
          return;
        }
      } catch {
        toast.error('Failed to validate mobile number');
        return;
      }
    }
    setTab(tab + 1);
  };

  const handleBack = () => setTab(tab - 1);

  return (
    <Box
      sx={{
        position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        p: 2, zIndex: 1400, overflowY: 'auto',
      }}
    >
      <Toaster />
      <Card sx={{ width: '100%', maxWidth: 560, borderRadius: 3, boxShadow: 4, maxHeight: '90vh', overflowY: 'auto' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: themeColor }}>
                {editingId ? 'Edit Admission' : 'Add New Admission'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {editingId ? 'Update student admission details' : 'Register a new student admission'}
              </Typography>
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
              '& .Mui-selected': { color: themeColor, fontWeight: 700 },
              '& .MuiTabs-indicator': { backgroundColor: themeColor },
            }}
          >
            <Tab label="Student Info" icon={<Person fontSize="small" />} iconPosition="start" />
            <Tab label="Course & Batch" icon={<School fontSize="small" />} iconPosition="start" />
            <Tab label="Payment & EMI" icon={<Payment fontSize="small" />} iconPosition="start" />
          </Tabs>

          {/* Tab Content */}
          <form onSubmit={e => handleSubmit(e, onSuccess)}>
            <Stack spacing={2.5}>
              {tab === 0 && (
                <AdmissionStudentInfoTab form={form} handleChange={handleChange} />
              )}
              {tab === 1 && (
                <AdmissionCourseBatchTab
                  form={form}
                  handleChange={handleChange}
                  courses={courses}
                  educations={educations}
                  exams={exams}
                  batches={batches}
                  setForm={setForm}
                  loading={loadingDropdowns}
                />
              )}
              {tab === 2 && (
                <AdmissionPaymentInstallmentTab
                  form={form}
                  handleChange={handleChange}
                  installmentPlan={installmentPlan}
                  paymentModes={paymentModes}
                />
              )}

              {/* Navigation Buttons */}
              <Stack direction="row" justifyContent="flex-end" spacing={1.5} pt={1}>
                {tab > 0 && (
                  <Button variant="outlined" color="inherit" onClick={handleBack}>
                    Back
                  </Button>
                )}
                {tab < 2 ? (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ bgcolor: themeColor, '&:hover': { filter: 'brightness(0.9)' }, fontWeight: 700 }}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{ bgcolor: themeColor, '&:hover': { filter: 'brightness(0.9)' }, fontWeight: 700 }}
                  >
                    {editingId ? 'Update' : 'Submit'}
                  </Button>
                )}
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdmissionFormModal;
