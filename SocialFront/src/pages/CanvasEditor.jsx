/**
 * Document Maker — Canva-style
 * view='home': template picker with category grid + recent designs
 * view='editor': full canvas editor with bottom toolbar
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, IconButton,
  MenuItem, Select, Slider, Stack, Tab, Tabs, TextField,
  Tooltip, Typography, InputAdornment,
} from '@mui/material';
import BadgeIcon from '@mui/icons-material/Badge';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ImageIcon from '@mui/icons-material/Image';
import DrawIcon from '@mui/icons-material/Draw';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import LayersIcon from '@mui/icons-material/Layers';
import HomeIcon from '@mui/icons-material/Home';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ShareIcon from '@mui/icons-material/Share';
import CheckIcon from '@mui/icons-material/Check';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import AppsIcon from '@mui/icons-material/Apps';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import apiClient from '../apiClient';

/* ─── Fabric loader ──────────────────────────────────────────── */
let fabricModule = null;
async function getFabric() {
  if (!fabricModule) fabricModule = await import('fabric');
  return fabricModule;
}

/* ─── Doc types ───────────────────────────────────────────────── */
const DOC_TYPES = [
  { key: 'id_card',     label: 'ID Card',      icon: <BadgeIcon sx={{ fontSize: 28 }} />,             color: '#4f46e5', color2: '#818cf8', dims: { w: 340, h: 215 },
    thumb: 'https://images.unsplash.com/photo-1586282391129-76a6df230234?w=200&q=60',
    desc: 'Student & staff identity cards' },
  { key: 'certificate', label: 'Certificate',   icon: <WorkspacePremiumIcon sx={{ fontSize: 28 }} />,  color: '#059669', color2: '#6ee7b7', dims: { w: 794, h: 562 },
    thumb: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&q=60',
    desc: 'Completion & achievement certificates' },
  { key: 'result',      label: 'Result Sheet',  icon: <AssignmentIcon sx={{ fontSize: 28 }} />,        color: '#d97706', color2: '#fde68a', dims: { w: 595, h: 842 },
    thumb: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=200&q=60',
    desc: 'Exam results and mark sheets' },
  { key: 'admit_card',  label: 'Admit Card',    icon: <CreditCardIcon sx={{ fontSize: 28 }} />,        color: '#dc2626', color2: '#fca5a5', dims: { w: 340, h: 215 },
    thumb: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=200&q=60',
    desc: 'Examination hall tickets' },
];

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

