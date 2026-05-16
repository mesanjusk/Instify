const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const PayrollRun = require('../models/PayrollRun');

// Employee CRUD
router.get('/', async (req, res) => {
  try {
    const { institute_uuid } = req.query;
    const q = institute_uuid ? { institute_uuid } : {};
    const employees = await Employee.find(q).sort({ createdAt: -1 });
    res.json({ success: true, result: employees });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const emp = new Employee(req.body);
    await emp.save();
    res.json({ success: true, result: emp });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:uuid', async (req, res) => {
  try {
    const emp = await Employee.findOneAndUpdate(
      { employee_uuid: req.params.uuid }, req.body, { new: true }
    );
    if (!emp) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, result: emp });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:uuid', async (req, res) => {
  try {
    await Employee.findOneAndDelete({ employee_uuid: req.params.uuid });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Process payroll for month/year
router.post('/payroll/process', async (req, res) => {
  try {
    const { institute_uuid, month, year, processedBy } = req.body;
    if (!institute_uuid || !month || !year) {
      return res.status(400).json({ success: false, message: 'institute_uuid, month, year required' });
    }

    // Delete existing draft for same period
    await PayrollRun.findOneAndDelete({ institute_uuid, month, year, status: 'draft' });

    const employees = await Employee.find({ institute_uuid, status: 'active' });

    const payslips = employees.map(emp => {
      const basic = emp.salaryStructure?.basic || 0;
      const hra = emp.salaryStructure?.hra || 0;
      const components = emp.salaryStructure?.components || [];
      const earnings = components.filter(c => c.type === 'earning')
        .reduce((s, c) => s + (c.isPercent ? (basic * c.amount / 100) : c.amount), 0);
      const deductions = components.filter(c => c.type === 'deduction')
        .reduce((s, c) => s + (c.isPercent ? (basic * c.amount / 100) : c.amount), 0);
      const gross = basic + hra + earnings;
      const net = gross - deductions;
      return {
        employee_uuid: emp.employee_uuid,
        employeeName: `${emp.firstName} ${emp.lastName || ''}`.trim(),
        designation: emp.designation || '',
        basic, hra, earnings, deductions, gross: Math.round(gross), net: Math.round(net),
      };
    });

    const totalGross = payslips.reduce((s, p) => s + p.gross, 0);
    const totalNet = payslips.reduce((s, p) => s + p.net, 0);

    const run = new PayrollRun({
      institute_uuid, month, year, payslips, totalGross, totalNet,
      status: 'processed', processedBy,
    });
    await run.save();
    res.json({ success: true, result: run });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Get payroll runs
router.get('/payroll', async (req, res) => {
  try {
    const { institute_uuid } = req.query;
    const runs = await PayrollRun.find({ institute_uuid }).sort({ year: -1, month: -1 });
    res.json({ success: true, result: runs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Mark payroll as paid
router.put('/payroll/:uuid/mark-paid', async (req, res) => {
  try {
    const run = await PayrollRun.findOneAndUpdate(
      { run_uuid: req.params.uuid },
      { status: 'paid', 'payslips.$[].status': 'paid', 'payslips.$[].paidOn': new Date() },
      { new: true }
    );
    if (!run) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, result: run });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
