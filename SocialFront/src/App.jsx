import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DesktopSetup from './components/DesktopSetup';
import SyncStatusBar from './components/SyncStatusBar';
import { CircularProgress, Box } from '@mui/material';

import DashboardLayout from './layouts/DashboardLayout';
import SectionLayout from './layouts/SectionLayout';
import PrivateRoute from './components/PrivateRoute';
import FeatureGate from './components/FeatureGate';

// Always-present routes (auth + shell) — load eagerly
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Dashboard from './pages/Dashboard';
import MagicLogin from './pages/MagicLogin';
import PublicForm from './pages/PublicForm';

// Lazy-load all heavy feature pages — split into separate chunks
const AcademicHub = lazy(() => import('./pages/AcademicHub'));
const AdminHub = lazy(() => import('./pages/AdminHub'));
const User = lazy(() => import('./pages/User'));
const ImageUploader = lazy(() => import('./components/ImageUploader'));
const Enquiry = lazy(() => import('./pages/Enquiry'));
const Courses = lazy(() => import('./pages/Courses'));
const Batches = lazy(() => import('./pages/Batches'));
const OrgCategories = lazy(() => import('./pages/OrgCategories'));
const Education = lazy(() => import('./pages/Education'));
const Exam = lazy(() => import('./pages/Exam'));
const PaymentMode = lazy(() => import('./pages/PaymentMode'));
const InstituteProfile = lazy(() => import('./pages/instituteProfile'));
const Owner = lazy(() => import('./pages/Owner'));
const CoursesCategory = lazy(() => import('./pages/CoursesCategory'));
const Leads = lazy(() => import('./reports/Leads'));
const AllAdmission = lazy(() => import('./reports/allAdmission'));
const AddLead = lazy(() => import('./pages/AddLead'));
const AddNew = lazy(() => import('./components/admissions/AddAdmission'));
const Followup = lazy(() => import('./pages/Followup'));
const WhatsAppAdminPage = lazy(() => import('./pages/WhatsAppAdminPage'));
const AddReciept = lazy(() => import('./pages/addReciept'));
const AddPayment = lazy(() => import('./pages/addPayment'));
const AllLeadByAdmission = lazy(() => import('./reports/allLeadByAdmission'));
const AddAttendance = lazy(() => import('./pages/AddAttendance'));
const AllAttendance = lazy(() => import('./reports/allAttendance'));
const AllBatches = lazy(() => import('./reports/allBatches'));
const AllBalance = lazy(() => import('./reports/allBalance'));
const AddAccount = lazy(() => import('./pages/AddAccount'));
const AllExams = lazy(() => import('./reports/allExams'));
const Institutes = lazy(() => import('./pages/Institutes'));
const Students = lazy(() => import('./pages/Students'));
const Fees = lazy(() => import('./pages/Fees'));
const ToolsPanel = lazy(() => import('./pages/ToolsPanel'));
const AllTransaction3 = lazy(() => import('./reports/allTransaction3'));
const WhatsAppIntegrationSettingsPage = lazy(() => import('./modules/whatsapp/pages/WhatsAppIntegrationSettingsPage'));
const BaileysWhatsApp = lazy(() => import('./pages/BaileysWhatsApp'));
const CanvasEditor = lazy(() => import('./pages/CanvasEditor'));
const UpiPayment = lazy(() => import('./pages/UpiPayment'));
const CsvImport = lazy(() => import('./pages/CsvImport'));
const BulkDownload = lazy(() => import('./pages/BulkDownload'));
const Employees = lazy(() => import('./pages/Employees'));
const TrialBalance = lazy(() => import('./pages/TrialBalance'));
const ProfitLoss = lazy(() => import('./pages/ProfitLoss'));
const FunnelReport = lazy(() => import('./pages/FunnelReport'));
const Forms = lazy(() => import('./pages/Forms'));
const FormResponses = lazy(() => import('./pages/FormResponses'));
const IDCardManager = lazy(() => import('./pages/IDCardManager'));
const IDCardStudentSelfEdit = lazy(() => import('./pages/IDCardStudentSelfEdit'));
const IDCardPrint = lazy(() => import('./pages/IDCardPrint'));

function PageLoader() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200 }}>
      <CircularProgress size={32} sx={{ color: '#075E54' }} />
    </Box>
  );
}

export default function App() {
  const isDesktop = !!window.electronAPI;
  const [setupDone, setSetupDone] = useState(true);

  useEffect(() => {
    if (!isDesktop) return;
    window.electronAPI.getConfig('remoteMongoUri').then(uri => {
      setSetupDone(!!uri);
    });
  }, [isDesktop]);

  return (
    <>
    {isDesktop && <DesktopSetup open={!setupDone} onComplete={() => setSetupDone(true)} />}
    {isDesktop && setupDone && <SyncStatusBar />}
    <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* ── Public ───────────────────────────────────────── */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Signup />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/upload" element={<ImageUploader />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:id" element={<ResetPassword />} />
      <Route path="/access/:token" element={<MagicLogin />} />
      <Route path="/f/:slug" element={<PublicForm />} />
      <Route path="/idcard-preview/:token" element={<IDCardStudentSelfEdit />} />

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
        <Route path="bulk-download" element={<FeatureGate module="bulk_download"><BulkDownload /></FeatureGate>} />
        <Route path="employees" element={<FeatureGate module="payroll"><Employees /></FeatureGate>} />
        <Route path="trial-balance" element={<TrialBalance />} />
        <Route path="profit-loss" element={<ProfitLoss />} />
        <Route path="funnel-report" element={<FeatureGate module="funnel"><FunnelReport /></FeatureGate>} />
        <Route path="forms" element={<FeatureGate module="forms"><Forms /></FeatureGate>} />
        <Route path="forms/:formId/responses" element={<FeatureGate module="forms"><FormResponses /></FeatureGate>} />
        <Route path="idcard" element={<FeatureGate module="idcard"><IDCardManager /></FeatureGate>} />
        <Route path="idcard/:projectUuid/print" element={<IDCardPrint />} />
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
