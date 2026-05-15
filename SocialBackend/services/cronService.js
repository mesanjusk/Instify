/**
 * Cron Service
 * Scheduled jobs using node-cron.
 * Jobs run in the process, so they survive server restarts as long as
 * the server is running. For multi-instance deployments add a lock mechanism.
 *
 * Schedule expressions: https://crontab.guru
 */

const cron = require('node-cron');
const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Student = require('../models/Student');
const Fees = require('../models/Fees');
const baileysService = require('./baileysService');

/** Format a date to DD-MM-YYYY for messages */
function fmt(date) {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Build a WhatsApp-safe JID from a mobile number.
 * Returns null if number is invalid.
 */
function toJid(mobile) {
  const digits = (mobile || '').replace(/\D/g, '');
  if (digits.length < 10) return null;
  return digits.length === 10 ? `91${digits}` : digits;
}

/**
 * Try to send a WhatsApp message via Baileys.
 * Fails silently — cron should not crash the process.
 */
async function trySend(instituteId, mobile, message) {
  try {
    const status = baileysService.getStatus(instituteId);
    if (status !== 'connected') return;
    const number = toJid(mobile);
    if (!number) return;
    await baileysService.sendText(instituteId, number, message);
  } catch (err) {
    console.error(`[Cron] WhatsApp send failed (${mobile}):`, err.message);
  }
}

/**
 * JOB 1 — Daily follow-up reminders (runs every day at 9:00 AM IST).
 * Finds leads with followupDate = today and sends a WhatsApp reminder
 * to the student's mobile.
 */
function scheduleFollowupReminders() {
  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron] Running follow-up reminder job…');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const leads = await Lead.find({
        followupDate: { $gte: today, $lt: tomorrow },
      });

      for (const lead of leads) {
        const student = await Student.findOne({ uuid: lead.student_uuid });
        if (!student) continue;
        const mobile = student.mobileSelf || student.mobileParent;
        if (!mobile) continue;

        const msg =
          `Hello ${student.firstName},\n` +
          `This is a reminder for your follow-up scheduled today (${fmt(lead.followupDate)}) regarding the *${lead.course || 'course'}* enquiry.\n` +
          `Please contact us for more details.\n– Instify`;

        await trySend(lead.institute_uuid, mobile, msg);
      }
      console.log(`[Cron] Follow-up reminders sent for ${leads.length} lead(s)`);
    } catch (err) {
      console.error('[Cron] Follow-up job error:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });
}

/**
 * JOB 2 — Fee due reminders (runs every day at 10:00 AM IST).
 * Finds fees records with unpaid installments due today or overdue.
 */
function scheduleFeeReminders() {
  cron.schedule('0 10 * * *', async () => {
    console.log('[Cron] Running fee due reminder job…');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      const fees = await Fees.find({ balance: { $gt: 0 } });

      for (const fee of fees) {
        const duePlan = (fee.installmentPlan || []).find(p => {
          const due = new Date(p.dueDate);
          due.setHours(0, 0, 0, 0);
          return due <= today;
        });
        if (!duePlan) continue;

        const student = await Student.findOne({ uuid: fee.student_uuid });
        if (!student) continue;
        const mobile = student.mobileSelf || student.mobileParent;
        if (!mobile) continue;

        const msg =
          `Dear ${student.firstName},\n` +
          `Your fee instalment of ₹${duePlan.amount} was due on ${duePlan.dueDate}.\n` +
          `Outstanding balance: ₹${fee.balance}\n` +
          `Please clear the dues at the earliest.\n– Instify`;

        await trySend(fee.institute_uuid, mobile, msg);
      }
      console.log('[Cron] Fee reminder job complete');
    } catch (err) {
      console.error('[Cron] Fee reminder job error:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });
}

/**
 * JOB 3 — Birthday wishes (runs every day at 8:00 AM IST).
 */
function scheduleBirthdayWishes() {
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] Running birthday wishes job…');
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const day = now.getDate();

      const students = await Student.find({
        dob: { $exists: true, $ne: null },
      });

      for (const student of students) {
        const dob = new Date(student.dob);
        if (dob.getMonth() + 1 !== month || dob.getDate() !== day) continue;
        const mobile = student.mobileSelf || student.mobileParent;
        if (!mobile) continue;

        const msg =
          `🎂 Happy Birthday, *${student.firstName}*!\n` +
          `Wishing you a wonderful day filled with joy.\n` +
          `– Instify Team`;

        await trySend(student.institute_uuid, mobile, msg);
      }
      console.log('[Cron] Birthday wishes job complete');
    } catch (err) {
      console.error('[Cron] Birthday wishes job error:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });
}

/** Initialize all cron jobs. Call once from index.js after DB connects. */
function initCronJobs() {
  scheduleFollowupReminders();
  scheduleFeeReminders();
  scheduleBirthdayWishes();
  console.log('✅ Cron jobs scheduled (follow-ups, fees, birthdays)');
}

module.exports = { initCronJobs };
