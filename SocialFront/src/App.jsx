import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import SyncStatusBar from './components/SyncStatusBar';
import UpdateNotifier from './components/UpdateNotifier';
import useOfflineQueue from './hooks/useOfflineQueue';
import { CircularProgress, Box } from '@mui/material';

import DashboardLayout from './layouts/DashboardLayout';
import SectionLayout from './layouts/SectionLayout';
import PrivateRoute from './components/PrivateRoute';
import FeatureGate from './components/FeatureGate';

// Always-present routes (auth + shell) — load eagerly
import Intro from './pages/Intro';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Dashboard from './pages/Dashboard';
import MagicLogin from './pages/MagicLogin';
import PublicForm from './pages/PublicForm';
import PrivacyPolicy from './pages/PrivacyPolicy';

// When a JS chunk fetch fails (stale PWA cache), reload the page once so the
// service worker can serve the fresh hashes from the new deploy.
const lazyWithRetry = (importFn) =>
  lazy(() =>
    importFn().catch(() => {
      if (!sessionStorage.getItem('chunk-reloaded')) {
        sessionStorage.setItem('chunk-reloaded', '1');
        window.location.reload();
        return new Promise(() => {}); // hold until reload completes
      }
      return { default: () => null };
    })
  );

// Lazy-load all heavy feature pages — split into separate chunks
const AcademicHub = lazyWithRetry(() => import('./pages/AcademicHub'));
const AdminHub = lazyWithRetry(() => import('./pages/AdminHub'));
const User = lazyWithRetry(() => import('./pages/User'));
const ImageUploader = lazyWithRetry(() => import('./components/ImageUploader'));
const Enquiry = lazyWithRetry(() => import('./pages/Enquiry'));
const Courses = lazyWithRetry(() => import('./pages/Courses'));
const Batches = lazyWithRetry(() => import('./pages/Batches'));
const OrgCategories = lazyWithRetry(() => import('./pages/OrgCategories'));
const Education = lazyWithRetry(() => import('./pages/Education'));
const Exam = lazyWithRetry(() => import('./pages/Exam'));
const PaymentMode = lazyWithRetry(() => import('./pages/PaymentMode'));
const InstituteProfile = lazyWithRetry(() => import('./pages/instituteProfile'));
const Owner = lazyWithRetry(() => import('./pages/Owner'));
const CoursesCategory = lazyWithRetry(() => import('./pages/CoursesCategory'));
const Leads = lazyWithRetry(() => import('./reports/Leads'));
const AllAdmission = lazyWithRetry(() => import('./reports/allAdmission'));
const AddLead = lazyWithRetry(() => import('./pages/AddLead'));
const AddNew = lazyWithRetry(() => import('./components/admissions/AddAdmission'));
const Followup = lazyWithRetry(() => import('./pages/Followup'));
const WhatsAppAdminPage = lazyWithRetry(() => import('./pages/WhatsAppAdminPage'));
const AddReciept = lazyWithRetry(() => import('./pages/addReciept'));
const AddPayment = lazyWithRetry(() => import('./pages/addPayment'));
const AllLeadByAdmission = lazyWithRetry(() => import('./reports/allLeadByAdmission'));
const AddAttendance = lazyWithRetry(() => import('./pages/AddAttendance'));
const AllAttendance = lazyWithRetry(() => import('./reports/allAttendance'));
const AllBatches = lazyWithRetry(() => import('./reports/allBatches'));
const AllBalance = lazyWithRetry(() => import('./reports/allBalance'));
const AddAccount = lazyWithRetry(() => import('./pages/AddAccount'));
const AllExams = lazyWithRetry(() => import('./reports/allExams'));
const Institutes = lazyWithRetry(() => import('./pages/Institutes'));
const Students = lazyWithRetry(() => import('./pages/Students'));
const Fees = lazyWithRetry(() => import('./pages/Fees'));
const ToolsPanel = lazyWithRetry(() => import('./pages/ToolsPanel'));
const AllTransaction3 = lazyWithRetry(() => import('./reports/allTransaction3'));
const WhatsAppIntegrationSettingsPage = lazyWithRetry(() => import('./modules/whatsapp/pages/WhatsAppIntegrationSettingsPage'));
const BaileysWhatsApp = lazyWithRetry(() => import('./pages/BaileysWhatsApp'));
const CanvasEditor = lazyWithRetry(() => import('./pages/CanvasEditor'));
const UpiPayment = lazyWithRetry(() => import('./pages/UpiPayment'));
const CsvImport = lazyWithRetry(() => import('./pages/CsvImport'));
const AcademicBulkImport = lazyWithRetry(() => import('./pages/AcademicBulkImport'));
const BulkDownload = lazyWithRetry(() => import('./pages/BulkDownload'));
const Employees = lazyWithRetry(() => import('./pages/Employees'));
const TrialBalance = lazyWithRetry(() => import('./pages/TrialBalance'));
const ProfitLoss = lazyWithRetry(() => import('./pages/ProfitLoss'));
const FunnelReport = lazyWithRetry(() => import('./pages/FunnelReport'));
const Forms = lazyWithRetry(() => import('./pages/Forms'));
const FormResponses = lazyWithRetry(() => import('./pages/FormResponses'));
const IDCardStudentSelfEdit = lazyWithRetry(() => import('./pages/IDCardStudentSelfEdit'));
const IDCardPrint = lazyWithRetry(() => import('./pages/IDCardPrint'));
const Greetings = lazyWithRetry(() => import('./pages/Greetings'));

