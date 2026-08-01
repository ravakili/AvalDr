import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuthStore } from "./store/authStore";

// Onboarding
import PWAInstallGuide from "./pages/onboarding/PWAInstallGuide";
import WelcomeSlides from "./pages/onboarding/WelcomeSlides";

// Auth
import Login from "./pages/auth/Login";
import OTPVerification from "./pages/auth/OTPVerification";
import ProfileCompletion from "./pages/auth/ProfileCompletion";

// Shared layout
import DashboardLayout from "./components/layout/DashboardLayout";

// User pages
import UserHome from "./pages/user/UserHome";
import FindDoctors from "./pages/user/FindDoctors";
import BookAppointment from "./pages/user/BookAppointment";
import MyAppointments from "./pages/user/MyAppointments";
import UserProfile from "./pages/user/UserProfile";
import PaymentCallback from "./pages/user/PaymentCallback";

// Chat pages
import ChatPage from "./pages/chat/ChatPage";
import ChatInbox from "./pages/chat/ChatInbox";

// Doctor pages
import DoctorOverview from "./pages/doctor/DoctorOverview";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import PatientManagement from "./pages/doctor/PatientManagement";
import DoctorProfile from "./pages/doctor/DoctorProfile";

// Admin pages
import AdminOverview from "./pages/admin/AdminOverview";
import ManageDoctors from "./pages/admin/ManageDoctors";
import ManageUsers from "./pages/admin/ManageUsers";
import AdminDefinitions from "./pages/admin/AdminDefinitions";
import AppointmentLogs from "./pages/admin/AppointmentLogs";
import WithdrawalRequests from "./pages/admin/WithdrawalRequests";
import SystemSettings from "./pages/admin/SystemSettings";

function OnboardingGuard() {
  const user = useAuthStore((s) => s.user);
  const pwaSeen = localStorage.getItem("AvalDr-pwa-seen");
  const onboardingDone = localStorage.getItem("AvalDr-onboarding-done");

  if (user) {
    const home =
      user.role === "admin"
        ? "/admin"
        : user.role === "doctor"
          ? "/doctor"
          : "/user";
    return <Navigate to={home} replace />;
  }

  if (!pwaSeen) return <PWAInstallGuide />;
  if (!onboardingDone) return <WelcomeSlides />;
  return <Login />;
}

function RootRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  const home =
    user.role === "admin"
      ? "/admin"
      : user.role === "doctor"
        ? "/doctor"
        : "/user";
  return <Navigate to={home} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<OnboardingGuard />} />
      <Route path="/pwa-install" element={<PWAInstallGuide />} />
      <Route path="/onboarding" element={<WelcomeSlides />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verify-otp" element={<OTPVerification />} />
      <Route path="/complete-profile" element={<ProfileCompletion />} />
      <Route
        path="/payment/callback"
        element={
          <ProtectedRoute allow={["user"]}>
            <PaymentCallback />
          </ProtectedRoute>
        }
      />

      {/* Patient */}
      <Route
        path="/user"
        element={
          <ProtectedRoute allow={["user"]}>
            <DashboardLayout role="user" />
          </ProtectedRoute>
        }
      >
        <Route index element={<UserHome />} />
        <Route path="doctors" element={<FindDoctors />} />
        <Route path="book/:doctorId" element={<BookAppointment />} />
        <Route path="appointments" element={<MyAppointments />} />
        <Route path="consult" element={<ChatInbox />} />
        <Route path="consult/:appointmentId" element={<ChatPage />} />
        <Route path="profile" element={<UserProfile />} />
      </Route>

      {/* Doctor */}
      <Route
        path="/doctor"
        element={
          <ProtectedRoute allow={["doctor"]}>
            <DashboardLayout role="doctor" />
          </ProtectedRoute>
        }
      >
        <Route index element={<DoctorOverview />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route path="consult" element={<ChatInbox />} />
        <Route path="consult/:appointmentId" element={<ChatPage />} />
        <Route path="patients" element={<PatientManagement />} />
        <Route path="profile" element={<DoctorProfile />} />
      </Route>

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allow={["admin"]}>
            <DashboardLayout role="admin" />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="doctors" element={<ManageDoctors />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="definitions" element={<AdminDefinitions />} />
        <Route path="logs" element={<AppointmentLogs />} />
        <Route path="withdrawals" element={<WithdrawalRequests />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="consult" element={<ChatInbox />} />
        <Route path="consult/:appointmentId" element={<ChatPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
