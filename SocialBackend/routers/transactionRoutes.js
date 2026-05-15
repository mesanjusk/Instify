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

module.exports = router;
