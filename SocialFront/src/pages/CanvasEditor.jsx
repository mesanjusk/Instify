/**
 * Document Maker
 * Focused tool for school documents: ID cards, certificates, result sheets, admit cards.
 * Uses Fabric.js with predefined templates — auto-fills from student data.
 * Supports batch generation (all students in a batch → ZIP).
 */

import { useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, CardMedia, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, Divider, IconButton, MenuItem, Select,
  Stack, Tab, Tabs, TextField, Tooltip, Typography,
} from '@mui/material';
import BadgeIcon from '@mui/icons-material/Badge';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import DownloadIcon from '@mui/icons-material/Download';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import apiClient from '../apiClient';

let fabricModule = null;
async function getFabric() {
  if (!fabricModule) fabricModule = await import('fabric');
  return fabricModule;
}

const DOC_TYPES = [
  { key: 'id_card', label: 'Student ID Card', icon: <BadgeIcon />, color: '#4f46e5', desc: 'Portrait ID card with photo, name, roll no, course, batch' },
  { key: 'certificate', label: 'Certificate', icon: <WorkspacePremiumIcon />, color: '#10b981', desc: 'A4 landscape completion certificate with institute branding' },
  { key: 'result', label: 'Result / Mark Sheet', icon: <AssignmentIcon />, color: '#f59e0b', desc: 'Auto-filled mark sheet from exam data' },
  { key: 'admit_card', label: 'Exam Admit Card', icon: <CreditCardIcon />, color: '#ef4444', desc: 'Admit card with photo, exam details, and roll number' },
];