/* ─── Canvas seeder ──────────────────────────────────────────── */
async function seedCanvas(canvas, docType, tpl, data, instName) {
  const { fabric } = await getFabric();
  canvas.clear();
  const { w, h } = DOC_TYPES.find(d => d.key === docType).dims;
  canvas.setWidth(w); canvas.setHeight(h);
  canvas.backgroundColor = tpl.bg;

  const name   = data.name   || 'Student Name';
  const rollNo = data.rollNo || 'ROLL-001';
  const course = data.course || 'Course Name';
  const batch  = data.batch  || 'Batch 2025';
  const inst   = instName    || 'Institute Name';

  if (docType === 'id_card') {
    canvas.add(new fabric.Rect({ left: 0, top: 0, width: w, height: 56, fill: tpl.headerColor, selectable: false, evented: false }));
    canvas.add(new fabric.Text(inst.toUpperCase(), { left: w / 2, top: 13, fontSize: 13, fill: '#fff', fontWeight: 'bold', fontFamily: 'Arial', originX: 'center', selectable: false, evented: false }));
    canvas.add(new fabric.Text('STUDENT IDENTITY CARD', { left: w / 2, top: 34, fontSize: 9.5, fill: 'rgba(255,255,255,0.75)', fontFamily: 'Arial', originX: 'center', selectable: false, evented: false }));
    const photoBox = new fabric.Rect({ left: 14, top: 66, width: 78, height: 98, fill: tpl.headerColor + '22', stroke: tpl.headerColor + '66', strokeWidth: 1.5, rx: 6, ry: 6 });
    const photoText = new fabric.Text('PHOTO', { left: 53, top: 108, fontSize: 10, fill: tpl.headerColor, fontFamily: 'Arial', originX: 'center', selectable: false, evented: false });
    canvas.add(photoBox, photoText);
    [{ l: 'Name', v: name }, { l: 'Roll No', v: rollNo }, { l: 'Course', v: course }, { l: 'Batch', v: batch }].forEach(({ l, v }, i) => {
      canvas.add(new fabric.Text(`${l}:`, { left: 108, top: 70 + i * 24, fontSize: 11, fill: '#64748b', fontFamily: 'Arial' }));
      canvas.add(new fabric.IText(v, { left: 170, top: 70 + i * 24, fontSize: 11, fill: '#1e293b', fontWeight: 'bold', fontFamily: 'Arial' }));
    });
    canvas.add(new fabric.Rect({ left: 0, top: h - 26, width: w, height: 26, fill: tpl.headerColor, selectable: false, evented: false }));
    canvas.add(new fabric.Text('Valid for current academic year', { left: w / 2, top: h - 16, fontSize: 8.5, fill: 'rgba(255,255,255,0.8)', fontFamily: 'Arial', originX: 'center', selectable: false, evented: false }));
  }

  if (docType === 'certificate') {
    canvas.add(new fabric.Rect({ left: 14, top: 14, width: w - 28, height: h - 28, fill: 'transparent', stroke: tpl.headerColor, strokeWidth: 3, rx: 6, ry: 6, selectable: false, evented: false }));
    canvas.add(new fabric.Rect({ left: 24, top: 24, width: w - 48, height: h - 48, fill: 'transparent', stroke: tpl.headerColor + '55', strokeWidth: 1, selectable: false, evented: false }));
    canvas.add(new fabric.Text(inst.toUpperCase(), { left: w / 2, top: 56, fontSize: 18, fill: tpl.headerColor, fontWeight: 'bold', fontFamily: 'Arial', originX: 'center' }));
    canvas.add(new fabric.Text('CERTIFICATE OF COMPLETION', { left: w / 2, top: 96, fontSize: 26, fill: '#1e293b', fontWeight: 'bold', fontFamily: 'Arial', originX: 'center' }));
    canvas.add(new fabric.Text('This is to certify that', { left: w / 2, top: 168, fontSize: 16, fill: '#64748b', fontFamily: 'Arial', originX: 'center' }));
    canvas.add(new fabric.IText(name, { left: w / 2, top: 208, fontSize: 30, fill: tpl.headerColor, fontStyle: 'italic', fontFamily: 'Arial', originX: 'center' }));
    canvas.add(new fabric.Line([w / 2 - 160, 258, w / 2 + 160, 258], { stroke: tpl.headerColor + '88', strokeWidth: 1.5, selectable: false, evented: false }));
    canvas.add(new fabric.Text('has successfully completed the course', { left: w / 2, top: 274, fontSize: 15, fill: '#64748b', fontFamily: 'Arial', originX: 'center' }));
    canvas.add(new fabric.IText(course, { left: w / 2, top: 310, fontSize: 22, fill: tpl.headerColor, fontWeight: 'bold', fontFamily: 'Arial', originX: 'center' }));
    canvas.add(new fabric.Line([110, h - 90, 270, h - 90], { stroke: '#94a3b8', strokeWidth: 1, selectable: false, evented: false }));
    canvas.add(new fabric.Line([w - 270, h - 90, w - 110, h - 90], { stroke: '#94a3b8', strokeWidth: 1, selectable: false, evented: false }));
    canvas.add(new fabric.Text('Student Signature', { left: 190, top: h - 78, fontSize: 10, fill: '#94a3b8', fontFamily: 'Arial', originX: 'center', selectable: false, evented: false }));
    canvas.add(new fabric.Text('Principal / Director', { left: w - 190, top: h - 78, fontSize: 10, fill: '#94a3b8', fontFamily: 'Arial', originX: 'center', selectable: false, evented: false }));
  }

  if (docType === 'result') {
    canvas.add(new fabric.Rect({ left: 0, top: 0, width: w, height: 72, fill: tpl.headerColor, selectable: false, evented: false }));
    canvas.add(new fabric.Text(inst.toUpperCase(), { left: w / 2, top: 16, fontSize: 16, fill: '#fff', fontWeight: 'bold', fontFamily: 'Arial', originX: 'center', selectable: false, evented: false }));
    canvas.add(new fabric.Text('RESULT / MARK SHEET', { left: w / 2, top: 44, fontSize: 12, fill: 'rgba(255,255,255,0.75)', fontFamily: 'Arial', originX: 'center', selectable: false, evented: false }));
    canvas.add(new fabric.IText(`Student: ${name}`, { left: 28, top: 90, fontSize: 13, fill: '#1e293b', fontWeight: 'bold', fontFamily: 'Arial' }));
    canvas.add(new fabric.IText(`Roll No: ${rollNo}  |  Course: ${course}  |  Batch: ${batch}`, { left: 28, top: 112, fontSize: 11, fill: '#64748b', fontFamily: 'Arial' }));
    canvas.add(new fabric.Rect({ left: 18, top: 140, width: w - 36, height: 28, fill: '#f1f5f9', selectable: false, evented: false }));
    ['Subject', 'Max', 'Min', 'Obtained', 'Grade'].forEach((h2, ci) => {
      canvas.add(new fabric.Text(h2, { left: 28 + ci * 110, top: 150, fontSize: 11, fill: '#475569', fontWeight: 'bold', fontFamily: 'Arial' }));
    });
    ['Subject 1', 'Subject 2', 'Subject 3', 'Subject 4', 'Subject 5'].forEach((sub, ri) => {
      const y = 178 + ri * 28;
      if (ri % 2 === 1) canvas.add(new fabric.Rect({ left: 18, top: y - 6, width: w - 36, height: 28, fill: '#f8fafc', selectable: false, evented: false }));
      [sub, '100', '35', '--', '--'].forEach((val, ci) => {
        canvas.add(new fabric.IText(val, { left: 28 + ci * 110, top: y, fontSize: 11, fill: '#1e293b', fontFamily: 'Arial' }));
      });
    });
  }

  if (docType === 'admit_card') {
    canvas.add(new fabric.Rect({ left: 0, top: 0, width: w, height: 52, fill: tpl.headerColor, selectable: false, evented: false }));
    canvas.add(new fabric.Text(inst.toUpperCase(), { left: w / 2, top: 12, fontSize: 12, fill: '#fff', fontWeight: 'bold', fontFamily: 'Arial', originX: 'center', selectable: false, evented: false }));
    canvas.add(new fabric.Text('EXAMINATION ADMIT CARD', { left: w / 2, top: 32, fontSize: 9.5, fill: 'rgba(255,255,255,0.75)', fontFamily: 'Arial', originX: 'center', selectable: false, evented: false }));
    const photoBox2 = new fabric.Rect({ left: 14, top: 62, width: 74, height: 94, fill: tpl.headerColor + '18', stroke: tpl.headerColor + '55', strokeWidth: 1.5, rx: 4, ry: 4 });
    canvas.add(photoBox2);
    canvas.add(new fabric.Text('PHOTO', { left: 51, top: 103, fontSize: 10, fill: tpl.headerColor, fontFamily: 'Arial', originX: 'center', selectable: false, evented: false }));
    [{ l: 'Name', v: name }, { l: 'Roll No', v: rollNo }, { l: 'Course', v: course }, { l: 'Exam Date', v: data.examDate || '—' }, { l: 'Venue', v: data.venue || '—' }].forEach(({ l, v }, i) => {
      canvas.add(new fabric.Text(`${l}:`, { left: 102, top: 66 + i * 20, fontSize: 10, fill: '#64748b', fontFamily: 'Arial' }));
      canvas.add(new fabric.IText(v, { left: 164, top: 66 + i * 20, fontSize: 10, fill: '#1e293b', fontWeight: 'bold', fontFamily: 'Arial' }));
    });
    canvas.add(new fabric.Rect({ left: 0, top: h - 24, width: w, height: 24, fill: tpl.headerColor + 'cc', selectable: false, evented: false }));
    canvas.add(new fabric.Text('Present this card at the examination centre', { left: w / 2, top: h - 15, fontSize: 8.5, fill: '#fff', fontFamily: 'Arial', originX: 'center', selectable: false, evented: false }));
  }

  canvas.renderAll();
}

