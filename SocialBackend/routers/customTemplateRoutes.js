const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { v4: uuidv4 } = require('uuid');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { promisify } = require('util');
const CustomTemplate = require('../models/CustomTemplate');

const execFileAsync = promisify(execFile);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
const convertUpload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Upload template image (images only)
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file' });
    const { institute_uuid, name, docType, created_by } = req.body;
    if (!institute_uuid || !name) return res.status(400).json({ success: false, message: 'institute_uuid and name required' });

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `instify/templates/${institute_uuid}`, resource_type: 'image' },
        (err, result) => err ? reject(err) : resolve(result)
      );
      stream.end(req.file.buffer);
    });

    const tpl = await CustomTemplate.create({
      institute_uuid, name,
      docType: docType || 'other',
      imageUrl: uploadResult.secure_url,
      thumbUrl: uploadResult.secure_url.replace('/upload/', '/upload/w_200,q_60/'),
      created_by,
    });
    res.json({ success: true, result: tpl });
  } catch (err) {
    console.error('[Template upload]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Convert and upload CDR / PDF / SVG template
router.post('/convert', convertUpload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });

  const { institute_uuid, name, docType, created_by } = req.body;
  if (!institute_uuid || !name) return res.status(400).json({ success: false, message: 'institute_uuid and name required' });

  const originalName = req.file.originalname || 'template';
  const ext = path.extname(originalName).toLowerCase();
  const supported = ['.cdr', '.cdt', '.pdf', '.svg'];
  if (!supported.includes(ext)) {
    return res.status(400).json({ success: false, message: `Unsupported type: ${ext}. Use CDR, CDT, PDF, or SVG.` });
  }

  const tmpDir = path.join(os.tmpdir(), `instify_${uuidv4()}`);
  let uploadBuffer = req.file.buffer;

  try {
    if (ext === '.cdr' || ext === '.cdt' || ext === '.pdf') {
      fs.mkdirSync(tmpDir, { recursive: true });
      const tmpInput = path.join(tmpDir, `input${ext}`);
      fs.writeFileSync(tmpInput, uploadBuffer);

      await execFileAsync('libreoffice', [
        '--headless',
        '--convert-to', 'png',
        '--outdir', tmpDir,
        tmpInput,
      ], { timeout: 90000 });

      // Pick first output PNG (multi-page PDFs produce input1.png, input2.png, …)
      const pngs = fs.readdirSync(tmpDir)
        .filter(f => f.endsWith('.png'))
        .sort();
      if (!pngs.length) throw new Error('LibreOffice produced no PNG output — ensure the file is valid');

      uploadBuffer = fs.readFileSync(path.join(tmpDir, pngs[0]));
    }
    // SVG: upload buffer as-is (Cloudinary accepts SVG as resource_type image)

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `instify/templates/${institute_uuid}`, resource_type: 'image' },
        (err, result) => err ? reject(err) : resolve(result)
      );
      stream.end(uploadBuffer);
    });

    const tpl = await CustomTemplate.create({
      institute_uuid, name,
      docType: docType || 'other',
      imageUrl: uploadResult.secure_url,
      thumbUrl: uploadResult.secure_url.replace('/upload/', '/upload/w_200,q_60/'),
      created_by,
    });

    res.json({ success: true, result: tpl });
  } catch (err) {
    console.error('[Template convert]', err.message);
    res.status(500).json({ success: false, message: `Conversion failed: ${err.message}` });
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
});

// List templates
router.get('/', async (req, res) => {
  try {
    const { institute_uuid, docType } = req.query;
    if (!institute_uuid) return res.status(400).json({ success: false, message: 'institute_uuid required' });
    const q = { institute_uuid };
    if (docType) q.docType = docType;
    const templates = await CustomTemplate.find(q).sort({ createdAt: -1 });
    res.json({ success: true, result: templates });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Delete template
router.delete('/:uuid', async (req, res) => {
  try {
    const tpl = await CustomTemplate.findOneAndDelete({ template_uuid: req.params.uuid });
    if (tpl?.imageUrl) {
      const publicId = tpl.imageUrl.split('/').slice(-2).join('/').replace(/\.[^.]+$/, '');
      await cloudinary.uploader.destroy(publicId).catch(() => {});
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