function PageLoader() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200 }}>
      <CircularProgress size={32} sx={{ color: '#075E54' }} />
    </Box>
  );
}

export default function App() {
  const isDesktop = !!window.electronAPI;
  const navigate = useNavigate();
  useOfflineQueue();

  useEffect(() => {
    // Expose router navigate so utility functions outside React can do clean redirects
    window._navigateTo = navigate;
    return () => { window._navigateTo = null; };
  }, [navigate]);

  return (
    <>
    {isDesktop && <SyncStatusBar />}
    {isDesktop && <UpdateNotifier />}
    <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* ── Public ───────────────────────────────────────── */}
      <Route path="/" element={<Intro />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Signup />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/upload" element={<ImageUploader />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:id" element={<ResetPassword />} />
      <Route path="/access/:token" element={<MagicLogin />} />
      <Route path="/f/:slug" element={<PublicForm />} />
      <Route path="/idcard-preview/:token" element={<IDCardStudentSelfEdit />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />

      {/* ── Section routes (no sidebar / FAB / bottom nav) ── */}
      <Route
        path="/:username/section/whatsapp"
        element={
          <PrivateRoute>
            <FeatureGate module="whatsapp">
              <Box sx={{ height: '100dvh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <BaileysWhatsApp />
              </Box>
            </FeatureGate>
          </PrivateRoute>
        }
      />
      <Route
        path="/:username/section/canvas"
        element={
          <PrivateRoute>
            <FeatureGate module="canvas">
              <Box sx={{ height: '100dvh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <CanvasEditor />
              </Box>
            </FeatureGate>
          </PrivateRoute>
        }
      />
      <Route
        path="/:username/section/academic"
        element={
          <PrivateRoute>
            <FeatureGate module="academic">
              <SectionLayout title="Academic" subtitle="Students, courses & attendance" color="#1a7a4a">
                <AcademicHub />
              </SectionLayout>
            </FeatureGate>
          </PrivateRoute>
        }
      />
      <Route
        path="/:username/section/admin"
        element={
          <PrivateRoute>
            <SectionLayout title="Administration" subtitle="Settings, users & accounts" color="#0a1a0f">
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
        <Route path="whatsapp" element={<FeatureGate module="whatsapp"><WhatsAppAdminPage /></FeatureGate>} />
        <Route path="dashboard/centers/:centerId/whatsapp" element={<WhatsAppIntegrationSettingsPage />} />
        <Route path="allExams" element={<AllExams />} />
        <Route path="fees" element={<Fees />} />
        <Route path="tools" element={<ToolsPanel />} />
        <Route path="allTransaction3" element={<AllTransaction3 />} />
        <Route path="upi-payment" element={<UpiPayment />} />
        <Route path="csv-import" element={<FeatureGate module="csv_import"><CsvImport /></FeatureGate>} />
        <Route path="academic-bulk-import" element={<AcademicBulkImport />} />
        <Route path="bulk-download" element={<FeatureGate module="bulk_download"><BulkDownload /></FeatureGate>} />
        <Route path="employees" element={<FeatureGate module="payroll"><Employees /></FeatureGate>} />
        <Route path="trial-balance" element={<TrialBalance />} />
        <Route path="profit-loss" element={<ProfitLoss />} />
        <Route path="funnel-report" element={<FeatureGate module="funnel"><FunnelReport /></FeatureGate>} />
        <Route path="forms" element={<FeatureGate module="forms"><Forms /></FeatureGate>} />
        <Route path="forms/:formId/responses" element={<FeatureGate module="forms"><FormResponses /></FeatureGate>} />
        <Route path="idcard" element={<RedirectToSection section="canvas" />} />
        <Route path="idcard/:projectUuid/print" element={<IDCardPrint />} />
        <Route path="greetings" element={<Greetings />} />
        {/* Legacy redirects → section routes */}
        <Route path="whatsapp-personal" element={<RedirectToSection section="whatsapp" />} />
        <Route path="canvas-editor" element={<RedirectToSection section="canvas" />} />
      </Route>

      {/* ── Fallback ──────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
    </>
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
