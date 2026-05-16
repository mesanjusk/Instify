import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

import DashboardLayout from './layouts/DashboardLayout';
import SectionLayout from './layouts/SectionLayout';
import MagicLogin from './pages/MagicLogin';
import AcademicHub from './pages/AcademicHub';
import AdminHub from './pages/AdminHub';

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
import AllBalance from './reports/allBalance';
import AddAccount from './pages/AddAccount';
import AllExams from './reports/allExams';
import Institutes from './pages/Institutes';
import Students from './pages/Students';
import Fees from './pages/Fees';
import ToolsPanel from './pages/ToolsPanel';
import AllTransaction3 from './reports/allTransaction3';
import WhatsAppIntegrationSettingsPage from './modules/whatsapp/pages/WhatsAppIntegrationSettingsPage';
const BaileysWhatsApp = lazy(() => import('./pages/BaileysWhatsApp'));
const CanvasEditor = lazy(() => import('./pages/CanvasEditor'));
import UpiPayment from './pages/UpiPayment';
import CsvImport from './pages/CsvImport';
import BulkDownload from './pages/BulkDownload';
import Employees from './pages/Employees';
import TrialBalance from './pages/TrialBalance';
import ProfitLoss from './pages/ProfitLoss';
import FunnelReport from './pages/FunnelReport';

function PageLoader() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200 }}>
      <CircularProgress size={32} sx={{ color: '#075E54' }} />
    </Box>
  );
}

export default function App() {
  return (
    <Routes>
      {/* ── Public ───────────────────────────────────────── */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Signup />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/upload" element={<ImageUploader />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:id" element={<ResetPassword />} />
      <Route path="/access/:token" element={<MagicLogin />} />

      {/* ── Section routes (no sidebar / FAB / bottom nav) ── */}
      <Route
        path="/:username/section/whatsapp"
        element={
          <PrivateRoute>
            <SectionLayout title="WhatsApp Bot" subtitle="Automation & messaging" color="#075E54">
              <Suspense fallback={<PageLoader />}>
                <BaileysWhatsApp />
              </Suspense>
            </SectionLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/:username/section/canvas"
        element={
          <PrivateRoute>
            <Box sx={{ height: '100dvh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <Suspense fallback={<PageLoader />}>
                <CanvasEditor />
              </Suspense>
            </Box>
          </PrivateRoute>
        }
      />
      <Route
        path="/:username/section/academic"
        element={
          <PrivateRoute>
            <SectionLayout title="Academic" subtitle="Students, courses & attendance" color="#4f46e5">
              <AcademicHub />
            </SectionLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/:username/section/admin"
        element={
          <PrivateRoute>
            <SectionLayout title="Administration" subtitle="Settings, users & accounts" color="#0f172a">
              <AdminHub />
            </SectionLayout>
          </PrivateRoute>
        }
      />

      {/* ── Dashboard layout routes ───────────────────────── */}
      <Route path="/:username" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
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
        <Route path="allBalance" element={<AllBalance />} />
        <Route path="allBatches" element={<AllBatches />} />
        <Route path="whatsapp" element={<WhatsAppAdminPage />} />
        <Route path="dashboard/centers/:centerId/whatsapp" element={<WhatsAppIntegrationSettingsPage />} />
        <Route path="allExams" element={<AllExams />} />
        <Route path="fees" element={<Fees />} />
        <Route path="tools" element={<ToolsPanel />} />
        <Route path="allTransaction3" element={<AllTransaction3 />} />
        <Route path="upi-payment" element={<UpiPayment />} />
        <Route path="csv-import" element={<CsvImport />} />
        <Route path="bulk-download" element={<BulkDownload />} />
        <Route path="employees" element={<Employees />} />
        <Route path="trial-balance" element={<TrialBalance />} />
        <Route path="profit-loss" element={<ProfitLoss />} />
        <Route path="funnel-report" element={<FunnelReport />} />
        {/* Legacy redirects → section routes */}
        <Route path="whatsapp-personal" element={<RedirectToSection section="whatsapp" />} />
        <Route path="canvas-editor" element={<RedirectToSection section="canvas" />} />
      </Route>

      {/* ── Fallback ──────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/* Redirects old direct routes to the new section URLs */
function RedirectToSection({ section }) {
  const { username } = (() => {
    // Extract username from current pathname
    const parts = window.location.pathname.split('/').filter(Boolean);
    return { username: parts[0] || 'admin' };
  })();
  return <Navigate to={`/${username}/section/${section}`} replace />;
}