/* ─── Home: category card ─────────────────────────────────────── */
function CategoryCard({ dt, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: 'pointer', borderRadius: 3, overflow: 'hidden',
        bgcolor: '#1e1e2e', border: '1px solid #2a2a3e',
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:active': { transform: 'scale(0.97)' },
        '&:hover': { boxShadow: `0 4px 20px ${dt.color}44` },
      }}
    >
      {/* Colored top */}
      <Box sx={{
        height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, ${dt.color}, ${dt.color2})`,
      }}>
        <Box sx={{ color: '#fff', opacity: 0.9 }}>{dt.icon}</Box>
      </Box>
      <Box sx={{ p: 1.25 }}>
        <Typography sx={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.2 }}>{dt.label}</Typography>
        <Typography sx={{ color: '#64748b', fontSize: '0.65rem', mt: 0.3, lineHeight: 1.3 }}>{dt.desc}</Typography>
      </Box>
    </Box>
  );
}

/* ─── Home: recent design tile ─────────────────────────────────── */
function RecentTile({ dt, tpl, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        width: 120, flexShrink: 0, cursor: 'pointer', borderRadius: 2, overflow: 'hidden',
        border: '1px solid #2a2a3e', transition: 'transform 0.15s',
        '&:active': { transform: 'scale(0.97)' },
      }}
    >
      <Box sx={{
        height: 80, background: `linear-gradient(135deg, ${tpl.thumb}cc, ${tpl.thumb})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <AutoAwesomeIcon sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 22 }} />
      </Box>
      <Box sx={{ bgcolor: '#1e1e2e', p: 1 }}>
        <Typography sx={{ color: '#e2e8f0', fontSize: '0.7rem', fontWeight: 500 }} noWrap>{dt.label}</Typography>
        <Typography sx={{ color: '#64748b', fontSize: '0.62rem' }}>{tpl.label}</Typography>
      </Box>
    </Box>
  );
}

