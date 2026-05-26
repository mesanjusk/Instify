/**
 * Registry of all models that participate in bidirectional sync.
 * uuidField: the field used as the stable cross-database identifier.
 * Excluded: WASession, LidMapping, Message (WhatsApp) — self-managed or local-only.
 */
const SYNC_MODELS = [
  { name: 'Student',         collection: 'students',          uuidField: 'uuid' },
  { name: 'Lead',            collection: 'leads',             uuidField: 'Lead_uuid' },
  { name: 'Admission',       collection: 'admissions',        uuidField: 'uuid' },
  { name: 'Fees',            collection: 'fees',              uuidField: 'uuid' },
  { name: 'Transaction',     collection: 'transactions',      uuidField: 'Transaction_uuid' },
  { name: 'Attendance',      collection: 'attendances',       uuidField: 'Attendance_uuid' },
  { name: 'Batch',           collection: 'batches',           uuidField: 'Batch_uuid' },
  { name: 'Course',          collection: 'courses',           uuidField: 'Course_uuid' },
  { name: 'Employee',        collection: 'employees',         uuidField: 'employee_uuid' },
  { name: 'Account',         collection: 'accounts',          uuidField: 'uuid' },
  { name: 'Accountgroup',    collection: 'accountgroups',     uuidField: 'Account_group_uuid' },
  { name: 'PaymentMode',     collection: 'paymentmodes',      uuidField: 'uuid' },
  { name: 'UpiConfig',       collection: 'upiconfigs',        uuidField: 'uuid' },
  { name: 'PayrollRun',      collection: 'payrollruns',       uuidField: 'run_uuid' },
  { name: 'Exam',            collection: 'exams',             uuidField: 'uuid' },
  { name: 'Form',            collection: 'forms',             uuidField: 'form_uuid' },
  { name: 'FormResponse',    collection: 'formresponses',     uuidField: 'response_uuid' },
  { name: 'Enquiry',         collection: 'enquiries',         uuidField: 'uuid' },
  { name: 'Record',          collection: 'records',           uuidField: 'uuid' },
  { name: 'IDCardProject',   collection: 'idcardprojects',    uuidField: 'project_uuid' },
  { name: 'IDCardStudent',   collection: 'idcardstudents',    uuidField: 'idcard_uuid' },
  { name: 'Design',          collection: 'designs',           uuidField: 'design_uuid' },
  { name: 'CustomTemplate',  collection: 'customtemplates',   uuidField: 'template_uuid' },
  { name: 'MessageTemplate', collection: 'messagetemplates',  uuidField: 'uuid' },
  { name: 'Institute',       collection: 'institutes',        uuidField: 'institute_uuid' },
  { name: 'User',            collection: 'users',             uuidField: 'user_uuid' },
];

module.exports = { SYNC_MODELS };
