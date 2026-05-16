const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const { v4: uuid } = require("uuid");

router.post("/addTransaction", async (req, res) => {
  try {
    const {
      Description,
      Transaction_date,
      institute_uuid,
      Total_Debit,
      Total_Credit,
      Payment_mode,
      Created_by,
    } = req.body;

    let { Journal_entry } = req.body;

    try {
      if (typeof Journal_entry === "string") {
        Journal_entry = JSON.parse(Journal_entry);
      }
    } catch (parseErr) {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format for Journal_entry",
      });
    }

    if (
      !Array.isArray(Journal_entry) ||
      !Journal_entry.length ||
      !Journal_entry[0].Account_id ||
      !Journal_entry[0].Type ||
      !Journal_entry[0].Amount
    ) {
      return res.status(400).json({
        success: false,
        message: "Fields in Journal_entry are required.",
      });
    }

    // Generate new Transaction ID
    const lastTransaction = await Transaction.findOne().sort({ Transaction_id: -1 });
    const newTransactionNumber = lastTransaction ? lastTransaction.Transaction_id + 1 : 1;

    const newTransaction = new Transaction({
      Transaction_uuid: uuid(),
      Transaction_id: newTransactionNumber,
      institute_uuid,
      Transaction_date,
      Total_Debit,
      Total_Credit,
      Journal_entry,
      Payment_mode,
      Description,
      Created_by,
    });

    await newTransaction.save();

    return res.json({ success: true, message: "Transaction added successfully" });

  } catch (error) {
    console.error("Error saving Transaction:", error);
    return res.status(500).json({ success: false, message: "Failed to add Transaction" });
  }
});

router.get("/GetTransactionList", async (req, res) => {
    try {
        const data = await Transaction.find({});
        if (data.length) {
            res.json({ success: true, result: data.filter(a => a.Description) });
        } else {
            res.json({ success: false, message: "Transaction Not found" });
        }
    } catch (err) {
        console.error("Error fetching Transaction:", err);
        res.status(500).json({ success: false, message: err });
    }
});

// Trial Balance
router.get('/trial-balance', async (req, res) => {
  try {
    const { institute_uuid } = req.query;
    if (!institute_uuid) return res.status(400).json({ success: false, message: 'institute_uuid required' });

    const Account = require('../models/Account');
    const rows = await Transaction.aggregate([
      { $match: { institute_uuid } },
      { $unwind: '$Journal_entry' },
      { $group: { _id: { acct: '$Journal_entry.Account_id', type: '$Journal_entry.Type' }, total: { $sum: '$Journal_entry.Amount' } } },
    ]);

    const totals = {};
    rows.forEach(r => {
      const id = r._id.acct;
      if (!totals[id]) totals[id] = { debit: 0, credit: 0 };
      totals[id][r._id.type === 'Debit' ? 'debit' : 'credit'] += r.total;
    });

    const accounts = await Account.find({ institute_uuid });
    const result = accounts.map(a => ({
      name: a.Account_name,
      group: a.Account_group,
      debit: totals[a.uuid]?.debit || 0,
      credit: totals[a.uuid]?.credit || 0,
    })).filter(r => r.debit > 0 || r.credit > 0);

    const totalDebit = result.reduce((s, r) => s + r.debit, 0);
    const totalCredit = result.reduce((s, r) => s + r.credit, 0);
    res.json({ success: true, result, totalDebit, totalCredit });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Profit & Loss
router.get('/pnl', async (req, res) => {
  try {
    const { institute_uuid, from, to } = req.query;
    if (!institute_uuid) return res.status(400).json({ success: false, message: 'institute_uuid required' });

    const Account = require('../models/Account');
    const match = { institute_uuid };
    if (from || to) {
      match.Transaction_date = {};
      if (from) match.Transaction_date.$gte = new Date(from);
      if (to) match.Transaction_date.$lte = new Date(to);
    }

    const rows = await Transaction.aggregate([
      { $match: match },
      { $unwind: '$Journal_entry' },
      { $group: { _id: { acct: '$Journal_entry.Account_id', type: '$Journal_entry.Type' }, total: { $sum: '$Journal_entry.Amount' } } },
    ]);

    const totals = {};
    rows.forEach(r => {
      const id = r._id.acct;
      if (!totals[id]) totals[id] = { debit: 0, credit: 0 };
      totals[id][r._id.type === 'Debit' ? 'debit' : 'credit'] += r.total;
    });

    const accounts = await Account.find({ institute_uuid });
    const income = [], expense = [];

    accounts.forEach(a => {
      const grp = (a.Account_group || '').toLowerCase();
      const d = totals[a.uuid]?.debit || 0;
      const c = totals[a.uuid]?.credit || 0;
      if (grp.includes('income') || grp.includes('revenue') || grp.includes('fees')) {
        income.push({ name: a.Account_name, amount: c - d });
      } else if (grp.includes('expense') || grp.includes('salary') || grp.includes('cost')) {
        expense.push({ name: a.Account_name, amount: d - c });
      }
    });

    const totalIncome = income.reduce((s, r) => s + r.amount, 0);
    const totalExpense = expense.reduce((s, r) => s + r.amount, 0);
    res.json({ success: true, result: { income, expense, totalIncome, totalExpense, netProfit: totalIncome - totalExpense } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
