const Form = require('../models/Form');
const FormResponse = require('../models/FormResponse');
const Institute = require('../models/institute');

// ── Admin: create form ────────────────────────────────────────────────────────
exports.createForm = async (req, res) => {
  try {
    const { institute_uuid, title, description, slug, fields, isActive, successMessage, createdBy } = req.body;
    if (!institute_uuid || !title || !slug) {
      return res.status(400).json({ success: false, message: 'institute_uuid, title and slug are required' });
    }
    const safe = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const exists = await Form.findOne({ institute_uuid, slug: safe });
    if (exists) return res.status(409).json({ success: false, message: 'A form with this slug already exists for this institute' });

    const form = await Form.create({ institute_uuid, title, description, slug: safe, fields: fields || [], isActive, successMessage, createdBy });
    res.status(201).json({ success: true, result: form });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: list all forms for an institute ────────────────────────────────────
exports.getForms = async (req, res) => {
  try {
    const { institute_uuid } = req.query;
    if (!institute_uuid) return res.status(400).json({ success: false, message: 'institute_uuid required' });
    const forms = await Form.find({ institute_uuid }).sort({ createdAt: -1 });
    res.json({ success: true, result: forms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: get single form ────────────────────────────────────────────────────
exports.getForm = async (req, res) => {
  try {
    const form = await Form.findOne({ form_uuid: req.params.uuid });
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });
    res.json({ success: true, result: form });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: update form ────────────────────────────────────────────────────────
exports.updateForm = async (req, res) => {
  try {
    const { title, description, slug, fields, isActive, successMessage } = req.body;
    const update = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (slug !== undefined) {
      const safe = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const form = await Form.findOne({ form_uuid: req.params.uuid });
      if (!form) return res.status(404).json({ success: false, message: 'Form not found' });
      const conflict = await Form.findOne({ institute_uuid: form.institute_uuid, slug: safe, form_uuid: { $ne: req.params.uuid } });
      if (conflict) return res.status(409).json({ success: false, message: 'Slug already used by another form' });
      update.slug = safe;
    }
    if (fields !== undefined) update.fields = fields;
    if (isActive !== undefined) update.isActive = isActive;
    if (successMessage !== undefined) update.successMessage = successMessage;

    const form = await Form.findOneAndUpdate({ form_uuid: req.params.uuid }, update, { new: true });
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });
    res.json({ success: true, result: form });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: delete form ────────────────────────────────────────────────────────
exports.deleteForm = async (req, res) => {
  try {
    const form = await Form.findOneAndDelete({ form_uuid: req.params.uuid });
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });
    await FormResponse.deleteMany({ form_uuid: req.params.uuid });
    res.json({ success: true, message: 'Form and its responses deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: get responses ──────────────────────────────────────────────────────
exports.getResponses = async (req, res) => {
  try {
    const responses = await FormResponse.find({ form_uuid: req.params.uuid }).sort({ createdAt: -1 });
    res.json({ success: true, result: responses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Public: get form by slug ──────────────────────────────────────────────────
exports.getPublicForm = async (req, res) => {
  try {
    const { slug } = req.params;
    const instituteId = req.query.i;
    if (!instituteId) return res.status(400).json({ success: false, message: 'Institute identifier required' });

    const institute = await Institute.findOne({
      $or: [{ institute_uuid: instituteId }, { 'access.subdomain': instituteId }, { center_code: instituteId }],
    });
    if (!institute) return res.status(404).json({ success: false, message: 'Institute not found' });

    const form = await Form.findOne({ institute_uuid: institute.institute_uuid, slug, isActive: true });
    if (!form) return res.status(404).json({ success: false, message: 'Form not found or inactive' });

    res.json({ success: true, result: form });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Public: submit response ───────────────────────────────────────────────────
exports.submitResponse = async (req, res) => {
  try {
    const { slug } = req.params;
    const instituteId = req.query.i;
    if (!instituteId) return res.status(400).json({ success: false, message: 'Institute identifier required' });

    const institute = await Institute.findOne({
      $or: [{ institute_uuid: instituteId }, { 'access.subdomain': instituteId }, { center_code: instituteId }],
    });
    if (!institute) return res.status(404).json({ success: false, message: 'Institute not found' });

    const form = await Form.findOne({ institute_uuid: institute.institute_uuid, slug, isActive: true });
    if (!form) return res.status(404).json({ success: false, message: 'Form not found or inactive' });

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const response = await FormResponse.create({
      form_uuid: form.form_uuid,
      institute_uuid: institute.institute_uuid,
      data: req.body,
      ip,
    });

    res.status(201).json({ success: true, message: form.successMessage, result: response });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
