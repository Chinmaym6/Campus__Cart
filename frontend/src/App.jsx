import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Verify from "./pages/Verify";
import ForgotPassword from "./pages/ForgotPassword";
import EnterOTP from "./pages/EnterOTP";
import ResetPassword from "./pages/ResetPassword";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import VerifyEmailChange from "./pages/VerifyEmailChange";
import CreateListing from "./pages/CreateListing";
import AllDrafts from "./pages/AllDrafts";
import AllListings from "./pages/AllListings";
import Marketplace from "./pages/Marketplace";
import ItemDetails from "./pages/ItemDetails";
import PublicProfile from "./pages/PublicProfile";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && location.pathname === "/") {
      navigate("/dashboard");
    }
  }, [navigate, location.pathname]);

  return (
    <div className="app">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/login"
            element={<Navigate to="/auth" state={{ mode: "login" }} replace />}
          />
          <Route
            path="/register"
            element={
              <Navigate to="/auth" state={{ mode: "register" }} replace />
            }
          />
          <Route path="/auth" element={<Auth />} />
          <Route path="/verify/:token" element={<Verify />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/enter-otp" element={<EnterOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/create-listing" element={<CreateListing />} />
          <Route path="/all-drafts" element={<AllDrafts />} />
          <Route path="/all-listings" element={<AllListings />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/browse" element={<Marketplace />} />
          <Route path="/item/:id" element={<ItemDetails />} />
          <Route path="/user/:userId" element={<PublicProfile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:conversationId" element={<Chat />} />
          <Route
            path="/verify-email-change/:token"
            element={<VerifyEmailChange />}
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </Router>
  );
}

export default App;
