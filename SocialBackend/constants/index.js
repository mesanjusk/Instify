/** Shared backend constants — import instead of hardcoding strings in routes/controllers */

const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  OWNER: 'owner',
  STAFF: 'staff',
  TEACHER: 'teacher',
  STUDENT: 'student',
});

const LEAD_STATUSES = Object.freeze({
  OPEN: 'open',
  FOLLOW_UP: 'follow-up',
  CONVERTED: 'converted',
  LOST: 'lost',
});

const ADMISSION_STATUSES = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  DROPPED: 'dropped',
});

const GENDER_OPTIONS = Object.freeze(['Male', 'Female', 'Other']);

const PAYMENT_MODES = Object.freeze({
  CASH: 'Cash',
  UPI: 'UPI',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
  ONLINE: 'Online',
});

const JWT_EXPIRY = '7d';

const HTTP = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500,
});

const MSG = Object.freeze({
  SERVER_ERROR: 'Internal server error',
  NOT_FOUND: 'Record not found',
  INVALID_CREDENTIALS: 'Invalid credentials',
  UNAUTHORIZED: 'Unauthorized',
  SUCCESS: 'success',
  DUPLICATE: 'Record already exists',
});

module.exports = { USER_ROLES, LEAD_STATUSES, ADMISSION_STATUSES, GENDER_OPTIONS, PAYMENT_MODES, JWT_EXPIRY, HTTP, MSG };
