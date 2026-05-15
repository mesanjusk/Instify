import { Routes, Route, Navigate } from 'react-router-dom';

import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import User from './pages/User';
import Login from './components/Login';
import ImageUploader from './components/ImageUploader';
import Enquiry from './pages/Enquiry';
import Courses from './pages/Courses';
import Batches from './pages/Batches';
import Signup from './components/Signup';
import OrgCategories from './pages/OrgCategories';
import Education from './pages/Education';
import Exam from './pages/Exam';
import PaymentMode from './pages/PaymentMode';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import InstituteProfile from './pages/instituteProfile';
import Owner from './pages/Owner';
import PrivateRoute from './components/PrivateRoute';
import CoursesCategory from './pages/CoursesCategory';
import Leads from './reports/Leads';
import AllAdmission from './reports/allAdmission';
import AddLead from './pages/AddLead';
import AddNew from './components/admissions/AddAdmission';
import Followup from './pages/Followup';
import WhatsAppAdminPage from './pages/WhatsAppAdminPage';
import AddReciept from './pages/addReciept';
import AddPayment from './pages/addPayment';
import AllLeadByAdmission from './reports/allLeadByAdmission';
import AddAttendance from './pages/AddAttendance';
import AllAttendance from './reports/allAttendance';
import AllBatches from './reports/allBatches';
import AllBalance from './reports/allBalance'; // <-- ✅ NEW PAGE
import AddAccount from './pages/AddAccount';
import AllExams from './reports/allExams';
import Institutes from './pages/Institutes';
import Students from './pages/Students';
import Fees from './pages/Fees';
import ToolsPanel from './pages/ToolsPanel';
import AllTransaction3 from './reports/allTransaction3';
import WhatsAppIntegrationSettingsPage from './modules/whatsapp/pages/WhatsAppIntegrationSettingsPage';
import BaileysWhatsApp from './pages/BaileysWhatsApp';
import UpiPayment from './pages/UpiPayment';
import CsvImport from './pages/CsvImport';
import CanvasEditor from './pages/CanvasEditor';

export default function App() {
  return (
    <Routes>
      {/* 🌐 Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Signup />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/upload" element={<ImageUploader />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:id" element={<ResetPassword />} />

      {/* 🔐 Protected Routes under :username */}
      <Route path="/:username" element={<PrivateRoute><DashboardLayout /></PrivateRoute>} >
        <Route index element={<Dashboard />} />
        <Route path="user" element={<User />} />
        <Route path="batches" element={<Batches />} />
        <Route path="enquiry" element={<Enquiry />} />
        <Route path="courses" element={<Courses />} />
        <Route path="students" element={<Students />} />
        <Route path="orgcategories" element={<OrgCategories />} />
        <Route path="education" element={<Education />} />
        <Route path="exam" element={<Exam />} />
        <Route path="paymentmode" element={<PaymentMode />} />
        <Route path="instituteProfile" element={<InstituteProfile />} />
        <Route path="owner" element={<Owner />} />
        <Route path="institutes" element={<Institutes />} />
        <Route path="coursesCategory" element={<CoursesCategory />} />
        <Route path="leads" element={<Leads />} />
        <Route path="allAdmission" element={<AllAdmission />} />
        <Route path="allLeadByAdmission" element={<AllLeadByAdmission />} />
        <Route path="add-lead" element={<AddLead />} />
        <Route path="addNewAdd" element={<AddNew />} />
        <Route path="addReciept" element={<AddReciept />} />
        <Route path="addPayment" element={<AddPayment />} />
        <Route path="addAccount" element={<AddAccount />} />
        <Route path="followup" element={<Followup />} />
        <Route path="addAttendance" element={<AddAttendance />} />
        <Route path="allAttendance" element={<AllAttendance />} />
        <Route path="allBalance" element={<AllBalance />} /> {/* ✅ Added Route */}
        <Route path="allBatches" element={<AllBatches />} /> {/* ✅ Added Route */}
        <Route path="whatsapp" element={<WhatsAppAdminPage />} />
        <Route path="dashboard/centers/:centerId/whatsapp" element={<WhatsAppIntegrationSettingsPage />} />
        <Route path="allExams" element={<AllExams />} />
        <Route path="fees" element={<Fees />} />
        <Route path="tools" element={<ToolsPanel />} />
        <Route path="allTransaction3" element={<AllTransaction3 />} />
        <Route path="whatsapp-personal" element={<BaileysWhatsApp />} />
        <Route path="upi-payment" element={<UpiPayment />} />
        <Route path="csv-import" element={<CsvImport />} />
        <Route path="canvas-editor" element={<CanvasEditor />} />
      </Route>

      {/* 🧭 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
