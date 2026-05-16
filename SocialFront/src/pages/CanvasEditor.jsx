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
<<<<<<< Updated upstream
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
=======
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import LayersIcon from '@mui/icons-material/Layers';
import HomeIcon from '@mui/icons-material/Home';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import PrintIcon from '@mui/icons-material/Print';
import TuneIcon from '@mui/icons-material/Tune';
import ShareIcon from '@mui/icons-material/Share';
import CheckIcon from '@mui/icons-material/Check';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import AppsIcon from '@mui/icons-material/Apps';
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
// Build a Fabric.js canvas for a given document type and student data
async function buildCanvas(canvasEl, docType, data, instituteName) {
=======
const TEMPLATES = {
  id_card: [
    { id: 'indigo', label: 'Classic',  thumb: '#4f46e5', headerColor: '#4f46e5', bg: '#f0f4ff' },
    { id: 'dark',   label: 'Premium',  thumb: '#0f172a', headerColor: '#0f172a', bg: '#1e293b' },
    { id: 'green',  label: 'Fresh',    thumb: '#059669', headerColor: '#059669', bg: '#f0fdf4' },
    { id: 'rose',   label: 'Rose',     thumb: '#be123c', headerColor: '#be123c', bg: '#fff1f2' },
  ],
  certificate: [
    { id: 'gold',    label: 'Gold',       thumb: '#92400e', headerColor: '#92400e', bg: '#fffbf0' },
    { id: 'blue',    label: 'Royal Blue', thumb: '#1d4ed8', headerColor: '#1d4ed8', bg: '#eff6ff' },
    { id: 'minimal', label: 'Minimal',    thumb: '#374151', headerColor: '#374151', bg: '#ffffff' },
  ],
  result: [
    { id: 'slate',  label: 'Formal', thumb: '#1e293b', headerColor: '#1e293b', bg: '#ffffff' },
    { id: 'indigo', label: 'Modern', thumb: '#4338ca', headerColor: '#4338ca', bg: '#f5f3ff' },
  ],
  admit_card: [
    { id: 'red',    label: 'Alert Red', thumb: '#dc2626', headerColor: '#dc2626', bg: '#fff5f5' },
    { id: 'indigo', label: 'Classic',   thumb: '#4f46e5', headerColor: '#4f46e5', bg: '#f0f4ff' },
    { id: 'dark',   label: 'Dark',      thumb: '#0f172a', headerColor: '#0f172a', bg: '#f8fafc' },
  ],
};

/* ─── Print / page-setup constants ───────────────────────────── */
const MM_TO_PX = 3.7795275591; // 96 DPI

const PAGE_SIZES = [
  { key: 'a4',          label: 'A4',           w: 210,   h: 297   },
  { key: 'a4l',         label: 'A4 Landscape', w: 297,   h: 210   },
  { key: 'a3',          label: 'A3',           w: 297,   h: 420   },
  { key: 'a3l',         label: 'A3 Landscape', w: 420,   h: 297   },
  { key: 'a5',          label: 'A5',           w: 148,   h: 210   },
  { key: 'a2',          label: 'A2',           w: 420,   h: 594   },
  { key: 'letter',      label: 'Letter',       w: 216,   h: 279   },
  { key: 'legal',       label: 'Legal',        w: 216,   h: 356   },
  { key: 'id_card',     label: 'ID Card',      w: 85.6,  h: 53.98 },
  { key: 'certificate', label: 'Certificate',  w: 297,   h: 210   },
  { key: 'custom',      label: 'Custom…',      w: null,  h: null  },
];

const DEFAULT_SETUPS = {
  id_card:     { pageKey: 'id_card',     w: 85.6,  h: 53.98, marginT: 0,  marginR: 0,  marginB: 0,  marginL: 0,  orientation: 'landscape' },
  certificate: { pageKey: 'certificate', w: 297,   h: 210,   marginT: 10, marginR: 10, marginB: 10, marginL: 10, orientation: 'landscape' },
  result:      { pageKey: 'a4',          w: 210,   h: 297,   marginT: 15, marginR: 15, marginB: 15, marginL: 15, orientation: 'portrait'  },
  admit_card:  { pageKey: 'id_card',     w: 85.6,  h: 53.98, marginT: 0,  marginR: 0,  marginB: 0,  marginL: 0,  orientation: 'landscape' },
};

/* ─── Canvas seeder ──────────────────────────────────────────── */
async function seedCanvas(canvas, docType, tpl, data, instName) {
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
  const pageSetupRef = useRef(null);
  const [pageSetup,      setPageSetup]      = useState(null);
  const [tempSetup,      setTempSetup]      = useState(null);
  const [pageSetupDialog,setPageSetupDialog]= useState(false);
  const [printCopies,    setPrintCopies]    = useState(1);
  const [printing,       setPrinting]       = useState(false);

  function showAlert(type, text) { setAlert({ type, text }); setTimeout(() => setAlert(null), 4000); }

  async function drawMGuides(fc, setup) {
    if (!fc || !setup) return;
    const { fabric } = await getFabric();
    fc.getObjects().filter(o => o.__marginGuide).forEach(o => fc.remove(o));
    const { marginT, marginR, marginB, marginL } = setup;
    if ((marginT + marginR + marginB + marginL) === 0) { fc.renderAll(); return; }
    const t = marginT * MM_TO_PX, r = marginR * MM_TO_PX;
    const b = marginB * MM_TO_PX, l = marginL * MM_TO_PX;
    const guide = new fabric.Rect({
      left: l, top: t,
      width: fc.width - l - r, height: fc.height - t - b,
      fill: 'transparent',
      stroke: 'rgba(99,102,241,0.7)',
      strokeWidth: 1,
      strokeDashArray: [6, 4],
      selectable: false, evented: false,
    });
    guide.__marginGuide = true;
    fc.add(guide);
    fc.renderAll();
  }

  function hideMGuides() {
    if (!fabricRef.current) return;
    fabricRef.current.getObjects().filter(o => o.__marginGuide).forEach(o => o.set('visible', false));
    fabricRef.current.renderAll();
  }

  function showMGuides() {
    if (!fabricRef.current) return;
    fabricRef.current.getObjects().filter(o => o.__marginGuide).forEach(o => o.set('visible', true));
    fabricRef.current.renderAll();
  }

  async function printDocument() {
    if (!fabricRef.current) return;
    const setup = pageSetupRef.current;
    if (!setup) return;
    setPrinting(true);
    try {
      hideMGuides();
      const dataUrl = fabricRef.current.toDataURL({ format: 'png', multiplier: 3 });
      showMGuides();
      const wMM = setup.w, hMM = setup.h;
      const isLand = setup.orientation === 'landscape';
      const pdf = new jsPDF({ orientation: isLand ? 'landscape' : 'portrait', unit: 'mm', format: [wMM, hMM] });
      const pW = wMM - setup.marginL - setup.marginR;
      const pH = hMM - setup.marginT - setup.marginB;
      for (let i = 0; i < Math.max(1, printCopies); i++) {
        if (i > 0) pdf.addPage([wMM, hMM], isLand ? 'landscape' : 'portrait');
        pdf.addImage(dataUrl, 'PNG', setup.marginL, setup.marginT, pW, pH);
      }
      pdf.autoPrint();
      window.open(pdf.output('bloburl'), '_blank');
    } catch (err) {
      showAlert('error', 'Print failed: ' + err.message);
    } finally {
      setPrinting(false);
    }
  }

  async function generateBatchPDF() {
    if (!batchStudents.length) return showAlert('error', 'No students in selected batch');
    const setup = pageSetupRef.current;
    if (!setup) return;
    setGenerating(true);
    const { fabric } = await getFabric();
    const tpl = (TEMPLATES[docType] || [])[selectedTpl] || TEMPLATES[docType][0];
    try {
      const wMM = setup.w, hMM = setup.h;
      const isLand = setup.orientation === 'landscape';
      const pdf = new jsPDF({ orientation: isLand ? 'landscape' : 'portrait', unit: 'mm', format: [wMM, hMM] });
      const pW = wMM - setup.marginL - setup.marginR;
      const pH = hMM - setup.marginT - setup.marginB;
      for (let idx = 0; idx < batchStudents.length; idx++) {
        const s = batchStudents[idx];
        const el = document.createElement('canvas'); document.body.appendChild(el);
        const { w, h } = DOC_TYPES.find(d => d.key === docType).dims;
        const fc = new fabric.Canvas(el, { width: w, height: h });
        const data = {
          name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name || 'Student',
          rollNo: s.rollNo || '—', course: s.course || '—', batch: s.batch || selBatch,
        };
        await seedCanvas(fc, docType, tpl, data, instituteName);
        const imgData = fc.toDataURL({ format: 'png', multiplier: 3 });
        if (idx > 0) pdf.addPage([wMM, hMM], isLand ? 'landscape' : 'portrait');
        pdf.addImage(imgData, 'PNG', setup.marginL, setup.marginT, pW, pH);
        fc.dispose(); document.body.removeChild(el);
      }
      pdf.autoPrint();
      window.open(pdf.output('bloburl'), '_blank');
      showAlert('success', `Batch PDF ready — ${batchStudents.length} pages!`);
    } catch (err) { showAlert('error', err.message); }
    finally { setGenerating(false); }
  }

  const updateScale = useCallback(() => {
    if (!containerRef.current || !fabricRef.current) return;
    const cw = containerRef.current.clientWidth - 32;
    const fw = fabricRef.current.width;
    setScale(cw < fw ? cw / fw : 1);
  }, []);
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
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
=======
    const { w, h } = DOC_TYPES.find(d => d.key === type).dims;
    const fc = new fabric.Canvas(canvasRef.current, { width: w, height: h, selection: true });
    fabricRef.current = fc;
    fc.on('selection:created', handleSelect);
    fc.on('selection:updated', handleSelect);
    fc.on('selection:cleared', () => setSelectedObj(null));
    await seedCanvas(fc, type, tpl, {}, instituteName);
    await drawMGuides(fc, pageSetupRef.current);
    setReady(true);
    setTimeout(updateScale, 50);
  }

  function handleSelect(e) {
    const obj = e.selected?.[0];
    if (!obj) return;
    setSelectedObj(obj);
    if (obj.type === 'i-text' || obj.type === 'text') {
      setFontSize(obj.fontSize || 14);
      setFontColor(obj.fill || '#1e293b');
      setIsBold(obj.fontWeight === 'bold');
      setIsItalic(obj.fontStyle === 'italic');
      setToolTab(2);
    }
  }

  function openEditor(type, tplIdx = 0) {
    const setup = { ...(DEFAULT_SETUPS[type] || DEFAULT_SETUPS.result) };
    pageSetupRef.current = setup;
    setPageSetup(setup);
    setTempSetup(setup);
    setDocType(type);
    setSelectedTpl(tplIdx);
    setSelectedObj(null);
    setToolTab(0);
    setReady(false);
    setView('editor');
    setTimeout(() => initCanvas(type, tplIdx), 0);
  }
>>>>>>> Stashed changes

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
    hideMGuides();
    const url = fabricRef.current.toDataURL({ format: 'png', multiplier: 2 });
<<<<<<< Updated upstream
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docType}-${studentData.name || 'student'}.png`;
    a.click();
=======
    showMGuides();
    const a = document.createElement('a'); a.href = url; a.download = `${docType}.png`; a.click();
>>>>>>> Stashed changes
  }

  async function exportPDF() {
    if (!fabricRef.current) return;
    setExporting(true);
    try {
<<<<<<< Updated upstream
      const url = fabricRef.current.toDataURL({ format: 'png', multiplier: 2 });
      const w = fabricRef.current.width;
      const h = fabricRef.current.height;
=======
      hideMGuides();
      const { w, h } = DOC_TYPES.find(d => d.key === docType).dims;
      const url = fabricRef.current.toDataURL({ format: 'png', multiplier: 2 });
      showMGuides();
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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
=======
              {uploadFile && <Box component="img" src={URL.createObjectURL(uploadFile)} alt="preview" sx={{ width: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 1, border: '1px solid #e2e8f0' }} />}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setUploadDialog(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button variant="contained" onClick={handleUpload} disabled={uploading || !uploadFile || !uploadName.trim()}
              startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : null}
              sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, textTransform: 'none' }}>
              {uploading ? 'Uploading…' : 'Upload'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bottom nav */}
        <Box sx={{ bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', flexShrink: 0, boxShadow: '0 -1px 8px rgba(0,0,0,0.06)' }}>
          <HomeNavItem icon={<AddCircleOutlineIcon fontSize="small" />} label="Create" active={homeNav === 0} onClick={() => setHomeNav(0)} />
          <HomeNavItem icon={<FolderOpenIcon fontSize="small" />} label="Your Designs" active={homeNav === 1} onClick={() => setHomeNav(1)} />
          <HomeNavItem icon={<ViewModuleIcon fontSize="small" />} label="Templates" active={homeNav === 2} onClick={() => setHomeNav(2)} />
          <HomeNavItem icon={<AppsIcon fontSize="small" />} label="More" active={homeNav === 3} onClick={() => setHomeNav(3)} />
        </Box>
      </Box>
    );
  }

  /* ════════════════════════════════════════════════════════════
     EDITOR VIEW
  ════════════════════════════════════════════════════════════ */
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#f1f5f9', overflow: 'hidden' }}>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageFile(e, 'Photo')} />
      <input ref={sigInputRef}  type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageFile(e, 'Signature')} />

      {/* Top bar */}
      <Box sx={{
        bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0',
        px: 1.5, py: 1, display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <IconButton onClick={() => setView('home')} size="small" sx={{ color: '#64748b' }}>
          <HomeIcon fontSize="small" />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ color: '#1e293b', fontWeight: 600, fontSize: '0.825rem' }} noWrap>
            {currentDT?.label}
          </Typography>
        </Box>
        <Tooltip title="Page Setup">
          <IconButton size="small" onClick={() => { setTempSetup({ ...(pageSetup || DEFAULT_SETUPS[docType] || DEFAULT_SETUPS.result) }); setPageSetupDialog(true); }} sx={{ color: '#64748b' }}>
            <TuneIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Print">
          <IconButton size="small" onClick={printDocument} disabled={printing} sx={{ color: '#4f46e5' }}>
            {printing ? <CircularProgress size={16} color="inherit" /> : <PrintIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title="More options">
          <IconButton size="small" sx={{ color: '#64748b' }}><MoreHorizIcon fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="Download PNG">
          <IconButton size="small" onClick={exportPNG} sx={{ color: '#64748b' }}><DownloadIcon fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="Share">
          <IconButton size="small" sx={{ color: '#64748b' }}><ShareIcon fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="Save Design">
          <IconButton
            size="small"
            onClick={saveDesign}
            disabled={savingDesign}
            sx={{ bgcolor: '#7c3aed', color: '#fff', borderRadius: 1.5, p: 0.75, '&:hover': { bgcolor: '#6d28d9' } }}
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
              <Box sx={{ overflowX: 'auto', '& canvas': { display: 'block', maxWidth: '100%' } }}>
                <canvas ref={canvasRef} />
              </Box>
            </CardContent>
          </Card>
=======
            ) : (
              <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>Tap an element on the canvas to edit it.</Typography>
            )
          )}

          {/* Export tab */}
          {toolTab === 3 && (
            <Stack spacing={1.5}>
              {/* Fill from student */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Select value={fillStudent} onChange={e => { setFillStudent(e.target.value); fillFromStudent(e.target.value); }}
                  displayEmpty size="small"
                  sx={{ flex: 1, bgcolor: '#f1f5f9', color: '#1e293b', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } }}>
                  <MenuItem value=""><em style={{ color: '#94a3b8' }}>Fill from student…</em></MenuItem>
                  {students.map(s => <MenuItem key={s.uuid || s._id} value={s.uuid || s._id}>{s.firstName} {s.lastName}</MenuItem>)}
                </Select>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button size="small" startIcon={<DownloadIcon />} onClick={exportPNG}
                  sx={{ flex: 1, bgcolor: '#f1f5f9', color: '#1e293b', border: '1px solid #e2e8f0', '&:hover': { bgcolor: '#e2e8f0' } }}>PNG</Button>
                <Button size="small" startIcon={<PictureAsPdfIcon />} onClick={exportPDF} disabled={exporting}
                  sx={{ flex: 1, bgcolor: '#7c3aed22', color: '#7c3aed', border: '1px solid #7c3aed33', '&:hover': { bgcolor: '#7c3aed33' } }}>PDF</Button>
              </Stack>
              {/* Copies + Print */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontSize: '0.72rem', color: '#64748b', flexShrink: 0 }}>Copies</Typography>
                <TextField type="number" size="small" value={printCopies}
                  onChange={e => setPrintCopies(Math.max(1, Math.min(99, Number(e.target.value))))}
                  inputProps={{ min: 1, max: 99 }}
                  sx={{ width: 64, '& .MuiOutlinedInput-root': { bgcolor: '#f1f5f9', '& fieldset': { borderColor: '#e2e8f0' } }, '& input': { py: 0.5, px: 1 } }}
                />
                <Button size="small"
                  startIcon={printing ? <CircularProgress size={12} color="inherit" /> : <PrintIcon />}
                  onClick={printDocument} disabled={printing}
                  sx={{ flex: 1, bgcolor: '#4f46e522', color: '#4f46e5', border: '1px solid #4f46e533', '&:hover': { bgcolor: '#4f46e533' } }}>
                  {printing ? 'Printing…' : 'Print'}
                </Button>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Select value={selBatch} onChange={e => setSelBatch(e.target.value)} displayEmpty size="small"
                  sx={{ flex: 1, bgcolor: '#f1f5f9', color: '#1e293b', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } }}>
                  <MenuItem value=""><em style={{ color: '#94a3b8' }}>Select batch for bulk…</em></MenuItem>
                  {batches.map(b => <MenuItem key={b._id} value={b.batch_name || b._id}>{b.batch_name}</MenuItem>)}
                </Select>
                <Button size="small" startIcon={generating ? <CircularProgress size={12} color="inherit" /> : <FolderZipIcon />}
                  onClick={generateBatchZip} disabled={generating || !batchStudents.length}
                  sx={{ flexShrink: 0, bgcolor: '#f1f5f9', color: '#1e293b', border: '1px solid #e2e8f0', '&:hover': { bgcolor: '#e2e8f0' } }}>
                  {generating ? '…' : `ZIP (${batchStudents.length})`}
                </Button>
                <Button size="small" startIcon={generating ? <CircularProgress size={12} color="inherit" /> : <PictureAsPdfIcon />}
                  onClick={generateBatchPDF} disabled={generating || !batchStudents.length}
                  sx={{ flexShrink: 0, bgcolor: '#7c3aed22', color: '#7c3aed', border: '1px solid #7c3aed33', '&:hover': { bgcolor: '#7c3aed33' } }}>
                  {generating ? '…' : `PDF`}
                </Button>
              </Stack>
              {loadingBatch && <CircularProgress size={16} sx={{ mx: 'auto', color: '#7c3aed' }} />}
            </Stack>
          )}
>>>>>>> Stashed changes
        </Box>
      </Box>

      {/* ── Page Setup Dialog ──────────────────────────────── */}
      <Dialog open={pageSetupDialog} onClose={() => setPageSetupDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', pb: 0 }}>Page Setup</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Stack spacing={2}>
            {/* Paper size chips */}
            <Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mb: 1 }}>Paper Size</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {PAGE_SIZES.map(ps => (
                  <Chip key={ps.key} label={ps.label} size="small"
                    onClick={() => setTempSetup(prev => ({
                      ...prev,
                      pageKey: ps.key,
                      ...(ps.w && ps.h ? { w: ps.w, h: ps.h } : {}),
                    }))}
                    sx={{
                      bgcolor: tempSetup?.pageKey === ps.key ? '#7c3aed' : '#f1f5f9',
                      color: tempSetup?.pageKey === ps.key ? '#fff' : '#1e293b',
                      borderRadius: 1, cursor: 'pointer', fontSize: '0.7rem', height: 26,
                      '&:hover': { bgcolor: tempSetup?.pageKey === ps.key ? '#6d28d9' : '#e2e8f0' },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Custom W×H */}
            {tempSetup?.pageKey === 'custom' && (
              <Stack direction="row" spacing={1}>
                <TextField label="Width (mm)" type="number" size="small" value={tempSetup?.w || ''}
                  onChange={e => setTempSetup(prev => ({ ...prev, w: Number(e.target.value) }))}
                  inputProps={{ min: 10, max: 2000 }} sx={{ flex: 1 }} />
                <TextField label="Height (mm)" type="number" size="small" value={tempSetup?.h || ''}
                  onChange={e => setTempSetup(prev => ({ ...prev, h: Number(e.target.value) }))}
                  inputProps={{ min: 10, max: 2000 }} sx={{ flex: 1 }} />
              </Stack>
            )}

            {/* Orientation */}
            <Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mb: 1 }}>Orientation</Typography>
              <Stack direction="row" spacing={1}>
                {[['portrait', '↕ Portrait'], ['landscape', '↔ Landscape']].map(([val, lbl]) => (
                  <Button key={val} size="small" onClick={() => setTempSetup(prev => ({ ...prev, orientation: val }))}
                    sx={{
                      flex: 1, textTransform: 'none',
                      bgcolor: tempSetup?.orientation === val ? '#7c3aed' : '#f1f5f9',
                      color: tempSetup?.orientation === val ? '#fff' : '#64748b',
                      border: `1px solid ${tempSetup?.orientation === val ? '#7c3aed' : '#e2e8f0'}`,
                      '&:hover': { bgcolor: tempSetup?.orientation === val ? '#6d28d9' : '#e2e8f0' },
                    }}>{lbl}</Button>
                ))}
              </Stack>
            </Box>

            {/* Margins */}
            <Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mb: 1 }}>Margins (mm)</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                {[['marginT', 'Top'], ['marginR', 'Right'], ['marginB', 'Bottom'], ['marginL', 'Left']].map(([key, lbl]) => (
                  <TextField key={key} label={lbl} type="number" size="small"
                    value={tempSetup?.[key] ?? 0}
                    onChange={e => setTempSetup(prev => ({ ...prev, [key]: Math.max(0, Number(e.target.value)) }))}
                    inputProps={{ min: 0, max: 100 }} />
                ))}
              </Box>
            </Box>

            {/* Quick margin presets */}
            <Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mb: 1 }}>Quick Margin Presets</Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap">
                {[['None', 0], ['5mm', 5], ['10mm', 10], ['15mm', 15], ['20mm', 20]].map(([lbl, val]) => (
                  <Chip key={lbl} label={lbl} size="small"
                    onClick={() => setTempSetup(prev => ({ ...prev, marginT: val, marginR: val, marginB: val, marginL: val }))}
                    sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontSize: '0.7rem', height: 26, cursor: 'pointer', borderRadius: 1, '&:hover': { bgcolor: '#e2e8f0' } }}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPageSetupDialog(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            const s = { ...tempSetup };
            pageSetupRef.current = s;
            setPageSetup(s);
            setPageSetupDialog(false);
            if (fabricRef.current) drawMGuides(fabricRef.current, s);
          }} sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, textTransform: 'none' }}>
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