/* ─── Home nav item ───────────────────────────────────────────── */
function HomeNavItem({ icon, label, active, onClick }) {
  return (
    <Box onClick={onClick} sx={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 0.3, py: 1, cursor: 'pointer',
      color: active ? '#a78bfa' : '#64748b',
      '&:hover': { color: '#e2e8f0' },
    }}>
      {icon}
      <Typography sx={{ fontSize: '0.62rem', fontWeight: active ? 700 : 400 }}>{label}</Typography>
    </Box>
  );
}

/* ─── Editor: template thumbnail ──────────────────────────────── */
function TemplateTile({ tpl, selected, onClick }) {
  return (
    <Box onClick={onClick} sx={{ flexShrink: 0, cursor: 'pointer', textAlign: 'center' }}>
      <Box sx={{
        width: 56, height: 72, borderRadius: 1.5,
        background: `linear-gradient(160deg, ${tpl.thumb}cc, ${tpl.thumb})`,
        border: selected ? `2.5px solid #a78bfa` : '2.5px solid transparent',
        boxShadow: selected ? `0 0 0 3px #a78bfa44` : 'none',
        transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <AutoAwesomeIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }} />
      </Box>
      <Typography sx={{ fontSize: '0.62rem', color: '#64748b', mt: 0.4, display: 'block' }}>{tpl.label}</Typography>
    </Box>
  );
}

