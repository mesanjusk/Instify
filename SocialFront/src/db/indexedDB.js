import Dexie from 'dexie';
import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_DB_SECRET_KEY || 'change_me';

class AppDatabase extends Dexie {
  constructor() {
    super('appDB');
    // v1 — original tables
    this.version(1).stores({
      leads: '++id, lead_uuid, institute_uuid',
      students: '++id, student_uuid, institute_uuid',
      attendance: '++id, attendance_uuid, institute_uuid',
      admissions: '++id, admission_uuid, institute_uuid',
      courses: '++id, course_uuid, institute_uuid',
      exams: '++id, exam_uuid, institute_uuid',
      batches: '++id, batch_uuid, institute_uuid'
    });
    // v2 — add educations and paymentModes (required by masterUtils)
    this.version(2).stores({
      leads: '++id, lead_uuid, institute_uuid',
      students: '++id, student_uuid, institute_uuid',
      attendance: '++id, attendance_uuid, institute_uuid',
      admissions: '++id, admission_uuid, institute_uuid',
      courses: '++id, course_uuid, institute_uuid',
      exams: '++id, exam_uuid, institute_uuid',
      batches: '++id, batch_uuid, institute_uuid',
      educations: '++id',
      paymentModes: '++id'
    });
  }

  encrypt(data) {
    const text = JSON.stringify(data);
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  }

  decrypt(cipher) {
    const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY);
    const text = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(text);
  }
}

const db = new AppDatabase();
export default db;