// Build a Fabric.js canvas for a given document type and student data
async function buildCanvas(canvasEl, docType, data, instituteName) {
  const { fabric } = await getFabric();
  const inst = instituteName || 'Institute Name';

  const dims = {
    id_card: { w: 340, h: 215 },
    certificate: { w: 794, h: 562 },
    result: { w: 595, h: 842 },
    admit_card: { w: 340, h: 215 },
  };

  const { w, h } = dims[docType] || { w: 400, h: 300 };

  const canvas = new fabric.Canvas(canvasEl, { width: w, height: h, selection: true });

  const name = data.name || 'Student Name';
  const rollNo = data.rollNo || 'ROLL-001';
  const course = data.course || 'Course Name';
  const batch = data.batch || 'Batch Name';
  const dob = data.dob || '';
  const examName = data.examName || 'Annual Examination';
  const examDate = data.examDate || '—';
  const venue = data.venue || '—';

  if (docType === 'id_card') {
    // Blue header
    canvas.add(new fabric.Rect({ left: 0, top: 0, width: w, height: 55, fill: '#4f46e5', selectable: false }));
    canvas.add(new fabric.Text(inst.toUpperCase(), { left: w / 2, top: 14, fontSize: 13, fill: '#fff', fontWeight: 'bold', fontFamily: 'Arial', originX: 'center', selectable: false }));
    canvas.add(new fabric.Text('STUDENT IDENTITY CARD', { left: w / 2, top: 32, fontSize: 10, fill: '#c7d2fe', fontFamily: 'Arial', originX: 'center', selectable: false }));

    // Photo placeholder
    canvas.add(new fabric.Rect({ left: 15, top: 65, width: 80, height: 100, fill: '#e0e7ff', stroke: '#a5b4fc', strokeWidth: 1, rx: 4, ry: 4 }));
    canvas.add(new fabric.Text('PHOTO', { left: 55, top: 105, fontSize: 10, fill: '#818cf8', fontFamily: 'Arial', originX: 'center' }));

    // Details
    const fields = [
      { label: 'Name', value: name },
      { label: 'Roll No', value: rollNo },
      { label: 'Course', value: course },
      { label: 'Batch', value: batch },
      ...(dob ? [{ label: 'DOB', value: dob }] : []),
    ];
    fields.forEach(({ label, value }, i) => {
      canvas.add(new fabric.Text(`${label}:`, { left: 110, top: 68 + i * 22, fontSize: 11, fill: '#475569', fontFamily: 'Arial' }));
      canvas.add(new fabric.Text(String(value), { left: 175, top: 68 + i * 22, fontSize: 11, fill: '#1e293b', fontWeight: 'bold', fontFamily: 'Arial' }));
    });

    // Footer
    canvas.add(new fabric.Rect({ left: 0, top: h - 28, width: w, height: 28, fill: '#1e293b', selectable: false }));
    canvas.add(new fabric.Text('Valid for the current academic year', { left: w / 2, top: h - 18, fontSize: 9, fill: '#94a3b8', fontFamily: 'Arial', originX: 'center' }));
  }

  if (docType === 'certificate') {
    canvas.backgroundColor = '#fffbf0';
    // Outer border
    canvas.add(new fabric.Rect({ left: 12, top: 12, width: w - 24, height: h - 24, fill: 'transparent', stroke: '#92400e', strokeWidth: 3, rx: 6, ry: 6, selectable: false }));
    canvas.add(new fabric.Rect({ left: 22, top: 22, width: w - 44, height: h - 44, fill: 'transparent', stroke: '#d97706', strokeWidth: 1, selectable: false }));

    canvas.add(new fabric.Text(inst.toUpperCase(), { left: w / 2, top: 55, fontSize: 18, fill: '#92400e', fontWeight: 'bold', fontFamily: 'Arial', originX: 'center' }));
    canvas.add(new fabric.Text('CERTIFICATE OF COMPLETION', { left: w / 2, top: 95, fontSize: 26, fill: '#44403c', fontWeight: 'bold', fontFamily: 'Arial', originX: 'center' }));
    canvas.add(new fabric.Text('This is to certify that', { left: w / 2, top: 165, fontSize: 16, fill: '#57534e', fontFamily: 'Arial', originX: 'center' }));
    canvas.add(new fabric.Text(name, { left: w / 2, top: 205, fontSize: 30, fill: '#92400e', fontStyle: 'italic', fontFamily: 'Arial', originX: 'center' }));
    canvas.add(new fabric.Line([w / 2 - 150, 250, w / 2 + 150, 250], { stroke: '#d97706', strokeWidth: 1.5, selectable: false }));
    canvas.add(new fabric.Text('has successfully completed the course', { left: w / 2, top: 270, fontSize: 16, fill: '#57534e', fontFamily: 'Arial', originX: 'center' }));
    canvas.add(new fabric.Text(course, { left: w / 2, top: 310, fontSize: 22, fill: '#1d4ed8', fontWeight: 'bold', fontFamily: 'Arial', originX: 'center' }));

    // Signature lines
    canvas.add(new fabric.Line([100, h - 90, 260, h - 90], { stroke: '#57534e', strokeWidth: 1, selectable: false }));
    canvas.add(new fabric.Line([w - 260, h - 90, w - 100, h - 90], { stroke: '#57534e', strokeWidth: 1, selectable: false }));
    canvas.add(new fabric.Text('Student Signature', { left: 180, top: h - 80, fontSize: 10, fill: '#78716c', fontFamily: 'Arial', originX: 'center' }));
    canvas.add(new fabric.Text('Director / Principal', { left: w - 180, top: h - 80, fontSize: 10, fill: '#78716c', fontFamily: 'Arial', originX: 'center' }));
  }

  if (docType === 'result') {
    canvas.backgroundColor = '#ffffff';
    canvas.add(new fabric.Rect({ left: 0, top: 0, width: w, height: 70, fill: '#1e293b', selectable: false }));
    canvas.add(new fabric.Text(inst.toUpperCase(), { left: w / 2, top: 16, fontSize: 16, fill: '#fff', fontWeight: 'bold', fontFamily: 'Arial', originX: 'center' }));
    canvas.add(new fabric.Text('RESULT / MARK SHEET', { left: w / 2, top: 42, fontSize: 13, fill: '#94a3b8', fontFamily: 'Arial', originX: 'center' }));

    canvas.add(new fabric.Text(`Student: ${name}`, { left: 30, top: 90, fontSize: 13, fill: '#1e293b', fontWeight: 'bold', fontFamily: 'Arial' }));
    canvas.add(new fabric.Text(`Roll No: ${rollNo}`, { left: 30, top: 112, fontSize: 12, fill: '#475569', fontFamily: 'Arial' }));
    canvas.add(new fabric.Text(`Course: ${course}  |  Batch: ${batch}`, { left: 30, top: 134, fontSize: 12, fill: '#475569', fontFamily: 'Arial' }));
    canvas.add(new fabric.Text(`Exam: ${examName}`, { left: 30, top: 156, fontSize: 12, fill: '#475569', fontFamily: 'Arial' }));

    // Table header
    canvas.add(new fabric.Rect({ left: 20, top: 185, width: w - 40, height: 28, fill: '#f1f5f9', selectable: false }));
    canvas.add(new fabric.Text('Subject', { left: 30, top: 194, fontSize: 11, fill: '#64748b', fontWeight: 'bold', fontFamily: 'Arial' }));
    canvas.add(new fabric.Text('Max Marks', { left: 300, top: 194, fontSize: 11, fill: '#64748b', fontWeight: 'bold', fontFamily: 'Arial' }));
    canvas.add(new fabric.Text('Obtained', { left: 440, top: 194, fontSize: 11, fill: '#64748b', fontWeight: 'bold', fontFamily: 'Arial' }));

    const subjects = data.subjects || [{ name: 'Subject 1', max: 100, obtained: '—' }, { name: 'Subject 2', max: 100, obtained: '—' }, { name: 'Subject 3', max: 100, obtained: '—' }];
    subjects.slice(0, 8).forEach(({ name: sName, max, obtained }, i) => {
      const y = 225 + i * 26;
      if (i % 2 === 1) canvas.add(new fabric.Rect({ left: 20, top: y - 6, width: w - 40, height: 26, fill: '#f8fafc', selectable: false }));
      canvas.add(new fabric.Text(String(sName), { left: 30, top: y, fontSize: 11, fill: '#1e293b', fontFamily: 'Arial' }));
      canvas.add(new fabric.Text(String(max), { left: 330, top: y, fontSize: 11, fill: '#475569', fontFamily: 'Arial' }));
      canvas.add(new fabric.Text(String(obtained), { left: 460, top: y, fontSize: 11, fill: '#1e293b', fontWeight: 'bold', fontFamily: 'Arial' }));
    });
  }

  if (docType === 'admit_card') {
    canvas.add(new fabric.Rect({ left: 0, top: 0, width: w, height: 50, fill: '#ef4444', selectable: false }));
    canvas.add(new fabric.Text(inst.toUpperCase(), { left: w / 2, top: 10, fontSize: 12, fill: '#fff', fontWeight: 'bold', fontFamily: 'Arial', originX: 'center' }));
    canvas.add(new fabric.Text('ADMIT CARD', { left: w / 2, top: 30, fontSize: 11, fill: '#fecaca', fontFamily: 'Arial', originX: 'center' }));

    // Photo
    canvas.add(new fabric.Rect({ left: 15, top: 62, width: 75, height: 95, fill: '#fee2e2', stroke: '#fca5a5', strokeWidth: 1, rx: 4, ry: 4 }));
    canvas.add(new fabric.Text('PHOTO', { left: 52, top: 100, fontSize: 10, fill: '#ef4444', fontFamily: 'Arial', originX: 'center' }));

    const fields = [
      { label: 'Name', value: name },
      { label: 'Roll No', value: rollNo },
      { label: 'Course', value: course },
      { label: 'Exam', value: examName },
      { label: 'Date', value: examDate },
      { label: 'Venue', value: venue },
    ];
    fields.forEach(({ label, value }, i) => {
      canvas.add(new fabric.Text(`${label}:`, { left: 105, top: 64 + i * 19, fontSize: 10, fill: '#64748b', fontFamily: 'Arial' }));
      canvas.add(new fabric.Text(String(value), { left: 165, top: 64 + i * 19, fontSize: 10, fill: '#1e293b', fontWeight: 'bold', fontFamily: 'Arial' }));
    });

    canvas.add(new fabric.Rect({ left: 0, top: h - 24, width: w, height: 24, fill: '#7f1d1d', selectable: false }));
    canvas.add(new fabric.Text('This card must be presented at the examination centre', { left: w / 2, top: h - 16, fontSize: 8.5, fill: '#fecaca', fontFamily: 'Arial', originX: 'center' }));
  }

  canvas.renderAll();
  return canvas;
}

