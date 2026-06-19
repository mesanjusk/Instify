import { useSearchParams } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import apiClient from '../apiClient';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const AddAdmission = () => {
  const nextMonthDate = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().substring(0, 10);
  })();

  const initialForm = {
    branchCode: '',
    admissionDate: new Date().toISOString().substring(0, 10),
    emiDate: nextMonthDate,
    firstName: '',
    middleName: '',
    lastName: '',
    dob: '',
    gender: '',
    mobileSelf: '',
    mobileSelfWhatsapp: false,
    mobileParent: '',
    mobileParentWhatsapp: false,
    address: '',
    education: '',
    examEvent: '',
    course: '',
    batchTime: '',
    installment: '',
    fees: '',
    discount: '',
    total: '',
    feePaid: '',
    paidBy: '',
    balance: '',
    emi: ''
  };

  const [form, setForm] = useState(initialForm);
  const [tab, setTab] = useState(0);

  const [admissions, setAdmissions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showModal, setShowModal] = useState(true);
  const [courses, setCourses] = useState([]);
  const [educations, setEducations] = useState([]);
  const [exams, setExams] = useState([]);
  const [batches, setBatches] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [installmentPlan, setInstallmentPlan] = useState([]);

  const institute_uuid = localStorage.getItem("institute_uuid");
  const [searchParams] = useSearchParams();
  const lead_uuid = searchParams.get('lead_uuid');


  const fetchCourses = async () => {
    try {
      const res = await apiClient.get(`/api/courses`, { params: { institute_uuid } });
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load courses');
    }
  };
  useEffect(() => {
    const fetchLeadData = async () => {
      try {
        const res = await apiClient.get(`/api/leads/${lead_uuid}`);
        const lead = res.data;

        setForm(prev => ({
          ...prev,
          firstName: lead.studentData?.firstName || '',
          lastName: lead.studentData?.lastName || '',
          mobileSelf: lead.studentData?.mobileSelf || '',
          address: lead.studentData?.address || '',
          course: lead.studentData?.course || '',
        }));

        // Auto-fill fees if course exists
        const selectedCourse = courses.find(c => c.name === lead.studentData?.course);
        if (selectedCourse) {
          const courseFee = Number(selectedCourse.courseFees || 0);
          setForm(prev => ({
            ...prev,
            fees: courseFee,
            total: courseFee,
            balance: courseFee,
          }));
        }
      } catch (err) {
        console.error('Error fetching lead data:', err);
        toast.error('Failed to load lead data');
      }
    };

    if (lead_uuid && courses.length > 0) fetchLeadData();
  }, [lead_uuid, courses]);

  const fetchEducations = async () => {
    try {
      const res = await apiClient.get(`/api/education`);
      setEducations(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load education options');
    }
  };

  const fetchExams = async () => {
    try {
      const res = await apiClient.get(`/api/exams`, { params: { institute_uuid } });
      setExams(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load exam events');
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await apiClient.get(`/api/batches`, { params: { institute_uuid } });
      setBatches(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load batches');
    }
  };

  const fetchPaymentModes = async () => {
    try {
      const res = await apiClient.get(`/api/paymentmode`);
      setPaymentModes(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load payment modes');
    }
  };

  // Generate installment plan and EMI whenever related fields change
  useEffect(() => {
    const inst = parseInt(form.installment, 10);
    const fees = Number(form.fees || 0);
    const discount = Number(form.discount || 0);
    const feePaid = Number(form.feePaid || 0);
    const bal = fees - discount - feePaid;

    if (!inst || inst <= 0 || bal <= 0) {
      setInstallmentPlan([]);
      if (form.emi !== '') {
        setForm(prev => ({ ...prev, emi: '' }));
      }
      return;
    }

    const emi = parseFloat((bal / inst).toFixed(2));
    const plan = [];
    let remaining = bal;
    const start = form.emiDate ? new Date(form.emiDate) : (() => {
      const d = new Date(form.admissionDate);
      d.setMonth(d.getMonth() + 1);
      return d;
    })();

    for (let i = 0; i < inst; i++) {
      const due = new Date(start);
      due.setMonth(due.getMonth() + i);
      const amount = i + 1 === inst ? parseFloat(remaining.toFixed(2)) : emi;
      remaining = parseFloat((remaining - amount).toFixed(2));
      plan.push({
        installmentNo: i + 1,
        dueDate: due.toISOString().split('T')[0],
        amount,
      });
    }
    setInstallmentPlan(plan);
    if (form.emi !== emi) {
      setForm(prev => ({ ...prev, emi }));
    }
  }, [
    form.installment,
    form.fees,
    form.discount,
    form.feePaid,
    form.admissionDate,
    form.emiDate
  ]);

  const fetchAdmissions = async () => {
    if (!institute_uuid) return;
    try {
      const res = await apiClient.get(`/api/admissions`, {
        params: { institute_uuid }
      });
      const { data } = res.data;
      setAdmissions(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to fetch admissions');
    }
  };

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    let updatedForm = { ...form, [field]: value };

    if (field === 'admissionDate') {
      const d = new Date(value);
      d.setMonth(d.getMonth() + 1);
      const nextMonth = d.toISOString().substring(0, 10);
      const prevDefault = (() => {
        const pd = new Date(form.admissionDate);
        pd.setMonth(pd.getMonth() + 1);
        return pd.toISOString().substring(0, 10);
      })();
      if (form.emiDate === prevDefault || form.emiDate === '') {
        updatedForm.emiDate = nextMonth;
      }
    }

    const fees = Number(field === 'fees' ? value : form.fees || 0);
    const discount = Number(field === 'discount' ? value : form.discount || 0);
    const feePaid = Number(field === 'feePaid' ? value : form.feePaid || 0);

    if (['fees', 'discount', 'feePaid'].includes(field)) {
      const total = fees - discount;
      const balance = total - feePaid;

      updatedForm.fees = fees;
      updatedForm.discount = discount;
      updatedForm.feePaid = feePaid;
      updatedForm.total = total;
      updatedForm.balance = balance;
    }

    setForm(updatedForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("handleSubmit triggered");

    if (!institute_uuid) return toast.error("Missing institute ID");

    const mobileRegex = /^\d{10}$/;
    if (form.mobileSelf && !mobileRegex.test(form.mobileSelf)) return toast.error('Enter valid self mobile number');
    if (form.mobileParent && !mobileRegex.test(form.mobileParent)) return toast.error('Enter valid parent mobile number');

    const fees = Number(form.fees || 0);
    const discount = Number(form.discount || 0);
    const feePaid = Number(form.feePaid || 0);
    const total = fees - discount;
    const balance = total - feePaid;

    if (discount > fees) return toast.error('Discount cannot exceed fees');
    if (feePaid > total) return toast.error('Fee paid cannot exceed total');

    try {
      // Step 1: Create/Update student
      const studentPayload = {
        institute_uuid,
        firstName: form.firstName,
        middleName: form.middleName,
        lastName: form.lastName,
        dob: form.dob,
        gender: form.gender,
        mobileSelf: form.mobileSelf,
        mobileParent: form.mobileParent,
        address: form.address,
      };

      let studentResponse;
      if (editingId && form.student_uuid) {
        studentResponse = await apiClient.put(`/api/students/${form.student_uuid}`, studentPayload);
      } else {
        studentResponse = await apiClient.post(`/api/students`, studentPayload);
      }

      const studentData = studentResponse.data.data;
      const student_uuid = studentData.uuid || studentData._id;
      console.log("Student saved:", student_uuid);

      // Step 2: Create/Update admission
      const admissionPayload = {
        institute_uuid,
        student_uuid,
        admissionDate: form.admissionDate,
        course: form.course,
        batchTime: form.batchTime,
        examEvent: form.examEvent,
        installment: form.installment,
        fees,
        discount,
        total,
        feePaid,
        paidBy: form.paidBy,
        balance,
        createdBy: 'System',
      };

      let admissionResponse;
      if (editingId) {
        admissionResponse = await apiClient.put(`/api/admissions/${editingId}`, admissionPayload);
        toast.success('Admission updated successfully');
      } else {
        admissionResponse = await apiClient.post(`/api/admissions`, admissionPayload);
        toast.success('Admission added successfully');
      }

      const admissionData = admissionResponse.data.data;
      const admission_uuid = admissionData.uuid;
      console.log("Admission saved:", admission_uuid);

      // Step 3: Create/Update fees/emi record
      const feesPayload = {
        institute_uuid,
        student_uuid,
        admission_uuid,
        fees,
        discount,
        total,
        feePaid,
        balance,
        emi: Number(form.emi || 0),
        installment: form.installment,
        installmentPlan,
        paidBy: form.paidBy,
      };

      const feesResponse = await apiClient.post(`/api/fees`, feesPayload);
      console.log("Fees saved:", feesResponse.data.data);

      // Step 3: Create/Update lead record
      const leadPayload = {
        institute_uuid,
        student_uuid,
        admission_uuid,
        enquiryDate: form.admissionDate,
        course: form.course,
        referredBy: "Self",
        createdBy: 'System',
        followups: [{
          date: new Date().toISOString().substring(0, 10),
          status: 'open',
          remark: '',
          createdBy: 'System',
        }],
      };

      const leadResponse = await apiClient.post(`/api/leads`, leadPayload);
      console.log("Lead saved:", leadResponse.data.data);

      // Step 3: Create/Update account record
      const accountPayload = {
        institute_uuid,
        Account_name: `${form.firstName} ${form.lastName}`.trim(),
        Account_group: 'ACCOUNT',
        Mobile_number: form.mobileSelf
      };

      const accountResponse = await apiClient.post(`/api/account/addAccount`, accountPayload);
      console.log("Account saved:", accountResponse.data.data);

      toast.success('All records saved successfully');

      // Reset state
      setForm(initialForm);
      setEditingId(null);
      setTab(0);
      setInstallmentPlan([]);

      fetchAdmissions();
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      if (err.response) {
        console.error("Backend Response:", err.response.data);
        toast.error(`Server Error: ${err.response.data.message || err.response.statusText}`);
      } else {
        toast.error('Error saving admission');
      }
    }
  };



  const handleEdit = (data) => {
    const emiDate = data.emiDate || (() => {
      const d = new Date(data.admissionDate);
      d.setMonth(d.getMonth() + 1);
      return d.toISOString().substring(0, 10);
    })();
    setForm({ ...data, emiDate });
    setInstallmentPlan(data.installmentPlan || []);
    setEditingId(data._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this admission?')) return;
    try {
      await apiClient.delete(`/api/admission/${id}`);
      toast.success('Deleted');
      fetchAdmissions();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const exportPDF = () => {
    if (filteredAdmissions.length === 0) return toast.error("No data to export");
    const doc = new jsPDF();
    autoTable(doc, {
      head: [[
        'Name',
        'Course',
        'Mobile',
        'Fees',
        'Discount',
        'Total',
        'Paid',
        'Balance',
        'Admission Date'
      ]],
      body: filteredAdmissions.map((e) => [
        `${e.firstName} ${e.lastName}`,
        e.course,
        e.mobileSelf,
        e.fees,
        e.discount,
        e.total,
        e.feePaid,
        e.balance,
        e.admissionDate
      ]),
    });
    doc.save('admissions.pdf');
  };

  const exportExcel = () => {
    if (filteredAdmissions.length === 0) return toast.error("No data to export");
    const worksheet = XLSX.utils.json_to_sheet(
      filteredAdmissions.map((e) => ({
        Name: `${e.firstName} ${e.lastName}`,
        Course: e.course,
        Mobile: e.mobileSelf,
        Fees: e.fees,
        Discount: e.discount,
        Total: e.total,
        Paid: e.feePaid,
        Balance: e.balance,
        AdmissionDate: e.admissionDate,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Admissions');
    XLSX.writeFile(workbook, 'admissions.xlsx');
  };

  useEffect(() => {
    fetchCourses();
    fetchEducations();
    fetchExams();
    fetchBatches();
    fetchPaymentModes();
    fetchAdmissions();
  }, []);

  // Don't render anything if the modal should be hidden
  if (!showModal) return null;

  const filteredAdmissions = admissions.filter(e => {
    const matchSearch = e.firstName?.toLowerCase().includes(search.toLowerCase()) || e.mobileSelf?.includes(search);
    const admissionDate = new Date(e.admissionDate);
    const inDateRange = (!startDate || admissionDate >= new Date(startDate)) && (!endDate || admissionDate <= new Date(endDate));
    return matchSearch && inDateRange;
  });

  return (
    <Dialog
      open={showModal}
      onClose={() => setShowModal(false)}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      PaperProps={{ sx: { mx: { xs: 1, sm: 2 }, maxHeight: '95vh' } }}
    >
      <DialogTitle sx={{ p: 2, pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700} color="primary">
            {editingId ? 'Edit Admission' : 'Add New Admission'}
          </Typography>
          <IconButton onClick={() => setShowModal(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider', px: 0 }}
      >
        {['Student Info', 'Course & Batch', 'Payment & EMI'].map((label, idx) => (
          <Tab key={idx} label={label} sx={{ fontSize: '0.8rem', minHeight: 42 }} />
        ))}
      </Tabs>

      <DialogContent sx={{ p: 2 }}>
        <Box component="form" id="admission-main-form" onSubmit={handleSubmit}>
          <Stack spacing={2} mt={1}>

            {/* TAB 1: Student Info */}
            {tab === 0 && (
              <>
                <TextField
                  label="First Name"
                  size="small"
                  value={form.firstName}
                  onChange={handleChange('firstName')}
                  required
                  fullWidth
                />
                <TextField
                  label="Middle Name"
                  size="small"
                  value={form.middleName}
                  onChange={handleChange('middleName')}
                  fullWidth
                />
                <TextField
                  label="Last Name"
                  size="small"
                  value={form.lastName}
                  onChange={handleChange('lastName')}
                  fullWidth
                />
                <TextField
                  label="Date of Birth"
                  type="date"
                  size="small"
                  value={form.dob?.substring(0, 10) || ''}
                  onChange={handleChange('dob')}
                  InputLabelProps={{ shrink: true }}
                  required
                  fullWidth
                />
                <FormControl>
                  <Typography variant="body2" mb={0.5}>Gender</Typography>
                  <RadioGroup row value={form.gender} onChange={handleChange('gender')}>
                    <FormControlLabel value="Male" control={<Radio size="small" />} label="Male" />
                    <FormControlLabel value="Female" control={<Radio size="small" />} label="Female" />
                  </RadioGroup>
                </FormControl>
                <TextField
                  label="Mobile (Self)"
                  size="small"
                  value={form.mobileSelf}
                  onChange={handleChange('mobileSelf')}
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]{10}', maxLength: 10 }}
                  fullWidth
                />
                <TextField
                  label="Mobile (Parent)"
                  size="small"
                  value={form.mobileParent}
                  onChange={handleChange('mobileParent')}
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]{10}', maxLength: 10 }}
                  fullWidth
                />
                <TextField
                  label="Address"
                  size="small"
                  value={form.address}
                  onChange={handleChange('address')}
                  fullWidth
                />
              </>
            )}

            {/* TAB 2: Course & Batch */}
            {tab === 1 && (
              <>
                <FormControl size="small" fullWidth>
                  <InputLabel>Education</InputLabel>
                  <Select value={form.education} label="Education" onChange={handleChange('education')}>
                    <MenuItem value="">-- Select Education --</MenuItem>
                    {educations.map(e => (
                      <MenuItem key={e._id} value={e.education}>{e.education}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel>Course</InputLabel>
                  <Select
                    value={form.course}
                    label="Course"
                    onChange={(e) => {
                      const selectedCourse = courses.find(c => c.uuid === e.target.value);
                      const courseFee = Number(selectedCourse?.courseFees || 0);
                      const discount = Number(form.discount || 0);
                      const feePaid = Number(form.feePaid || 0);
                      const total = courseFee - discount;
                      const balance = total - feePaid;
                      setForm(prev => ({
                        ...prev,
                        course: e.target.value,
                        fees: courseFee,
                        total,
                        balance
                      }));
                    }}
                  >
                    <MenuItem value="">-- Select Course --</MenuItem>
                    {courses.map(c => (
                      <MenuItem key={c._id} value={c.uuid}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel>Batch</InputLabel>
                  <Select value={form.batchTime} label="Batch" onChange={handleChange('batchTime')}>
                    <MenuItem value="">-- Select Batch --</MenuItem>
                    {batches.map(b => (
                      <MenuItem key={b._id} value={b.time || b.batchTime || b.name || ''}>
                        {b.time || b.batchTime || b.name || 'Unnamed Batch'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel>Exam</InputLabel>
                  <Select value={form.examEvent} label="Exam" onChange={handleChange('examEvent')}>
                    <MenuItem value="">-- Select Exam --</MenuItem>
                    {exams.map(e => (
                      <MenuItem key={e._id} value={e.exam}>{e.exam}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}

            {/* TAB 3: Payment & EMI */}
            {tab === 2 && (
              <>
                <TextField
                  label="Fees"
                  type="number"
                  size="small"
                  value={form.fees}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                <TextField
                  label="Discount"
                  type="number"
                  size="small"
                  value={form.discount}
                  onChange={handleChange('discount')}
                  fullWidth
                />
                <TextField
                  label="Total"
                  type="number"
                  size="small"
                  value={form.total}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                <TextField
                  label="Fee Paid"
                  type="number"
                  size="small"
                  value={form.feePaid}
                  onChange={handleChange('feePaid')}
                  fullWidth
                />
                <TextField
                  label="Balance"
                  type="number"
                  size="small"
                  value={form.balance}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                <FormControl size="small" fullWidth>
                  <InputLabel>Payment Mode</InputLabel>
                  <Select value={form.paidBy} label="Payment Mode" onChange={handleChange('paidBy')}>
                    <MenuItem value="">-- Select Payment Mode --</MenuItem>
                    {paymentModes.map(p => (
                      <MenuItem key={p._id} value={p.mode}>{p.mode}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Installments"
                  type="number"
                  size="small"
                  value={form.installment}
                  onChange={handleChange('installment')}
                  inputProps={{ min: 1 }}
                  fullWidth
                />
                <TextField
                  label="EMI Start Date"
                  type="date"
                  size="small"
                  value={form.emiDate}
                  onChange={handleChange('emiDate')}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label="EMI"
                  type="number"
                  size="small"
                  value={form.emi}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                {installmentPlan.length > 0 && (
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: '40vh', overflow: 'auto' }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell align="center" sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>#</TableCell>
                          <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Due Date</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {installmentPlan.map(p => (
                          <TableRow key={p.installmentNo}>
                            <TableCell align="center">{p.installmentNo}</TableCell>
                            <TableCell>{new Date(p.dueDate).toLocaleDateString()}</TableCell>
                            <TableCell align="right">{p.amount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            )}
          </Stack>
        </Box>
      </DialogContent>

      <Divider />
      <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ p: 2 }}>
        <Button onClick={() => setShowModal(false)} color="inherit" variant="outlined">
          Cancel
        </Button>
        <Button
          type="submit"
          form="admission-main-form"
          variant="contained"
          sx={{ bgcolor: '#1a7a4a', '&:hover': { bgcolor: '#25a066' } }}
        >
          {editingId ? 'Update' : 'Submit'}
        </Button>
      </Stack>
    </Dialog>
  );

};

export default AddAdmission;
