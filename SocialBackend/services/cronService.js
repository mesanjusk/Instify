const cron = require('node-cron');
const Lead = require('../models/Lead');
const Student = require('../models/Student');
const Fees = require('../models/Fees');
const MessageTemplate = require('../models/MessageTemplate');
const baileysService = require('./baileysService');

function fmt(date) {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function toJid(mobile) {
  const digits = (mobile || '').replace(/\D/g, '');
  if (digits.length < 10) return null;
  return digits.length === 10 ? `91${digits}` : digits;
}

async function trySend(instituteId, mobile, message) {
  try {
    if (baileysService.getStatus(instituteId) !== 'connected') return;
    const number = toJid(mobile);
    if (!number) return;
    await baileysService.sendText(instituteId, number, message);
  } catch (err) {
    console.error(`[Cron] WhatsApp send failed (${mobile}):`, err.message);
  }
}

async function getTemplate(institute_uuid, key, defaults) {
  try {
    const tpl = await MessageTemplate.findOne({ institute_uuid, key });
    return tpl ? tpl.body : defaults[key];
  } catch { return defaults[key]; }
}

const DEFAULT_TEMPLATES = {
  followup: 'Hello {{name}},\nThis is a reminder for your follow-up today ({{date}}) regarding the *{{course}}* enquiry.\nPlease contact us for more details.\n– Instify',
  fees: 'Dear {{name}},\nYour fee instalment of ₹{{amount}} was due on {{date}}.\nOutstanding balance: ₹{{balance}}\nPlease clear the dues at the earliest.\n– Instify',
  birthday: '🎂 Happy Birthday, *{{name}}*!\nWishing you a wonderful day filled with joy.\n– Instify Team',
  magic_link: 'Hello {{name}},\nYour Instify account is ready.\nClick to access: {{link}}\n– Instify',
};

function fillTemplate(tpl, vars) {
  return tpl.replace(/{{(\w+)}}/g, (_, k) => vars[k] || '');
}

function scheduleFollowupReminders() {
  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron] Running follow-up reminder job…');
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      const leads = await Lead.find({ followupDate: { $gte: today, $lt: tomorrow } });
      for (const lead of leads) {
        const student = await Student.findOne({ uuid: lead.student_uuid });
        if (!student) continue;
        const mobile = student.mobileSelf || student.mobileParent;
        if (!mobile) continue;
        const tpl = await getTemplate(lead.institute_uuid, 'followup', DEFAULT_TEMPLATES);
        const msg = fillTemplate(tpl, { name: student.firstName, date: fmt(lead.followupDate), course: lead.course || 'course' });
        await trySend(lead.institute_uuid, mobile, msg);
      }
      console.log(`[Cron] Follow-up reminders sent for ${leads.length} lead(s)`);
    } catch (err) { console.error('[Cron] Follow-up job error:', err.message); }
  }, { timezone: 'Asia/Kolkata' });
}

function scheduleFeeReminders() {
  cron.schedule('0 10 * * *', async () => {
    console.log('[Cron] Running fee due reminder job…');
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const fees = await Fees.find({ balance: { $gt: 0 } });
      for (const fee of fees) {
        const duePlan = (fee.installmentPlan || []).find(p => { const d = new Date(p.dueDate); d.setHours(0,0,0,0); return d <= today; });
        if (!duePlan) continue;
        const student = await Student.findOne({ uuid: fee.student_uuid });
        if (!student) continue;
        const mobile = student.mobileSelf || student.mobileParent;
        if (!mobile) continue;
        const tpl = await getTemplate(fee.institute_uuid, 'fees', DEFAULT_TEMPLATES);
        const msg = fillTemplate(tpl, { name: student.firstName, amount: duePlan.amount, date: duePlan.dueDate, balance: fee.balance });
        await trySend(fee.institute_uuid, mobile, msg);
      }
      console.log('[Cron] Fee reminder job complete');
    } catch (err) { console.error('[Cron] Fee reminder job error:', err.message); }
  }, { timezone: 'Asia/Kolkata' });
}

function scheduleBirthdayWishes() {
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] Running birthday wishes job…');
    try {
      const now = new Date();
      const students = await Student.find({ dob: { $exists: true, $ne: null } });
      for (const student of students) {
        const dob = new Date(student.dob);
        if (dob.getMonth() + 1 !== now.getMonth() + 1 || dob.getDate() !== now.getDate()) continue;
        const mobile = student.mobileSelf || student.mobileParent;
        if (!mobile) continue;
        const tpl = await getTemplate(student.institute_uuid, 'birthday', DEFAULT_TEMPLATES);
        const msg = fillTemplate(tpl, { name: student.firstName });
        await trySend(student.institute_uuid, mobile, msg);
      }
      console.log('[Cron] Birthday wishes job complete');
    } catch (err) { console.error('[Cron] Birthday wishes job error:', err.message); }
  }, { timezone: 'Asia/Kolkata' });
}

function initCronJobs() {
  scheduleFollowupReminders();
  scheduleFeeReminders();
  scheduleBirthdayWishes();
  console.log('✅ Cron jobs scheduled (follow-ups, fees, birthdays)');
}

module.exports = { initCronJobs };
