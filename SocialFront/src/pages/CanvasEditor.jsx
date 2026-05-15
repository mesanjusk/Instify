/**
 * Canvas Editor
 * Fabric.js-based editor for designing ID cards and certificates.
 * Supports text, shapes, image upload, and export as PNG or PDF.
 */

import { useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Divider,
  MenuItem, Select, Slider, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import RectangleOutlinedIcon from '@mui/icons-material/RectangleOutlined';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import ImageIcon from '@mui/icons-material/Image';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import jsPDF from 'jspdf';

// Fabric is loaded via dynamic import to avoid SSR issues
let fabricModule = null;
async function getFabric() {
  if (!fabricModule) fabricModule = await import('fabric');
  return fabricModule;
}

const TEMPLATES = {
  id_card: { width: 340, height: 210, bg: '#1565c0', label: 'ID Card' },
  certificate: { width: 792, height: 560, bg: '#fff8e1', label: 'Certificate (A4 Landscape)' },
  blank: { width: 600, height: 400, bg: '#ffffff', label: 'Blank Canvas' },
};

export default function CanvasEditor() {
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);

  const [template, setTemplate] = useState('id_card');
  const [textInput, setTextInput] = useState('Your Text Here');
  const [fontSize, setFontSize] = useState(24);
  const [fontColor, setFontColor] = useState('#ffffff');
  const [alert, setAlert] = useState(null);
  const [ready, setReady] = useState(false);

  function showAlert(type, text) {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 4000);
  }

  async function initCanvas(tplKey) {
    const { fabric } = await getFabric();
    const tpl = TEMPLATES[tplKey];

    if (fabricRef.current) {
      fabricRef.current.dispose();
      fabricRef.current = null;
    }

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: tpl.width,
      height: tpl.height,
      backgroundColor: tpl.bg,
      selection: true,
    });

    fabricRef.current = canvas;
    setReady(true);

    // Seed template content
    if (tplKey === 'id_card') {
      const rect = new fabric.Rect({ left: 0, top: 0, width: tpl.width, height: 60, fill: '#0d47a1', selectable: false });
      const title = new fabric.Text('STUDENT ID CARD', { left: 20, top: 15, fontSize: 22, fill: '#fff', fontWeight: 'bold', selectable: false });
      const nameLabel = new fabric.Text('Name:', { left: 20, top: 80, fontSize: 14, fill: '#fff' });
      const name = new fabric.Text('Full Name', { left: 80, top: 80, fontSize: 14, fill: '#ffeb3b', fontWeight: 'bold' });
      const courseLabel = new fabric.Text('Course:', { left: 20, top: 110, fontSize: 14, fill: '#fff' });
      const course = new fabric.Text('Course Name', { left: 95, top: 110, fontSize: 14, fill: '#ffeb3b' });
      const idLabel = new fabric.Text('ID:', { left: 20, top: 140, fontSize: 14, fill: '#fff' });
      const id = new fabric.Text('STU-001', { left: 50, top: 140, fontSize: 14, fill: '#ffeb3b' });
      canvas.add(rect, title, nameLabel, name, courseLabel, course, idLabel, id);
    }

    if (tplKey === 'certificate') {
      const border = new fabric.Rect({ left: 10, top: 10, width: tpl.width - 20, height: tpl.height - 20, fill: 'transparent', stroke: '#8d6e63', strokeWidth: 4, rx: 8, ry: 8, selectable: false });
      const inner = new fabric.Rect({ left: 20, top: 20, width: tpl.width - 40, height: tpl.height - 40, fill: 'transparent', stroke: '#bcaaa4', strokeWidth: 1, selectable: false });
      const cert = new fabric.Text('CERTIFICATE OF COMPLETION', { left: tpl.width / 2, top: 80, fontSize: 28, fill: '#4e342e', fontWeight: 'bold', originX: 'center' });
      const sub = new fabric.Text('This is to certify that', { left: tpl.width / 2, top: 160, fontSize: 18, fill: '#6d4c41', originX: 'center' });
      const studentName = new fabric.Text('Student Name', { left: tpl.width / 2, top: 210, fontSize: 28, fill: '#bf360c', fontStyle: 'italic', originX: 'center' });
      const line = new fabric.Line([160, 260, tpl.width - 160, 260], { stroke: '#8d6e63', strokeWidth: 1.5 });
      const body = new fabric.Text('has successfully completed the course', { left: tpl.width / 2, top: 290, fontSize: 18, fill: '#6d4c41', originX: 'center' });
      const course = new fabric.Text('Course Name', { left: tpl.width / 2, top: 330, fontSize: 22, fill: '#1565c0', fontWeight: 'bold', originX: 'center' });
      canvas.add(border, inner, cert, sub, studentName, line, body, course);
    }

    canvas.renderAll();
  }

  useEffect(() => {
    initCanvas(template);
    return () => { if (fabricRef.current) fabricRef.current.dispose(); };
  }, []);

  async function changeTemplate(tplKey) {
    setTemplate(tplKey);
    await initCanvas(tplKey);
  }

  async function addText() {
    const { fabric } = await getFabric();
    const canvas = fabricRef.current;
    if (!canvas) return;
    const text = new fabric.IText(textInput || 'Text', {
      left: 50, top: 50,
      fontSize,
      fill: fontColor,
      fontFamily: 'Arial',
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  }

  async function addRect() {
    const { fabric } = await getFabric();
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.add(new fabric.Rect({ left: 60, top: 60, width: 120, height: 80, fill: fontColor, opacity: 0.7 }));
    canvas.renderAll();
  }

  async function addCircle() {
    const { fabric } = await getFabric();
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.add(new fabric.Circle({ left: 80, top: 80, radius: 50, fill: fontColor, opacity: 0.7 }));
    canvas.renderAll();
  }

  function addImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const { fabric } = await getFabric();
        const canvas = fabricRef.current;
        fabric.Image.fromURL(ev.target.result, (img) => {
          img.scaleToWidth(150);
          img.set({ left: 50, top: 50 });
          canvas.add(img);
          canvas.renderAll();
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  function deleteSelected() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObjects();
    active.forEach(obj => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.renderAll();
  }

  function exportPNG() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL({ format: 'png', multiplier: 2 });
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template}-design.png`;
    a.click();
  }

  function exportPDF() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL({ format: 'png', multiplier: 2 });
    const tpl = TEMPLATES[template];
    const pdf = new jsPDF({ orientation: tpl.width > tpl.height ? 'landscape' : 'portrait', unit: 'px', format: [tpl.width * 2, tpl.height * 2] });
    pdf.addImage(url, 'PNG', 0, 0, tpl.width * 2, tpl.height * 2);
    pdf.save(`${template}-design.pdf`);
  }

  const tpl = TEMPLATES[template];

  return (
    <Box sx={{ py: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <FileCopyIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h5" fontWeight={700}>Canvas Editor</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
          Design ID cards &amp; certificates
        </Typography>
      </Stack>

      {alert && <Alert severity={alert.type} sx={{ mb: 2 }}>{alert.text}</Alert>}

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
        {/* Toolbar */}
        <Box sx={{ minWidth: 240, maxWidth: { xs: '100%', lg: 240 } }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>Template</Typography>
              <Select value={template} onChange={e => changeTemplate(e.target.value)} size="small" fullWidth sx={{ mb: 2 }}>
                {Object.entries(TEMPLATES).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v.label}</MenuItem>
                ))}
              </Select>

              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" fontWeight={600} mb={1}>Add Elements</Typography>

              <TextField
                label="Text content"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                size="small" fullWidth sx={{ mb: 1 }}
              />
              <Stack direction="row" spacing={1} mb={1} alignItems="center">
                <Typography variant="caption">Size:</Typography>
                <Slider value={fontSize} onChange={(_, v) => setFontSize(v)} min={10} max={80} size="small" sx={{ flex: 1 }} />
                <Typography variant="caption">{fontSize}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} mb={1} alignItems="center">
                <Typography variant="caption">Color:</Typography>
                <input type="color" value={fontColor} onChange={e => setFontColor(e.target.value)} style={{ width: 40, height: 32, border: 'none', cursor: 'pointer' }} />
              </Stack>

              <Stack spacing={1} mt={1}>
                <Tooltip title="Add text (double-click to edit)">
                  <Button variant="outlined" size="small" startIcon={<TextFieldsIcon />} onClick={addText} fullWidth>Add Text</Button>
                </Tooltip>
                <Tooltip title="Add rectangle">
                  <Button variant="outlined" size="small" startIcon={<RectangleOutlinedIcon />} onClick={addRect} fullWidth>Add Rectangle</Button>
                </Tooltip>
                <Tooltip title="Add circle">
                  <Button variant="outlined" size="small" startIcon={<CircleOutlinedIcon />} onClick={addCircle} fullWidth>Add Circle</Button>
                </Tooltip>
                <Tooltip title="Upload an image">
                  <Button variant="outlined" size="small" startIcon={<ImageIcon />} onClick={addImage} fullWidth>Add Image</Button>
                </Tooltip>
              </Stack>

              <Divider sx={{ my: 1.5 }} />
              <Stack spacing={1}>
                <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={deleteSelected} fullWidth>Delete Selected</Button>
              </Stack>

              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" fontWeight={600} mb={1}>Export</Typography>
              <Stack spacing={1}>
                <Button size="small" variant="contained" startIcon={<DownloadIcon />} onClick={exportPNG} fullWidth>Export PNG</Button>
                <Button size="small" variant="contained" color="secondary" startIcon={<PictureAsPdfIcon />} onClick={exportPDF} fullWidth>Export PDF</Button>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {/* Canvas Area */}
        <Box sx={{ flex: 1, overflowX: 'auto' }}>
          <Card variant="outlined">
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                {tpl.label} — {tpl.width} × {tpl.height}px &nbsp;|&nbsp; Click to select &nbsp;|&nbsp; Double-click text to edit
              </Typography>
              <Box sx={{ display: 'inline-block', border: '1px solid #ddd', boxShadow: 2 }}>
                <canvas ref={canvasRef} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </Box>
  );
}