export default function DocumentMaker() {
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const uploadInputRef = useRef(null);

  const [docType, setDocType] = useState('id_card');
  const [tab, setTab] = useState(0);
  const [ready, setReady] = useState(false);
  const [alert, setAlert] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Student form
  const [studentData, setStudentData] = useState({ name: '', rollNo: '', course: '', batch: '', dob: '', examName: '', examDate: '', venue: '' });
  const instituteName = localStorage.getItem('institute_title') || 'Your Institute';
  const instituteId = localStorage.getItem('institute_uuid') || '';
  const isAdmin = ['admin', 'superadmin'].includes(localStorage.getItem('role') || '');

  // Custom templates
  const [customTemplates, setCustomTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadDocType, setUploadDocType] = useState('other');
  const [uploading, setUploading] = useState(false);

  // Batch generation
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [batchStudents, setBatchStudents] = useState([]);
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [generating, setGenerating] = useState(false);

  function showAlert(type, text) {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 5000);
  }

  function setField(key, value) {
    setStudentData(prev => ({ ...prev, [key]: value }));
  }

  // Fetch custom templates
  async function loadCustomTemplates() {
    if (!instituteId) return;
    setLoadingTemplates(true);
    try {
      const r = await apiClient.get(`/api/custom-templates?institute_uuid=${instituteId}`);
      setCustomTemplates(Array.isArray(r.data?.result) ? r.data.result : []);
    } catch {
      // silently ignore
    } finally {
      setLoadingTemplates(false);
    }
  }

  // Upload a new custom template
  async function handleUpload() {
    if (!uploadFile || !uploadName.trim()) return showAlert('error', 'Name and image required');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('image', uploadFile);
      form.append('institute_uuid', instituteId);
      form.append('name', uploadName.trim());
      form.append('docType', uploadDocType);
      form.append('created_by', localStorage.getItem('user_uuid') || '');
      await apiClient.post('/api/custom-templates/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      showAlert('success', 'Template uploaded!');
      setUploadDialog(false);
      setUploadFile(null);
      setUploadName('');
      setUploadDocType('other');
      loadCustomTemplates();
    } catch (err) {
      showAlert('error', 'Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  }

  // Delete a custom template
  async function handleDeleteTemplate(uuid) {
    try {
      await apiClient.delete(`/api/custom-templates/${uuid}`);
      setCustomTemplates(prev => prev.filter(t => t.template_uuid !== uuid));
      showAlert('success', 'Template deleted');
    } catch {
      showAlert('error', 'Delete failed');
    }
  }

  // Load custom template image as canvas background
  async function handleUseTemplate(imageUrl) {
    if (!canvasRef.current) return;
    if (fabricRef.current) { fabricRef.current.dispose(); fabricRef.current = null; }
    setReady(false);
    try {
      const { fabric } = await getFabric();
      const img = await new Promise((res, rej) => fabric.Image.fromURL(imageUrl, (i) => i ? res(i) : rej(new Error('Image load failed')), { crossOrigin: 'anonymous' }));
      const iw = img.width || 794;
      const ih = img.height || 562;
      const canvas = new fabric.Canvas(canvasRef.current, { width: iw, height: ih, selection: true });
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), { scaleX: 1, scaleY: 1 });
      fabricRef.current = canvas;
      setReady(true);
    } catch (err) {
      showAlert('error', 'Could not load template: ' + err.message);
    }
  }

  async function renderCanvas() {
    if (!canvasRef.current) return;
    if (fabricRef.current) { fabricRef.current.dispose(); fabricRef.current = null; }
    setReady(false);
    try {
      fabricRef.current = await buildCanvas(canvasRef.current, docType, studentData, instituteName);
      setReady(true);
    } catch (err) {
      showAlert('error', 'Canvas render failed: ' + err.message);
    }
  }

  useEffect(() => {
    renderCanvas();
    return () => { if (fabricRef.current) { fabricRef.current.dispose(); fabricRef.current = null; } };
  }, [docType]);

  useEffect(() => { loadCustomTemplates(); }, []);

  // Load batches for batch generation
  useEffect(() => {
    const uuid = localStorage.getItem('institute_uuid');
    if (!uuid) return;
    apiClient.get(`/api/batches?institute_uuid=${uuid}`)
      .then(r => setBatches(Array.isArray(r.data?.result) ? r.data.result : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedBatch) { setBatchStudents([]); return; }
    setLoadingBatch(true);
    apiClient.get(`/api/students?batch=${selectedBatch}&institute_uuid=${localStorage.getItem('institute_uuid')}`)
      .then(r => setBatchStudents(Array.isArray(r.data?.result) ? r.data.result : []))
      .catch(() => setBatchStudents([]))
      .finally(() => setLoadingBatch(false));
  }, [selectedBatch]);

  async function exportPNG() {
    if (!fabricRef.current) return;
    const url = fabricRef.current.toDataURL({ format: 'png', multiplier: 2 });
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docType}-${studentData.name || 'student'}.png`;
    a.click();
  }

  async function exportPDF() {
    if (!fabricRef.current) return;
    setExporting(true);
    try {
      const url = fabricRef.current.toDataURL({ format: 'png', multiplier: 2 });
      const w = fabricRef.current.width;
      const h = fabricRef.current.height;
      const pdf = new jsPDF({ orientation: w > h ? 'landscape' : 'portrait', unit: 'px', format: [w * 2, h * 2] });
      pdf.addImage(url, 'PNG', 0, 0, w * 2, h * 2);
      pdf.save(`${docType}-${studentData.name || 'document'}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  async function generateBatchZip() {
    if (!batchStudents.length) return showAlert('error', 'No students in selected batch');
    setGenerating(true);
    const zip = new JSZip();
    const { fabric } = await getFabric();
    try {
      for (const student of batchStudents) {
        const tmpEl = document.createElement('canvas');
        document.body.appendChild(tmpEl);
        const data = {
          name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.name || 'Student',
          rollNo: student.rollNo || student.studentId || '—',
          course: student.course || '—',
          batch: student.batch || selectedBatch,
          dob: student.dob ? new Date(student.dob).toLocaleDateString('en-IN') : '',
        };
        const c = await buildCanvas(tmpEl, docType, data, instituteName);
        const imgData = c.toDataURL({ format: 'png', multiplier: 2 }).split(',')[1];
        zip.file(`${data.name.replace(/\s+/g, '_')}_${docType}.png`, imgData, { base64: true });
        c.dispose();
        document.body.removeChild(tmpEl);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `batch_${docType}_cards.zip`;
      a.click();
      showAlert('success', `Generated ${batchStudents.length} documents!`);
    } catch (err) {
      showAlert('error', 'Generation failed: ' + err.message);
    } finally {
      setGenerating(false);
    }
  }

  const currentType = DOC_TYPES.find(d => d.key === docType);
  const isWide = docType === 'certificate' || docType === 'result';

  const formFields = {
    id_card: [
      { key: 'name', label: 'Student Name', placeholder: 'Full Name' },
      { key: 'rollNo', label: 'Roll No / ID', placeholder: 'STU-001' },
      { key: 'course', label: 'Course', placeholder: 'Computer Science' },
      { key: 'batch', label: 'Batch', placeholder: '2024–25' },
      { key: 'dob', label: 'Date of Birth', placeholder: 'DD/MM/YYYY' },
    ],
    certificate: [
      { key: 'name', label: 'Student Name', placeholder: 'Full Name' },
      { key: 'course', label: 'Course Name', placeholder: 'Web Development' },
    ],
    result: [
      { key: 'name', label: 'Student Name', placeholder: 'Full Name' },
      { key: 'rollNo', label: 'Roll No', placeholder: 'STU-001' },
      { key: 'course', label: 'Course', placeholder: 'Science' },
      { key: 'batch', label: 'Batch', placeholder: '2024–25' },
      { key: 'examName', label: 'Exam Name', placeholder: 'Annual Exam 2025' },
    ],
    admit_card: [
      { key: 'name', label: 'Student Name', placeholder: 'Full Name' },
      { key: 'rollNo', label: 'Roll No', placeholder: 'STU-001' },
      { key: 'course', label: 'Course', placeholder: 'Science' },
      { key: 'examName', label: 'Exam Name', placeholder: 'Final Examination' },
      { key: 'examDate', label: 'Exam Date', placeholder: '15 June 2025' },
      { key: 'venue', label: 'Venue / Room', placeholder: 'Room 101' },
    ],
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
        <BadgeIcon sx={{ color: '#7c3aed', fontSize: 28 }} />
        <Box>
          <Typography variant="h6" fontWeight={700}>Document Maker</Typography>
          <Typography variant="caption" color="text.secondary">ID Cards · Certificates · Result Sheets · Admit Cards</Typography>
        </Box>
      </Stack>

      {alert && <Alert severity={alert.type} sx={{ mb: 2 }} onClose={() => setAlert(null)}>{alert.text}</Alert>}

      {/* Custom Templates Gallery */}
      <Card sx={{ mb: 2.5, bgcolor: 'background.paper' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <ImageIcon sx={{ color: '#7c3aed', fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={700}>Custom Templates</Typography>
              {customTemplates.length > 0 && (
                <Chip label={customTemplates.length} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#ede9fe', color: '#7c3aed' }} />
              )}
            </Stack>
            {isAdmin && (
              <Button
                size="small"
                startIcon={<AddPhotoAlternateIcon />}
                onClick={() => setUploadDialog(true)}
                sx={{ bgcolor: '#7c3aed', color: '#fff', '&:hover': { bgcolor: '#6d28d9' }, textTransform: 'none', fontSize: '0.75rem' }}
              >
                Upload Template
              </Button>
            )}
          </Stack>

          {loadingTemplates ? (
            <CircularProgress size={20} sx={{ display: 'block', mx: 'auto' }} />
          ) : customTemplates.length === 0 ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', py: 1.5 }}>
              {isAdmin ? 'No custom templates yet. Upload one to get started.' : 'No templates available.'}
            </Typography>
          ) : (
            <Box sx={{
              display: 'flex',
              gap: 1.5,
              overflowX: 'auto',
              pb: 0.5,
              '&::-webkit-scrollbar': { height: 4 },
              '&::-webkit-scrollbar-thumb': { bgcolor: '#c4b5fd', borderRadius: 2 },
            }}>
              {customTemplates.map((tpl) => (
                <Box key={tpl.template_uuid} sx={{ position: 'relative', flexShrink: 0 }}>
                  <Card
                    onClick={() => handleUseTemplate(tpl.imageUrl)}
                    sx={{
                      width: 100, cursor: 'pointer',
                      border: '2px solid transparent',
                      '&:hover': { border: '2px solid #7c3aed' },
                      transition: 'border-color 0.15s',
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={tpl.thumbUrl || tpl.imageUrl}
                      alt={tpl.name}
                      sx={{ height: 70, objectFit: 'cover' }}
                    />
                    <CardContent sx={{ p: '4px 6px', '&:last-child': { pb: '4px' } }}>
                      <Typography variant="caption" fontWeight={600} noWrap display="block" sx={{ fontSize: '0.65rem' }}>
                        {tpl.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                        {tpl.docType}
                      </Typography>
                    </CardContent>
                  </Card>
                  {isAdmin && (
                    <Tooltip title="Delete template">
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(tpl.template_uuid); }}
                        sx={{
                          position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(0,0,0,0.5)',
                          color: '#fff', width: 20, height: 20,
                          '&:hover': { bgcolor: '#ef4444' },
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 12 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Upload Template Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>Upload Template Image</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Template Name"
              value={uploadName}
              onChange={e => setUploadName(e.target.value)}
              fullWidth
              size="small"
              placeholder="e.g. Blue ID Card 2025"
            />
            <Select
              value={uploadDocType}
              onChange={e => setUploadDocType(e.target.value)}
              size="small"
              fullWidth
            >
              <MenuItem value="id_card">ID Card</MenuItem>
              <MenuItem value="certificate">Certificate</MenuItem>
              <MenuItem value="result">Result / Mark Sheet</MenuItem>
              <MenuItem value="admit_card">Admit Card</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
            <Box>
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => setUploadFile(e.target.files?.[0] || null)}
              />
              <Button
                variant="outlined"
                fullWidth
                startIcon={<AddPhotoAlternateIcon />}
                onClick={() => uploadInputRef.current?.click()}
                sx={{ textTransform: 'none' }}
              >
                {uploadFile ? uploadFile.name : 'Choose Image (max 10MB)'}
              </Button>
            </Box>
            {uploadFile && (
              <Box
                component="img"
                src={URL.createObjectURL(uploadFile)}
                alt="preview"
                sx={{ width: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 1, border: '1px solid #e2e8f0' }}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUploadDialog(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading || !uploadFile || !uploadName.trim()}
            startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, textTransform: 'none' }}
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document type selector */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(4,1fr)' }, gap: 1.5, mb: 3 }}>
        {DOC_TYPES.map((dt) => (
          <Card
            key={dt.key}
            onClick={() => setDocType(dt.key)}
            sx={{
              cursor: 'pointer',
              border: `2px solid ${docType === dt.key ? dt.color : '#e2e8f0'}`,
              transition: 'border-color 0.15s',
              '&:hover': { borderColor: dt.color },
            }}
          >
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, textAlign: 'center' }}>
              <Box sx={{ color: dt.color, mb: 0.5 }}>{dt.icon}</Box>
              <Typography variant="caption" fontWeight={600} display="block">{dt.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: isWide ? '320px 1fr' : '280px 1fr' }, gap: 3 }}>
        {/* Left panel */}
        <Box>
          <Card>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #e2e8f0', px: 1 }}>
              <Tab label="Single" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', minHeight: 44 }} />
              <Tab label="Batch Generate" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', minHeight: 44 }} />
            </Tabs>
            <CardContent sx={{ p: 2 }}>
              {tab === 0 ? (
                <Stack spacing={1.5}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {currentType?.desc}
                  </Typography>
                  {(formFields[docType] || []).map(({ key, label, placeholder }) => (
                    <TextField
                      key={key}
                      label={label}
                      value={studentData[key]}
                      onChange={e => setField(key, e.target.value)}
                      placeholder={placeholder}
                      fullWidth
                    />
                  ))}
                  <Button fullWidth onClick={renderCanvas} sx={{ bgcolor: currentType?.color, '&:hover': { bgcolor: currentType?.color, filter: 'brightness(0.9)' } }}>
                    Preview Document
                  </Button>
                  <Divider />
                  <Typography variant="caption" fontWeight={600} color="text.secondary">Export</Typography>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={exportPNG} sx={{ flex: 1 }}>PNG</Button>
                    <Button size="small" variant="outlined" color="secondary" startIcon={<PictureAsPdfIcon />} onClick={exportPDF} disabled={exporting} sx={{ flex: 1 }}>PDF</Button>
                  </Stack>
                </Stack>
              ) : (
                <Stack spacing={1.5}>
                  <Typography variant="caption" color="text.secondary">
                    Select a batch to generate documents for all students and download as ZIP.
                  </Typography>
                  <Select
                    value={selectedBatch}
                    onChange={e => setSelectedBatch(e.target.value)}
                    displayEmpty
                    size="small"
                    fullWidth
                  >
                    <MenuItem value=""><em>Select batch…</em></MenuItem>
                    {batches.map(b => (
                      <MenuItem key={b._id || b.batch_name} value={b.batch_name || b._id}>{b.batch_name}</MenuItem>
                    ))}
                  </Select>
                  {loadingBatch && <CircularProgress size={20} sx={{ mx: 'auto' }} />}
                  {batchStudents.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {batchStudents.length} students found
                    </Typography>
                  )}
                  <Button
                    fullWidth
                    startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <FolderZipIcon />}
                    onClick={generateBatchZip}
                    disabled={generating || !batchStudents.length}
                    sx={{ bgcolor: currentType?.color, '&:hover': { bgcolor: currentType?.color, filter: 'brightness(0.9)' } }}
                  >
                    {generating ? 'Generating…' : `Generate ZIP (${batchStudents.length})`}
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Canvas preview */}
        <Box>
          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="caption" color="text.secondary">
                  Preview — {currentType?.label}
                </Typography>
                {ready && <Chip label="Ready" size="small" color="success" sx={{ height: 18, fontSize: '0.6rem' }} />}
              </Stack>
              <Box sx={{ overflowX: 'auto', '& canvas': { display: 'block', maxWidth: '100%' } }}>
                <canvas ref={canvasRef} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
