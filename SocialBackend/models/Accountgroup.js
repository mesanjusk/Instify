const mongoose = require('mongoose');

const AccountgroupSchema=new mongoose.Schema({
    Account_group_uuid: {type: String},
    Account_group: { type: String, required: true },
 })

 const Accountgroup = mongoose.model("Accountgroup", AccountgroupSchema);

module.exports = Accountgroup;