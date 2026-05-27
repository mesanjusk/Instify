/**
 * Document Maker — Canva-style
 * view='home': template picker with category grid + recent designs
 * view='editor': full canvas editor with bottom toolbar
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert, Avatar, Box, Button, Card, CardContent, CardMedia, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel,
  IconButton, LinearProgress, MenuItem, Paper, Select, Slider, Stack, Switch,
  Tab, Tabs, TextField, Tooltip, Typography, InputAdornment, useMediaQuery,
} from '@mui/material';
import * as XLSX from 'xlsx';
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
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import LayersIcon from '@mui/icons-material/Layers';
import HomeIcon from '@mui/icons-material/Home';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
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
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import TonalityIcon from '@mui/icons-material/Tonality';
import ChangeHistoryIcon from '@mui/icons-material/ChangeHistory';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import AlignHorizontalLeftIcon from '@mui/icons-material/AlignHorizontalLeft';
import AlignHorizontalCenterIcon from '@mui/icons-material/AlignHorizontalCenter';
import AlignHorizontalRightIcon from '@mui/icons-material/AlignHorizontalRight';
import AlignVerticalTopIcon from '@mui/icons-material/AlignVerticalTop';
import AlignVerticalCenterIcon from '@mui/icons-material/AlignVerticalCenter';
import AlignVerticalBottomIcon from '@mui/icons-material/AlignVerticalBottom';
import FlipToFrontIcon from '@mui/icons-material/FlipToFront';
import FlipToBackIcon from '@mui/icons-material/FlipToBack';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SchoolIcon from '@mui/icons-material/School';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PeopleIcon from '@mui/icons-material/People';
import BlockIcon from '@mui/icons-material/Block';
import FilterListIcon from '@mui/icons-material/FilterList';
import TableChartIcon from '@mui/icons-material/TableChart';
import GroupsIcon from '@mui/icons-material/Groups';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import apiClient from '../apiClient';

/* ─── Fabric loader ──────────────────────────────────────────── */
let fabricModule = null;
async function getFabric() {
  if (!fabricModule) {
    const mod = await import('fabric');
    // fabric v5 can land in different spots depending on bundler/module format
    const ns = mod.fabric ?? mod.default?.fabric ?? mod.default ?? mod;
    fabricModule = { fabric: ns };
  }
  return fabricModule;
}

/* ─── Doc types ───────────────────────────────────────────────── */
const DOC_TYPES = [
  { key: 'id_card',     label: 'ID Card',      icon: <BadgeIcon sx={{ fontSize: 28 }} />,             color: '#1a7a4a', color2: '#34c97e', dims: { w: 340, h: 215 },
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
    { id: 'indigo', label: 'Classic',  thumb: '#1a7a4a', headerColor: '#1a7a4a', bg: '#f4f9f6' },
    { id: 'dark',   label: 'Premium',  thumb: '#0a1a0f', headerColor: '#0a1a0f', bg: '#1e293b' },
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
    { id: 'indigo', label: 'Modern', thumb: '#25a066', headerColor: '#25a066', bg: '#fff8e1' },
  ],
  admit_card: [
    { id: 'red',    label: 'Alert Red', thumb: '#dc2626', headerColor: '#dc2626', bg: '#fff5f5' },
    { id: 'indigo', label: 'Classic',   thumb: '#1a7a4a', headerColor: '#1a7a4a', bg: '#f4f9f6' },
    { id: 'dark',   label: 'Dark',      thumb: '#0a1a0f', headerColor: '#0a1a0f', bg: '#f8fafc' },
  ],
};

