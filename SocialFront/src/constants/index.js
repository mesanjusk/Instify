/** Shared frontend constants — use these instead of hardcoded strings */

export const API_ROUTES = Object.freeze({
  // Auth
  INSTITUTE_LOGIN: '/api/auth/institute/login',
  USER_LOGIN: '/api/auth/user/login',
  REGISTER: '/api/auth/register',
  FORGOT_PASSWORD: '/api/auth/institute/forgot-password',

  // Students
  STUDENTS: '/api/students',
  CHECK_MOBILE: '/api/students/check-mobile',

  // Leads
  LEADS: '/api/leads',

  // Admissions
  ADMISSIONS: '/api/admissions',

  // Fees
  FEES: '/api/fees',

  // Attendance
  ATTENDANCE: '/api/attendance',

  // Courses / Batches
  COURSES: '/api/courses',
  BATCHES: '/api/batches',
  COURSE_CATEGORIES: '/api/courseCategory',

  // Transactions / Accounts
  TRANSACTIONS: '/api/transaction',
  ACCOUNTS: '/api/account',

  // Baileys WhatsApp
  BAILEYS_SESSION: (id) => `/api/baileys/session/${id}`,
  BAILEYS_SEND_TEXT: '/api/baileys/send-text',
  BAILEYS_SEND_BULK: '/api/baileys/send-bulk',

  // UPI
  UPI_CONFIG: '/api/upi/config',
  UPI_QR: (id) => `/api/upi/qr/${id}`,

  // CSV Import
  CSV_IMPORT_STUDENTS: '/api/csv-import/students',
  CSV_IMPORT_LEADS: '/api/csv-import/leads',

  // Dashboard
  DASHBOARD_STATS: '/api/dashboard-stats',
});

export const LEAD_STATUSES = Object.freeze({
  OPEN: 'open',
  FOLLOW_UP: 'follow-up',
  CONVERTED: 'converted',
  LOST: 'lost',
});

export const LEAD_STATUS_COLORS = Object.freeze({
  open: 'info',
  'follow-up': 'warning',
  converted: 'success',
  lost: 'error',
});

export const ADMISSION_STATUSES = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  DROPPED: 'dropped',
});

export const GENDER_OPTIONS = Object.freeze(['Male', 'Female', 'Other']);

export const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  OWNER: 'owner',
  STAFF: 'staff',
  TEACHER: 'teacher',
});

export const PAYMENT_MODES = Object.freeze(['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Online']);

export const DATE_FORMAT = 'DD-MM-YYYY';

export const APP_NAME = 'Instify';