/* ─── Main component ──────────────────────────────────────────── */
export default function DocumentMaker() {
  const canvasRef    = useRef(null);
  const fabricRef    = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const sigInputRef  = useRef(null);

  const [view,         setView]         = useState('home');   // 'home' | 'editor'
  const [homeNav,      setHomeNav]      = useState(0);        // 0=Create 1=Designs 2=Templates 3=More
  const [docType,      setDocType]      = useState('id_card');
  const [selectedTpl,  setSelectedTpl]  = useState(0);
  const [toolTab,      setToolTab]      = useState(0);        // 0=Templates 1=Add 2=Edit 3=Export
  const [scale,        setScale]        = useState(1);
  const [ready,        setReady]        = useState(false);
  const [alert,        setAlert]        = useState(null);
  const [selectedObj,  setSelectedObj]  = useState(null);
  const [exporting,    setExporting]    = useState(false);
  const [generating,   setGenerating]   = useState(false);
  const [fontSize,     setFontSize]     = useState(14);
  const [fontColor,    setFontColor]    = useState('#1e293b');
  const [isBold,       setIsBold]       = useState(false);
  const [isItalic,     setIsItalic]     = useState(false);
  const [batches,      setBatches]      = useState([]);
  const [selBatch,     setSelBatch]     = useState('');
  const [batchStudents,setBatchStudents]= useState([]);
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [searchTerm,   setSearchTerm]   = useState('');

  const instituteName = localStorage.getItem('institute_title') || 'Your Institute';

  function showAlert(type, text) { setAlert({ type, text }); setTimeout(() => setAlert(null), 4000); }

  const updateScale = useCallback(() => {
    if (!containerRef.current || !fabricRef.current) return;
    const cw = containerRef.current.clientWidth - 32;
    const fw = fabricRef.current.width;
    setScale(cw < fw ? cw / fw : 1);
  }, []);

  async function initCanvas(type, tplIdx) {
    const { fabric } = await getFabric();
    const tpl = (TEMPLATES[type] || [])[tplIdx] || TEMPLATES[type][0];
    if (fabricRef.current) { fabricRef.current.dispose(); fabricRef.current = null; }
    if (!canvasRef.current) return;
    const { w, h } = DOC_TYPES.find(d => d.key === type).dims;
    const fc = new fabric.Canvas(canvasRef.current, { width: w, height: h, selection: true });
    fabricRef.current = fc;
    fc.on('selection:created', handleSelect);
    fc.on('selection:updated', handleSelect);
    fc.on('selection:cleared', () => setSelectedObj(null));
    await seedCanvas(fc, type, tpl, {}, instituteName);
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
    setDocType(type);
    setSelectedTpl(tplIdx);
    setSelectedObj(null);
    setToolTab(0);
    setReady(false);
    setView('editor');
    setTimeout(() => initCanvas(type, tplIdx), 0);
  }

  useEffect(() => {
    if (view === 'editor' && !fabricRef.current) initCanvas(docType, selectedTpl);
    if (view !== 'editor' && fabricRef.current) { fabricRef.current.dispose(); fabricRef.current = null; }
  }, [view]);

  useEffect(() => {
    const ro = new ResizeObserver(updateScale);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [updateScale, view]);

  useEffect(() => () => { if (fabricRef.current) { fabricRef.current.dispose(); fabricRef.current = null; } }, []);

  /* ── canvas actions ─────────────────────────────────────── */
  async function addText() {
    const { fabric } = await getFabric();
    if (!fabricRef.current) return;
    const t = new fabric.IText('Double-tap to edit', { left: 60, top: 60, fontSize: 16, fill: '#1e293b', fontFamily: 'Arial' });
    fabricRef.current.add(t);
    fabricRef.current.setActiveObject(t);
    fabricRef.current.renderAll();
  }

  async function handleImageFile(e, label = 'Image') {
    const file = e.target.files?.[0]; if (!file) return;
    const { fabric } = await getFabric();
    const reader = new FileReader();
    reader.onload = async (ev) => {
      fabric.Image.fromURL(ev.target.result, (img) => {
        img.scaleToWidth(label === 'Signature' ? 120 : 80);
        img.set({ left: 50, top: 50 });
        fabricRef.current?.add(img);
        fabricRef.current?.setActiveObject(img);
        fabricRef.current?.renderAll();
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function addShape(shape) {
    const { fabric } = await getFabric();
    const fc = fabricRef.current; if (!fc) return;
    const obj = shape === 'rect'
      ? new fabric.Rect({ left: 60, top: 60, width: 100, height: 60, fill: '#e0e7ff', stroke: '#4f46e5', strokeWidth: 1.5, rx: 4, ry: 4 })
      : new fabric.Circle({ left: 60, top: 60, radius: 40, fill: '#e0e7ff', stroke: '#4f46e5', strokeWidth: 1.5 });
    fc.add(obj); fc.setActiveObject(obj); fc.renderAll();
  }

  async function addSignatureLine() {
    const { fabric } = await getFabric();
    const fc = fabricRef.current; if (!fc) return;
    const grp = new fabric.Group([
      new fabric.Line([0, 0, 140, 0], { stroke: '#94a3b8', strokeWidth: 1.5 }),
      new fabric.Text('Signature', { left: 32, top: 8, fontSize: 9, fill: '#94a3b8', fontFamily: 'Arial' }),
    ], { left: 80, top: 80 });
    fc.add(grp); fc.renderAll();
  }

  function applyFontProp(prop, value) {
    const obj = fabricRef.current?.getActiveObject();
    if (!obj || (obj.type !== 'i-text' && obj.type !== 'text')) return;
    obj.set(prop, value); fabricRef.current.renderAll();
  }

  function deleteSelected() {
    const fc = fabricRef.current; if (!fc) return;
    fc.getActiveObjects().forEach(o => fc.remove(o));
    fc.discardActiveObject(); fc.renderAll(); setSelectedObj(null);
  }

  async function exportPNG() {
    if (!fabricRef.current) return;
    const url = fabricRef.current.toDataURL({ format: 'png', multiplier: 2 });
    const a = document.createElement('a'); a.href = url; a.download = `${docType}.png`; a.click();
  }

  async function exportPDF() {
    if (!fabricRef.current) return;
    setExporting(true);
    try {
      const { w, h } = DOC_TYPES.find(d => d.key === docType).dims;
      const url = fabricRef.current.toDataURL({ format: 'png', multiplier: 2 });
      const pdf = new jsPDF({ orientation: w > h ? 'landscape' : 'portrait', unit: 'px', format: [w * 2, h * 2] });
      pdf.addImage(url, 'PNG', 0, 0, w * 2, h * 2);
      pdf.save(`${docType}.pdf`);
    } finally { setExporting(false); }
  }

  async function generateBatchZip() {
    if (!batchStudents.length) return showAlert('error', 'No students in selected batch');
    setGenerating(true);
    const zip = new JSZip();
    const { fabric } = await getFabric();
    const tpl = (TEMPLATES[docType] || [])[selectedTpl] || TEMPLATES[docType][0];
    try {
      for (const s of batchStudents) {
        const el = document.createElement('canvas'); document.body.appendChild(el);
        const { w, h } = DOC_TYPES.find(d => d.key === docType).dims;
        const fc = new fabric.Canvas(el, { width: w, height: h });
        const data = { name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name || 'Student', rollNo: s.rollNo || '—', course: s.course || '—', batch: s.batch || selBatch };
        await seedCanvas(fc, docType, tpl, data, instituteName);
        const img = fc.toDataURL({ format: 'png', multiplier: 2 }).split(',')[1];
        zip.file(`${data.name.replace(/\s+/g, '_')}_${docType}.png`, img, { base64: true });
        fc.dispose(); document.body.removeChild(el);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `batch_${docType}.zip`; a.click();
      showAlert('success', `Generated ${batchStudents.length} documents!`);
    } catch (err) { showAlert('error', err.message); }
    finally { setGenerating(false); }
  }

  function switchTemplate(idx) {
    setSelectedTpl(idx); setSelectedObj(null); setReady(false);
    setTimeout(() => initCanvas(docType, idx), 0);
  }

  useEffect(() => {
    const uuid = localStorage.getItem('institute_uuid'); if (!uuid) return;
    apiClient.get(`/api/batches?institute_uuid=${uuid}`)
      .then(r => setBatches(Array.isArray(r.data?.result) ? r.data.result : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selBatch) { setBatchStudents([]); return; }
    setLoadingBatch(true);
    apiClient.get(`/api/students?batch=${selBatch}&institute_uuid=${localStorage.getItem('institute_uuid')}`)
      .then(r => setBatchStudents(Array.isArray(r.data?.result) ? r.data.result : []))
      .catch(() => setBatchStudents([]))
      .finally(() => setLoadingBatch(false));
  }, [selBatch]);

  const currentDT  = DOC_TYPES.find(d => d.key === docType);
  const templates   = TEMPLATES[docType] || [];
  const filteredDTs = DOC_TYPES.filter(d => !searchTerm || d.label.toLowerCase().includes(searchTerm.toLowerCase()));

  /* ── Recent designs (all doc types × first template) ─────── */
  const recentDesigns = DOC_TYPES.flatMap(dt =>
    (TEMPLATES[dt.key] || []).slice(0, 2).map((tpl, i) => ({ dt, tpl, key: `${dt.key}-${i}` }))
  );

  /* ════════════════════════════════════════════════════════════
     HOME VIEW
  ════════════════════════════════════════════════════════════ */
  if (view === 'home') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#0f0f1a' }}>

        {/* Header */}
        <Box sx={{ px: 2, pt: 2, pb: 1, bgcolor: '#0f0f1a', flexShrink: 0 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
            <Typography sx={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1.1rem' }}>Document Maker</Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Chip size="small" label="Pro" sx={{ bgcolor: '#7c3aed22', color: '#a78bfa', fontSize: '0.65rem', height: 22 }} />
            </Stack>
          </Stack>
          {/* Search */}
          <TextField
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search templates…"
            size="small" fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#64748b', fontSize: 18 }} /></InputAdornment>,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#1e1e2e', borderRadius: 3, color: '#e2e8f0',
                '& fieldset': { borderColor: '#2a2a3e' },
                '&:hover fieldset': { borderColor: '#3a3a5e' },
                '&.Mui-focused fieldset': { borderColor: '#7c3aed' },
              },
              '& .MuiInputBase-input::placeholder': { color: '#64748b', opacity: 1 },
            }}
          />
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>

          {/* Explore templates */}
          <Box sx={{ px: 2, pt: 1, pb: 2 }}>
            <Typography sx={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.9rem', mb: 1.5 }}>Explore templates</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
              {filteredDTs.map(dt => (
                <CategoryCard key={dt.key} dt={dt} onClick={() => openEditor(dt.key, 0)} />
              ))}
            </Box>
          </Box>

          {/* Inspired by your designs */}
          {homeNav === 0 && (
            <Box sx={{ px: 2, pb: 3 }}>
              <Typography sx={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.9rem', mb: 1.5 }}>
                Inspired by your designs
              </Typography>
              <Box sx={{
                display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1,
                scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
              }}>
                {recentDesigns.map(({ dt, tpl, key }) => (
                  <RecentTile key={key} dt={dt} tpl={tpl} onClick={() => openEditor(dt.key, TEMPLATES[dt.key].indexOf(tpl))} />
                ))}
              </Box>
            </Box>
          )}

          {/* Your Designs tab */}
          {homeNav === 1 && (
            <Box sx={{ px: 2, pb: 3, textAlign: 'center' }}>
              <Box sx={{ py: 5 }}>
                <FolderOpenIcon sx={{ fontSize: 48, color: '#2a2a3e', mb: 1 }} />
                <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>No saved designs yet</Typography>
                <Typography sx={{ color: '#475569', fontSize: '0.75rem', mt: 0.5 }}>Create a design to see it here</Typography>
              </Box>
            </Box>
          )}

          {/* Templates tab */}
          {homeNav === 2 && (
            <Box sx={{ px: 2, pb: 3 }}>
              {DOC_TYPES.map(dt => (
                <Box key={dt.key} sx={{ mb: 3 }}>
                  <Typography sx={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.85rem', mb: 1 }}>{dt.label}</Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
                    {(TEMPLATES[dt.key] || []).map((tpl, i) => (
                      <Box key={tpl.id} onClick={() => openEditor(dt.key, i)} sx={{
                        width: 96, flexShrink: 0, cursor: 'pointer', borderRadius: 2, overflow: 'hidden',
                        border: '1px solid #2a2a3e', '&:hover': { border: '1px solid #7c3aed55' },
                      }}>
                        <Box sx={{ height: 64, background: `linear-gradient(135deg, ${tpl.thumb}cc, ${tpl.thumb})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <AutoAwesomeIcon sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 20 }} />
                        </Box>
                        <Box sx={{ bgcolor: '#1e1e2e', p: 0.75 }}>
                          <Typography sx={{ color: '#e2e8f0', fontSize: '0.65rem', fontWeight: 500 }}>{tpl.label}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Bottom nav */}
        <Box sx={{ bgcolor: '#1e1e2e', borderTop: '1px solid #2a2a3e', display: 'flex', flexShrink: 0 }}>
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#1a1a2e', overflow: 'hidden' }}>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageFile(e, 'Photo')} />
      <input ref={sigInputRef}  type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageFile(e, 'Signature')} />

      {/* ── Top bar (Canva-style minimal) ──────────────────── */}
      <Box sx={{
        bgcolor: '#16213e', borderBottom: '1px solid #1e2a4a',
        px: 1.5, py: 1, display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0,
      }}>
        <IconButton onClick={() => setView('home')} size="small" sx={{ color: '#94a3b8' }}>
          <HomeIcon fontSize="small" />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.825rem' }} noWrap>
            {currentDT?.label}
          </Typography>
        </Box>
        <Tooltip title="More options">
          <IconButton size="small" sx={{ color: '#94a3b8' }}><MoreHorizIcon fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="Download PNG">
          <IconButton size="small" onClick={exportPNG} sx={{ color: '#94a3b8' }}><DownloadIcon fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="Share">
          <IconButton size="small" sx={{ color: '#94a3b8' }}><ShareIcon fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="Export PDF">
          <IconButton
            size="small"
            onClick={exportPDF}
            disabled={exporting}
            sx={{ bgcolor: '#7c3aed', color: '#fff', borderRadius: 1.5, p: 0.75, '&:hover': { bgcolor: '#6d28d9' } }}
          >
            <CheckIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Alert ──────────────────────────────────────────── */}
      {alert && (
        <Alert severity={alert.type} sx={{ mx: 1, mt: 0.5, flexShrink: 0 }} onClose={() => setAlert(null)} size="small">
          {alert.text}
        </Alert>
      )}

      {/* ── Canvas area ────────────────────────────────────── */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'auto', p: 2,
          '& canvas': { display: 'block' },
        }}
      >
        {!ready && <CircularProgress sx={{ color: currentDT?.color || '#7c3aed' }} />}
        <Box sx={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
          borderRadius: 2,
          overflow: 'hidden',
          display: ready ? 'block' : 'none',
        }}>
          <canvas ref={canvasRef} />
        </Box>
      </Box>

      {/* ── Bottom toolbar (Canva-style tabs) ──────────────── */}
      <Box sx={{
        bgcolor: '#16213e', borderTop: '1px solid #1e2a4a',
        flexShrink: 0, maxHeight: 220, display: 'flex', flexDirection: 'column',
      }}>
        <Tabs
          value={toolTab} onChange={(_, v) => setToolTab(v)}
          variant="scrollable" scrollButtons="auto"
          sx={{
            minHeight: 44, borderBottom: '1px solid #1e2a4a',
            '& .MuiTab-root': { minHeight: 44, py: 0, fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', color: '#64748b' },
            '& .Mui-selected': { color: '#a78bfa !important' },
            '& .MuiTabs-indicator': { bgcolor: '#7c3aed' },
          }}
        >
          <Tab label="Templates" />
          <Tab label="Add" />
          <Tab label="Edit" />
          <Tab label="Export" />
        </Tabs>

        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', p: 1.5 }}>

          {/* Templates tab */}
          {toolTab === 0 && (
            <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 0.5, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
              {templates.map((tpl, idx) => (
                <TemplateTile key={tpl.id} tpl={tpl} selected={selectedTpl === idx} onClick={() => switchTemplate(idx)} />
              ))}
            </Box>
          )}

          {/* Add tab */}
          {toolTab === 1 && (
            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
              {[
                { label: 'Text',      icon: <TextFieldsIcon fontSize="small" />,  action: addText },
                { label: 'Photo',     icon: <ImageIcon fontSize="small" />,        action: () => fileInputRef.current?.click() },
                { label: 'Signature', icon: <DrawIcon fontSize="small" />,         action: () => sigInputRef.current?.click() },
                { label: 'Sig Line',  icon: <DrawIcon fontSize="small" />,         action: addSignatureLine },
                { label: 'Rectangle', icon: <LayersIcon fontSize="small" />,       action: () => addShape('rect') },
                { label: 'Circle',    icon: <LayersIcon fontSize="small" />,       action: () => addShape('circle') },
              ].map(({ label, icon, action }) => (
                <Box key={label} onClick={action} sx={{
                  flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 0.5, cursor: 'pointer', p: 1, borderRadius: 2, minWidth: 60,
                  border: '1px solid #1e2a4a', bgcolor: '#1a1a2e',
                  '&:hover': { bgcolor: '#1e2a4a', borderColor: '#7c3aed55' },
                }}>
                  <Box sx={{ color: '#a78bfa' }}>{icon}</Box>
                  <Typography sx={{ fontSize: '0.62rem', fontWeight: 500, color: '#94a3b8' }}>{label}</Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Edit tab */}
          {toolTab === 2 && (
            selectedObj ? (
              <Stack spacing={1.5}>
                {(selectedObj.type === 'i-text' || selectedObj.type === 'text') && (
                  <>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography sx={{ fontSize: '0.72rem', color: '#64748b', flexShrink: 0 }}>Size</Typography>
                      <Slider
                        value={fontSize} min={8} max={80} size="small"
                        onChange={(_, v) => { setFontSize(v); applyFontProp('fontSize', v); }}
                        sx={{ flex: 1, color: '#7c3aed' }}
                      />
                      <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', minWidth: 24 }}>{fontSize}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>Color</Typography>
                      <input type="color" value={fontColor}
                        onChange={e => { setFontColor(e.target.value); applyFontProp('fill', e.target.value); }}
                        style={{ width: 32, height: 26, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0, background: 'none' }}
                      />
                      <Tooltip title="Bold">
                        <IconButton size="small" onClick={() => { const v = !isBold; setIsBold(v); applyFontProp('fontWeight', v ? 'bold' : 'normal'); }}
                          sx={{ bgcolor: isBold ? '#7c3aed' : '#1e2a4a', color: isBold ? '#fff' : '#94a3b8' }}>
                          <FormatBoldIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Italic">
                        <IconButton size="small" onClick={() => { const v = !isItalic; setIsItalic(v); applyFontProp('fontStyle', v ? 'italic' : 'normal'); }}
                          sx={{ bgcolor: isItalic ? '#7c3aed' : '#1e2a4a', color: isItalic ? '#fff' : '#94a3b8' }}>
                          <FormatItalicIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </>
                )}
                <Button size="small" variant="outlined" color="error" startIcon={<DeleteOutlineIcon />} onClick={deleteSelected} sx={{ alignSelf: 'flex-start', borderColor: '#ef444466', color: '#ef4444' }}>
                  Delete
                </Button>
              </Stack>
            ) : (
              <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>Tap an element on the canvas to edit it.</Typography>
            )
          )}

          {/* Export tab */}
          {toolTab === 3 && (
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button size="small" startIcon={<DownloadIcon />} onClick={exportPNG}
                  sx={{ flex: 1, bgcolor: '#1e2a4a', color: '#e2e8f0', '&:hover': { bgcolor: '#243350' } }}>PNG</Button>
                <Button size="small" startIcon={<PictureAsPdfIcon />} onClick={exportPDF} disabled={exporting}
                  sx={{ flex: 1, bgcolor: '#7c3aed22', color: '#a78bfa', '&:hover': { bgcolor: '#7c3aed33' } }}>PDF</Button>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Select value={selBatch} onChange={e => setSelBatch(e.target.value)} displayEmpty size="small"
                  sx={{ flex: 1, bgcolor: '#1e2a4a', color: '#e2e8f0', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1e2a4a' } }}>
                  <MenuItem value=""><em style={{ color: '#64748b' }}>Select batch for bulk…</em></MenuItem>
                  {batches.map(b => <MenuItem key={b._id} value={b.batch_name || b._id}>{b.batch_name}</MenuItem>)}
                </Select>
                <Button size="small" startIcon={generating ? <CircularProgress size={12} color="inherit" /> : <FolderZipIcon />}
                  onClick={generateBatchZip} disabled={generating || !batchStudents.length}
                  sx={{ flexShrink: 0, bgcolor: '#1e2a4a', color: '#e2e8f0' }}>
                  {generating ? '…' : `ZIP (${batchStudents.length})`}
                </Button>
              </Stack>
              {loadingBatch && <CircularProgress size={16} sx={{ mx: 'auto', color: '#7c3aed' }} />}
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}
