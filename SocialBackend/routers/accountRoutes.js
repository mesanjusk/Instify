const express = require("express");
const router = express.Router();
const Account = require("../models/Account");
const { v4: uuid } = require("uuid");

// Add a new account
router.post("/addAccount", async (req, res) => {
  const { Account_name, institute_uuid, Mobile_number, Account_group, Status } = req.body;

  if (!Account_name || !institute_uuid || !Account_group) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const check = await Account.findOne({ 
      Account_name: Account_name.trim(), 
      institute_uuid 
    });

    if (check) {
      return res.status(400).json({ success: false, message: "Account name already exists" });
    }

    const mobile = Mobile_number && Mobile_number.trim() !== '' ? Mobile_number.trim() : null;

    const newAccount = new Account({
      Account_name: Account_name.trim(),
      institute_uuid,
      Mobile_number: mobile,
      Account_group,
      Status,
      Account_uuid: uuid()
    });

    await newAccount.save();
    res.status(201).json({ success: true, message: "Account added successfully" });

  } catch (error) {
    console.error("Error saving account:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
});


// Get all accounts
router.get("/GetAccountList", async (req, res) => {
    try {
        const data = await Account.find({});
        if (data.length) {
            res.json({ success: true, result: data.filter(a => a.Mobile_number) });
        } else {
            res.json({ success: false, message: "Account Not found" });
        }
    } catch (err) {
        console.error("Error fetching Account:", err);
        res.status(500).json({ success: false, message: err });
    }
});

module.exports = router;
