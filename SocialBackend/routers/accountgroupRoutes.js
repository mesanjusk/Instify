const express = require("express");
const router = express.Router();
const Accountgroup = require("../models/Accountgroup");
const { v4: uuid } = require("uuid");

router.post("/addAccountgroup", async (req, res) => {
    const{ Account_group}=req.body

    try{
        const check=await Accountgroup.findOne({ Account_group: Account_group })

        if(check){
            res.json("exist")
        }
        else{
          const newGroup = new Accountgroup({
            Account_group,
            Account_group_uuid: uuid()
        });
        await newGroup.save(); 
        res.json("notexist");
        }

    }
    catch(e){
      console.error("Error saving group:", e);
      res.status(500).json("fail");
    }
  });



  router.get("/GetAccountgroupList", async (req, res) => {
    try {
      let data = await Accountgroup.find({});
  
      if (data.length)
        res.json({ success: true, result: data.filter((a) => a.Account_group) });
      else res.json({ success: false, message: "Account Group Not found" });
    } catch (err) {
      console.error("Error fetching group:", err);
        res.status(500).json({ success: false, message: err });
    }
  });

  
  module.exports = router;