/* ─── Explore template catalogue ─────────────────────────────── */
const EXPLORE_ITEMS = [
  { key: 'id_card',     label: 'ID Card',       thumbUrl: 'https://images.unsplash.com/photo-1586282391129-76a6df230234?w=200&q=60', category: 'education' },
  { key: 'certificate', label: 'Certificate',   thumbUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&q=60', category: 'education' },
  { key: 'result',      label: 'Result Sheet',  thumbUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=200&q=60', category: 'education' },
  { key: 'admit_card',  label: 'Admit Card',    thumbUrl: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=200&q=60', category: 'education' },
  { key: 'id_card',     label: 'Poster',        thumbUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=60', category: 'poster'    },
  { key: 'certificate', label: 'Letter Head',   thumbUrl: 'https://images.unsplash.com/photo-1586095951271-0b11b13a4612?w=200&q=60', category: 'business'  },
  { key: 'result',      label: 'Notice',        thumbUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=200&q=60', category: 'business'  },
  { key: 'admit_card',  label: 'Hall Ticket',   thumbUrl: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=200&q=60', category: 'education' },
  { key: 'id_card',     label: 'ID Photo',      thumbUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=60', category: 'education' },
  { key: 'certificate', label: 'Achievement',   thumbUrl: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=200&q=60', category: 'education' },
  { key: 'result',      label: 'Report Card',   thumbUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=200&q=60', category: 'education' },
  { key: 'admit_card',  label: 'Exam Slip',     thumbUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=200&q=60', category: 'education' },
  { key: 'id_card',     label: 'Staff Card',    thumbUrl: 'https://images.unsplash.com/photo-1516534775068-ba3e7458af70?w=200&q=60', category: 'business'  },
  { key: 'certificate', label: 'Participation', thumbUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=200&q=60', category: 'education' },
  { key: 'result',      label: 'Progress',      thumbUrl: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=200&q=60', category: 'education' },
  { key: 'admit_card',  label: 'Merit Card',    thumbUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&q=60', category: 'education' },
];

const CATEGORY_CHIPS = [
  { id: 'all',       label: 'All'          },
  { id: 'education', label: '📚 Education' },
  { id: 'business',  label: '🏢 Business'  },
  { id: 'poster',    label: '🖼️ Poster'    },
];

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

/* ─── Built-in print layout presets (18 layouts) ─────────────────── */
const PRESET_LAYOUTS = [
  { id: 'a4_1x1',   name: 'A4 — Full Page',    pageW: 210, pageH: 297, marginT: 10, marginR: 10, marginB: 10, marginL: 10, cols: 1, rows: 1, gapH: 0, gapV: 0 },
  { id: 'a4_2x1',   name: 'A4 — 2 per row',    pageW: 210, pageH: 297, marginT: 10, marginR: 10, marginB: 10, marginL: 10, cols: 2, rows: 1, gapH: 5, gapV: 0 },
  { id: 'a4_1x2',   name: 'A4 — 2 per col',    pageW: 210, pageH: 297, marginT: 10, marginR: 10, marginB: 10, marginL: 10, cols: 1, rows: 2, gapH: 0, gapV: 5 },
  { id: 'a4_2x2',   name: 'A4 — 2×2 (4)',      pageW: 210, pageH: 297, marginT: 8,  marginR: 8,  marginB: 8,  marginL: 8,  cols: 2, rows: 2, gapH: 5, gapV: 5 },
  { id: 'a4_2x3',   name: 'A4 — 2×3 (6)',      pageW: 210, pageH: 297, marginT: 8,  marginR: 8,  marginB: 8,  marginL: 8,  cols: 2, rows: 3, gapH: 5, gapV: 5 },
  { id: 'a4_2x4',   name: 'A4 — 2×4 (8)',      pageW: 210, pageH: 297, marginT: 8,  marginR: 8,  marginB: 8,  marginL: 8,  cols: 2, rows: 4, gapH: 5, gapV: 5 },
  { id: 'a4_2x5',   name: 'A4 — 2×5 (10)',     pageW: 210, pageH: 297, marginT: 5,  marginR: 5,  marginB: 5,  marginL: 5,  cols: 2, rows: 5, gapH: 4, gapV: 4 },
  { id: 'a4_3x4',   name: 'A4 — 3×4 (12)',     pageW: 210, pageH: 297, marginT: 5,  marginR: 5,  marginB: 5,  marginL: 5,  cols: 3, rows: 4, gapH: 3, gapV: 3 },
  { id: 'a4_3x5',   name: 'A4 — 3×5 (15)',     pageW: 210, pageH: 297, marginT: 5,  marginR: 5,  marginB: 5,  marginL: 5,  cols: 3, rows: 5, gapH: 3, gapV: 3 },
  { id: 'a4_4x5',   name: 'A4 — 4×5 (20)',     pageW: 210, pageH: 297, marginT: 5,  marginR: 5,  marginB: 5,  marginL: 5,  cols: 4, rows: 5, gapH: 3, gapV: 3 },
  { id: 'a4l_2x2',  name: 'A4 Land 2×2 (4)',   pageW: 297, pageH: 210, marginT: 8,  marginR: 8,  marginB: 8,  marginL: 8,  cols: 2, rows: 2, gapH: 5, gapV: 5 },
  { id: 'a4l_3x2',  name: 'A4 Land 3×2 (6)',   pageW: 297, pageH: 210, marginT: 8,  marginR: 8,  marginB: 8,  marginL: 8,  cols: 3, rows: 2, gapH: 5, gapV: 5 },
  { id: 'a4l_4x2',  name: 'A4 Land 4×2 (8)',   pageW: 297, pageH: 210, marginT: 8,  marginR: 8,  marginB: 8,  marginL: 8,  cols: 4, rows: 2, gapH: 5, gapV: 5 },
  { id: 'a3_2x4',   name: 'A3 — 2×4 (8)',      pageW: 297, pageH: 420, marginT: 10, marginR: 10, marginB: 10, marginL: 10, cols: 2, rows: 4, gapH: 5, gapV: 5 },
  { id: 'a3_3x5',   name: 'A3 — 3×5 (15)',     pageW: 297, pageH: 420, marginT: 8,  marginR: 8,  marginB: 8,  marginL: 8,  cols: 3, rows: 5, gapH: 4, gapV: 4 },
  { id: 'a3_4x6',   name: 'A3 — 4×6 (24)',     pageW: 297, pageH: 420, marginT: 5,  marginR: 5,  marginB: 5,  marginL: 5,  cols: 4, rows: 6, gapH: 3, gapV: 3 },
  { id: 'let_2x4',  name: 'Letter 2×4 (8)',    pageW: 216, pageH: 279, marginT: 8,  marginR: 8,  marginB: 8,  marginL: 8,  cols: 2, rows: 4, gapH: 5, gapV: 5 },
  { id: 'leg_2x6',  name: 'Legal 2×6 (12)',    pageW: 216, pageH: 356, marginT: 8,  marginR: 8,  marginB: 8,  marginL: 8,  cols: 2, rows: 6, gapH: 5, gapV: 5 },
];

/* ─── Placeholder fields ─────────────────────────────────── */
const PLACEHOLDER_FIELDS = [
  { key: 'name',        label: 'Name' },
  { key: 'full_name',   label: 'Full Name' },
  { key: 'first_name',  label: 'First Name' },
  { key: 'middle_name', label: 'Middle Name' },
  { key: 'last_name',   label: 'Last Name' },
  { key: 'roll_number', label: 'Roll No' },
  { key: 'reg_no',      label: 'Reg No' },
  { key: 'course',      label: 'Course' },
  { key: 'batch',       label: 'Batch' },
  { key: 'mobile',      label: 'Mobile' },
  { key: 'father_name', label: "Father's Name" },
  { key: 'mother_name', label: "Mother's Name" },
  { key: 'aadhar_no',   label: 'Aadhar No' },
  { key: 'dob',         label: 'Date of Birth' },
  { key: 'education',   label: 'Education' },
  { key: 'class',       label: 'Class' },
  { key: 'section',     label: 'Section' },
  { key: 'email',       label: 'Email' },
  { key: 'photo',       label: 'Photo Frame' },
];

function studentToRow(s, batchName) {
  const dobDate = s.dob ? new Date(s.dob) : null;
  const dobStr = dobDate && !isNaN(dobDate)
    ? `${String(dobDate.getDate()).padStart(2, '0')}/${String(dobDate.getMonth() + 1).padStart(2, '0')}/${dobDate.getFullYear()}`
    : '—';
  return {
    name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name || 'Student',
    full_name: [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ') || s.name || 'Student',
    first_name: s.firstName || '—',
    middle_name: s.middleName || '',
    last_name: s.lastName || '—',
    roll_number: s.rollNo || s.roll_number || s.regNo || '—',
    reg_no: s.regNo || '—',
    course: s.course || '—',
    batch: s.batch || batchName || '—',
    mobile: s.mobileSelf || s.mobile || '—',
    father_name: s.fatherName || s.father_name || '—',
    mother_name: s.mothersName || '—',
    aadhar_no: s.aadharNo || '—',
    dob: dobStr,
    education: s.education || '—',
    class: s.class_name || s.class || '—',
    section: s.section || '—',
    email: s.email || '—',
    photo_url: s.photo_url || s.bg_removed_url || null,
  };
}

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
        bgcolor: '#ffffff', border: '1px solid #e2e8f0',
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:active': { transform: 'scale(0.97)' },
        '&:hover': { boxShadow: `0 4px 20px ${dt.color}33`, borderColor: `${dt.color}55` },
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
        <Typography sx={{ color: '#1e293b', fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.2 }}>{dt.label}</Typography>
        <Typography sx={{ color: '#64748b', fontSize: '0.65rem', mt: 0.3, lineHeight: 1.3 }}>{dt.desc}</Typography>
      </Box>
    </Box>
  );
}

/* ─── Home: recent design tile ─────────────────────────────────── */
function RecentTile({ dt, tpl, design, onClick }) {
  const thumbSrc = design?.thumbnail || dt.thumb;
  return (
    <Box
      onClick={onClick}
      sx={{
        width: 155, flexShrink: 0, cursor: 'pointer', borderRadius: 2.5, overflow: 'hidden',
        bgcolor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #f0f4f8',
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:active': { transform: 'scale(0.97)' },
        '&:hover': { boxShadow: '0 6px 18px rgba(0,0,0,0.12)', transform: 'translateY(-1px)' },
      }}
    >
      <Box sx={{ height: 115, overflow: 'hidden', position: 'relative' }}>
        {thumbSrc ? (
          <Box component="img" src={thumbSrc} alt={design?.name || dt.label}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Box sx={{
            height: '100%', background: `linear-gradient(135deg, ${tpl.thumb}cc, ${tpl.thumb})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AutoAwesomeIcon sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 26 }} />
          </Box>
        )}
        <IconButton
          size="small"
          onClick={e => e.stopPropagation()}
          sx={{ position: 'absolute', top: 5, right: 5, width: 26, height: 26, bgcolor: 'rgba(255,255,255,0.88)', '&:hover': { bgcolor: '#fff' } }}
        >
          <MoreHorizIcon sx={{ fontSize: 14, color: '#475569' }} />
        </IconButton>
      </Box>
      <Box sx={{ bgcolor: '#ffffff', px: 1.25, py: 1 }}>
        <Typography sx={{ color: '#1e293b', fontSize: '0.74rem', fontWeight: 600 }} noWrap>
          {design?.name || dt.label}
        </Typography>
        <Typography sx={{ color: '#94a3b8', fontSize: '0.62rem', mt: 0.2 }}>{tpl.label}</Typography>
      </Box>
    </Box>
  );
}

/* ─── Home nav item ───────────────────────────────────────────── */
function HomeNavItem({ icon, label, active, onClick }) {
  return (
    <Box onClick={onClick} sx={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 0.3, py: 1.1, cursor: 'pointer',
      color: active ? '#7c3aed' : '#94a3b8',
      '&:hover': { color: active ? '#7c3aed' : '#475569' },
      transition: 'color 0.15s',
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
        border: selected ? `2.5px solid #f0c040` : '2.5px solid transparent',
        boxShadow: selected ? `0 0 0 3px #f0c04044` : 'none',
        transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <AutoAwesomeIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }} />
      </Box>
      <Typography sx={{ fontSize: '0.62rem', color: '#64748b', mt: 0.4, display: 'block' }}>{tpl.label}</Typography>
    </Box>
  );
}

/* ─── Layout mini preview (SVG grid) ─────────────────────────── */
function LayoutPreview({ layout, size = 56 }) {
  const { pageW, pageH, marginT, marginR, marginB, marginL, cols, rows, gapH, gapV } = layout;
  const isLand = pageW > pageH;
  const aspect = pageH / pageW;
  const dW = isLand ? size : Math.round(size * (pageW / pageH));
  const dH = isLand ? Math.round(size * aspect) : size;
  const sx = dW / pageW;
  const sy = dH / pageH;
  const cellW = (pageW - marginL - marginR - (cols - 1) * gapH) / cols;
  const cellH = (pageH - marginT - marginB - (rows - 1) * gapV) / rows;
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({
        key: `${r}-${c}`,
        x: (marginL + c * (cellW + gapH)) * sx,
        y: (marginT + r * (cellH + gapV)) * sy,
        w: cellW * sx,
        h: cellH * sy,
      });
    }
  }
  return (
    <svg width={dW} height={dH} style={{ display: 'block', borderRadius: 2, border: '1px solid #e2e8f0', flexShrink: 0 }}>
      <rect width={dW} height={dH} fill="#f8fafc" />
      {cells.map(cell => (
        <rect key={cell.key} x={cell.x} y={cell.y} width={Math.max(0, cell.w)} height={Math.max(0, cell.h)}
          fill="#ddd6fe" stroke="#d4a017" strokeWidth="0.6" rx="0.8" />
      ))}
    </svg>
  );
}

/* ─── ID Card / Projects constants ────────────────────────────── */
const ID_STATUS_COLOR = {
  pending: 'default', not_available: 'error', student_submitted: 'warning', approved: 'success',
};
const ID_STATUS_LABEL = {
  pending: 'Pending', not_available: 'Not Available', student_submitted: 'Submitted', approved: 'Approved',
};

/* ─── Webcam capture dialog ────────────────────────────────────── */
function WebcamCapture({ open, onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then(stream => { streamRef.current = stream; if (videoRef.current) videoRef.current.srcObject = stream; })
      .catch(() => {});
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [open]);
  function capture() {
    const canvas = canvasRef.current; const video = videoRef.current;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(blob => { onCapture(blob); onClose(); }, 'image/jpeg', 0.92);
    streamRef.current?.getTracks().forEach(t => t.stop());
  }
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Capture Photo</DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: 8, maxHeight: 340, background: '#000' }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" startIcon={<PhotoCameraIcon />} onClick={capture}>Capture</Button>
      </DialogActions>
    </Dialog>
  );
}

/* ─── Student card in project grid ────────────────────────────── */
function ProjectStudentCard({ student, onPhotoUpload, onWebcam, onRemoveBg, onStatusChange, onShare, onApprove, onReject, tab }) {
  const photo = student.use_bg_removed ? student.bg_removed_url : student.photo_url;
  const displayName = student.student_name_override || student.student_name;
  const [bgLoading, setBgLoading] = useState(false);
  async function handleRemoveBg() { setBgLoading(true); await onRemoveBg(student.idcard_uuid); setBgLoading(false); }
  return (
    <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.5, bgcolor: '#fff', display: 'flex', flexDirection: 'column', gap: 1, transition: 'box-shadow 0.15s', '&:hover': { boxShadow: 3 } }}>
      <Box sx={{ position: 'relative', width: '100%', paddingTop: '100%', borderRadius: 1.5, overflow: 'hidden', bgcolor: '#f1f5f9' }}>
        {photo ? (
          <img src={photo} alt={displayName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PeopleIcon sx={{ fontSize: 40, color: '#cbd5e1' }} />
          </Box>
        )}
        <Chip label={ID_STATUS_LABEL[student.card_status]} color={ID_STATUS_COLOR[student.card_status]} size="small"
          sx={{ position: 'absolute', top: 6, right: 6, height: 18, fontSize: '0.6rem' }} />
      </Box>
      <Box>
        <Typography fontWeight={600} fontSize="0.8rem" noWrap>{displayName}</Typography>
        <Typography variant="caption" color="text.secondary">
          {student.class_name}{student.section ? ` - ${student.section}` : ''} · Roll {student.roll_number || '—'}
        </Typography>
      </Box>
      {tab === 0 && (
        <Stack direction="row" flexWrap="wrap" gap={0.5}>
          <Tooltip title="Upload photo">
            <IconButton size="small" component="label">
              <UploadFileIcon fontSize="small" />
              <input hidden type="file" accept="image/*" onChange={e => onPhotoUpload(student.idcard_uuid, e.target.files[0], 'teacher')} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Webcam capture">
            <IconButton size="small" onClick={() => onWebcam(student.idcard_uuid)}><PhotoCameraIcon fontSize="small" /></IconButton>
          </Tooltip>
          {photo && (
            <Tooltip title="Remove background">
              <IconButton size="small" onClick={handleRemoveBg} disabled={bgLoading}>
                {bgLoading ? <CircularProgress size={14} /> : <AutoFixHighIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
          {photo && student.bg_removed_url && (
            <Tooltip title={student.use_bg_removed ? 'Using BG removed' : 'Using original'}>
              <Switch size="small" checked={student.use_bg_removed}
                onChange={e => onStatusChange(student.idcard_uuid, { use_bg_removed: e.target.checked })} />
            </Tooltip>
          )}
          <Tooltip title="Share link with student">
            <IconButton size="small" onClick={() => onShare(student.idcard_uuid)} disabled={!photo}><ShareIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title={student.card_status === 'not_available' ? 'Mark available' : 'Mark not available'}>
            <IconButton size="small"
              onClick={() => onStatusChange(student.idcard_uuid, { card_status: student.card_status === 'not_available' ? 'pending' : 'not_available' })}
              color={student.card_status === 'not_available' ? 'error' : 'default'}>
              <BlockIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )}
      {tab === 1 && student.card_status === 'student_submitted' && (
        <Stack direction="row" spacing={0.5}>
          <Button size="small" variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => onApprove(student.idcard_uuid)}>Approve</Button>
          <Button size="small" variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => onReject(student.idcard_uuid)}>Reject</Button>
        </Stack>
      )}
    </Box>
  );
}

/* ─── Create project dialog ────────────────────────────────────── */
function CreateProjectDlg({ open, onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [year, setYear] = useState(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
  const [sigUrl, setSigUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  async function uploadSig(file) {
    setUploading(true);
    const fd = new FormData(); fd.append('image', file);
    try { const res = await apiClient.post('/api/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); setSigUrl(res.data.url || ''); } catch {}
    setUploading(false);
  }
  function handleClose() { setTitle(''); setYear(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`); setSigUrl(''); onClose(); }
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Create New Project</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Project Title *" value={title} onChange={e => setTitle(e.target.value)} size="small" fullWidth placeholder="e.g. 2025-26 Student ID Cards" />
          <TextField label="Academic Year" value={year} onChange={e => setYear(e.target.value)} size="small" fullWidth />
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Principal Signature (optional)</Typography>
            <Button variant="outlined" size="small" component="label" startIcon={uploading ? <CircularProgress size={14} /> : <UploadFileIcon />} disabled={uploading}>
              {sigUrl ? 'Change Signature' : 'Upload Signature'}
              <input hidden type="file" accept="image/*" onChange={e => uploadSig(e.target.files[0])} />
            </Button>
            {sigUrl && <img src={sigUrl} alt="sig" style={{ height: 40, marginLeft: 12, verticalAlign: 'middle', objectFit: 'contain' }} />}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" disabled={!title} onClick={() => onSave({ title, academic_year: year, principal_signature_url: sigUrl })}>Create</Button>
      </DialogActions>
    </Dialog>
  );
}

/* ─── Add single student dialog ────────────────────────────────── */
function AddStudentDlg({ open, onSave, onClose }) {
  const [form, setForm] = useState({ student_name: '', class_name: '', section: '', roll_number: '' });
  function handleClose() { setForm({ student_name: '', class_name: '', section: '', roll_number: '' }); onClose(); }
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Add Student</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Student Name *" value={form.student_name} onChange={e => setForm(f => ({ ...f, student_name: e.target.value }))} size="small" fullWidth />
          <Stack direction="row" spacing={1.5}>
            <TextField label="Class *" value={form.class_name} onChange={e => setForm(f => ({ ...f, class_name: e.target.value }))} size="small" fullWidth />
            <TextField label="Section" value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} size="small" fullWidth />
          </Stack>
          <TextField label="Roll Number" value={form.roll_number} onChange={e => setForm(f => ({ ...f, roll_number: e.target.value }))} size="small" fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" disabled={!form.student_name || !form.class_name} onClick={() => onSave(form)}>Add</Button>
      </DialogActions>
    </Dialog>
  );
}

/* ─── Stat pill ─────────────────────────────────────────────────── */
function StatPill({ label, value, color = 'text.primary', bg = '#f8fafc' }) {
  return (
    <Box sx={{ bgcolor: bg, borderRadius: 2, px: 2, py: 1, minWidth: 72, textAlign: 'center', border: '1px solid #e2e8f0' }}>
      <Typography fontWeight={700} color={color} fontSize="1rem">{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
  );
}

/* ─── Main component ──────────────────────────────────────────── */
export default function DocumentMaker() {
  const navigate = useNavigate();
  const { username } = useParams();
  const isDesktop = useMediaQuery('(min-width:900px)');

  const canvasRef      = useRef(null);
  const fabricRef      = useRef(null);
  const containerRef   = useRef(null);
  const fileInputRef   = useRef(null);
  const sigInputRef    = useRef(null);
  const uploadInputRef = useRef(null);

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
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [savingDesign, setSavingDesign] = useState(false);
  const [designName,   setDesignName]   = useState('');
  const [currentDesignId, setCurrentDesignId] = useState(null);
  const [fillStudent,  setFillStudent]  = useState('');
  const [students,     setStudents]     = useState([]);

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

  const pageSetupRef     = useRef(null);
  const suppressDirtyRef = useRef(false);
  const carouselStatesRef = useRef({});
  const carouselBaseTemplateRef = useRef(null);
  const initParamsRef    = useRef(null);   // { type, tplIdx } set by openEditor/switchTemplate
  const frameInputRef    = useRef(null);
  const svgInputRef      = useRef(null);
  const bulkFrameRef     = useRef(null);
  const historyRef     = useRef([]);
  const historyIdxRef  = useRef(-1);
  const skipHistoryRef = useRef(false);
  const [pageSetup,       setPageSetup]       = useState(null);
  const [tempSetup,       setTempSetup]       = useState(null);
  const [pageSetupDialog, setPageSetupDialog] = useState(false);
  const [printCopies,     setPrintCopies]     = useState(1);
  const [printing,        setPrinting]        = useState(false);
  const [isDirty,         setIsDirty]         = useState(false);
  const [exitConfirmDlg,  setExitConfirmDlg]  = useState(false);
  const [pendingExit,     setPendingExit]      = useState(null);
  const [galleryDialog,   setGalleryDialog]   = useState(false);
  const [carouselIdx,     setCarouselIdx]     = useState(0);
  const [carouselFields,  setCarouselFields]  = useState({ name: '', rollNo: '', course: '', batch: '' });
  const [userZoom,        setUserZoom]        = useState(1);

  // New Canva features state
  const [fontFamily,   setFontFamily]   = useState('Arial');
  const [letterSp,     setLetterSp]     = useState(0);
  const [objOpacity,   setObjOpacity]   = useState(1);
  const [objAngle,     setObjAngle]     = useState(0);
  const [bgColor,      setBgColor]      = useState('#ffffff');
  const [imgBright,    setImgBright]    = useState(0);
  const [imgContrast,  setImgContrast]  = useState(0);
  const [canUndo,      setCanUndo]      = useState(false);
  const [canRedo,      setCanRedo]      = useState(false);

  const [dataSource,    setDataSource]    = useState('batch'); // 'batch' | 'csv'
  const [csvRows,       setCsvRows]       = useState([]);
  const [csvFile,       setCsvFile]       = useState('');
  const csvInputRef = useRef(null);
  const [customPh,      setCustomPh]      = useState('');

  // Multi-selection and photo-adjust state
  const [selectedObjs,    setSelectedObjs]    = useState([]);
  const [photoAdjustMode, setPhotoAdjustMode] = useState(false);
  const photoAdjustModeRef = useRef(false);

  const [editorMode,      setEditorMode]      = useState('single');  // 'single' | 'bulk' | 'batch'
  const [modeSelectDlg,   setModeSelectDlg]   = useState(false);
  const [pendingDocType,  setPendingDocType]  = useState('id_card');
  const [pendingTplIdx,   setPendingTplIdx]   = useState(0);
  const [modeDialogMode,  setModeDialogMode]  = useState('single');
  const [modeDialogBatch, setModeDialogBatch] = useState('');

  // ── Projects / student management state ───────────────────────
  const [projects,          setProjects]          = useState([]);
  const [selectedProject,   setSelectedProject]   = useState(null);
  const [projectStudents,   setProjectStudents]   = useState([]);
  const [projectTab,        setProjectTab]        = useState(0);
  const [classFilter,       setClassFilter]       = useState('');
  const [projectClasses,    setProjectClasses]    = useState([]);
  const [projectsLoading,   setProjectsLoading]   = useState(false);
  const [projStudLoading,   setProjStudLoading]   = useState(false);
  const [createProjDlg,     setCreateProjDlg]     = useState(false);
  const [addStudentDlg,     setAddStudentDlg]     = useState(false);
  const [bulkPhotoDlg,      setBulkPhotoDlg]      = useState(false);
  const [excelImportDlg,    setExcelImportDlg]    = useState(false);
  const [webcamTarget,      setWebcamTarget]      = useState(null);
  const [magicLinkDlg,      setMagicLinkDlg]      = useState(null);
  const [bulkClass,         setBulkClass]         = useState('');
  const [bulkUploading,     setBulkUploading]     = useState(false);
  const [excelImportRows,   setExcelImportRows]   = useState([]);
  const [excelPreview,      setExcelPreview]      = useState([]);
  const [importing,         setImporting]         = useState(false);

  // Layout management
  const [layoutDialog,   setLayoutDialog]   = useState(false);
  const [editingLayout,  setEditingLayout]  = useState(null);
  const [userLayouts,    setUserLayouts]    = useState([]);
  const [presetsOpen,    setPresetsOpen]    = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [explorePage,    setExplorePage]    = useState(0);

  function showAlert(type, text) { setAlert({ type, text }); setTimeout(() => setAlert(null), 4000); }

  // ── Project management helpers ─────────────────────────────────
  async function loadProjects() {
    setProjectsLoading(true);
    try {
      const res = await apiClient.get(`/api/idcard/projects?institute_uuid=${instituteId}`);
      setProjects(res.data.result || []);
    } catch { showAlert('error', 'Failed to load projects'); }
    finally { setProjectsLoading(false); }
  }

  async function loadProjectStudents(projectUuid, cls = classFilter) {
    setProjStudLoading(true);
    try {
      const params = new URLSearchParams();
      if (cls) params.set('class_name', cls);
      const tabStatus = projectTab === 1 ? 'student_submitted' : projectTab === 2 ? 'approved' : '';
      if (tabStatus) params.set('card_status', tabStatus);
      const res = await apiClient.get(`/api/idcard/projects/${projectUuid}/students?${params}`);
      const list = res.data.result || [];
      setProjectStudents(list);
      const unique = [...new Set(list.map(s => s.class_name).filter(Boolean))].sort();
      if (!cls) setProjectClasses(unique);
    } catch { showAlert('error', 'Failed to load students'); }
    finally { setProjStudLoading(false); }
  }

  async function createNewProject(data) {
    try {
      const loginUsername = localStorage.getItem('login_username') || 'admin';
      const res = await apiClient.post('/api/idcard/projects', { ...data, institute_uuid: instituteId, createdBy: loginUsername });
      setCreateProjDlg(false);
      showAlert('success', 'Project created!');
      setProjects(p => [res.data.result, ...p]);
    } catch (err) { showAlert('error', err.response?.data?.message || 'Failed to create project'); }
  }

  async function addStudentToProject(data) {
    try {
      await apiClient.post(`/api/idcard/projects/${selectedProject.project_uuid}/students`, { students: [data] });
      setAddStudentDlg(false);
      showAlert('success', 'Student added!');
      loadProjectStudents(selectedProject.project_uuid);
    } catch (err) { showAlert('error', err.response?.data?.message || 'Failed'); }
  }

  function parseExcelForImport(file) {
    const reader = new FileReader();
    reader.onload = e => {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      setExcelImportRows(rows);
      setExcelPreview(rows.slice(0, 5));
      setExcelImportDlg(true);
    };
    reader.readAsArrayBuffer(file);
  }

  async function importStudentsFromExcel() {
    setImporting(true);
    try {
      const res = await apiClient.post(`/api/idcard/projects/${selectedProject.project_uuid}/students`, { students: excelImportRows });
      setExcelImportDlg(false);
      setExcelImportRows([]);
      showAlert('success', `Imported ${res.data.count} students!`);
      loadProjectStudents(selectedProject.project_uuid);
    } catch (err) { showAlert('error', err.response?.data?.message || 'Import failed'); }
    finally { setImporting(false); }
  }

  async function uploadStudentPhoto(idcardUuid, file, source = 'teacher') {
    if (!file) return;
    const fd = new FormData(); fd.append('photo', file); fd.append('source', source);
    try {
      await apiClient.post(`/api/idcard/students/${idcardUuid}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showAlert('success', 'Photo updated');
      loadProjectStudents(selectedProject.project_uuid);
    } catch { showAlert('error', 'Photo upload failed'); }
  }

  async function handleWebcamCapture(blob) {
    if (!webcamTarget) return;
    const file = new File([blob], 'webcam.jpg', { type: 'image/jpeg' });
    await uploadStudentPhoto(webcamTarget, file, 'webcam');
    setWebcamTarget(null);
  }

  async function bulkUploadPhotos(files) {
    setBulkUploading(true);
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append('photos', f));
    if (bulkClass) fd.append('class_name', bulkClass);
    try {
      const res = await apiClient.post(`/api/idcard/projects/${selectedProject.project_uuid}/photos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setBulkPhotoDlg(false);
      showAlert('success', `Matched ${res.data.matched} / ${res.data.matched + res.data.unmatched} photos`);
      loadProjectStudents(selectedProject.project_uuid);
    } catch { showAlert('error', 'Bulk upload failed'); }
    finally { setBulkUploading(false); }
  }

  async function removeStudentBg(idcardUuid) {
    try {
      const res = await apiClient.post(`/api/idcard/students/${idcardUuid}/remove-bg`);
      showAlert('success', 'Background removed!');
      setProjectStudents(p => p.map(s => s.idcard_uuid === idcardUuid ? { ...s, bg_removed_url: res.data.bg_removed_url, use_bg_removed: true } : s));
    } catch (err) { showAlert('error', err.response?.data?.message || 'BG removal failed'); }
  }

  async function updateStudentStatus(idcardUuid, update) {
    try {
      await apiClient.put(`/api/idcard/students/${idcardUuid}/status`, update);
      setProjectStudents(p => p.map(s => s.idcard_uuid === idcardUuid ? { ...s, ...update } : s));
    } catch { showAlert('error', 'Update failed'); }
  }

  async function generateMagicLink(idcardUuid) {
    try {
      const res = await apiClient.post(`/api/idcard/students/${idcardUuid}/magic-link`);
      setMagicLinkDlg({ link: res.data.link });
    } catch { showAlert('error', 'Failed to generate link'); }
  }

  async function approveStudentCard(idcardUuid) {
    try {
      const loginUsername = localStorage.getItem('login_username') || 'admin';
      await apiClient.put(`/api/idcard/students/${idcardUuid}/approve`, { approved_by: loginUsername });
      showAlert('success', 'Approved!');
      loadProjectStudents(selectedProject.project_uuid);
    } catch { showAlert('error', 'Approve failed'); }
  }

  async function rejectStudentCard(idcardUuid) {
    try {
      await apiClient.put(`/api/idcard/students/${idcardUuid}/reject`);
      showAlert('success', 'Sent back for revision');
      loadProjectStudents(selectedProject.project_uuid);
    } catch { showAlert('error', 'Reject failed'); }
  }

  function zoomIn()  { setUserZoom(prev => Math.min(4, +(prev + 0.25).toFixed(2))); }
  function zoomOut() { setUserZoom(prev => Math.max(0.25, +(prev - 0.25).toFixed(2))); }
  function zoomFit() { setUserZoom(1); }

  /* ── History (undo / redo) ─────────────────────────────────── */
  const CUSTOM_PROPS = ['__placeholder', '__frameType', '__frameBounds'];

  function pushHistory() {
    if (!fabricRef.current || skipHistoryRef.current || suppressDirtyRef.current) return;
    const json = JSON.stringify(fabricRef.current.toJSON(CUSTOM_PROPS));
    historyRef.current = historyRef.current.slice(0, historyIdxRef.current + 1);
    historyRef.current.push(json);
    if (historyRef.current.length > 40) historyRef.current.shift();
    historyIdxRef.current = historyRef.current.length - 1;
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(false);
  }

  async function undo() {
    if (!fabricRef.current || historyIdxRef.current <= 0) return;
    historyIdxRef.current--;
    skipHistoryRef.current = true;
    await new Promise(r => fabricRef.current.loadFromJSON(JSON.parse(historyRef.current[historyIdxRef.current]), r));
    fabricRef.current.renderAll();
    skipHistoryRef.current = false;
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(true);
    setSelectedObj(null);
    setIsDirty(true);
  }

  async function redo() {
    if (!fabricRef.current || historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current++;
    skipHistoryRef.current = true;
    await new Promise(r => fabricRef.current.loadFromJSON(JSON.parse(historyRef.current[historyIdxRef.current]), r));
    fabricRef.current.renderAll();
    skipHistoryRef.current = false;
    setCanUndo(true);
    setCanRedo(historyIdxRef.current < historyRef.current.length - 1);
    setSelectedObj(null);
    setIsDirty(true);
  }

  /* ── Object helpers ────────────────────────────────────────── */
  function applyObjProp(prop, value) {
    const obj = fabricRef.current?.getActiveObject();
    if (!obj) return;
    obj.set(prop, value); fabricRef.current.renderAll();
  }

  function alignObj(dir) {
    const obj = fabricRef.current?.getActiveObject();
    const fc = fabricRef.current;
    if (!obj || !fc) return;
    switch (dir) {
      case 'left':    obj.set('left', 0); break;
      case 'hcenter': obj.set('left', (fc.width - obj.getScaledWidth()) / 2); break;
      case 'right':   obj.set('left', fc.width - obj.getScaledWidth()); break;
      case 'top':     obj.set('top', 0); break;
      case 'vcenter': obj.set('top', (fc.height - obj.getScaledHeight()) / 2); break;
      case 'bottom':  obj.set('top', fc.height - obj.getScaledHeight()); break;
      default: break;
    }
    obj.setCoords(); fc.renderAll(); pushHistory();
  }

  function applyLayer(dir) {
    const obj = fabricRef.current?.getActiveObject();
    const fc = fabricRef.current;
    if (!obj || !fc) return;
    if (dir === 'front') fc.bringToFront(obj);
    else if (dir === 'up') fc.bringForward(obj);
    else if (dir === 'down') fc.sendBackwards(obj);
    else fc.sendToBack(obj);
    fc.renderAll(); pushHistory();
  }

  function duplicateObj() {
    const obj = fabricRef.current?.getActiveObject();
    const fc = fabricRef.current;
    if (!obj || !fc) return;
    obj.clone(cloned => {
      cloned.set({ left: (obj.left || 0) + 12, top: (obj.top || 0) + 12, evented: true });
      fc.add(cloned); fc.setActiveObject(cloned); fc.renderAll(); pushHistory();
    });
  }

  function setCanvasBg(color) {
    const fc = fabricRef.current;
    if (!fc) return;
    fc.backgroundColor = color; fc.renderAll();
    setBgColor(color); setIsDirty(true); pushHistory();
  }

  function applyImageFilter(type, value) {
    const obj = fabricRef.current?.getActiveObject();
    if (!obj || obj.type !== 'image') return;
    const fab = fabricModule?.fabric;
    if (!fab) return;
    obj.filters = (obj.filters || []).filter(f => f.type !== type);
    if (type === 'Brightness' && value !== 0) obj.filters.push(new fab.Image.filters.Brightness({ brightness: value }));
    if (type === 'Contrast'   && value !== 0) obj.filters.push(new fab.Image.filters.Contrast({ contrast: value }));
    obj.applyFilters(); fabricRef.current.renderAll();
  }

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
    const pad = 12;
    const cw = containerRef.current.clientWidth  - pad * 2;
    const ch = containerRef.current.clientHeight - pad * 2;
    const fw = fabricRef.current.width;
    const fh = fabricRef.current.height;
    const sx = fw > cw ? cw / fw : 1;
    const sy = fh > ch ? ch / fh : 1;
    setScale(Math.min(sx, sy, 1));   // never scale up, only down to fit
  }, []);

  async function loadCustomTemplates() {
    if (!instituteId) return;
    setLoadingTemplates(true);
    try {
      const r = await apiClient.get(`/api/custom-templates?institute_uuid=${instituteId}`);
      setCustomTemplates(Array.isArray(r.data?.result) ? r.data.result : []);
    } catch { /* silently ignore */ } finally {
      setLoadingTemplates(false);
    }
  }

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

  async function handleDeleteTemplate(uuid) {
    try {
      await apiClient.delete(`/api/custom-templates/${uuid}`);
      setCustomTemplates(prev => prev.filter(t => t.template_uuid !== uuid));
      showAlert('success', 'Template deleted');
    } catch {
      showAlert('error', 'Delete failed');
    }
  }

  async function handleUseCustomTemplate(imageUrl) {
    openEditor(docType, 0);
    setTimeout(async () => {
      if (!fabricRef.current) return;
      const { fabric } = await getFabric();
      fabric.Image.fromURL(imageUrl, (img) => {
        if (!fabricRef.current) return;
        const { w, h } = DOC_TYPES.find(d => d.key === docType)?.dims || { w: 794, h: 562 };
        img.scaleToWidth(w);
        fabricRef.current.setBackgroundImage(img, fabricRef.current.renderAll.bind(fabricRef.current));
      }, { crossOrigin: 'anonymous' });
    }, 400);
  }

  function attachCanvasListeners(fc) {
    fc.on('selection:created', handleSelect);
    fc.on('selection:updated', handleSelect);
    fc.on('selection:cleared', () => {
      setSelectedObj(null);
      setSelectedObjs([]);
      if (photoAdjustModeRef.current) {
        setPhotoAdjustMode(false);
        photoAdjustModeRef.current = false;
      }
    });
    fc.on('object:added',    () => { if (!suppressDirtyRef.current) { setIsDirty(true); pushHistory(); } });
    fc.on('object:modified', () => { if (!suppressDirtyRef.current) { setIsDirty(true); pushHistory(); } });
    fc.on('object:removed',  () => { if (!suppressDirtyRef.current) { setIsDirty(true); pushHistory(); } });
    fc.on('mouse:dblclick', handleDblClick);
    fc.on('object:moving', e => {
      const obj = e.target;
      if (obj.__frameType && obj.type === 'image' && obj.clipPath?.absolutePositioned && !photoAdjustModeRef.current) {
        // Normal move: keep absolutePositioned clip in sync with the image
        obj.clipPath.left = obj.left;
        obj.clipPath.top = obj.top;
        if (obj.__frameBounds) {
          const hw = obj.__frameBounds.width / 2;
          const hh = obj.__frameBounds.height / 2;
          obj.__frameBounds = { ...obj.__frameBounds, left: obj.left - hw, top: obj.top - hh };
        }
      }
      // In adjust mode: clip stays fixed, image moves freely (pan effect)
    });
  }

  // tplIdx = null  → blank white canvas (default when opening from home)
  // tplIdx = 0..N  → seed canvas with that template design (Templates tab tiles)
  // pendingJSON     → restore a saved design JSON
  async function initCanvas(type, tplIdx = null, pendingJSON = null) {
    try {
      const { fabric } = await getFabric();
      if (fabricRef.current) { fabricRef.current.dispose(); fabricRef.current = null; }
      if (!canvasRef.current) { setReady(true); return; }
      const { w, h } = DOC_TYPES.find(d => d.key === type).dims;
      const fc = new fabric.Canvas(canvasRef.current, { width: w, height: h, selection: true });
      fabricRef.current = fc;
      attachCanvasListeners(fc);
      suppressDirtyRef.current = true;
      if (pendingJSON) {
        await new Promise(res => fc.loadFromJSON(pendingJSON, () => { fc.renderAll(); res(); }));
      } else if (tplIdx !== null) {
        const tpl = (TEMPLATES[type] || [])[tplIdx] || (TEMPLATES[type] || [])[0];
        if (tpl) await seedCanvas(fc, type, tpl, {}, instituteName);
        else { fc.backgroundColor = '#ffffff'; fc.renderAll(); }
        await drawMGuides(fc, pageSetupRef.current);
      } else {
        fc.backgroundColor = '#ffffff';
        fc.renderAll();
        await drawMGuides(fc, pageSetupRef.current);
      }
      suppressDirtyRef.current = false;
      setIsDirty(false);
      historyRef.current = [JSON.stringify(fc.toJSON(CUSTOM_PROPS))];
      historyIdxRef.current = 0;
      setCanUndo(false); setCanRedo(false);
      setBgColor(typeof fc.backgroundColor === 'string' ? fc.backgroundColor : '#ffffff');
      setReady(true);
      setTimeout(updateScale, 50);
    } catch (err) {
      console.error('[Canvas] initCanvas error:', err);
      suppressDirtyRef.current = false;
      setReady(true);   // always unblock the spinner even on error
      showAlert('error', 'Canvas init failed: ' + (err?.message || err));
    }
  }

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
      attachCanvasListeners(canvas);
      setIsDirty(false);
      setReady(true);
    } catch (err) {
      showAlert('error', 'Could not load template: ' + err.message);
    }
  }

  function handleSelect(e) {
    const fc = fabricRef.current;
    const allSelected = fc ? fc.getActiveObjects() : (e.selected || []);
    setSelectedObjs(allSelected);
    const obj = e.selected?.[0];
    if (!obj) return;
    if (photoAdjustModeRef.current) {
      setPhotoAdjustMode(false);
      photoAdjustModeRef.current = false;
    }
    setSelectedObj(obj);
    setObjOpacity(obj.opacity !== undefined ? obj.opacity : 1);
    setObjAngle(Math.round(obj.angle || 0));
    if (obj.type === 'i-text' || obj.type === 'text') {
      setFontSize(obj.fontSize || 14);
      setFontColor(obj.fill || '#1e293b');
      setIsBold(obj.fontWeight === 'bold');
      setIsItalic(obj.fontStyle === 'italic');
      setFontFamily(obj.fontFamily || 'Arial');
      setLetterSp(Math.round(obj.charSpacing || 0));
      setToolTab(1); // → Text tab
    } else if (obj.type === 'image') {
      const bright = obj.filters?.find(f => f.type === 'Brightness')?.brightness ?? 0;
      const cont   = obj.filters?.find(f => f.type === 'Contrast')?.contrast ?? 0;
      setImgBright(bright); setImgContrast(cont);
      setToolTab(2); // → Object tab
    } else {
      setToolTab(2); // → Object tab
    }
  }

  function handleDblClick(e) {
    const obj = e.target;
    if (obj && obj.__frameType && obj.type === 'image' && obj.clipPath?.absolutePositioned) {
      setPhotoAdjustMode(true);
      photoAdjustModeRef.current = true;
      setSelectedObj(obj);
      setToolTab(2);
    }
  }

  function exitPhotoAdjustMode() {
    setPhotoAdjustMode(false);
    photoAdjustModeRef.current = false;
    pushHistory();
  }

  function confirmThen(action) {
    if (isDirty) {
      setPendingExit(() => action);
      setExitConfirmDlg(true);
    } else {
      action();
    }
  }

  function handleBack() {
    confirmThen(() => { setIsDirty(false); setView('home'); });
  }

  function openEditor(type, tplIdx = 0, mode = 'single') {
    setEditorMode(mode);
    const setup = { ...(DEFAULT_SETUPS[type] || DEFAULT_SETUPS.result) };
    pageSetupRef.current = setup;
    initParamsRef.current = { type, tplIdx: null };   // null = blank canvas on first open
    setPageSetup(setup);
    setTempSetup(setup);
    setDocType(type);
    setSelectedTpl(tplIdx);
    setSelectedObj(null);
    setToolTab(0);
    setReady(false);
    setIsDirty(false);
    carouselStatesRef.current = {};
    carouselBaseTemplateRef.current = null;
    setCarouselIdx(0);
    setView('editor');
    // initCanvas is triggered by the useEffect([view]) — never call it here directly
  }

  function pickMode(type, tplIdx = 0) {
    setPendingDocType(type);
    setPendingTplIdx(tplIdx);
    setModeDialogMode('single');
    setModeDialogBatch('');
    setModeSelectDlg(true);
  }

  function confirmModeAndOpen() {
    const mode = modeDialogMode;
    if ((mode === 'bulk' || mode === 'batch') && modeDialogBatch) {
      setSelBatch(modeDialogBatch);
    }
    setModeSelectDlg(false);
    openEditor(pendingDocType, pendingTplIdx, mode);
  }

  function saveBulkCanvas() {
    const fc = fabricRef.current;
    if (!fc || !batchStudents.length) return;
    const cur = batchStudents[carouselIdx];
    const curKey = cur?.uuid || cur?._id || String(carouselIdx);
    carouselStatesRef.current[curKey] = JSON.stringify(fc.toJSON(CUSTOM_PROPS));
    showAlert('success', `Saved card for ${carouselFields.name || 'student'}`);
  }

  async function exportBulkPDF() {
    saveBulkCanvas();
    const setup = pageSetupRef.current;
    if (!setup || !batchStudents.length) return;
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
        const sKey = s?.uuid || s?._id || String(idx);
        const el = document.createElement('canvas'); document.body.appendChild(el);
        const { w, h } = DOC_TYPES.find(d => d.key === docType).dims;
        const fc = new fabric.Canvas(el, { width: w, height: h });
        if (carouselStatesRef.current[sKey]) {
          await new Promise(r => fc.loadFromJSON(JSON.parse(carouselStatesRef.current[sKey]), () => { fc.renderAll(); r(); }));
        } else {
          await seedCanvas(fc, docType, tpl, studentToRow(s, selBatch), instituteName);
        }
        const imgData = fc.toDataURL({ format: 'png', multiplier: 3 });
        if (idx > 0) pdf.addPage([wMM, hMM], isLand ? 'landscape' : 'portrait');
        pdf.addImage(imgData, 'PNG', setup.marginL, setup.marginT, pW, pH);
        fc.dispose(); document.body.removeChild(el);
      }
      pdf.save(`bulk_${docType}.pdf`);
      showAlert('success', `Bulk PDF ready — ${batchStudents.length} pages!`);
    } catch (err) { showAlert('error', err.message); }
    finally { setGenerating(false); }
  }

  async function goCarousel(newIdx) {
    if (newIdx < 0 || newIdx >= batchStudents.length) return;
    const fc = fabricRef.current;
    if (fc) {
      const cur = batchStudents[carouselIdx];
      const curKey = cur?.uuid || cur?._id || String(carouselIdx);
      suppressDirtyRef.current = true;
      carouselStatesRef.current[curKey] = JSON.stringify(fc.toJSON(CUSTOM_PROPS));
      suppressDirtyRef.current = false;
    }
    const nxt = batchStudents[newIdx];
    const nxtKey = nxt?.uuid || nxt?._id || String(newIdx);
    const row = studentToRow(nxt, selBatch);
    setCarouselIdx(newIdx);
    setCarouselFields({ name: row.name, rollNo: row.roll_number, course: row.course, batch: row.batch });
    if (!fc) return;
    suppressDirtyRef.current = true;
    if (carouselStatesRef.current[nxtKey]) {
      // Load this student's individually saved/adjusted canvas
      await new Promise(res => fc.loadFromJSON(JSON.parse(carouselStatesRef.current[nxtKey]), () => { fc.renderAll(); res(); }));
    } else {
      const baseTemplate = carouselBaseTemplateRef.current;
      const hasPlaceholders = baseTemplate && (baseTemplate.objects || []).some(o => o.__placeholder);
      if (hasPlaceholders) {
        await renderRowToCanvas(fc, baseTemplate, row);
      } else {
        const tpl = (TEMPLATES[docType] || [])[selectedTpl] || TEMPLATES[docType][0];
        await seedCanvas(fc, docType, tpl, { name: row.name, rollNo: row.roll_number, course: row.course, batch: row.batch }, instituteName);
      }
    }
    suppressDirtyRef.current = false;
    updateScale();
  }

  async function applyCarouselToCanvas() {
    if (!fabricRef.current || !batchStudents.length) return;
    const tpl = (TEMPLATES[docType] || [])[selectedTpl] || TEMPLATES[docType][0];
    suppressDirtyRef.current = true;
    setReady(false);
    await seedCanvas(fabricRef.current, docType, tpl, carouselFields, instituteName);
    suppressDirtyRef.current = false;
    setReady(true);
  }

  async function addGalleryImage(url) {
    const { fabric } = await getFabric();
    if (!fabricRef.current) return;
    fabric.Image.fromURL(url, (img) => {
      if (!fabricRef.current) return;
      const fc = fabricRef.current;
      img.scaleToWidth(Math.min(fc.width / 2, 200));
      img.set({ left: 50, top: 50 });
      fc.add(img);
      fc.setActiveObject(img);
      fc.renderAll();
    }, { crossOrigin: 'anonymous' });
    setGalleryDialog(false);
  }

  useEffect(() => {
    if (view === 'editor') {
      // Always dispose any stale canvas before creating a fresh one
      if (fabricRef.current) { fabricRef.current.dispose(); fabricRef.current = null; }
      const params = initParamsRef.current || { type: docType, tplIdx: null, pendingJSON: null };
      initParamsRef.current = null;
      initCanvas(params.type, params.tplIdx, params.pendingJSON ?? null);
    } else {
      if (fabricRef.current) { fabricRef.current.dispose(); fabricRef.current = null; }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    let obj;
    if (shape === 'rect')     obj = new fabric.Rect({ left: 60, top: 60, width: 100, height: 60, fill: '#e8f5e9', stroke: '#1a7a4a', strokeWidth: 1.5, rx: 4, ry: 4 });
    else if (shape === 'circle')   obj = new fabric.Circle({ left: 60, top: 60, radius: 40, fill: '#e8f5e9', stroke: '#1a7a4a', strokeWidth: 1.5 });
    else if (shape === 'triangle') obj = new fabric.Triangle({ left: 60, top: 60, width: 80, height: 80, fill: '#e8f5e9', stroke: '#1a7a4a', strokeWidth: 1.5 });
    else if (shape === 'line')     obj = new fabric.Line([0, 0, 150, 0], { left: 60, top: 80, stroke: '#1e293b', strokeWidth: 2 });
    if (obj) { fc.add(obj); fc.setActiveObject(obj); fc.renderAll(); pushHistory(); setIsDirty(true); }
  }

  async function addFrame(shapeType) {
    const { fabric } = await getFabric();
    const fc = fabricRef.current; if (!fc) return;
    const w = shapeType === 'circle' ? 130 : 140;
    const h = shapeType === 'circle' ? 130 : 180;
    let border;
    if (shapeType === 'circle') {
      border = new fabric.Circle({ radius: w / 2, fill: '#fff8e1', stroke: '#d4a017', strokeWidth: 2, strokeDashArray: [8, 4] });
    } else if (shapeType === 'rounded') {
      border = new fabric.Rect({ width: w, height: h, fill: '#fff8e1', stroke: '#d4a017', strokeWidth: 2, strokeDashArray: [8, 4], rx: 24, ry: 24 });
    } else {
      border = new fabric.Rect({ width: w, height: h, fill: '#fff8e1', stroke: '#d4a017', strokeWidth: 2, strokeDashArray: [8, 4], rx: 4, ry: 4 });
    }
    const cx = w / 2; const cy = shapeType === 'circle' ? w / 2 : h / 2;
    const lbl = new fabric.Text('+ Photo', { left: cx, top: cy, originX: 'center', originY: 'center', fontSize: 12, fill: '#d4a017', fontFamily: 'Arial', fontWeight: 'bold', selectable: false, evented: false });
    const grp = new fabric.Group([border, lbl], { left: 60, top: 60 });
    grp.__frameType = shapeType;
    fc.add(grp); fc.setActiveObject(grp); fc.renderAll(); pushHistory(); setIsDirty(true);
  }

  async function fillFrameWithPhoto(file) {
    const fc = fabricRef.current;
    const obj = fc?.getActiveObject();
    if (!fc || !file) return;
    const { fabric } = await getFabric();
    const shapeType = obj?.__frameType || 'rect';
    const tLeft  = obj ? (obj.left || 0) : 60;
    const tTop   = obj ? (obj.top  || 0) : 60;
    const tW     = obj ? obj.getScaledWidth()  : 140;
    const tH     = obj ? obj.getScaledHeight() : 180;
    const reader = new FileReader();
    reader.onload = ev => {
      fabric.Image.fromURL(ev.target.result, img => {
        const scale = Math.max(tW / img.width, tH / img.height);
        img.scale(scale);
        const centerLeft = tLeft + tW / 2;
        const centerTop  = tTop  + tH / 2;
        let clip;
        if (shapeType === 'circle') {
          clip = new fabric.Circle({ radius: Math.min(tW, tH) / 2, left: centerLeft, top: centerTop, originX: 'center', originY: 'center', absolutePositioned: true });
        } else if (shapeType === 'rounded') {
          clip = new fabric.Rect({ width: tW, height: tH, rx: 24, ry: 24, left: centerLeft, top: centerTop, originX: 'center', originY: 'center', absolutePositioned: true });
        } else {
          clip = new fabric.Rect({ width: tW, height: tH, left: centerLeft, top: centerTop, originX: 'center', originY: 'center', absolutePositioned: true });
        }
        img.clipPath = clip;
        img.__frameBounds = { left: tLeft, top: tTop, width: tW, height: tH };
        img.set({ left: centerLeft, top: centerTop, originX: 'center', originY: 'center' });
        if (obj) fc.remove(obj);
        img.__frameType = shapeType;
        fc.add(img); fc.setActiveObject(img); fc.renderAll();
        setSelectedObj(img); setToolTab(2);
        pushHistory(); setIsDirty(true);
      }, { crossOrigin: 'anonymous' });
    };
    reader.readAsDataURL(file);
  }

  async function changeSelectedFrameType(shapeType) {
    const fc = fabricRef.current;
    if (!fc) return;
    const { fabric } = await getFabric();
    const targets = fc.getActiveObjects().filter(o => o.__frameType);
    if (!targets.length) return;
    for (const obj of targets) {
      if (obj.type === 'group') {
        const oldLeft = obj.left || 0;
        const oldTop  = obj.top  || 0;
        obj._restoreObjectsState();
        fc.remove(obj);
        const w = shapeType === 'circle' ? 130 : 140;
        const h = shapeType === 'circle' ? 130 : 180;
        let border;
        if (shapeType === 'circle') {
          border = new fabric.Circle({ radius: w / 2, fill: '#fff8e1', stroke: '#d4a017', strokeWidth: 2, strokeDashArray: [8, 4] });
        } else if (shapeType === 'rounded') {
          border = new fabric.Rect({ width: w, height: h, fill: '#fff8e1', stroke: '#d4a017', strokeWidth: 2, strokeDashArray: [8, 4], rx: 24, ry: 24 });
        } else {
          border = new fabric.Rect({ width: w, height: h, fill: '#fff8e1', stroke: '#d4a017', strokeWidth: 2, strokeDashArray: [8, 4], rx: 4, ry: 4 });
        }
        const cx = w / 2, cy = shapeType === 'circle' ? w / 2 : h / 2;
        const lbl = new fabric.Text('+ Photo', { left: cx, top: cy, originX: 'center', originY: 'center', fontSize: 12, fill: '#d4a017', fontFamily: 'Arial', fontWeight: 'bold', selectable: false, evented: false });
        const newGrp = new fabric.Group([border, lbl], { left: oldLeft, top: oldTop });
        newGrp.__frameType = shapeType;
        fc.add(newGrp);
      } else if (obj.type === 'image' && obj.__frameBounds) {
        const fb = obj.__frameBounds;
        const cLeft = fb.left + fb.width / 2;
        const cTop  = fb.top  + fb.height / 2;
        let clip;
        if (shapeType === 'circle') {
          clip = new fabric.Circle({ radius: Math.min(fb.width, fb.height) / 2, left: cLeft, top: cTop, originX: 'center', originY: 'center', absolutePositioned: true });
        } else if (shapeType === 'rounded') {
          clip = new fabric.Rect({ width: fb.width, height: fb.height, rx: 24, ry: 24, left: cLeft, top: cTop, originX: 'center', originY: 'center', absolutePositioned: true });
        } else {
          clip = new fabric.Rect({ width: fb.width, height: fb.height, left: cLeft, top: cTop, originX: 'center', originY: 'center', absolutePositioned: true });
        }
        obj.clipPath = clip;
        obj.__frameType = shapeType;
      } else {
        // Placeholder rect — just update the type tag
        obj.__frameType = shapeType;
      }
    }
    fc.discardActiveObject();
    fc.renderAll();
    pushHistory();
    setIsDirty(true);
    setSelectedObj(null);
    setSelectedObjs([]);
  }

  async function bulkFillFramesWithPhoto(file) {
    const fc = fabricRef.current;
    if (!fc || !file) return;
    const { fabric } = await getFabric();
    const frames = fc.getActiveObjects().filter(o => o.__frameType);
    if (!frames.length) return;
    const reader = new FileReader();
    reader.onload = ev => {
      let remaining = frames.length;
      frames.forEach(frame => {
        const shapeType = frame.__frameType;
        const tLeft = frame.left || 0;
        const tTop  = frame.top  || 0;
        const tW = frame.getScaledWidth();
        const tH = frame.getScaledHeight();
        const centerLeft = tLeft + tW / 2;
        const centerTop  = tTop  + tH / 2;
        fabric.Image.fromURL(ev.target.result, img => {
          const scale = Math.max(tW / img.width, tH / img.height);
          img.scale(scale);
          let clip;
          if (shapeType === 'circle') {
            clip = new fabric.Circle({ radius: Math.min(tW, tH) / 2, left: centerLeft, top: centerTop, originX: 'center', originY: 'center', absolutePositioned: true });
          } else if (shapeType === 'rounded') {
            clip = new fabric.Rect({ width: tW, height: tH, rx: 24, ry: 24, left: centerLeft, top: centerTop, originX: 'center', originY: 'center', absolutePositioned: true });
          } else {
            clip = new fabric.Rect({ width: tW, height: tH, left: centerLeft, top: centerTop, originX: 'center', originY: 'center', absolutePositioned: true });
          }
          img.clipPath = clip;
          img.__frameBounds = { left: tLeft, top: tTop, width: tW, height: tH };
          img.__frameType = shapeType;
          img.set({ left: centerLeft, top: centerTop, originX: 'center', originY: 'center' });
          fc.remove(frame);
          fc.add(img);
          remaining--;
          if (remaining === 0) {
            fc.discardActiveObject();
            fc.renderAll();
            pushHistory();
            setIsDirty(true);
            showAlert('success', `Filled ${frames.length} frame${frames.length > 1 ? 's' : ''} with photo`);
          }
        }, { crossOrigin: 'anonymous' });
      });
    };
    reader.readAsDataURL(file);
  }

  async function importSVG(file) {
    const { fabric } = await getFabric();
    const fc = fabricRef.current; if (!fc) return;
    const reader = new FileReader();
    reader.onload = ev => {
      fabric.loadSVGFromString(ev.target.result, (objects, options) => {
        if (!objects?.length) { showAlert('error', 'Could not parse SVG — try re-exporting from Corel Draw'); return; }
        const group = fabric.util.groupSVGElements(objects, options);
        const scaleX = fc.width  / (group.width  || fc.width);
        const scaleY = fc.height / (group.height || fc.height);
        const s = Math.min(scaleX, scaleY, 1);
        group.set({ left: fc.width / 2, top: fc.height / 2, originX: 'center', originY: 'center', scaleX: s, scaleY: s });
        fc.add(group); fc.setActiveObject(group); fc.renderAll();
        pushHistory(); setIsDirty(true);
        showAlert('success', `SVG imported — ${objects.length} objects. Tap "Ungroup" in Object tab to edit individually.`);
      });
    };
    reader.readAsText(file);
  }

  async function ungroupSelected() {
    const fc = fabricRef.current;
    const obj = fc?.getActiveObject();
    if (!fc || !obj || obj.type !== 'group') return;
    const { fabric } = await getFabric();
    const items = obj.getObjects();
    obj._restoreObjectsState();
    fc.remove(obj);
    items.forEach(item => fc.add(item));
    fc.renderAll();
    pushHistory(); setIsDirty(true);
    showAlert('success', `Ungrouped into ${items.length} objects`);
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
    hideMGuides();
    const url = fabricRef.current.toDataURL({ format: 'png', multiplier: 2 });
    showMGuides();
    const a = document.createElement('a'); a.href = url; a.download = `${docType}.png`; a.click();
  }

  async function exportPDF() {
    if (!fabricRef.current) return;
    setExporting(true);
    try {
      hideMGuides();
      const { w, h } = DOC_TYPES.find(d => d.key === docType).dims;
      const url = fabricRef.current.toDataURL({ format: 'png', multiplier: 2 });
      showMGuides();
      const pdf = new jsPDF({ orientation: w > h ? 'landscape' : 'portrait', unit: 'px', format: [w * 2, h * 2] });
      pdf.addImage(url, 'PNG', 0, 0, w * 2, h * 2);
      pdf.save(`${docType}.pdf`);
    } finally { setExporting(false); }
  }

  /* ── Placeholder helpers ──────────────────────────────────── */
  async function addPlaceholder(field) {
    const { fabric } = await getFabric();
    const fc = fabricRef.current; if (!fc) return;
    if (field === 'photo') {
      const frame = new fabric.Rect({
        left: fc.width / 2 - 40, top: fc.height / 2 - 50,
        width: 80, height: 100,
        fill: '#fff8e1', stroke: '#d4a017', strokeWidth: 2,
        strokeDashArray: [5, 3], rx: 4, ry: 4,
        __placeholder: 'photo', __frameType: 'rect',
      });
      fc.add(frame); fc.setActiveObject(frame);
    } else {
      const obj = new fabric.IText(`{{${field}}}`, {
        left: fc.width / 2, top: fc.height / 2,
        originX: 'center', originY: 'center',
        fontSize: 14, fill: '#d4a017',
        backgroundColor: '#fff8e1', fontFamily: 'Arial',
        __placeholder: field,
      });
      fc.add(obj); fc.setActiveObject(obj);
    }
    fc.renderAll(); pushHistory(); setIsDirty(true);
  }

  function getActiveRows() {
    if (dataSource === 'csv' && csvRows.length) return csvRows;
    return batchStudents.map(s => studentToRow(s, selBatch));
  }

  async function renderRowToCanvas(fc, templateJSON, row) {
    const { fabric } = await getFabric();
    const json = JSON.parse(JSON.stringify(templateJSON));
    json.objects = (json.objects || []).map(obj => {
      if (!obj.__placeholder) return obj;
      const field = obj.__placeholder;
      if (field === 'photo') return obj; // handled below
      const val = row[field] ?? `{{${field}}}`;
      if (obj.type === 'i-text' || obj.type === 'text') return { ...obj, text: String(val) };
      return obj;
    });
    await new Promise(r => fc.loadFromJSON(json, r));
    if (row.photo_url) {
      const frame = fc.getObjects().find(o => o.__placeholder === 'photo');
      if (frame) {
        await new Promise(r => {
          fabric.Image.fromURL(row.photo_url, img => {
            const scaleX = frame.width / (img.width || 1);
            const scaleY = frame.height / (img.height || 1);
            const scale = Math.max(scaleX, scaleY);
            img.set({
              left: frame.left, top: frame.top, scaleX: scale, scaleY: scale,
              clipPath: new fabric.Rect({ left: frame.left, top: frame.top, width: frame.width, height: frame.height, absolutePositioned: true }),
            });
            fc.remove(frame); fc.add(img); fc.renderAll(); r();
          }, { crossOrigin: 'anonymous' });
        });
      }
    }
    fc.renderAll();
  }

  async function handleCsvUpload(file) {
    if (!file) return;
    setCsvFile(file.name);
    const ext = file.name.split('.').pop().toLowerCase();
    try {
      if (ext === 'csv') {
        const Papa = (await import('papaparse')).default;
        Papa.parse(file, {
          header: true, skipEmptyLines: true,
          complete: r => { setCsvRows(r.data); setDataSource('csv'); showAlert('success', `Loaded ${r.data.length} rows from CSV`); },
        });
      } else {
        const XLSX = await import('xlsx');
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf);
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        setCsvRows(data); setDataSource('csv');
        showAlert('success', `Loaded ${data.length} rows from Excel`);
      }
    } catch { showAlert('error', 'Failed to parse file'); }
  }

  async function generateBatchZip() {
    const rows = getActiveRows();
    if (!rows.length) return showAlert('error', 'No data. Select a batch or upload a CSV/Excel file.');
    setGenerating(true);
    const zip = new JSZip();
    const { fabric } = await getFabric();
    const templateJSON = fabricRef.current?.toJSON(CUSTOM_PROPS);
    if (!templateJSON) return;
    const hasPlaceholders = (templateJSON.objects || []).some(o => o.__placeholder);
    const tpl = (TEMPLATES[docType] || [])[selectedTpl] || TEMPLATES[docType][0];
    try {
      for (const row of rows) {
        const el = document.createElement('canvas'); document.body.appendChild(el);
        const { w, h } = DOC_TYPES.find(d => d.key === docType).dims;
        const fc = new fabric.Canvas(el, { width: w, height: h });
        if (hasPlaceholders) {
          await renderRowToCanvas(fc, templateJSON, row);
        } else {
          await seedCanvas(fc, docType, tpl, row, instituteName);
        }
        const name = String(row.name || row.Name || 'record').replace(/\s+/g, '_');
        const img = fc.toDataURL({ format: 'png', multiplier: 2 }).split(',')[1];
        zip.file(`${name}_${docType}.png`, img, { base64: true });
        fc.dispose(); document.body.removeChild(el);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `batch_${docType}.zip`; a.click();
      showAlert('success', `Generated ${rows.length} documents!`);
    } catch (err) { showAlert('error', err.message); }
    finally { setGenerating(false); }
  }

  /* ── Print layout management ─────────────────────────────────── */
  function loadUserLayouts() {
    try { setUserLayouts(JSON.parse(localStorage.getItem('instify_print_layouts') || '[]')); } catch { setUserLayouts([]); }
  }

  function saveUserLayout(layout) {
    const list = JSON.parse(localStorage.getItem('instify_print_layouts') || '[]');
    const idx = list.findIndex(l => l.id === layout.id);
    const entry = { ...layout, id: layout.id || String(Date.now()) };
    if (idx >= 0) list[idx] = entry; else list.unshift(entry);
    localStorage.setItem('instify_print_layouts', JSON.stringify(list));
    setUserLayouts(list);
    showAlert('success', 'Layout saved!');
  }

  function deleteUserLayout(id) {
    const list = JSON.parse(localStorage.getItem('instify_print_layouts') || '[]').filter(l => l.id !== id);
    localStorage.setItem('instify_print_layouts', JSON.stringify(list));
    setUserLayouts(list);
  }

  function layoutCellDims(layout) {
    const { pageW, pageH, marginT, marginR, marginB, marginL, cols, rows, gapH, gapV } = layout;
    const cellW = (pageW - marginL - marginR - (cols - 1) * gapH) / cols;
    const cellH = (pageH - marginT - marginB - (rows - 1) * gapV) / rows;
    return { cellW, cellH };
  }

  async function exportWithLayout(layout, useBatch = false) {
    if (!fabricRef.current) return;
    const { pageW, pageH, marginT, marginR, marginB, marginL, cols, rows, gapH, gapV } = layout;
    const { cellW, cellH } = layoutCellDims(layout);
    const isLand = pageW > pageH;
    const perPage = rows * cols;
    const slug = layout.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    setExporting(true); setGenerating(true);
    try {
      if (!useBatch) {
        hideMGuides();
        const cardDataURL = fabricRef.current.toDataURL({ format: 'png', multiplier: 2 });
        showMGuides();
        const pdf = new jsPDF({ orientation: isLand ? 'landscape' : 'portrait', unit: 'mm', format: [pageW, pageH] });
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++)
            pdf.addImage(cardDataURL, 'PNG', marginL + c * (cellW + gapH), marginT + r * (cellH + gapV), cellW, cellH);
        pdf.save(`${docType}_${slug}.pdf`);
        showAlert('success', `${perPage} cards per sheet — done!`);
      } else {
        const rows = getActiveRows();
        if (!rows.length) { showAlert('error', 'No data. Select a batch or upload CSV/Excel.'); return; }
        const { fabric } = await getFabric();
        const tpl = (TEMPLATES[docType] || [])[selectedTpl] || TEMPLATES[docType][0];
        const templateJSON = fabricRef.current?.toJSON(CUSTOM_PROPS);
        const hasPlaceholders = (templateJSON?.objects || []).some(o => o.__placeholder);
        const pdf = new jsPDF({ orientation: isLand ? 'landscape' : 'portrait', unit: 'mm', format: [pageW, pageH] });
        let pos = 0;
        for (let si = 0; si < rows.length; si++) {
          const row = rows[si];
          const el = document.createElement('canvas'); document.body.appendChild(el);
          const { w, h } = DOC_TYPES.find(d => d.key === docType).dims;
          const fc = new fabric.Canvas(el, { width: w, height: h });
          if (hasPlaceholders && templateJSON) {
            await renderRowToCanvas(fc, templateJSON, row);
          } else {
            await seedCanvas(fc, docType, tpl, row, instituteName);
          }
          const imgData = fc.toDataURL({ format: 'png', multiplier: 2 });
          fc.dispose(); document.body.removeChild(el);
          if (pos > 0 && pos % perPage === 0) {
            pdf.addPage([pageW, pageH], isLand ? 'landscape' : 'portrait'); pos = 0;
          }
          const r = Math.floor(pos / cols), c = pos % cols;
          pdf.addImage(imgData, 'PNG', marginL + c * (cellW + gapH), marginT + r * (cellH + gapV), cellW, cellH);
          pos++;
        }
        pdf.save(`batch_${docType}_${slug}.pdf`);
        showAlert('success', `${rows.length} students, ${perPage} per page — done!`);
      }
    } catch (err) { showAlert('error', 'Export failed: ' + err.message); }
    finally { setExporting(false); setGenerating(false); }
  }

  function switchTemplate(idx) {
    confirmThen(() => {
      setSelectedTpl(idx); setSelectedObj(null); setReady(false); setIsDirty(false);
      if (fabricRef.current) { fabricRef.current.dispose(); fabricRef.current = null; }
      initCanvas(docType, idx);   // idx is the template index → seeds the canvas
    });
  }

  async function saveDesign() {
    if (!fabricRef.current) return;
    setSavingDesign(true);
    try {
      const canvasJSON = JSON.stringify(fabricRef.current.toJSON(CUSTOM_PROPS));
      const thumbnail = fabricRef.current.toDataURL({ format: 'png', multiplier: 0.3 });
      const uuid = localStorage.getItem('institute_uuid');
      const payload = {
        institute_uuid: uuid,
        name: designName || `${currentDT?.label} ${new Date().toLocaleDateString('en-IN')}`,
        docType, templateId: templates[selectedTpl]?.id,
        canvasJSON, thumbnail,
      };
      if (currentDesignId) {
        await apiClient.put(`/api/designs/${currentDesignId}`, payload);
      } else {
        const res = await apiClient.post('/api/designs', payload);
        setCurrentDesignId(res.data.result?.design_uuid);
      }
      showAlert('success', 'Design saved!');
      setIsDirty(false);
      loadSavedDesigns();
    } catch { showAlert('error', 'Save failed'); }
    finally { setSavingDesign(false); }
  }

  async function loadSavedDesigns() {
    const uuid = localStorage.getItem('institute_uuid'); if (!uuid) return;
    try {
      const res = await apiClient.get(`/api/designs?institute_uuid=${uuid}`);
      setSavedDesigns(res.data?.result || []);
    } catch { setSavedDesigns([]); }
  }

  async function loadDesign(design) {
    // Store a pending JSON to restore after initCanvas creates the blank canvas
    const pendingJSON = design.canvasJSON ? JSON.parse(design.canvasJSON) : null;
    initParamsRef.current = { type: design.docType, tplIdx: 0, pendingJSON };
    setDocType(design.docType);
    setCurrentDesignId(design.design_uuid);
    setDesignName(design.name);
    setIsDirty(false);
    setReady(false);
    // Trigger the useEffect which will call initCanvas with the pendingJSON
    setView('editor');
  }

  async function deleteDesign(design) {
    if (!window.confirm(`Delete "${design.name}"?`)) return;
    try {
      await apiClient.delete(`/api/designs/${design.design_uuid}`);
      loadSavedDesigns();
    } catch { showAlert('error', 'Delete failed'); }
  }

  async function fillFromStudent(studentId) {
    const student = students.find(s => s.uuid === studentId || s._id === studentId);
    if (!student || !fabricRef.current) return;
    const tpl = (TEMPLATES[docType] || [])[selectedTpl] || TEMPLATES[docType][0];
    suppressDirtyRef.current = true;
    setReady(false);
    await seedCanvas(fabricRef.current, docType, tpl, {
      name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student',
      rollNo: student.rollNo || student.roll_number || '—',
      course: student.course || '—',
      batch: student.batch || '—',
    }, instituteName);
    suppressDirtyRef.current = false;
    setReady(true);
    updateScale();
  }

  useEffect(() => {
    const uuid = localStorage.getItem('institute_uuid'); if (!uuid) return;
    apiClient.get(`/api/batches?institute_uuid=${uuid}`)
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : (r.data?.result || r.data?.data || []);
        setBatches(list);
      })
      .catch(() => {});
    loadSavedDesigns();
    loadCustomTemplates();
    loadUserLayouts();
    apiClient.get(`/api/students?institute_uuid=${uuid}`)
      .then(r => setStudents(r.data?.data || r.data?.result || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (view === 'projects' && projects.length === 0) loadProjects();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  useEffect(() => {
    if (selectedProject) loadProjectStudents(selectedProject.project_uuid, classFilter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject, classFilter, projectTab]);

  useEffect(() => {
    if (!selBatch) { setBatchStudents([]); return; }
    setLoadingBatch(true);
    apiClient.get(`/api/students?batchTime=${encodeURIComponent(selBatch)}&institute_uuid=${localStorage.getItem('institute_uuid')}`)
      .then(r => {
        const list = r.data?.data || r.data?.result || [];
        setBatchStudents(list);
        carouselStatesRef.current = {};
        carouselBaseTemplateRef.current = null; // reset so new base is captured on first navigation
        setCarouselIdx(0);
        // Capture current canvas as base template for placeholder-based carousel preview
        const fc = fabricRef.current;
        if (fc) {
          const tJson = fc.toJSON(CUSTOM_PROPS);
          carouselBaseTemplateRef.current = tJson;
        }
        if (list.length > 0) {
          const row = studentToRow(list[0], selBatch);
          setCarouselFields({
            name:   row.name,
            rollNo: row.roll_number,
            course: row.course,
            batch:  row.batch,
          });
        }
      })
      .catch(() => setBatchStudents([]))
      .finally(() => setLoadingBatch(false));
  }, [selBatch]);

  // Auto-fill canvas with first student when a batch loads in bulk mode
  useEffect(() => {
    if (editorMode !== 'bulk' || batchStudents.length === 0 || !fabricRef.current || view !== 'editor') return;
    const fc = fabricRef.current;
    const templateJSON = fc.toJSON(CUSTOM_PROPS);
    carouselBaseTemplateRef.current = templateJSON;
    const s = batchStudents[0];
    const row = studentToRow(s, selBatch);
    const hasPlaceholders = (templateJSON.objects || []).some(o => o.__placeholder);
    suppressDirtyRef.current = true;
    const tpl = (TEMPLATES[docType] || [])[selectedTpl] || TEMPLATES[docType][0];
    (hasPlaceholders
      ? renderRowToCanvas(fc, templateJSON, row)
      : tpl ? seedCanvas(fc, docType, tpl, { name: row.name, rollNo: row.roll_number, course: row.course, batch: row.batch }, instituteName) : Promise.resolve()
    ).finally(() => { suppressDirtyRef.current = false; updateScale(); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchStudents]);

  const currentDT  = DOC_TYPES.find(d => d.key === docType);
  const templates   = TEMPLATES[docType] || [];
  const filteredDTs = DOC_TYPES.filter(d => !searchTerm || d.label.toLowerCase().includes(searchTerm.toLowerCase()));

  /* ── Recent designs (all doc types × first template) ─────── */
  const recentDesigns = DOC_TYPES.flatMap(dt =>
    (TEMPLATES[dt.key] || []).slice(0, 2).map((tpl, i) => ({ dt, tpl, key: `${dt.key}-${i}` }))
  );

  /* ════════════════════════════════════════════════════════════
     PROJECTS VIEW
  ════════════════════════════════════════════════════════════ */
  if (view === 'projects') {
    const photoReady    = projectStudents.filter(s => s.photo_url).length;
    const missing       = projectStudents.filter(s => !s.photo_url && s.card_status !== 'not_available').length;
    const approved      = projectStudents.filter(s => s.card_status === 'approved').length;
    const submitted     = projectStudents.filter(s => s.card_status === 'student_submitted').length;
    const notAvailable  = projectStudents.filter(s => s.card_status === 'not_available').length;
    const filteredStudents = projectTab === 1
      ? projectStudents.filter(s => s.card_status === 'student_submitted')
      : projectTab === 2 ? projectStudents.filter(s => s.card_status === 'approved')
      : projectStudents;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#f5f7fa', overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, bgcolor: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
          <IconButton size="small" onClick={() => { setSelectedProject(null); setProjectStudents([]); setProjectClasses([]); setClassFilter(''); setProjectTab(0); setView('home'); }}>
            <ArrowBackIcon />
          </IconButton>
          <Box flex={1}>
            <Typography fontWeight={700} fontSize="1rem" color="#1e293b">
              {selectedProject ? selectedProject.title : 'Projects'}
            </Typography>
            {selectedProject && (
              <Typography variant="caption" color="text.secondary">{selectedProject.academic_year} · {projectStudents.length} students</Typography>
            )}
          </Box>
          {!selectedProject && (
            <Button variant="contained" size="small" startIcon={<AddCircleOutlineIcon />} onClick={() => setCreateProjDlg(true)}
              sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, textTransform: 'none' }}>
              New Project
            </Button>
          )}
          {selectedProject && (
            <Button variant="outlined" size="small" startIcon={<PrintIcon />}
              onClick={() => navigate(`/${username}/idcard/${selectedProject.project_uuid}/print`)}
              sx={{ textTransform: 'none' }}>
              Print
            </Button>
          )}
        </Box>

        {/* Alert */}
        {alert && <Alert severity={alert.type} sx={{ mx: 2, mt: 1, flexShrink: 0 }} onClose={() => setAlert(null)}>{alert.text}</Alert>}

        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          {/* ── Project list ── */}
          {!selectedProject && (
            <>
              {/* Description */}
              <Box sx={{ mb: 2.5, p: 2, borderRadius: 2, background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)', color: '#fff' }}>
                <Typography fontWeight={700} fontSize="0.97rem" mb={0.5}>Student Data Manager</Typography>
                <Typography fontSize="0.78rem" sx={{ opacity: 0.85 }}>
                  Create projects to manage student photos, import data, collect self-submitted photos, and generate ID cards, certificates, results &amp; admit cards.
                </Typography>
              </Box>

              {/* Quick action cards */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, mb: 3 }}>
                {[
                  { key: 'single', icon: <PersonAddIcon sx={{ fontSize: 26 }} />, title: 'Single Entry', desc: 'Add one student manually', color: '#0ea5e9', bg: '#e0f2fe' },
                  { key: 'bulk',   icon: <PhotoLibraryIcon sx={{ fontSize: 26 }} />, title: 'Bulk Photos', desc: 'Upload multiple photos at once', color: '#8b5cf6', bg: '#ede9fe' },
                  { key: 'excel',  icon: <TableChartIcon sx={{ fontSize: 26 }} />, title: 'Excel / CSV', desc: 'Import from a spreadsheet', color: '#10b981', bg: '#d1fae5' },
                  { key: 'batch',  icon: <GroupsIcon sx={{ fontSize: 26 }} />, title: 'Class / Batch', desc: 'Filter and manage by class', color: '#f59e0b', bg: '#fef3c7' },
                ].map(m => (
                  <Paper key={m.key} variant="outlined" onClick={() => {
                    if (!selectedProject) { showAlert('info', 'Open or create a project first.'); return; }
                    if (m.key === 'single') setAddStudentDlg(true);
                    else if (m.key === 'bulk') setBulkPhotoDlg(true);
                    else if (m.key === 'excel') document.getElementById('excel-proj-input')?.click();
                  }}
                    sx={{ borderRadius: 2, overflow: 'hidden', cursor: 'pointer', border: '1.5px solid #e2e8f0', '&:hover': { boxShadow: `0 4px 12px ${m.color}33`, borderColor: m.color, transform: 'translateY(-1px)' }, transition: 'all 0.15s' }}>
                    <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.25, bgcolor: m.bg }}>
                      <Avatar sx={{ bgcolor: m.color, width: 38, height: 38, color: '#fff' }}>{m.icon}</Avatar>
                      <Box>
                        <Typography fontWeight={700} fontSize="0.82rem" color={m.color}>{m.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{m.desc}</Typography>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
              <input id="excel-proj-input" hidden type="file" accept=".xlsx,.xls,.csv" onChange={e => { if (!selectedProject) return; parseExcelForImport(e.target.files[0]); }} />

              {/* Projects list */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography fontWeight={700} fontSize="0.95rem">My Projects</Typography>
                <Chip label={`${projects.length} project${projects.length !== 1 ? 's' : ''}`} size="small" variant="outlined" />
              </Stack>
              {projectsLoading ? (
                <Box textAlign="center" py={5}><CircularProgress /></Box>
              ) : projects.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, border: '2px dashed #e2e8f0', borderRadius: 3 }}>
                  <BadgeIcon sx={{ fontSize: 44, color: '#cbd5e1', mb: 1 }} />
                  <Typography color="text.secondary" mb={2} fontSize="0.875rem">No projects yet. Create your first project to get started.</Typography>
                  <Button variant="contained" size="small" startIcon={<AddCircleOutlineIcon />} onClick={() => setCreateProjDlg(true)}
                    sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, textTransform: 'none' }}>
                    Create Project
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)' }, gap: 1.5 }}>
                  {projects.map(p => (
                    <Paper key={p.project_uuid} variant="outlined"
                      sx={{ borderRadius: 2, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s', '&:hover': { boxShadow: 3, borderColor: '#059669' } }}
                      onClick={() => { setSelectedProject(p); setProjectTab(0); setClassFilter(''); }}>
                      <Box sx={{ height: 4, background: p.status === 'active' ? 'linear-gradient(90deg,#059669,#34d399)' : '#e2e8f0' }} />
                      <Box sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={0.75}>
                          <Box flex={1} mr={1}>
                            <Typography fontWeight={700} fontSize="0.9rem">{p.title}</Typography>
                            <Typography variant="caption" color="text.secondary">{p.academic_year}</Typography>
                          </Box>
                          <Chip size="small" label={p.status === 'active' ? 'Active' : 'Done'} color={p.status === 'active' ? 'success' : 'default'} />
                        </Stack>
                        <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={0.5} color="primary.main">
                          <Typography variant="caption" fontWeight={600}>Open</Typography>
                          <ChevronRightIcon sx={{ fontSize: 13 }} />
                        </Stack>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </>
          )}

          {/* ── Project detail ── */}
          {selectedProject && (
            <>
              {/* Back to list */}
              <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => { setSelectedProject(null); setProjectStudents([]); setProjectClasses([]); setClassFilter(''); setProjectTab(0); }}
                sx={{ textTransform: 'none', color: '#64748b', mb: 2 }}>
                All Projects
              </Button>

              {/* Action cards */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.25, mb: 2.5 }}>
                <Paper variant="outlined" onClick={() => setAddStudentDlg(true)}
                  sx={{ borderRadius: 2, p: 1.5, cursor: 'pointer', bgcolor: '#f0f9ff', border: '1.5px solid #e0f2fe', '&:hover': { boxShadow: 2, borderColor: '#0ea5e9' } }}>
                  <Stack direction="row" alignItems="center" spacing={1.25}>
                    <Avatar sx={{ bgcolor: '#0ea5e9', width: 32, height: 32 }}><PersonAddIcon sx={{ fontSize: 16 }} /></Avatar>
                    <Box><Typography fontWeight={700} fontSize="0.78rem" color="#0369a1">Single Card</Typography><Typography variant="caption" color="text.secondary">Add one student</Typography></Box>
                  </Stack>
                </Paper>
                <Paper variant="outlined" onClick={() => setBulkPhotoDlg(true)}
                  sx={{ borderRadius: 2, p: 1.5, cursor: 'pointer', bgcolor: '#faf5ff', border: '1.5px solid #ede9fe', '&:hover': { boxShadow: 2, borderColor: '#8b5cf6' } }}>
                  <Stack direction="row" alignItems="center" spacing={1.25}>
                    <Avatar sx={{ bgcolor: '#8b5cf6', width: 32, height: 32 }}><PhotoLibraryIcon sx={{ fontSize: 16 }} /></Avatar>
                    <Box><Typography fontWeight={700} fontSize="0.78rem" color="#6d28d9">Bulk Photos</Typography><Typography variant="caption" color="text.secondary">Upload all at once</Typography></Box>
                  </Stack>
                </Paper>
                <Paper variant="outlined" component="label"
                  sx={{ borderRadius: 2, p: 1.5, cursor: 'pointer', bgcolor: '#f0fdf4', border: '1.5px solid #d1fae5', '&:hover': { boxShadow: 2, borderColor: '#10b981' } }}>
                  <input hidden type="file" accept=".xlsx,.xls,.csv" onChange={e => parseExcelForImport(e.target.files[0])} />
                  <Stack direction="row" alignItems="center" spacing={1.25}>
                    <Avatar sx={{ bgcolor: '#10b981', width: 32, height: 32 }}><TableChartIcon sx={{ fontSize: 16 }} /></Avatar>
                    <Box><Typography fontWeight={700} fontSize="0.78rem" color="#065f46">Excel / CSV</Typography><Typography variant="caption" color="text.secondary">Import from file</Typography></Box>
                  </Stack>
                </Paper>
                <Paper variant="outlined" onClick={() => navigate(`/${username}/idcard/${selectedProject.project_uuid}/print`)}
                  sx={{ borderRadius: 2, p: 1.5, cursor: 'pointer', bgcolor: '#fffbeb', border: '1.5px solid #fef3c7', '&:hover': { boxShadow: 2, borderColor: '#f59e0b' } }}>
                  <Stack direction="row" alignItems="center" spacing={1.25}>
                    <Avatar sx={{ bgcolor: '#f59e0b', width: 32, height: 32 }}><PrintIcon sx={{ fontSize: 16 }} /></Avatar>
                    <Box><Typography fontWeight={700} fontSize="0.78rem" color="#92400e">Print Cards</Typography><Typography variant="caption" color="text.secondary">Print / export PDF</Typography></Box>
                  </Stack>
                </Paper>
              </Box>

              {/* Stats */}
              <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
                <StatPill label="Total" value={projectStudents.length} />
                <StatPill label="Photo" value={photoReady} color="success.main" bg="#f0fdf4" />
                <StatPill label="Missing" value={missing} color="error.main" bg="#fef2f2" />
                <StatPill label="Submitted" value={submitted} color="warning.main" bg="#fffbeb" />
                <StatPill label="Approved" value={approved} color="primary.main" bg="#eff6ff" />
              </Stack>

              {/* Photo progress */}
              {projectStudents.length > 0 && (
                <Box mb={2}>
                  <Stack direction="row" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="text.secondary">Photo completion</Typography>
                    <Typography variant="caption" fontWeight={600} color="success.main">{Math.round((photoReady / projectStudents.length) * 100)}%</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={(photoReady / projectStudents.length) * 100} sx={{ height: 5, borderRadius: 3, bgcolor: '#e2e8f0' }} color="success" />
                </Box>
              )}

              {/* Tabs */}
              <Tabs value={projectTab} onChange={(_, v) => setProjectTab(v)} sx={{ mb: 1.5, borderBottom: '1px solid #e2e8f0' }}>
                <Tab label={`All (${projectStudents.length})`} sx={{ fontSize: '0.78rem', textTransform: 'none' }} />
                <Tab label={submitted > 0 ? `Approvals (${submitted})` : 'Approvals'} sx={{ fontSize: '0.78rem', textTransform: 'none' }} />
                <Tab label={approved > 0 ? `Print Ready (${approved})` : 'Print Ready'} sx={{ fontSize: '0.78rem', textTransform: 'none' }} />
              </Tabs>

              {/* Class filter */}
              {projectClasses.length > 0 && (
                <Box mb={1.5}>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="center">
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      <FilterListIcon sx={{ fontSize: 12, mr: 0.25, verticalAlign: 'middle' }} />Class:
                    </Typography>
                    <Chip label="All" onClick={() => setClassFilter('')} color={!classFilter ? 'primary' : 'default'} variant={!classFilter ? 'filled' : 'outlined'} size="small" />
                    {projectClasses.map(c => (
                      <Chip key={c} label={c} onClick={() => setClassFilter(c === classFilter ? '' : c)} color={classFilter === c ? 'primary' : 'default'} variant={classFilter === c ? 'filled' : 'outlined'} size="small" />
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Student grid */}
              {projStudLoading ? (
                <Box textAlign="center" py={5}><CircularProgress /></Box>
              ) : filteredStudents.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, border: '2px dashed #e2e8f0', borderRadius: 3 }}>
                  <PeopleIcon sx={{ fontSize: 44, color: '#cbd5e1', mb: 1 }} />
                  <Typography color="text.secondary" fontSize="0.875rem" mb={1.5}>
                    {projectTab === 1 ? 'No pending approvals.' : projectTab === 2 ? 'No approved cards yet.' : 'No students yet. Use the options above to add students.'}
                  </Typography>
                  {projectTab === 0 && (
                    <Stack direction="row" spacing={1.5} justifyContent="center">
                      <Button size="small" variant="outlined" startIcon={<PersonAddIcon />} onClick={() => setAddStudentDlg(true)} sx={{ textTransform: 'none' }}>Add Single</Button>
                      <Button size="small" variant="outlined" component="label" startIcon={<TableChartIcon />} sx={{ textTransform: 'none' }}>
                        Import Excel<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={e => parseExcelForImport(e.target.files[0])} />
                      </Button>
                    </Stack>
                  )}
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.25 }}>
                  {filteredStudents.map(s => (
                    <ProjectStudentCard key={s.idcard_uuid} student={s} tab={projectTab}
                      onPhotoUpload={uploadStudentPhoto} onWebcam={uuid => setWebcamTarget(uuid)}
                      onRemoveBg={removeStudentBg} onStatusChange={updateStudentStatus}
                      onShare={generateMagicLink} onApprove={approveStudentCard} onReject={rejectStudentCard} />
                  ))}
                </Box>
              )}
            </>
          )}
        </Box>

        {/* Dialogs */}
        <CreateProjectDlg open={createProjDlg} onSave={createNewProject} onClose={() => setCreateProjDlg(false)} />
        <AddStudentDlg open={addStudentDlg} onSave={addStudentToProject} onClose={() => setAddStudentDlg(false)} />
        <WebcamCapture open={!!webcamTarget} onCapture={handleWebcamCapture} onClose={() => setWebcamTarget(null)} />

        {/* Bulk photo dialog */}
        <Dialog open={bulkPhotoDlg} onClose={() => setBulkPhotoDlg(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Bulk Photo Upload</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Alert severity="info" sx={{ fontSize: '0.78rem' }}>
                Photos are auto-matched by filename = roll number (e.g. <strong>01.jpg</strong>). Upload one class at a time for best results.
              </Alert>
              {projectClasses.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Filter by Class (optional)</Typography>
                  <Select value={bulkClass} onChange={e => setBulkClass(e.target.value)} size="small" displayEmpty fullWidth>
                    <MenuItem value="">All Classes</MenuItem>
                    {projectClasses.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </Box>
              )}
              <Button variant="outlined" component="label" startIcon={bulkUploading ? <CircularProgress size={16} /> : <UploadFileIcon />} disabled={bulkUploading} size="large" sx={{ textTransform: 'none' }}>
                {bulkUploading ? 'Uploading…' : 'Select Photos'}
                <input hidden type="file" accept="image/*" multiple onChange={e => bulkUploadPhotos(e.target.files)} />
              </Button>
            </Stack>
          </DialogContent>
          <DialogActions><Button onClick={() => setBulkPhotoDlg(false)}>Close</Button></DialogActions>
        </Dialog>

        {/* Excel import preview dialog */}
        <Dialog open={excelImportDlg} onClose={() => setExcelImportDlg(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>
            Import Students — Preview
            <Chip label={`${excelImportRows.length} rows`} size="small" sx={{ ml: 1.5 }} color="primary" />
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2, fontSize: '0.78rem' }}>
              Columns auto-detected: <strong>student_name, roll_number, class, section</strong>. All other columns are stored as extra fields.
            </Alert>
            {excelPreview.length > 0 && (
              <Box sx={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 1 }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      {Object.keys(excelPreview[0]).map(k => <th key={k} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>{k}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {excelPreview.map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        {Object.values(row).map((v, j) => <td key={j} style={{ padding: '6px 12px', borderBottom: '1px solid #f1f5f9' }}>{String(v)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {excelImportRows.length > 5 && (
                  <Box sx={{ px: 2, py: 1, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" color="text.secondary">…and {excelImportRows.length - 5} more rows</Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExcelImportDlg(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button variant="contained" onClick={importStudentsFromExcel} disabled={importing}
              startIcon={importing ? <CircularProgress size={16} /> : <DownloadIcon />} sx={{ textTransform: 'none' }}>
              {importing ? 'Importing…' : `Import ${excelImportRows.length} Students`}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Magic link dialog */}
        <Dialog open={!!magicLinkDlg} onClose={() => setMagicLinkDlg(null)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Student Self-Edit Link</DialogTitle>
          <DialogContent>
            <Alert severity="success" sx={{ mb: 2 }}>Share this with the student so they can upload their own photo.</Alert>
            <Box sx={{ bgcolor: '#f8fafc', borderRadius: 1, p: 1.5, wordBreak: 'break-all', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>
              {magicLinkDlg?.link}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button startIcon={<ContentCopyIcon />} onClick={() => { navigator.clipboard.writeText(magicLinkDlg?.link); showAlert('success', 'Copied!'); }} sx={{ textTransform: 'none' }}>Copy</Button>
            <Button onClick={() => setMagicLinkDlg(null)} sx={{ textTransform: 'none' }}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  /* ════════════════════════════════════════════════════════════
     HOME VIEW
  ════════════════════════════════════════════════════════════ */
  if (view === 'home') {
    const visibleExplore = EXPLORE_ITEMS.filter(item =>
      (selectedCategory === 'all' || item.category === selectedCategory) &&
      (!searchTerm || item.label.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const itemsPerPage = 8;
    const totalPages = Math.ceil(visibleExplore.length / itemsPerPage);
    const pageItems = visibleExplore.slice(explorePage * itemsPerPage, (explorePage + 1) * itemsPerPage);
    const userInitial = (localStorage.getItem('user_name') || localStorage.getItem('username') || 'U')[0].toUpperCase();

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#f5f7fa' }}>

        {/* ── Header ── */}
        <Box sx={{ px: 2, pt: 1.5, pb: 1, bgcolor: '#ffffff', flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Avatar */}
            <Box
              onClick={() => navigate(`/${username}`)}
              sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, overflow: 'hidden', border: '2px solid #f0f4f8' }}
            >
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', lineHeight: 1 }}>{userInitial}</Typography>
            </Box>

            {/* Title with dropdown */}
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>Templates</Typography>
              <KeyboardArrowDownIcon sx={{ fontSize: 20, color: '#64748b' }} />
            </Box>

            {/* Search icon */}
            <IconButton
              size="small"
              onClick={() => {}}
              sx={{ color: '#1e293b', '&:hover': { bgcolor: '#f1f5f9' } }}
            >
              <SearchIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Box>
        </Box>

        {/* ── Search bar ── */}
        <Box sx={{ px: 2, pt: 1.25, pb: 0.5, bgcolor: '#f5f7fa', flexShrink: 0 }}>
          <TextField
            value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setExplorePage(0); }}
            placeholder="Search templates"
            size="small" fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} /></InputAdornment>,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#ffffff', borderRadius: 3, color: '#1e293b',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                '& fieldset': { borderColor: '#e8eef4' },
                '&:hover fieldset': { borderColor: '#cbd5e1' },
                '&.Mui-focused fieldset': { borderColor: '#7c3aed44' },
              },
              '& .MuiInputBase-input::placeholder': { color: '#94a3b8', opacity: 1 },
            }}
          />
        </Box>

        {/* ── Category chips ── */}
        <Box sx={{
          px: 2, py: 1, display: 'flex', gap: 1, overflowX: 'auto', flexShrink: 0,
          scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
        }}>
          {CATEGORY_CHIPS.map(cat => {
            const active = selectedCategory === cat.id;
            return (
              <Chip
                key={cat.id}
                label={cat.label}
                onClick={() => { setSelectedCategory(cat.id); setExplorePage(0); }}
                sx={{
                  bgcolor: active ? '#1e293b' : '#ffffff',
                  color: active ? '#ffffff' : '#475569',
                  border: `1.5px solid ${active ? '#1e293b' : '#e2e8f0'}`,
                  fontWeight: active ? 600 : 400,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  flexShrink: 0,
                  height: 32,
                  boxShadow: active ? '0 2px 8px rgba(30,41,59,0.18)' : '0 1px 3px rgba(0,0,0,0.05)',
                  '&:hover': { bgcolor: active ? '#0f172a' : '#f1f5f9', borderColor: active ? '#0f172a' : '#cbd5e1' },
                  transition: 'all 0.15s',
                }}
              />
            );
          })}
        </Box>

        {/* ── Scrollable body ── */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>

          {/* Explore templates grid */}
          <Box sx={{ px: 2, pt: 0.5, pb: 2 }}>
            {/* Blank Canvas quick-start */}
            <Box
              onClick={() => pickMode('id_card', 0)}
              sx={{
                mb: 2, p: 1.5, borderRadius: 2.5, border: '2px dashed #e2e8f0', bgcolor: '#fff',
                display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
                '&:hover': { borderColor: '#d4a017', bgcolor: '#fffbf0' }, transition: 'all 0.15s',
              }}
            >
              <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AddCircleOutlineIcon sx={{ color: '#64748b', fontSize: 20 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>Start with Blank Canvas</Typography>
                <Typography sx={{ fontSize: '0.7rem', color: '#64748b', mt: 0.2 }}>Begin from scratch — Single, Bulk or Batch</Typography>
              </Box>
              <ArrowForwardIosIcon sx={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }} />
            </Box>

            <Typography sx={{ color: '#1e293b', fontWeight: 700, fontSize: '1.1rem', mb: 1.5 }}>
              Explore templates
            </Typography>

            <Box sx={{ position: 'relative', pr: totalPages > 1 ? 2 : 0 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
                {pageItems.map((item, idx) => {
                  const dt = DOC_TYPES.find(d => d.key === item.key) || DOC_TYPES[0];
                  return (
                    <Box
                      key={`${item.key}-${idx}`}
                      onClick={() => pickMode(item.key, 0)}
                      sx={{
                        cursor: 'pointer', borderRadius: 2, overflow: 'hidden',
                        bgcolor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                        '&:active': { transform: 'scale(0.95)' },
                        transition: 'transform 0.12s',
                      }}
                    >
                      <Box sx={{ height: 82, overflow: 'hidden', position: 'relative' }}>
                        <Box
                          component="img"
                          src={item.thumbUrl}
                          alt={item.label}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                        <Box sx={{
                          display: 'none', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0,
                          background: `linear-gradient(135deg, ${dt.color}, ${dt.color2})`,
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Box sx={{ color: 'rgba(255,255,255,0.85)' }}>{dt.icon}</Box>
                        </Box>
                      </Box>
                      <Box sx={{ px: 0.5, py: 0.6, textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.67rem', color: '#1e293b', lineHeight: 1.3, fontWeight: 400 }}>
                          {item.label}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>

              {/* Next / prev page button */}
              {totalPages > 1 && (
                <IconButton
                  onClick={() => setExplorePage(prev => (prev + 1) % totalPages)}
                  sx={{
                    position: 'absolute', right: -10, top: '45%', transform: 'translateY(-50%)',
                    width: 30, height: 30,
                    bgcolor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                    border: '1px solid #e2e8f0', zIndex: 2,
                    '&:hover': { bgcolor: '#f8fafc' },
                  }}
                >
                  <ChevronRightIcon sx={{ fontSize: 17, color: '#475569' }} />
                </IconButton>
              )}
            </Box>
          </Box>

          {/* Generate for Batch — Create tab */}
          {homeNav === 0 && (
            <Box sx={{ px: 2, pb: 2 }}>
              <Typography sx={{ color: '#1e293b', fontWeight: 700, fontSize: '0.92rem', mb: 0.4 }}>Generate for Batch</Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.72rem', mb: 1.25 }}>Create documents for an entire batch in one click</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                {[
                  { label: 'ID Cards',    icon: <BadgeIcon sx={{ color: '#fff', fontSize: 18 }} />,            key: 'id_card',     bg: 'linear-gradient(135deg, #1a7a4a, #d4a017)' },
                  { label: 'Certificates', icon: <WorkspacePremiumIcon sx={{ color: '#fff', fontSize: 18 }} />, key: 'certificate', bg: 'linear-gradient(135deg, #d97706, #f59e0b)' },
                  { label: 'Admit Cards',  icon: <AssignmentIcon sx={{ color: '#fff', fontSize: 18 }} />,       key: 'admit_card',  bg: 'linear-gradient(135deg, #059669, #10b981)' },
                  { label: 'Results',      icon: <AutoAwesomeIcon sx={{ color: '#fff', fontSize: 18 }} />,      key: 'result',      bg: 'linear-gradient(135deg, #dc2626, #ef4444)' },
                ].map(item => (
                  <Box key={item.key} onClick={() => pickMode(item.key, 0)}
                    sx={{ borderRadius: 2, p: 1.5, cursor: 'pointer', background: item.bg, display: 'flex', alignItems: 'center', gap: 1,
                      '&:hover': { opacity: 0.88 }, '&:active': { transform: 'scale(0.97)' }, transition: 'opacity 0.15s, transform 0.1s' }}>
                    <Box sx={{ width: 30, height: 30, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {item.icon}
                    </Box>
                    <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.78rem' }}>{item.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Student Data Manager entry point */}
          {homeNav === 0 && (
            <Box sx={{ px: 2, pb: 2 }}>
              <Box
                onClick={() => { setSelectedProject(null); setProjectStudents([]); setProjectClasses([]); setClassFilter(''); setProjectTab(0); setView('projects'); }}
                sx={{
                  borderRadius: 2.5, p: 1.75, cursor: 'pointer',
                  border: '1.5px solid #ede9fe',
                  background: 'linear-gradient(135deg, #faf5ff, #f5f3ff)',
                  display: 'flex', alignItems: 'center', gap: 1.75,
                  '&:hover': { borderColor: '#c4b5fd', boxShadow: '0 2px 12px rgba(124,58,237,0.1)' },
                  transition: 'all 0.15s',
                }}
              >
                <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BadgeOutlinedIcon sx={{ color: '#7c3aed', fontSize: 22 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>Student Data Manager</Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#64748b', mt: 0.2 }}>Import students · collect photos · approve · print</Typography>
                </Box>
                <ArrowForwardIosIcon sx={{ fontSize: 13, color: '#94a3b8', flexShrink: 0 }} />
              </Box>
            </Box>
          )}

          {/* Inspired by your designs */}
          {homeNav === 0 && (
            <Box sx={{ px: 2, pb: 4 }}>
              <Typography sx={{ color: '#1e293b', fontWeight: 700, fontSize: '1rem', mb: 1.5 }}>
                Inspired by your designs
              </Typography>
              <Box sx={{
                display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1,
                scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
              }}>
                {/* Show saved designs first, then fall back to generated previews */}
                {savedDesigns.length > 0
                  ? savedDesigns.slice(0, 6).map(d => {
                      const dt = DOC_TYPES.find(x => x.key === d.docType) || DOC_TYPES[0];
                      const tpl = (TEMPLATES[d.docType] || [])[0] || TEMPLATES.id_card[0];
                      return (
                        <RecentTile key={d.design_uuid} dt={dt} tpl={tpl} design={d}
                          onClick={() => { initParamsRef.current = { type: d.docType, tplIdx: null, pendingJSON: JSON.parse(d.canvas_json || '{}') }; setView('editor'); }} />
                      );
                    })
                  : recentDesigns.map(({ dt, tpl, key }) => (
                      <RecentTile key={key} dt={dt} tpl={tpl}
                        onClick={() => pickMode(dt.key, TEMPLATES[dt.key].indexOf(tpl))} />
                    ))
                }
              </Box>
            </Box>
          )}

          {/* Your Designs tab */}
          {homeNav === 1 && (
            <Box sx={{ px: 2, pb: 3 }}>
              {savedDesigns.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <FolderOpenIcon sx={{ fontSize: 52, color: '#dde3ef', mb: 1.5 }} />
                  <Typography sx={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>No saved designs yet</Typography>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', mt: 0.5 }}>Create a design and save it to see it here</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
                  {savedDesigns.map(d => (
                    <Box key={d.design_uuid} sx={{ borderRadius: 2.5, overflow: 'hidden', border: '1px solid #e8eef4', cursor: 'pointer', bgcolor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', '&:hover': { border: '1px solid #c4b5fd', boxShadow: '0 4px 12px rgba(124,58,237,0.1)' } }}>
                      <Box onClick={() => loadDesign(d)} sx={{ height: 90, bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {d.thumbnail ? <img src={d.thumbnail} alt={d.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} /> : <AutoAwesomeIcon sx={{ color: '#cbd5e1', fontSize: 30 }} />}
                      </Box>
                      <Box sx={{ bgcolor: '#ffffff', px: 1.25, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f4f8' }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ color: '#1e293b', fontSize: '0.75rem', fontWeight: 600 }} noWrap>{d.name}</Typography>
                          <Typography sx={{ color: '#94a3b8', fontSize: '0.63rem' }}>{DOC_TYPES.find(dt => dt.key === d.docType)?.label}</Typography>
                        </Box>
                        <IconButton size="small" onClick={e => { e.stopPropagation(); deleteDesign(d); }} sx={{ color: '#94a3b8', p: 0.25, '&:hover': { color: '#ef4444' } }}>
                          <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {/* Templates tab */}
          {homeNav === 2 && (
            <Box sx={{ px: 2, pb: 3 }}>
              {isAdmin && (
                <Box
                  onClick={() => setUploadDialog(true)}
                  sx={{ mb: 2.5, borderRadius: 2.5, border: '2px dashed #c4b5fd', bgcolor: '#faf5ff',
                    p: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2,
                    '&:hover': { bgcolor: '#f5f3ff', borderColor: '#a78bfa' } }}
                >
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AddPhotoAlternateIcon sx={{ color: '#7c3aed', fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ color: '#7c3aed', fontWeight: 700, fontSize: '0.875rem' }}>Upload Custom Template</Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '0.72rem', mt: 0.25 }}>Add your own Corel Draw / SVG / image templates</Typography>
                  </Box>
                </Box>
              )}
              {DOC_TYPES.map(dt => (
                <Box key={dt.key} sx={{ mb: 3 }}>
                  <Typography sx={{ color: '#1e293b', fontWeight: 600, fontSize: '0.85rem', mb: 1 }}>{dt.label}</Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
                    {(TEMPLATES[dt.key] || []).map((tpl, i) => (
                      <Box key={tpl.id} onClick={() => pickMode(dt.key, i)} sx={{
                        width: 96, flexShrink: 0, cursor: 'pointer', borderRadius: 2, overflow: 'hidden',
                        bgcolor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                        border: '1px solid #e8eef4', '&:hover': { border: '1px solid #c4b5fd', boxShadow: '0 2px 8px rgba(124,58,237,0.1)' },
                      }}>
                        <Box sx={{ height: 64, background: `linear-gradient(135deg, ${tpl.thumb}cc, ${tpl.thumb})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <AutoAwesomeIcon sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 20 }} />
                        </Box>
                        <Box sx={{ bgcolor: '#ffffff', p: 0.75 }}>
                          <Typography sx={{ color: '#1e293b', fontSize: '0.65rem', fontWeight: 500 }}>{tpl.label}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}

              {/* Custom / admin-uploaded templates */}
              <Box sx={{ mt: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography sx={{ color: '#1e293b', fontWeight: 600, fontSize: '0.85rem' }}>Your Custom Templates</Typography>
                  {isAdmin && (
                    <Button
                      size="small"
                      startIcon={<AddPhotoAlternateIcon sx={{ fontSize: 14 }} />}
                      onClick={() => setUploadDialog(true)}
                      sx={{ bgcolor: '#ede9fe', color: '#7c3aed', textTransform: 'none', fontSize: '0.7rem', px: 1, py: 0.25, borderRadius: 1.5, '&:hover': { bgcolor: '#ddd6fe' } }}
                    >
                      Upload
                    </Button>
                  )}
                </Stack>
                {loadingTemplates ? (
                  <CircularProgress size={18} sx={{ display: 'block', mx: 'auto' }} />
                ) : customTemplates.length === 0 ? (
                  <Typography sx={{ color: '#475569', fontSize: '0.75rem', textAlign: 'center', py: 2 }}>
                    {isAdmin ? 'Upload your own template images to use them here.' : 'No custom templates yet.'}
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
                    {customTemplates.map(ct => (
                      <Box key={ct.template_uuid} sx={{ position: 'relative', flexShrink: 0 }}>
                        <Box
                          onClick={() => handleUseCustomTemplate(ct.imageUrl)}
                          sx={{ width: 96, cursor: 'pointer', borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0', '&:hover': { border: '1px solid #c4b5fd', boxShadow: '0 2px 8px rgba(124,58,237,0.1)' } }}
                        >
                          <Box sx={{ height: 64, overflow: 'hidden' }}>
                            <img src={ct.thumbUrl || ct.imageUrl} alt={ct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </Box>
                          <Box sx={{ bgcolor: '#ffffff', p: 0.75 }}>
                            <Typography sx={{ color: '#1e293b', fontSize: '0.65rem', fontWeight: 500 }} noWrap>{ct.name}</Typography>
                          </Box>
                        </Box>
                        {isAdmin && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={e => { e.stopPropagation(); handleDeleteTemplate(ct.template_uuid); }}
                              sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', width: 18, height: 18, '&:hover': { bgcolor: '#ef4444' } }}
                            >
                              <DeleteIcon sx={{ fontSize: 11 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>

        {/* Upload Template Dialog */}
        <input ref={uploadInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setUploadFile(e.target.files?.[0] || null)} />
        <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>Upload Custom Template</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField label="Template Name" value={uploadName} onChange={e => setUploadName(e.target.value)} fullWidth size="small" placeholder="e.g. Blue ID Card 2025" />
              <Select value={uploadDocType} onChange={e => setUploadDocType(e.target.value)} size="small" fullWidth>
                <MenuItem value="id_card">ID Card</MenuItem>
                <MenuItem value="certificate">Certificate</MenuItem>
                <MenuItem value="result">Result / Mark Sheet</MenuItem>
                <MenuItem value="admit_card">Admit Card</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
              <Button variant="outlined" fullWidth startIcon={<AddPhotoAlternateIcon />} onClick={() => uploadInputRef.current?.click()} sx={{ textTransform: 'none' }}>
                {uploadFile ? uploadFile.name : 'Choose Image (max 10MB)'}
              </Button>
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

        {/* ── Mode Selection Dialog ── */}
        <Dialog open={modeSelectDlg} onClose={() => setModeSelectDlg(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', pb: 1 }}>How would you like to create?</DialogTitle>
          <DialogContent sx={{ pb: 1 }}>
            <Stack spacing={1.25}>
              {[
                { mode: 'single', label: 'Single Document', desc: 'Design one document — for one person', icon: <BadgeIcon sx={{ fontSize: 22 }} />, color: '#1a7a4a' },
                { mode: 'bulk', label: 'Bulk (Carousel)', desc: 'Go through each student, adjust photo & text, save individually', icon: <PeopleIcon sx={{ fontSize: 22 }} />, color: '#d97706' },
                { mode: 'batch', label: 'Batch Generate', desc: 'Generate all documents at once from student data', icon: <FolderZipIcon sx={{ fontSize: 22 }} />, color: '#7c3aed' },
              ].map(item => (
                <Box key={item.mode} onClick={() => setModeDialogMode(item.mode)}
                  sx={{
                    p: 1.5, borderRadius: 2, border: `2px solid ${modeDialogMode === item.mode ? item.color : '#e2e8f0'}`,
                    cursor: 'pointer', bgcolor: modeDialogMode === item.mode ? `${item.color}0d` : '#fff',
                    display: 'flex', alignItems: 'center', gap: 1.5, transition: 'all 0.15s',
                  }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: item.color }}>
                    {item.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>{item.label}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#64748b', mt: 0.15 }}>{item.desc}</Typography>
                  </Box>
                  {modeDialogMode === item.mode && <CheckIcon sx={{ fontSize: 18, color: item.color, flexShrink: 0 }} />}
                </Box>
              ))}

              {(modeDialogMode === 'bulk' || modeDialogMode === 'batch') && (
                <Box sx={{ pt: 0.5 }}>
                  <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, mb: 0.75 }}>Select student batch (optional)</Typography>
                  <Select value={modeDialogBatch} onChange={e => setModeDialogBatch(e.target.value)} size="small" displayEmpty fullWidth
                    sx={{ bgcolor: '#f8fafc', fontSize: '0.82rem' }}>
                    <MenuItem value=""><em style={{ color: '#94a3b8' }}>Choose batch…</em></MenuItem>
                    {batches.map(b => <MenuItem key={b._id || b.Batch_uuid} value={b.name}>{b.name}{b.timing ? ` (${b.timing})` : ''}</MenuItem>)}
                  </Select>
                  <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', mt: 0.5 }}>
                    You can also upload CSV/Excel from the Export tab inside the editor.
                  </Typography>
                </Box>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 2.5, pb: 2 }}>
            <Button onClick={() => setModeSelectDlg(false)} sx={{ textTransform: 'none', color: '#64748b' }}>Cancel</Button>
            <Button variant="contained" onClick={confirmModeAndOpen}
              sx={{ bgcolor: '#d4a017', '&:hover': { bgcolor: '#b8860b' }, textTransform: 'none', fontWeight: 700, px: 2.5 }}>
              Start →
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Bottom nav ── */}
        <Box sx={{ bgcolor: '#ffffff', borderTop: '1px solid #e8eef4', display: 'flex', flexShrink: 0, boxShadow: '0 -1px 8px rgba(0,0,0,0.06)' }}>
          <HomeNavItem icon={<AddCircleOutlineIcon fontSize="small" />} label="Create"       active={homeNav === 0} onClick={() => setHomeNav(0)} />
          <HomeNavItem icon={<FolderOpenIcon fontSize="small" />}       label="Your Designs" active={homeNav === 1} onClick={() => setHomeNav(1)} />
          <HomeNavItem icon={<ViewModuleIcon fontSize="small" />}       label="Templates"    active={homeNav === 2} onClick={() => setHomeNav(2)} />
          <HomeNavItem icon={<PeopleIcon fontSize="small" />}           label="Projects"     active={false}        onClick={() => { setSelectedProject(null); setProjectStudents([]); setProjectClasses([]); setClassFilter(''); setProjectTab(0); setView('projects'); }} />
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
      <input ref={fileInputRef}   type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageFile(e, 'Photo')} />
      <input ref={sigInputRef}    type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageFile(e, 'Signature')} />
      <input ref={frameInputRef}  type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) fillFrameWithPhoto(e.target.files[0]); e.target.value = ''; }} />
      <input ref={svgInputRef}    type="file" accept=".svg,image/svg+xml" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) importSVG(e.target.files[0]); e.target.value = ''; }} />

      {/* Top bar — compact, no dead-weight buttons */}
      <Box sx={{
        bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0',
        px: 1, py: 0.75, display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <IconButton onClick={handleBack} size="small" sx={{ color: '#64748b' }}>
          <HomeIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <Tooltip title="Undo"><span>
          <IconButton size="small" onClick={undo} disabled={!canUndo} sx={{ color: '#64748b', '&.Mui-disabled': { opacity: 0.3 } }}>
            <UndoIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </span></Tooltip>
        <Tooltip title="Redo"><span>
          <IconButton size="small" onClick={redo} disabled={!canRedo} sx={{ color: '#64748b', '&.Mui-disabled': { opacity: 0.3 } }}>
            <RedoIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </span></Tooltip>
        <Box sx={{ flex: 1, minWidth: 0, px: 0.5 }}>
          <Typography sx={{ color: '#1e293b', fontWeight: 600, fontSize: '0.8rem' }} noWrap>
            {currentDT?.label}
          </Typography>
        </Box>
        <Tooltip title="Page Setup">
          <IconButton size="small" onClick={() => { setTempSetup({ ...(pageSetup || DEFAULT_SETUPS[docType] || DEFAULT_SETUPS.result) }); setPageSetupDialog(true); }} sx={{ color: '#64748b' }}>
            <TuneIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Print">
          <IconButton size="small" onClick={printDocument} disabled={printing} sx={{ color: '#1a7a4a' }}>
            {printing ? <CircularProgress size={14} color="inherit" /> : <PrintIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Download PNG">
          <IconButton size="small" onClick={exportPNG} sx={{ color: '#64748b' }}><DownloadIcon sx={{ fontSize: 18 }} /></IconButton>
        </Tooltip>
        <Tooltip title="Save Design">
          <IconButton
            size="small"
            onClick={saveDesign}
            disabled={savingDesign}
            sx={{ bgcolor: '#d4a017', color: '#fff', borderRadius: 1.5, p: 0.75, '&:hover': { bgcolor: '#b8860b' } }}
          >
            {savingDesign ? <CircularProgress size={14} color="inherit" /> : <CheckIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Template strip — Instagram-story style ─────────── */}
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #e2e8f0', flexShrink: 0, px: 1.25, py: 0.75 }}>
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
          {templates.map((tpl, idx) => (
            <Box key={tpl.id} onClick={() => switchTemplate(idx)} sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.4, cursor: 'pointer' }}>
              {/* Mini document preview */}
              <Box sx={{
                width: 40, height: 50, borderRadius: 1.5, overflow: 'hidden', position: 'relative',
                bgcolor: tpl.bg, border: selectedTpl === idx ? '2px solid #d4a017' : '1.5px solid #e2e8f0',
                boxShadow: selectedTpl === idx ? '0 0 0 2px #d4a01733' : 'none',
              }}>
                <Box sx={{ height: 11, bgcolor: tpl.thumb }} />
                <Box sx={{ px: 0.5, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                  <Box sx={{ height: 2, bgcolor: 'rgba(0,0,0,0.15)', borderRadius: 1 }} />
                  <Box sx={{ height: 2, bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 1, width: '70%' }} />
                  <Box sx={{ height: 2, bgcolor: 'rgba(0,0,0,0.08)', borderRadius: 1, width: '55%' }} />
                </Box>
              </Box>
              <Typography sx={{ fontSize: '0.58rem', color: selectedTpl === idx ? '#d4a017' : '#94a3b8', fontWeight: selectedTpl === idx ? 700 : 400 }}>
                {tpl.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Bulk Carousel Bar ──────────────────────────────── */}
      {editorMode === 'bulk' && (
        <Box sx={{
          bgcolor: '#1e293b', px: 1.5, py: 0.6, display: 'flex', alignItems: 'center', gap: 1,
          flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        }}>
          {batchStudents.length === 0 ? (
            <Stack direction="row" alignItems="center" gap={1} sx={{ flex: 1 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', fontWeight: 600, flexShrink: 0 }}>Batch:</Typography>
              <Select value={selBatch} onChange={e => setSelBatch(e.target.value)} displayEmpty size="small"
                sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.72rem', borderRadius: 1.5,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                  '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.6)' },
                  '& .MuiSelect-select': { py: 0.5, px: 1 } }}>
                <MenuItem value=""><em style={{ color: '#94a3b8' }}>Select batch…</em></MenuItem>
                {batches.map(b => <MenuItem key={b._id} value={b.batch_name || b.name || b._id}>{b.batch_name || b.name}</MenuItem>)}
              </Select>
              <Button size="small" component="label"
                sx={{ color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 1.5,
                  fontSize: '0.65rem', textTransform: 'none', px: 1, py: 0.4, flexShrink: 0, whiteSpace: 'nowrap' }}>
                CSV/Excel
                <input hidden type="file" accept=".csv,.xlsx,.xls" ref={csvInputRef} onChange={e => handleCsvUpload(e.target.files[0])} />
              </Button>
            </Stack>
          ) : (<>
            <IconButton size="small" onClick={() => goCarousel(carouselIdx - 1)} disabled={carouselIdx === 0}
              sx={{ color: '#fff', p: 0.4, '&.Mui-disabled': { opacity: 0.3 }, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 1 }}>
              <ArrowBackIosNewIcon sx={{ fontSize: 13 }} />
            </IconButton>

            <Box sx={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.82rem' }} noWrap>
                {carouselFields.name || batchStudents[carouselIdx]?.firstName || 'Student'}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.4, mt: 0.3 }}>
                {batchStudents.slice(Math.max(0, carouselIdx - 2), carouselIdx + 3).map((_, i) => {
                  const absIdx = Math.max(0, carouselIdx - 2) + i;
                  return (
                    <Box key={absIdx} onClick={() => goCarousel(absIdx)}
                      sx={{ width: absIdx === carouselIdx ? 16 : 5, height: 5, borderRadius: 3,
                        bgcolor: absIdx === carouselIdx ? '#d4a017' : 'rgba(255,255,255,0.3)',
                        cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }} />
                  );
                })}
              </Box>
              <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.6rem' }}>
                {carouselIdx + 1} / {batchStudents.length}
              </Typography>
            </Box>

            <IconButton size="small" onClick={() => goCarousel(carouselIdx + 1)} disabled={carouselIdx === batchStudents.length - 1}
              sx={{ color: '#fff', p: 0.4, '&.Mui-disabled': { opacity: 0.3 }, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 1 }}>
              <ArrowForwardIosIcon sx={{ fontSize: 13 }} />
            </IconButton>

            <Button size="small" onClick={saveBulkCanvas}
              sx={{ bgcolor: '#d4a017', color: '#fff', fontSize: '0.68rem', textTransform: 'none', px: 1, py: 0.35, minWidth: 0,
                flexShrink: 0, '&:hover': { bgcolor: '#b8860b' }, borderRadius: 1.5 }}>
              Save
            </Button>

            <Button size="small" onClick={exportBulkPDF} disabled={generating}
              sx={{ bgcolor: '#059669', color: '#fff', fontSize: '0.68rem', textTransform: 'none', px: 1, py: 0.35, minWidth: 0,
                flexShrink: 0, '&:hover': { bgcolor: '#047857' }, borderRadius: 1.5 }}>
              {generating ? '…' : 'Export All'}
            </Button>
          </>)}
        </Box>
      )}

      {/* ── Alert ──────────────────────────────────────────── */}
      {alert && (
        <Alert severity={alert.type} sx={{ mx: 1, mt: 0.5, flexShrink: 0 }} onClose={() => setAlert(null)} size="small">
          {alert.text}
        </Alert>
      )}

      {/* ── Main body: canvas + sidebar (row on desktop, column on mobile) ── */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>

      {/* ── Desktop left sidebar — Add Elements ─────────────── */}
      {isDesktop && (
        <Box sx={{ width: 176, bgcolor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
            <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Add Elements</Typography>
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
            <Stack spacing={1}>
              <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Content</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.75 }}>
                {[
                  ['Text',    <TextFieldsIcon sx={{ fontSize: 22, color: '#d4a017' }} />,       addText],
                  ['Photo',   <ImageIcon sx={{ fontSize: 22, color: '#d4a017' }} />,            () => fileInputRef.current?.click()],
                  ['Gallery', <AddPhotoAlternateIcon sx={{ fontSize: 22, color: '#d4a017' }} />,() => setGalleryDialog(true)],
                  ['SVG',     <FolderOpenIcon sx={{ fontSize: 22, color: '#d4a017' }} />,       () => svgInputRef.current?.click()],
                ].map(([label, icon, action]) => (
                  <Box key={label} onClick={action} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, cursor: 'pointer', p: 1, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', '&:hover': { borderColor: '#d4a01755', bgcolor: '#f1f5f9' } }}>
                    {icon}
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 500, color: '#64748b' }}>{label}</Typography>
                  </Box>
                ))}
              </Box>

              <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', pt: 0.5 }}>Photo Frames</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.5 }}>
                {[
                  ['Rect',   <Box sx={{ width: 20, height: 20, border: '2px dashed #d4a017', borderRadius: 1 }} />,     () => addFrame('rect')],
                  ['Circle', <Box sx={{ width: 20, height: 20, border: '2px dashed #d4a017', borderRadius: '50%' }} />, () => addFrame('circle')],
                  ['Round',  <Box sx={{ width: 20, height: 20, border: '2px dashed #d4a017', borderRadius: 5 }} />,     () => addFrame('rounded')],
                ].map(([label, icon, action]) => (
                  <Box key={label} onClick={action} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.4, cursor: 'pointer', p: 0.75, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', '&:hover': { borderColor: '#d4a01755', bgcolor: '#f1f5f9' } }}>
                    {icon}
                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 500, color: '#64748b' }}>{label}</Typography>
                  </Box>
                ))}
              </Box>

              <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', pt: 0.5 }}>Shapes</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.75 }}>
                {[
                  ['Rect',     <LayersIcon sx={{ fontSize: 22, color: '#d4a017' }} />,         () => addShape('rect')],
                  ['Circle',   <LayersIcon sx={{ fontSize: 22, color: '#d4a017' }} />,         () => addShape('circle')],
                  ['Triangle', <ChangeHistoryIcon sx={{ fontSize: 22, color: '#d4a017' }} />,  () => addShape('triangle')],
                  ['Line',     <HorizontalRuleIcon sx={{ fontSize: 22, color: '#d4a017' }} />, () => addShape('line')],
                ].map(([label, icon, action]) => (
                  <Box key={label} onClick={action} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, cursor: 'pointer', p: 1, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', '&:hover': { borderColor: '#d4a01755', bgcolor: '#f1f5f9' } }}>
                    {icon}
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 500, color: '#64748b' }}>{label}</Typography>
                  </Box>
                ))}
              </Box>
            </Stack>
          </Box>
        </Box>
      )}

      {/* ── Canvas area ────────────────────────────────────── */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1, minHeight: 0, position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: userZoom > 1 ? 'auto' : 'hidden', p: '6px',
          '& canvas': { display: 'block' },
        }}
      >
        {!ready && <CircularProgress sx={{ color: currentDT?.color || '#d4a017' }} />}
        <Box sx={{
          transform: `scale(${+(scale * userZoom).toFixed(3)})`,
          transformOrigin: 'center center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          borderRadius: 1.5,
          overflow: 'hidden',
          display: ready ? 'block' : 'none',
          flexShrink: 0,
        }}>
          <canvas ref={canvasRef} />
        </Box>

        {/* Photo adjust mode hint overlay */}
        {photoAdjustMode && ready && (
          <Box sx={{
            position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
            bgcolor: 'rgba(15,23,42,0.88)', color: '#fff', borderRadius: 2, px: 1.5, py: 0.6,
            display: 'flex', alignItems: 'center', gap: 0.75, zIndex: 10,
            backdropFilter: 'blur(4px)', pointerEvents: 'all',
            boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          }}>
            <OpenWithIcon sx={{ fontSize: 14, color: '#fbbf24', flexShrink: 0 }} />
            <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap' }}>
              Drag photo to reposition
            </Typography>
            <Button size="small" onClick={exitPhotoAdjustMode}
              sx={{ color: '#34d399', border: '1px solid rgba(52,211,153,0.45)', borderRadius: 1, ml: 0.5,
                    textTransform: 'none', fontSize: '0.65rem', px: 0.75, py: 0.2, minWidth: 0,
                    '&:hover': { bgcolor: 'rgba(52,211,153,0.12)' } }}>
              ✓ Done
            </Button>
          </Box>
        )}

        {/* Zoom pill — bottom right of canvas area */}
        {ready && (
          <Box sx={{
            position: 'absolute', bottom: 8, right: 8, zIndex: 5,
            display: 'flex', alignItems: 'center', gap: 0.25,
            bgcolor: 'rgba(15,23,42,0.72)', borderRadius: 2, px: 0.75, py: 0.25,
            backdropFilter: 'blur(6px)',
          }}>
            <IconButton size="small" onClick={zoomOut} sx={{ color: '#fff', p: 0.3 }}>
              <ZoomOutIcon sx={{ fontSize: 14 }} />
            </IconButton>
            <Typography onClick={zoomFit} sx={{ color: '#fff', fontSize: '0.62rem', minWidth: 30, textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
              {Math.round(scale * userZoom * 100)}%
            </Typography>
            <IconButton size="small" onClick={zoomIn} sx={{ color: '#fff', p: 0.3 }}>
              <ZoomInIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* ── Contextual quick bar — mobile: between canvas and toolbar; hidden on desktop (shown in sidebar) ── */}
      {selectedObj && ready && !isDesktop && (
        <Box sx={{
          bgcolor: '#1e293b', flexShrink: 0, px: 1.5, height: 54,
          display: 'flex', alignItems: 'center', gap: 1,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.18)',
        }}>
          {/* TEXT quick tools */}
          {(selectedObj.type === 'i-text' || selectedObj.type === 'text') && (<>
            <input type="color" value={fontColor}
              onChange={e => { setFontColor(e.target.value); applyFontProp('fill', e.target.value); }}
              style={{ width: 28, height: 28, border: '2px solid rgba(255,255,255,0.25)', borderRadius: 6, cursor: 'pointer', padding: 0, background: 'none', flexShrink: 0 }} />
            <IconButton size="small" onClick={() => { const v = !isBold; setIsBold(v); applyFontProp('fontWeight', v ? 'bold' : 'normal'); }}
              sx={{ color: isBold ? '#f0c040' : 'rgba(255,255,255,0.6)', bgcolor: isBold ? 'rgba(167,139,250,0.15)' : 'transparent', p: 0.6, borderRadius: 1 }}>
              <FormatBoldIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton size="small" onClick={() => { const v = !isItalic; setIsItalic(v); applyFontProp('fontStyle', v ? 'italic' : 'normal'); }}
              sx={{ color: isItalic ? '#f0c040' : 'rgba(255,255,255,0.6)', bgcolor: isItalic ? 'rgba(167,139,250,0.15)' : 'transparent', p: 0.6, borderRadius: 1 }}>
              <FormatItalicIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <Stack direction="row" alignItems="center" sx={{ bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 1.5, px: 0.75 }}>
              <IconButton size="small" onClick={() => { const v = Math.max(8, fontSize - 1); setFontSize(v); applyFontProp('fontSize', v); }} sx={{ color: 'rgba(255,255,255,0.6)', p: 0.4 }}>
                <Typography sx={{ fontSize: '0.9rem', lineHeight: 1, fontWeight: 700, color: 'inherit' }}>−</Typography>
              </IconButton>
              <Typography sx={{ color: '#fff', fontSize: '0.75rem', minWidth: 22, textAlign: 'center' }}>{fontSize}</Typography>
              <IconButton size="small" onClick={() => { const v = Math.min(200, fontSize + 1); setFontSize(v); applyFontProp('fontSize', v); }} sx={{ color: 'rgba(255,255,255,0.6)', p: 0.4 }}>
                <Typography sx={{ fontSize: '0.9rem', lineHeight: 1, fontWeight: 700, color: 'inherit' }}>+</Typography>
              </IconButton>
            </Stack>
          </>)}

          {/* IMAGE quick tools */}
          {selectedObj.type === 'image' && (<>
            <WbSunnyIcon sx={{ fontSize: 20, color: '#fbbf24' }} />
            <Box sx={{ width: 64 }}>
              <Slider value={Math.round(imgBright * 100)} min={-100} max={100} size="small"
                onChange={(_, v) => { const n = v / 100; setImgBright(n); applyImageFilter('Brightness', n); }}
                sx={{ color: '#fbbf24', py: 0.5, '& .MuiSlider-thumb': { width: 12, height: 12 } }} />
            </Box>
            <TonalityIcon sx={{ fontSize: 20, color: '#34c97e' }} />
            <Box sx={{ width: 64 }}>
              <Slider value={Math.round(imgContrast * 100)} min={-100} max={100} size="small"
                onChange={(_, v) => { const n = v / 100; setImgContrast(n); applyImageFilter('Contrast', n); }}
                sx={{ color: '#34c97e', py: 0.5, '& .MuiSlider-thumb': { width: 12, height: 12 } }} />
            </Box>
            <IconButton size="small" onClick={() => applyObjProp('flipX', !selectedObj.flipX)} sx={{ color: 'rgba(255,255,255,0.6)', p: 0.6 }}>
              <SwapHorizIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </>)}

          {/* FRAME quick tools — fill photo + adjust position */}
          {selectedObj.__frameType && (
            <Button size="small" onClick={() => frameInputRef.current?.click()}
              startIcon={<ImageIcon sx={{ fontSize: 18 }} />}
              sx={{ color: '#f0c040', border: '1px solid rgba(167,139,250,0.4)', borderRadius: 1.5, textTransform: 'none', fontSize: '0.75rem', px: 1.5, py: 0.5, '&:hover': { bgcolor: 'rgba(167,139,250,0.1)' } }}>
              Fill Photo
            </Button>
          )}
          {selectedObj.type === 'image' && selectedObj.__frameType && selectedObj.clipPath?.absolutePositioned && (
            <Button size="small"
              onClick={() => { setPhotoAdjustMode(true); photoAdjustModeRef.current = true; }}
              startIcon={<OpenWithIcon sx={{ fontSize: 18 }} />}
              sx={{ color: photoAdjustMode ? '#34d399' : 'rgba(255,255,255,0.7)', border: `1px solid ${photoAdjustMode ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.2)'}`, borderRadius: 1.5, textTransform: 'none', fontSize: '0.75rem', px: 1.5, py: 0.5 }}>
              {photoAdjustMode ? 'Adjusting…' : 'Adjust'}
            </Button>
          )}

          {/* SHAPE quick tool — fill color */}
          {(selectedObj.type === 'rect' || selectedObj.type === 'circle' || selectedObj.type === 'triangle' || selectedObj.type === 'polygon') && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Fill</Typography>
              <input type="color" value={selectedObj.fill || '#e8f5e9'}
                onChange={e => applyObjProp('fill', e.target.value)}
                style={{ width: 28, height: 28, border: '2px solid rgba(255,255,255,0.25)', borderRadius: 6, cursor: 'pointer', padding: 0, background: 'none' }} />
            </Box>
          )}

          <Box sx={{ flex: 1 }} />
          <IconButton size="small" onClick={duplicateObj} sx={{ color: 'rgba(255,255,255,0.6)', p: 0.6 }}>
            <ContentCopyIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <IconButton size="small" onClick={deleteSelected} sx={{ color: '#f87171', p: 0.6 }}>
            <DeleteOutlineIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      )}

      {/* ── Sidebar / bottom toolbar ───────────────────────── */}
      <Box sx={{
        bgcolor: '#ffffff',
        borderTop: { xs: '1px solid #e2e8f0', md: 'none' },
        borderLeft: { xs: 'none', md: '1px solid #e2e8f0' },
        flexShrink: 0,
        width: { xs: '100%', md: 300 },
        height: { xs: 180, md: '100%' },
        display: 'flex', flexDirection: 'column',
        boxShadow: { xs: '0 -1px 8px rgba(0,0,0,0.06)', md: '-2px 0 8px rgba(0,0,0,0.04)' },
      }}>
        {/* Desktop-only contextual quick bar at top of sidebar */}
        {isDesktop && selectedObj && ready && (
          <Box sx={{ bgcolor: '#1e293b', flexShrink: 0, px: 1.5, height: 52, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {(selectedObj.type === 'i-text' || selectedObj.type === 'text') && (<>
              <input type="color" value={fontColor} onChange={e => { setFontColor(e.target.value); applyFontProp('fill', e.target.value); }}
                style={{ width: 26, height: 26, border: '2px solid rgba(255,255,255,0.25)', borderRadius: 4, cursor: 'pointer', padding: 0, background: 'none', flexShrink: 0 }} />
              <IconButton size="small" onClick={() => { const v = !isBold; setIsBold(v); applyFontProp('fontWeight', v ? 'bold' : 'normal'); }}
                sx={{ color: isBold ? '#f0c040' : 'rgba(255,255,255,0.6)', p: 0.5 }}><FormatBoldIcon sx={{ fontSize: 18 }} /></IconButton>
              <IconButton size="small" onClick={() => { const v = !isItalic; setIsItalic(v); applyFontProp('fontStyle', v ? 'italic' : 'normal'); }}
                sx={{ color: isItalic ? '#f0c040' : 'rgba(255,255,255,0.6)', p: 0.5 }}><FormatItalicIcon sx={{ fontSize: 18 }} /></IconButton>
              <Stack direction="row" alignItems="center" sx={{ bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 1, px: 0.5 }}>
                <IconButton size="small" onClick={() => { const v = Math.max(8, fontSize - 1); setFontSize(v); applyFontProp('fontSize', v); }} sx={{ color: 'rgba(255,255,255,0.6)', p: 0.35 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: 'inherit', lineHeight: 1 }}>−</Typography>
                </IconButton>
                <Typography sx={{ color: '#fff', fontSize: '0.72rem', minWidth: 22, textAlign: 'center' }}>{fontSize}</Typography>
                <IconButton size="small" onClick={() => { const v = Math.min(200, fontSize + 1); setFontSize(v); applyFontProp('fontSize', v); }} sx={{ color: 'rgba(255,255,255,0.6)', p: 0.35 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: 'inherit', lineHeight: 1 }}>+</Typography>
                </IconButton>
              </Stack>
            </>)}
            {selectedObj.type === 'image' && (<>
              <WbSunnyIcon sx={{ fontSize: 18, color: '#fbbf24' }} />
              <Box sx={{ width: 60 }}><Slider value={Math.round(imgBright * 100)} min={-100} max={100} size="small" onChange={(_, v) => { const n = v / 100; setImgBright(n); applyImageFilter('Brightness', n); }} sx={{ color: '#fbbf24', py: 0.5, '& .MuiSlider-thumb': { width: 12, height: 12 } }} /></Box>
              <TonalityIcon sx={{ fontSize: 18, color: '#34c97e' }} />
              <Box sx={{ width: 60 }}><Slider value={Math.round(imgContrast * 100)} min={-100} max={100} size="small" onChange={(_, v) => { const n = v / 100; setImgContrast(n); applyImageFilter('Contrast', n); }} sx={{ color: '#34c97e', py: 0.5, '& .MuiSlider-thumb': { width: 12, height: 12 } }} /></Box>
            </>)}
            {selectedObj.__frameType && (
              <Button size="small" onClick={() => frameInputRef.current?.click()} startIcon={<ImageIcon sx={{ fontSize: 16 }} />}
                sx={{ color: '#f0c040', border: '1px solid rgba(167,139,250,0.4)', borderRadius: 1, textTransform: 'none', fontSize: '0.7rem', px: 1, py: 0.4 }}>Fill Photo</Button>
            )}
            {selectedObj.type === 'image' && selectedObj.__frameType && selectedObj.clipPath?.absolutePositioned && (
              <Button size="small"
                onClick={() => { setPhotoAdjustMode(true); photoAdjustModeRef.current = true; }}
                startIcon={<OpenWithIcon sx={{ fontSize: 16 }} />}
                sx={{ color: photoAdjustMode ? '#34d399' : 'rgba(255,255,255,0.65)', border: `1px solid ${photoAdjustMode ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.18)'}`, borderRadius: 1, textTransform: 'none', fontSize: '0.7rem', px: 1, py: 0.4 }}>
                {photoAdjustMode ? 'Adjusting' : 'Adjust'}
              </Button>
            )}
            <Box sx={{ flex: 1 }} />
            <IconButton size="small" onClick={duplicateObj} sx={{ color: 'rgba(255,255,255,0.6)', p: 0.5 }}><ContentCopyIcon sx={{ fontSize: 18 }} /></IconButton>
            <IconButton size="small" onClick={deleteSelected} sx={{ color: '#f87171', p: 0.5 }}><DeleteOutlineIcon sx={{ fontSize: 18 }} /></IconButton>
          </Box>
        )}

        {/* Scrollable tab bar — 6 focused sections */}
        <Tabs
          value={toolTab} onChange={(_, v) => setToolTab(v)}
          variant="fullWidth"
          sx={{
            minHeight: 36, flexShrink: 0, borderBottom: '1px solid #e2e8f0',
            '& .MuiTab-root': { minHeight: 36, py: 0, fontSize: '0.62rem', fontWeight: 600, textTransform: 'none', color: '#64748b', px: 0.25, minWidth: 0 },
            '& .Mui-selected': { color: '#d4a017 !important' },
            '& .MuiTabs-indicator': { bgcolor: '#d4a017' },
          }}
        >
          <Tab label="Add" />
          <Tab label="Text" />
          <Tab label="Object" />
          <Tab label="Arrange" />
          <Tab label="Style" />
          <Tab label="Export" />
        </Tabs>

        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', p: 1.25 }}>

          {/* ── Tab 0: Add elements ────────────────────────── */}
          {toolTab === 0 && (() => {
            const btn = (label, icon, action) => (
              <Box key={label} onClick={action} sx={{
                flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 0.4, cursor: 'pointer', px: 0.75, py: 0.75, borderRadius: 2, minWidth: 52,
                border: '1px solid #e2e8f0', bgcolor: '#f8fafc',
                '&:active': { opacity: 0.7 }, '&:hover': { borderColor: '#d4a01755', bgcolor: '#f1f5f9' },
              }}>
                <Box sx={{ color: '#d4a017' }}>{icon}</Box>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 500, color: '#64748b' }}>{label}</Typography>
              </Box>
            );
            return (
              <Stack spacing={0.75}>
                {/* Content */}
                <Typography sx={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Content</Typography>
                <Box sx={{ display: 'flex', gap: 0.75, overflowX: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
                  {btn('Text',    <TextFieldsIcon sx={{ fontSize: 18 }} />,       addText)}
                  {btn('Photo',   <ImageIcon sx={{ fontSize: 18 }} />,             () => fileInputRef.current?.click())}
                  {btn('Gallery', <AddPhotoAlternateIcon sx={{ fontSize: 18 }} />, () => setGalleryDialog(true))}
                  {btn('Sig',     <DrawIcon sx={{ fontSize: 18 }} />,              () => sigInputRef.current?.click())}
                  {btn('Sig Line',<HorizontalRuleIcon sx={{ fontSize: 18 }} />,   addSignatureLine)}
                  {btn('SVG',     <FolderOpenIcon sx={{ fontSize: 18 }} />,        () => svgInputRef.current?.click())}
                </Box>
                {/* Photo Frames (image placeholders) */}
                <Typography sx={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Photo Frames</Typography>
                <Box sx={{ display: 'flex', gap: 0.75, overflowX: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
                  {btn('Rect',    <Box sx={{ width: 18, height: 18, border: '2px dashed #d4a017', borderRadius: 1 }} />, () => addFrame('rect'))}
                  {btn('Circle',  <Box sx={{ width: 18, height: 18, border: '2px dashed #d4a017', borderRadius: '50%' }} />, () => addFrame('circle'))}
                  {btn('Rounded', <Box sx={{ width: 18, height: 18, border: '2px dashed #d4a017', borderRadius: 5 }} />, () => addFrame('rounded'))}
                </Box>
                {/* Shapes */}
                <Typography sx={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Shapes</Typography>
                <Box sx={{ display: 'flex', gap: 0.75, overflowX: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
                  {btn('Rect',     <LayersIcon sx={{ fontSize: 18 }} />,          () => addShape('rect'))}
                  {btn('Circle',   <LayersIcon sx={{ fontSize: 18 }} />,          () => addShape('circle'))}
                  {btn('Triangle', <ChangeHistoryIcon sx={{ fontSize: 18 }} />,   () => addShape('triangle'))}
                  {btn('Line',     <HorizontalRuleIcon sx={{ fontSize: 18 }} />,  () => addShape('line'))}
                </Box>
                {/* Dynamic Fields from Loaded Data */}
                {(() => {
                  const HIDDEN = new Set(['_id', '__v', 'uuid', 'institute_uuid', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'photo_url', 'bg_removed_url', '__placeholder', 'student_uuid']);
                  let fieldKeys = [];
                  let sourceLabel = '';
                  if (dataSource === 'csv' && csvRows.length > 0) {
                    fieldKeys = Object.keys(csvRows[0]).filter(k => k && !HIDDEN.has(k));
                    sourceLabel = csvFile || 'CSV/Excel';
                  } else if (batchStudents.length > 0) {
                    fieldKeys = Object.keys(studentToRow(batchStudents[0], selBatch)).filter(k => k !== 'photo_url');
                    sourceLabel = selBatch || 'DB Batch';
                  }
                  return fieldKeys.length > 0 ? (
                    <Box>
                      <Stack direction="row" alignItems="center" gap={0.5} mb={0.4}>
                        <Typography sx={{ fontSize: '0.6rem', color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Available Fields
                        </Typography>
                        <Box sx={{ px: 0.6, py: 0.1, borderRadius: 1, bgcolor: '#d1fae5', color: '#059669', fontSize: '0.52rem', fontWeight: 700 }}>
                          {fieldKeys.length}
                        </Box>
                      </Stack>
                      <Typography sx={{ fontSize: '0.56rem', color: '#94a3b8', mb: 0.6 }}>
                        From {sourceLabel} · Click to insert on canvas
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
                        {fieldKeys.map(key => (
                          <Box key={key} onClick={() => addPlaceholder(key)} sx={{
                            cursor: 'pointer', px: 0.75, py: 0.3, borderRadius: 1.5,
                            border: '1px solid #6ee7b7', bgcolor: '#ecfdf5',
                            '&:hover': { bgcolor: '#d1fae5', borderColor: '#34d399' },
                            '&:active': { transform: 'scale(0.95)' },
                            transition: 'all 0.1s',
                          }}>
                            <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#059669', fontFamily: 'monospace' }}>{`{{${key}}}`}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  ) : null;
                })()}

                {/* Smart Placeholders */}
                <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', pt: 0.5 }}>Smart Placeholders</Typography>
                <Typography sx={{ fontSize: '0.58rem', color: '#94a3b8', lineHeight: 1.4 }}>Insert data fields that auto-fill from students, CSV, or Excel</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.5 }}>
                  {PLACEHOLDER_FIELDS.map(({ key, label }) => (
                    <Box key={key} onClick={() => addPlaceholder(key)} sx={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3,
                      cursor: 'pointer', p: 0.75, borderRadius: 2,
                      border: '1px solid #d4a01733', bgcolor: '#fff8e1',
                      '&:hover': { borderColor: '#d4a01788', bgcolor: '#fff8e1' },
                      '&:active': { transform: 'scale(0.95)' },
                      transition: 'all 0.1s',
                    }}>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#d4a017', fontFamily: 'monospace' }}>{`{{${key}}}`}</Typography>
                      <Typography sx={{ fontSize: '0.58rem', color: '#d4a01799' }}>{label}</Typography>
                    </Box>
                  ))}
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <TextField
                    placeholder="custom_field"
                    value={customPh}
                    onChange={e => setCustomPh(e.target.value.replace(/[^a-z0-9_]/g, ''))}
                    size="small"
                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { fontSize: '0.72rem', bgcolor: '#f8fafc' }, '& input': { py: 0.5 } }}
                    onKeyDown={e => { if (e.key === 'Enter' && customPh) { addPlaceholder(customPh); setCustomPh(''); } }}
                  />
                  <Button
                    size="small"
                    disabled={!customPh}
                    onClick={() => { addPlaceholder(customPh); setCustomPh(''); }}
                    sx={{ minWidth: 0, px: 1.5, bgcolor: '#d4a017', color: '#fff', '&:hover': { bgcolor: '#b8860b' }, fontSize: '0.72rem' }}>
                    Add
                  </Button>
                </Stack>
              </Stack>
            );
          })()}

          {/* ── Tab 1: Text ────────────────────────────────── */}
          {toolTab === 1 && (
            (selectedObj?.type === 'i-text' || selectedObj?.type === 'text') ? (
              <Stack spacing={0.75}>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography sx={{ fontSize: '0.62rem', color: '#64748b', flexShrink: 0, minWidth: 36 }}>Font</Typography>
                  <Select value={fontFamily} size="small" onChange={e => { setFontFamily(e.target.value); applyFontProp('fontFamily', e.target.value); }}
                    sx={{ flex: 1, fontSize: '0.7rem', '& .MuiSelect-select': { py: 0.3, px: 1 } }}>
                    {['Arial','Georgia','Times New Roman','Verdana','Courier New','Impact','Trebuchet MS','Comic Sans MS'].map(f => (
                      <MenuItem key={f} value={f} sx={{ fontSize: '0.75rem', fontFamily: f }}>{f}</MenuItem>
                    ))}
                  </Select>
                </Stack>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography sx={{ fontSize: '0.62rem', color: '#64748b', flexShrink: 0, minWidth: 36 }}>Size</Typography>
                  <Slider value={fontSize} min={8} max={120} size="small"
                    onChange={(_, v) => { setFontSize(v); applyFontProp('fontSize', v); }}
                    sx={{ flex: 1, color: '#d4a017', py: 0.5 }} />
                  <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', minWidth: 20 }}>{fontSize}</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography sx={{ fontSize: '0.62rem', color: '#64748b', flexShrink: 0, minWidth: 36 }}>Color</Typography>
                  <input type="color" value={fontColor} onChange={e => { setFontColor(e.target.value); applyFontProp('fill', e.target.value); }}
                    style={{ width: 28, height: 24, border: 'none', borderRadius: 4, cursor: 'pointer', padding: 0 }} />
                  <Tooltip title="Bold">
                    <IconButton size="small" onClick={() => { const v = !isBold; setIsBold(v); applyFontProp('fontWeight', v ? 'bold' : 'normal'); }}
                      sx={{ bgcolor: isBold ? '#d4a017' : '#f1f5f9', color: isBold ? '#fff' : '#64748b', border: '1px solid #e2e8f0', p: 0.4 }}>
                      <FormatBoldIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Italic">
                    <IconButton size="small" onClick={() => { const v = !isItalic; setIsItalic(v); applyFontProp('fontStyle', v ? 'italic' : 'normal'); }}
                      sx={{ bgcolor: isItalic ? '#d4a017' : '#f1f5f9', color: isItalic ? '#fff' : '#64748b', border: '1px solid #e2e8f0', p: 0.4 }}>
                      <FormatItalicIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography sx={{ fontSize: '0.62rem', color: '#64748b', flexShrink: 0, minWidth: 36 }}>Spacing</Typography>
                  <Slider value={letterSp} min={-100} max={800} size="small"
                    onChange={(_, v) => { setLetterSp(v); applyFontProp('charSpacing', v); }}
                    sx={{ flex: 1, color: '#d4a017', py: 0.5 }} />
                  <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', minWidth: 20 }}>{letterSp}</Typography>
                </Stack>
              </Stack>
            ) : (
              <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', pt: 1, textAlign: 'center' }}>
                Tap a text element on the canvas to edit it
              </Typography>
            )
          )}

          {/* ── Tab 2: Object ──────────────────────────────── */}
          {toolTab === 2 && (
            selectedObj ? (
              <Stack spacing={0.75}>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography sx={{ fontSize: '0.62rem', color: '#64748b', flexShrink: 0, minWidth: 36 }}>Opacity</Typography>
                  <Slider value={Math.round(objOpacity * 100)} min={0} max={100} size="small"
                    onChange={(_, v) => { const n = v / 100; setObjOpacity(n); applyObjProp('opacity', n); }}
                    sx={{ flex: 1, color: '#d4a017', py: 0.5 }} />
                  <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', minWidth: 24 }}>{Math.round(objOpacity * 100)}%</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography sx={{ fontSize: '0.62rem', color: '#64748b', flexShrink: 0, minWidth: 36 }}>Rotate</Typography>
                  <Slider value={objAngle} min={0} max={360} size="small"
                    onChange={(_, v) => { setObjAngle(v); applyObjProp('angle', v); }}
                    sx={{ flex: 1, color: '#d4a017', py: 0.5 }} />
                  <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', minWidth: 24 }}>{objAngle}°</Typography>
                </Stack>
                <Stack direction="row" gap={0.5} flexWrap="wrap">
                  {[
                    { label: 'Flip H',  icon: <SwapHorizIcon sx={{ fontSize: 13 }} />,    action: () => applyObjProp('flipX', !selectedObj.flipX) },
                    { label: 'Flip V',  icon: <SwapVertIcon sx={{ fontSize: 13 }} />,      action: () => applyObjProp('flipY', !selectedObj.flipY) },
                    { label: 'Copy',    icon: <ContentCopyIcon sx={{ fontSize: 13 }} />,   action: duplicateObj },
                    { label: 'Delete',  icon: <DeleteOutlineIcon sx={{ fontSize: 13 }} />, action: deleteSelected, red: true },
                  ].map(({ label, icon, action, red }) => (
                    <Box key={label} onClick={action} sx={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.2,
                      cursor: 'pointer', px: 0.75, py: 0.4, borderRadius: 1.5, border: '1px solid #e2e8f0',
                      bgcolor: red ? '#fff0f0' : '#f8fafc', minWidth: 42, '&:active': { opacity: 0.7 },
                    }}>
                      <Box sx={{ color: red ? '#ef4444' : '#d4a017' }}>{icon}</Box>
                      <Typography sx={{ fontSize: '0.56rem', color: red ? '#ef4444' : '#64748b' }}>{label}</Typography>
                    </Box>
                  ))}
                  {/* Fill frame with photo if a frame is selected */}
                  {selectedObj.__frameType && (
                    <Box onClick={() => frameInputRef.current?.click()} sx={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.2,
                      cursor: 'pointer', px: 0.75, py: 0.4, borderRadius: 1.5, border: '1px solid #d4a01755',
                      bgcolor: '#fff8e1', minWidth: 52, '&:active': { opacity: 0.7 },
                    }}>
                      <ImageIcon sx={{ fontSize: 13, color: '#d4a017' }} />
                      <Typography sx={{ fontSize: '0.56rem', color: '#d4a017' }}>Fill Photo</Typography>
                    </Box>
                  )}
                  {/* Ungroup if an SVG/group is selected */}
                  {selectedObj.type === 'group' && (
                    <Box onClick={ungroupSelected} sx={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.2,
                      cursor: 'pointer', px: 0.75, py: 0.4, borderRadius: 1.5, border: '1px solid #0ea5e955',
                      bgcolor: '#f0f9ff', minWidth: 52, '&:active': { opacity: 0.7 },
                    }}>
                      <LayersIcon sx={{ fontSize: 13, color: '#0ea5e9' }} />
                      <Typography sx={{ fontSize: '0.56rem', color: '#0ea5e9' }}>Ungroup</Typography>
                    </Box>
                  )}
                  {/* Adjust photo position (double-click shortcut) */}
                  {selectedObj.type === 'image' && selectedObj.__frameType && selectedObj.clipPath?.absolutePositioned && (
                    <Box onClick={() => { setPhotoAdjustMode(true); photoAdjustModeRef.current = true; }}
                      sx={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.2,
                        cursor: 'pointer', px: 0.75, py: 0.4, borderRadius: 1.5,
                        border: `1px solid ${photoAdjustMode ? '#0ea5e9' : '#0ea5e955'}`,
                        bgcolor: photoAdjustMode ? '#e0f2fe' : '#f0f9ff', minWidth: 52, '&:active': { opacity: 0.7 },
                      }}>
                      <OpenWithIcon sx={{ fontSize: 13, color: '#0ea5e9' }} />
                      <Typography sx={{ fontSize: '0.56rem', color: '#0ea5e9' }}>Adjust</Typography>
                    </Box>
                  )}
                </Stack>

                {/* Frame shape selector */}
                {selectedObj.__frameType && selectedObjs.length <= 1 && (
                  <Box>
                    <Typography sx={{ fontSize: '0.56rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.4 }}>Frame Shape</Typography>
                    <Stack direction="row" gap={0.5}>
                      {[
                        ['rect',    'Rect',   <Box sx={{ width: 12, height: 12, border: '2px solid currentColor', borderRadius: 1 }} />],
                        ['circle',  'Circle', <Box sx={{ width: 12, height: 12, border: '2px solid currentColor', borderRadius: '50%' }} />],
                        ['rounded', 'Round',  <Box sx={{ width: 12, height: 12, border: '2px solid currentColor', borderRadius: 4 }} />],
                      ].map(([type, label, icon]) => (
                        <Box key={type} onClick={() => changeSelectedFrameType(type)} sx={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.2,
                          cursor: 'pointer', px: 0.75, py: 0.4, borderRadius: 1.5, flex: 1,
                          border: `1.5px solid ${selectedObj.__frameType === type ? '#d4a017' : '#e2e8f0'}`,
                          bgcolor: selectedObj.__frameType === type ? '#fff8e1' : '#f8fafc',
                          color: selectedObj.__frameType === type ? '#d4a017' : '#64748b',
                          '&:active': { opacity: 0.7 },
                        }}>
                          {icon}
                          <Typography sx={{ fontSize: '0.56rem' }}>{label}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Bulk frame controls when multiple frames are selected */}
                {selectedObjs.length > 1 && selectedObjs.every(o => o.__frameType) && (
                  <Box sx={{ p: 0.75, bgcolor: '#f0f9ff', borderRadius: 2, border: '1px solid #bae6fd' }}>
                    <Typography sx={{ fontSize: '0.58rem', color: '#0284c7', fontWeight: 600, mb: 0.5 }}>
                      {selectedObjs.length} frames selected
                    </Typography>
                    <Typography sx={{ fontSize: '0.56rem', color: '#94a3b8', mb: 0.4 }}>Change all to shape:</Typography>
                    <Stack direction="row" gap={0.5} mb={0.75}>
                      {[
                        ['rect',    'Rect',   <Box sx={{ width: 11, height: 11, border: '2px solid currentColor', borderRadius: 1 }} />],
                        ['circle',  'Circle', <Box sx={{ width: 11, height: 11, border: '2px solid currentColor', borderRadius: '50%' }} />],
                        ['rounded', 'Round',  <Box sx={{ width: 11, height: 11, border: '2px solid currentColor', borderRadius: 3 }} />],
                      ].map(([type, label, icon]) => (
                        <Box key={type} onClick={() => changeSelectedFrameType(type)} sx={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.2,
                          cursor: 'pointer', px: 0.5, py: 0.4, borderRadius: 1.5, flex: 1,
                          border: '1px solid #bae6fd', bgcolor: '#fff', color: '#0284c7',
                          '&:active': { opacity: 0.7 },
                        }}>
                          {icon}
                          <Typography sx={{ fontSize: '0.54rem' }}>{label}</Typography>
                        </Box>
                      ))}
                    </Stack>
                    <Box onClick={() => bulkFrameRef.current?.click()} sx={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5,
                      cursor: 'pointer', px: 1, py: 0.6, borderRadius: 1.5,
                      border: '1px solid #d4a01755', bgcolor: '#fff8e1',
                      '&:active': { opacity: 0.7 },
                    }}>
                      <ImageIcon sx={{ fontSize: 12, color: '#d4a017' }} />
                      <Typography sx={{ fontSize: '0.58rem', color: '#d4a017', fontWeight: 600 }}>
                        Fill All with Same Photo
                      </Typography>
                    </Box>
                    <input hidden ref={bulkFrameRef} type="file" accept="image/*"
                      onChange={e => { bulkFillFramesWithPhoto(e.target.files[0]); e.target.value = ''; }} />
                  </Box>
                )}

                {/* Image-specific: brightness + contrast */}
                {selectedObj.type === 'image' && (
                  <>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <WbSunnyIcon sx={{ fontSize: 13, color: '#f59e0b', flexShrink: 0 }} />
                      <Slider value={Math.round(imgBright * 100)} min={-100} max={100} size="small"
                        onChange={(_, v) => { const n = v / 100; setImgBright(n); applyImageFilter('Brightness', n); }}
                        sx={{ flex: 1, color: '#f59e0b', py: 0.5 }} />
                      <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', minWidth: 20 }}>{Math.round(imgBright * 100)}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <TonalityIcon sx={{ fontSize: 13, color: '#25a066', flexShrink: 0 }} />
                      <Slider value={Math.round(imgContrast * 100)} min={-100} max={100} size="small"
                        onChange={(_, v) => { const n = v / 100; setImgContrast(n); applyImageFilter('Contrast', n); }}
                        sx={{ flex: 1, color: '#25a066', py: 0.5 }} />
                      <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', minWidth: 20 }}>{Math.round(imgContrast * 100)}</Typography>
                    </Stack>
                  </>
                )}
              </Stack>
            ) : (
              <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', pt: 1, textAlign: 'center' }}>
                Tap an element on the canvas
              </Typography>
            )
          )}

          {/* ── Tab 3: Arrange ─────────────────────────────── */}
          {toolTab === 3 && (
            selectedObj ? (
              <Stack spacing={1}>
                <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Align to Canvas</Typography>
                <Stack direction="row" gap={0.5}>
                  {[
                    { title: 'Left',     icon: <AlignHorizontalLeftIcon sx={{ fontSize: 15 }} />,   dir: 'left' },
                    { title: 'H Center', icon: <AlignHorizontalCenterIcon sx={{ fontSize: 15 }} />, dir: 'hcenter' },
                    { title: 'Right',    icon: <AlignHorizontalRightIcon sx={{ fontSize: 15 }} />,  dir: 'right' },
                    { title: 'Top',      icon: <AlignVerticalTopIcon sx={{ fontSize: 15 }} />,      dir: 'top' },
                    { title: 'V Center', icon: <AlignVerticalCenterIcon sx={{ fontSize: 15 }} />,   dir: 'vcenter' },
                    { title: 'Bottom',   icon: <AlignVerticalBottomIcon sx={{ fontSize: 15 }} />,   dir: 'bottom' },
                  ].map(({ title, icon, dir }) => (
                    <Tooltip key={dir} title={title}>
                      <IconButton size="small" onClick={() => alignObj(dir)}
                        sx={{ p: 0.5, border: '1px solid #e2e8f0', borderRadius: 1.5, color: '#d4a017', bgcolor: '#f8fafc', '&:hover': { bgcolor: '#f1f5f9' } }}>
                        {icon}
                      </IconButton>
                    </Tooltip>
                  ))}
                </Stack>
                <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Layer Order</Typography>
                <Stack direction="row" gap={0.5}>
                  {[
                    { title: 'Bring to Front', icon: <FlipToFrontIcon sx={{ fontSize: 15 }} />,  dir: 'front' },
                    { title: 'Bring Forward',  icon: <ArrowUpwardIcon sx={{ fontSize: 15 }} />,   dir: 'up' },
                    { title: 'Send Backward',  icon: <ArrowDownwardIcon sx={{ fontSize: 15 }} />,  dir: 'down' },
                    { title: 'Send to Back',   icon: <FlipToBackIcon sx={{ fontSize: 15 }} />,   dir: 'back' },
                  ].map(({ title, icon, dir }) => (
                    <Tooltip key={dir} title={title}>
                      <IconButton size="small" onClick={() => applyLayer(dir)}
                        sx={{ p: 0.5, border: '1px solid #e2e8f0', borderRadius: 1.5, color: '#64748b', bgcolor: '#f8fafc', '&:hover': { bgcolor: '#f1f5f9' } }}>
                        {icon}
                      </IconButton>
                    </Tooltip>
                  ))}
                </Stack>
              </Stack>
            ) : (
              <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', pt: 1, textAlign: 'center' }}>
                Tap an element to arrange it
              </Typography>
            )
          )}

          {/* ── Tab 4: Style ───────────────────────────────── */}
          {toolTab === 4 && (
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" gap={1.5}>
                <Box sx={{ width: 36, height: 36, borderRadius: 1.5, border: '2px solid #e2e8f0', overflow: 'hidden', flexShrink: 0 }}>
                  <input type="color" value={bgColor} onChange={e => setCanvasBg(e.target.value)}
                    style={{ width: '200%', height: '200%', border: 'none', cursor: 'pointer', padding: 0, marginLeft: '-50%', marginTop: '-50%' }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#1e293b' }}>Background Color</Typography>
                  <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8' }}>{bgColor.toUpperCase()}</Typography>
                </Box>
              </Stack>
              {/* Quick BG presets */}
              <Stack direction="row" gap={0.75} flexWrap="wrap">
                {['#ffffff','#f8fafc','#1e293b','#d4a017','#1a7a4a','#0f766e','#b45309','#be123c','#f1f5f9','#fef9c3'].map(c => (
                  <Box key={c} onClick={() => setCanvasBg(c)} sx={{
                    width: 28, height: 28, borderRadius: 1.5, bgcolor: c, cursor: 'pointer',
                    border: bgColor === c ? '2px solid #d4a017' : '1px solid #e2e8f0',
                    '&:hover': { transform: 'scale(1.12)', transition: 'transform 0.1s' },
                  }} />
                ))}
              </Stack>
            </Stack>
          )}

          {/* ── Tab 5: Export ──────────────────────────────── */}
          {toolTab === 5 && (
            <Stack spacing={1.5}>

              {/* Student Carousel */}
              {batchStudents.length > 0 && (
                <Box sx={{ bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', p: 1.25 }}>
                  {/* Header + navigation */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography sx={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700 }}>
                      Record {carouselIdx + 1} / {batchStudents.length}
                    </Typography>
                    <Stack direction="row" spacing={0.25} alignItems="center">
                      <IconButton size="small" onClick={() => goCarousel(carouselIdx - 1)} disabled={carouselIdx === 0}
                        sx={{ color: '#d4a017', p: 0.3, border: '1px solid #e2e8f0', borderRadius: 1, '&.Mui-disabled': { opacity: 0.3 } }}>
                        <ChevronLeftIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <Box sx={{ display: 'flex', gap: 0.3 }}>
                        {batchStudents.slice(Math.max(0, carouselIdx - 2), carouselIdx + 3).map((_, i) => {
                          const absIdx = Math.max(0, carouselIdx - 2) + i;
                          return (
                            <Box key={absIdx} onClick={() => goCarousel(absIdx)} sx={{
                              width: absIdx === carouselIdx ? 16 : 6, height: 6, borderRadius: 3,
                              bgcolor: absIdx === carouselIdx ? '#d4a017' : '#cbd5e1',
                              cursor: 'pointer', transition: 'all 0.2s',
                            }} />
                          );
                        })}
                      </Box>
                      <IconButton size="small" onClick={() => goCarousel(carouselIdx + 1)} disabled={carouselIdx === batchStudents.length - 1}
                        sx={{ color: '#d4a017', p: 0.3, border: '1px solid #e2e8f0', borderRadius: 1, '&.Mui-disabled': { opacity: 0.3 } }}>
                        <ChevronRightIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Stack>
                  </Stack>
                  {/* Editable fields */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75, mb: 1 }}>
                    {[['name', 'Name'], ['rollNo', 'Roll No'], ['course', 'Course'], ['batch', 'Batch']].map(([key, lbl]) => (
                      <TextField key={key} label={lbl} value={carouselFields[key] || ''} size="small"
                        onChange={e => setCarouselFields(prev => ({ ...prev, [key]: e.target.value }))}
                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff', fontSize: '0.75rem' }, '& label': { fontSize: '0.72rem' } }}
                      />
                    ))}
                  </Box>
                  <Button size="small" fullWidth onClick={applyCarouselToCanvas}
                    sx={{ bgcolor: '#d4a01722', color: '#d4a017', border: '1px solid #d4a01733', textTransform: 'none', fontSize: '0.72rem', '&:hover': { bgcolor: '#d4a01733' } }}>
                    Apply to Canvas
                  </Button>
                </Box>
              )}

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
                  sx={{ flex: 1, bgcolor: '#d4a01722', color: '#d4a017', border: '1px solid #d4a01733', '&:hover': { bgcolor: '#d4a01733' } }}>PDF</Button>
              </Stack>
              {/* Copies + direct Print */}
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
                  sx={{ flex: 1, bgcolor: '#1a7a4a22', color: '#1a7a4a', border: '1px solid #1a7a4a33', '&:hover': { bgcolor: '#1a7a4a33' } }}>
                  {printing ? 'Printing…' : 'Print'}
                </Button>
              </Stack>
              {/* Data Source */}
              <Box>
                <Typography sx={{ fontSize: '0.62rem', color: '#64748b', mb: 0.75, fontWeight: 600 }}>Data Source</Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap">
                  <Chip
                    label="DB Students"
                    size="small"
                    onClick={() => setDataSource('batch')}
                    variant={dataSource === 'batch' ? 'filled' : 'outlined'}
                    color="primary"
                    sx={{ fontSize: '0.65rem', height: 22, cursor: 'pointer' }}
                  />
                  <Chip
                    label={csvFile || 'Upload CSV/Excel'}
                    size="small"
                    onClick={() => csvInputRef.current?.click()}
                    variant={dataSource === 'csv' ? 'filled' : 'outlined'}
                    color="secondary"
                    sx={{ fontSize: '0.65rem', height: 22, cursor: 'pointer' }}
                  />
                </Stack>
                {dataSource === 'csv' && csvRows.length > 0 && (
                  <Typography sx={{ fontSize: '0.6rem', color: '#10b981', mt: 0.5 }}>
                    ✓ {csvRows.length} rows loaded from {csvFile}
                  </Typography>
                )}
                <input hidden type="file" ref={csvInputRef} accept=".csv,.xlsx,.xls"
                  onChange={e => handleCsvUpload(e.target.files[0])} />
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Select value={selBatch} onChange={e => setSelBatch(e.target.value)} displayEmpty size="small"
                  sx={{ flex: 1, bgcolor: '#f1f5f9', color: '#1e293b', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } }}>
                  <MenuItem value=""><em style={{ color: '#94a3b8' }}>Select batch for bulk…</em></MenuItem>
                  {batches.map(b => <MenuItem key={b._id || b.Batch_uuid} value={b.name}>{b.name}{b.timing ? ` (${b.timing})` : ''}</MenuItem>)}
                </Select>
                <Button size="small" startIcon={generating ? <CircularProgress size={12} color="inherit" /> : <FolderZipIcon />}
                  onClick={generateBatchZip} disabled={generating || !getActiveRows().length}
                  sx={{ flexShrink: 0, bgcolor: '#f1f5f9', color: '#1e293b', border: '1px solid #e2e8f0', '&:hover': { bgcolor: '#e2e8f0' } }}>
                  {generating ? '…' : `ZIP (${getActiveRows().length})`}
                </Button>
                <Button size="small" startIcon={generating ? <CircularProgress size={12} color="inherit" /> : <PictureAsPdfIcon />}
                  onClick={generateBatchPDF} disabled={generating || !getActiveRows().length}
                  sx={{ flexShrink: 0, bgcolor: '#d4a01722', color: '#d4a017', border: '1px solid #d4a01733', '&:hover': { bgcolor: '#d4a01733' } }}>
                  {generating ? '…' : `PDF`}
                </Button>
              </Stack>
              {loadingBatch && <CircularProgress size={16} sx={{ mx: 'auto', color: '#d4a017' }} />}

              {/* ── Print Layout System ──────────────────────── */}
              <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569' }}>Print Layouts</Typography>
                  <Button size="small" onClick={() => { setEditingLayout({ id: null, name: '', pageW: 210, pageH: 297, marginT: 8, marginR: 8, marginB: 8, marginL: 8, cols: 2, rows: 4, gapH: 5, gapV: 5 }); setLayoutDialog(true); }}
                    sx={{ fontSize: '0.62rem', textTransform: 'none', color: '#d4a017', minWidth: 0 }}>+ New</Button>
                </Stack>

                {/* Saved layouts */}
                {userLayouts.length > 0 && (
                  <Stack spacing={0.5} mb={1}>
                    <Typography sx={{ fontSize: '0.56rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Saved ({userLayouts.length})</Typography>
                    {userLayouts.map(layout => {
                      const { cellW, cellH } = layoutCellDims(layout);
                      return (
                        <Box key={layout.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.75, borderRadius: 1.5, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                          <LayoutPreview layout={layout} size={44} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#1e293b' }} noWrap>{layout.name}</Typography>
                            <Typography sx={{ fontSize: '0.56rem', color: '#94a3b8' }}>{layout.cols}×{layout.rows} · {cellW.toFixed(0)}×{cellH.toFixed(0)}mm · {layout.cols * layout.rows}/page</Typography>
                          </Box>
                          <Stack direction="row" gap={0.25}>
                            <Tooltip title="Export current card">
                              <IconButton size="small" onClick={() => exportWithLayout(layout)} disabled={exporting || generating} sx={{ color: '#1a7a4a', p: 0.3 }}><DownloadIcon sx={{ fontSize: 14 }} /></IconButton>
                            </Tooltip>
                            {batchStudents.length > 0 && (
                              <Tooltip title={`Batch (${batchStudents.length} students)`}>
                                <IconButton size="small" onClick={() => exportWithLayout(layout, true)} disabled={exporting || generating} sx={{ color: '#d4a017', p: 0.3 }}><PictureAsPdfIcon sx={{ fontSize: 14 }} /></IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => { setEditingLayout({ ...layout }); setLayoutDialog(true); }} sx={{ color: '#64748b', p: 0.3 }}><TuneIcon sx={{ fontSize: 13 }} /></IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => deleteUserLayout(layout.id)} sx={{ color: '#f87171', p: 0.3 }}><DeleteOutlineIcon sx={{ fontSize: 14 }} /></IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                )}

                {/* Presets — collapsible */}
                <Box>
                  <Box onClick={() => setPresetsOpen(v => !v)} sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.56rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1 }}>Presets (18)</Typography>
                    <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8' }}>{presetsOpen ? '▲' : '▼'}</Typography>
                  </Box>
                  {presetsOpen && (
                    <Stack spacing={0.5}>
                      {PRESET_LAYOUTS.map(layout => {
                        const { cellW, cellH } = layoutCellDims(layout);
                        return (
                          <Box key={layout.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.75, borderRadius: 1.5, border: '1px solid #e2e8f0', bgcolor: '#fff' }}>
                            <LayoutPreview layout={layout} size={40} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography sx={{ fontSize: '0.62rem', fontWeight: 600, color: '#374151' }} noWrap>{layout.name}</Typography>
                              <Typography sx={{ fontSize: '0.55rem', color: '#94a3b8' }}>{cellW.toFixed(0)}×{cellH.toFixed(0)}mm · {layout.cols * layout.rows}/pg</Typography>
                            </Box>
                            <Stack direction="row" gap={0.25}>
                              <Tooltip title="Export current card">
                                <IconButton size="small" onClick={() => exportWithLayout(layout)} disabled={exporting || generating} sx={{ color: '#1a7a4a', p: 0.3 }}><DownloadIcon sx={{ fontSize: 14 }} /></IconButton>
                              </Tooltip>
                              {batchStudents.length > 0 && (
                                <Tooltip title="Batch export">
                                  <IconButton size="small" onClick={() => exportWithLayout(layout, true)} disabled={exporting || generating} sx={{ color: '#d4a017', p: 0.3 }}><PictureAsPdfIcon sx={{ fontSize: 14 }} /></IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Save as custom">
                                <IconButton size="small" onClick={() => { setEditingLayout({ ...layout, id: null, name: layout.name + ' (copy)' }); setLayoutDialog(true); }} sx={{ color: '#64748b', p: 0.3 }}><CheckIcon sx={{ fontSize: 13 }} /></IconButton>
                              </Tooltip>
                            </Stack>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </Box>
              </Box>
            </Stack>
          )}
        </Box>
      </Box>

      {/* ── Close main body row ────────────────────────────── */}
      </Box>

      {/* ── Print Layout Dialog ────────────────────────────── */}
      {layoutDialog && editingLayout && (
        <Dialog open={layoutDialog} onClose={() => setLayoutDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', pb: 0.5 }}>
            {editingLayout.id ? 'Edit Layout' : 'New Print Layout'}
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={1.5}>
              <TextField label="Layout Name" value={editingLayout.name} size="small"
                onChange={e => setEditingLayout(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. ID Card 2×4 A4"
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f8fafc' } }}
              />

              {/* Paper size selector */}
              <Box>
                <Typography sx={{ fontSize: '0.62rem', color: '#64748b', mb: 0.5 }}>Paper Size</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {[{ label: 'A4', w: 210, h: 297 }, { label: 'A4L', w: 297, h: 210 }, { label: 'A3', w: 297, h: 420 }, { label: 'A5', w: 148, h: 210 }, { label: 'Letter', w: 216, h: 279 }, { label: 'Legal', w: 216, h: 356 }].map(ps => {
                    const active = editingLayout.pageW === ps.w && editingLayout.pageH === ps.h;
                    return (
                      <Chip key={ps.label} label={ps.label} size="small" onClick={() => setEditingLayout(p => ({ ...p, pageW: ps.w, pageH: ps.h }))}
                        sx={{ fontSize: '0.62rem', cursor: 'pointer', bgcolor: active ? '#d4a017' : '#f1f5f9', color: active ? '#fff' : '#64748b', border: active ? 'none' : '1px solid #e2e8f0' }} />
                    );
                  })}
                </Box>
                <Stack direction="row" gap={1} mt={0.75}>
                  <TextField label="Width (mm)" type="number" size="small" value={editingLayout.pageW}
                    onChange={e => setEditingLayout(p => ({ ...p, pageW: +e.target.value }))}
                    sx={{ flex: 1, '& input': { fontSize: '0.75rem' } }} />
                  <TextField label="Height (mm)" type="number" size="small" value={editingLayout.pageH}
                    onChange={e => setEditingLayout(p => ({ ...p, pageH: +e.target.value }))}
                    sx={{ flex: 1, '& input': { fontSize: '0.75rem' } }} />
                </Stack>
              </Box>

              {/* Margins */}
              <Box>
                <Typography sx={{ fontSize: '0.62rem', color: '#64748b', mb: 0.5 }}>Margins (mm)</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75 }}>
                  {[['marginT', 'Top'], ['marginR', 'Right'], ['marginB', 'Bottom'], ['marginL', 'Left']].map(([k, lbl]) => (
                    <TextField key={k} label={lbl} type="number" size="small" value={editingLayout[k]}
                      onChange={e => setEditingLayout(p => ({ ...p, [k]: Math.max(0, +e.target.value) }))}
                      sx={{ '& input': { fontSize: '0.75rem' } }} />
                  ))}
                </Box>
              </Box>

              {/* Grid */}
              <Box>
                <Typography sx={{ fontSize: '0.62rem', color: '#64748b', mb: 0.5 }}>Grid</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75 }}>
                  <TextField label="Columns" type="number" size="small" value={editingLayout.cols}
                    onChange={e => setEditingLayout(p => ({ ...p, cols: Math.max(1, Math.min(20, +e.target.value)) }))}
                    sx={{ '& input': { fontSize: '0.75rem' } }} />
                  <TextField label="Rows" type="number" size="small" value={editingLayout.rows}
                    onChange={e => setEditingLayout(p => ({ ...p, rows: Math.max(1, Math.min(50, +e.target.value)) }))}
                    sx={{ '& input': { fontSize: '0.75rem' } }} />
                  <TextField label="H Gap (mm)" type="number" size="small" value={editingLayout.gapH}
                    onChange={e => setEditingLayout(p => ({ ...p, gapH: Math.max(0, +e.target.value) }))}
                    sx={{ '& input': { fontSize: '0.75rem' } }} />
                  <TextField label="V Gap (mm)" type="number" size="small" value={editingLayout.gapV}
                    onChange={e => setEditingLayout(p => ({ ...p, gapV: Math.max(0, +e.target.value) }))}
                    sx={{ '& input': { fontSize: '0.75rem' } }} />
                </Box>
              </Box>

              {/* Live preview + computed info */}
              {(() => {
                const { cellW, cellH } = layoutCellDims(editingLayout);
                const perPage = editingLayout.cols * editingLayout.rows;
                const valid = cellW > 0 && cellH > 0;
                return (
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', p: 1.25, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <LayoutPreview layout={editingLayout} size={72} />
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#1e293b' }}>
                        {editingLayout.cols}×{editingLayout.rows} = {perPage} per sheet
                      </Typography>
                      {valid ? (
                        <>
                          <Typography sx={{ fontSize: '0.6rem', color: '#64748b', mt: 0.25 }}>
                            Cell: {cellW.toFixed(1)} × {cellH.toFixed(1)} mm
                          </Typography>
                          <Typography sx={{ fontSize: '0.6rem', color: '#64748b' }}>
                            Paper: {editingLayout.pageW}×{editingLayout.pageH} mm
                          </Typography>
                        </>
                      ) : (
                        <Typography sx={{ fontSize: '0.6rem', color: '#ef4444', mt: 0.25 }}>
                          Grid too large for margins — reduce rows/cols or margins
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })()}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 2.5, pb: 2, gap: 0.5 }}>
            <Button onClick={() => setLayoutDialog(false)} sx={{ textTransform: 'none', color: '#64748b' }}>Cancel</Button>
            <Button variant="contained" onClick={() => { saveUserLayout(editingLayout); setLayoutDialog(false); }}
              disabled={!editingLayout.name.trim() || layoutCellDims(editingLayout).cellW <= 0}
              sx={{ bgcolor: '#d4a017', '&:hover': { bgcolor: '#b8860b' }, textTransform: 'none' }}>
              Save Layout
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* ── Exit Confirmation Dialog ───────────────────────── */}
      <Dialog open={exitConfirmDlg} onClose={() => setExitConfirmDlg(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>Unsaved Changes</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#475569', fontSize: '0.875rem' }}>
            You have unsaved changes. Save before leaving?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 0.5 }}>
          <Button onClick={() => setExitConfirmDlg(false)} sx={{ textTransform: 'none', color: '#64748b' }}>Cancel</Button>
          <Button onClick={() => { setExitConfirmDlg(false); pendingExit?.(); }}
            sx={{ textTransform: 'none', color: '#ef4444' }}>Discard</Button>
          <Button variant="contained"
            onClick={async () => {
              await saveDesign();
              setExitConfirmDlg(false);
              pendingExit?.();
            }}
            disabled={savingDesign}
            startIcon={savingDesign ? <CircularProgress size={13} color="inherit" /> : null}
            sx={{ bgcolor: '#d4a017', '&:hover': { bgcolor: '#b8860b' }, textTransform: 'none' }}>
            Save & Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Gallery Dialog ─────────────────────────────────── */}
      <Dialog open={galleryDialog} onClose={() => setGalleryDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', pb: 0 }}>Add from Gallery</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Stack spacing={1.5}>
            <Button variant="outlined" fullWidth startIcon={<AddPhotoAlternateIcon />}
              onClick={() => { setGalleryDialog(false); fileInputRef.current?.click(); }}
              sx={{ textTransform: 'none', borderColor: '#d4a017', color: '#d4a017' }}>
              Choose from Device
            </Button>
            {customTemplates.length > 0 && (
              <>
                <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Saved Templates</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, maxHeight: 260, overflowY: 'auto' }}>
                  {customTemplates.map(ct => (
                    <Box key={ct.template_uuid} onClick={() => addGalleryImage(ct.imageUrl)}
                      sx={{ cursor: 'pointer', borderRadius: 1.5, overflow: 'hidden', border: '1px solid #e2e8f0',
                        '&:hover': { border: '1px solid #d4a01755', boxShadow: '0 2px 8px rgba(212,160,23,0.15)' } }}>
                      <Box sx={{ height: 64, overflow: 'hidden' }}>
                        <img src={ct.thumbUrl || ct.imageUrl} alt={ct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                      <Box sx={{ p: 0.5 }}>
                        <Typography sx={{ fontSize: '0.6rem', color: '#64748b' }} noWrap>{ct.name}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </>
            )}
            {customTemplates.length === 0 && (
              <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center', py: 1 }}>
                No gallery images yet. Upload templates from the Templates tab.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setGalleryDialog(false)} sx={{ textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Page Setup Dialog ──────────────────────────────── */}
      <Dialog open={pageSetupDialog} onClose={() => setPageSetupDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', pb: 0 }}>Page Setup</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Stack spacing={2}>
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
                      bgcolor: tempSetup?.pageKey === ps.key ? '#d4a017' : '#f1f5f9',
                      color: tempSetup?.pageKey === ps.key ? '#fff' : '#1e293b',
                      borderRadius: 1, cursor: 'pointer', fontSize: '0.7rem', height: 26,
                      '&:hover': { bgcolor: tempSetup?.pageKey === ps.key ? '#b8860b' : '#e2e8f0' },
                    }}
                  />
                ))}
              </Box>
            </Box>
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
            <Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mb: 1 }}>Orientation</Typography>
              <Stack direction="row" spacing={1}>
                {[['portrait', '↕ Portrait'], ['landscape', '↔ Landscape']].map(([val, lbl]) => (
                  <Button key={val} size="small" onClick={() => setTempSetup(prev => ({ ...prev, orientation: val }))}
                    sx={{
                      flex: 1, textTransform: 'none',
                      bgcolor: tempSetup?.orientation === val ? '#d4a017' : '#f1f5f9',
                      color: tempSetup?.orientation === val ? '#fff' : '#64748b',
                      border: `1px solid ${tempSetup?.orientation === val ? '#d4a017' : '#e2e8f0'}`,
                      '&:hover': { bgcolor: tempSetup?.orientation === val ? '#b8860b' : '#e2e8f0' },
                    }}>{lbl}</Button>
                ))}
              </Stack>
            </Box>
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
          <Button variant="contained" onClick={async () => {
            const s = { ...tempSetup };
            // Swap w/h if orientation doesn't match the stored dimensions
            if (s.w && s.h) {
              const needsLandscape = s.orientation === 'landscape';
              const isCurrentlyLandscape = s.w >= s.h;
              if (needsLandscape !== isCurrentlyLandscape) {
                const tmp = s.w; s.w = s.h; s.h = tmp;
              }
            }
            pageSetupRef.current = s;
            setPageSetup(s);
            setPageSetupDialog(false);
            const fc = fabricRef.current;
            if (fc && s.w && s.h) {
              // Resize canvas to match page dimensions (mm → px at 96 DPI)
              const newW = Math.round(s.w * MM_TO_PX);
              const newH = Math.round(s.h * MM_TO_PX);
              fc.setWidth(newW);
              fc.setHeight(newH);
              fc.renderAll();
              await drawMGuides(fc, s);
              setTimeout(updateScale, 50);
            }
          }} sx={{ bgcolor: '#d4a017', '&:hover': { bgcolor: '#b8860b' }, textTransform: 'none' }}>
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
