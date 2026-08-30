import "./App.css";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";

import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import ReportLost from "./pages/ReportLost";
import ReportFound from "./pages/ReportFound";
import Reports from "./pages/Reports";
import ReportDetails from "./pages/ReportDetails";
import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";
import MySupportRequests from "./pages/MySupportRequests";
import HelpSupport from "./pages/HelpSupport";
import Messages from "./pages/Messages";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminHome from "./pages/AdminHome";

/* ============================= */
/* HOME PAGE */
/* ============================= */

function Home() {
  return (
    <>
      <Navbar />

      <div className="home-page">
        <main className="home-container">
          <div className="home-card">

            <h1>
              Lost & Found Portal <span>🔍</span>
            </h1>

            <p className="home-description">
              A simple platform for students to report lost items and help
              others find their belongings.
            </p>

            <div className="home-buttons">

              <Link to="/report-lost">
                <button className="home-btn lost-btn">
                  🔴 <span>Report Lost Item</span>
                </button>
              </Link>

              <Link to="/report-found">
                <button className="home-btn found-btn">
                  🟢 <span>Report Found Item</span>
                </button>
              </Link>

              <Link to="/reports">
                <button className="home-btn reports-btn">
                  📋 <span>View All Reports</span>
                </button>
              </Link>

              <Link to="/messages">
                <button className="home-btn messages-btn">
                  💬 <span>Private Messages</span>
                </button>
              </Link>

            </div>

          </div>
        </main>
      </div>
    </>
  );
}

/* ============================= */
/* MAIN APP */
/* ============================= */

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* DEFAULT → LOGIN */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* LOGIN */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* HOME */}
        <Route
          path="/home"
          element={<Home />}
        />

        {/* LOST ITEM */}
        <Route
          path="/report-lost"
          element={<ReportLost />}
        />

        {/* FOUND ITEM */}
        <Route
          path="/report-found"
          element={<ReportFound />}
        />

        {/* ALL REPORTS */}
        <Route
          path="/reports"
          element={<Reports />}
        />

        {/* REPORT DETAILS */}
        <Route
          path="/reports/:id"
          element={<ReportDetails />}
        />

        {/* PROFILE */}
        <Route
          path="/profile"
          element={<Profile />}
        />

        {/* CHANGE PASSWORD */}
        <Route
          path="/change-password"
          element={<ChangePassword />}
        />

        {/* HELP & SUPPORT */}
        <Route
          path="/help-support"
          element={<HelpSupport />}
        />

        {/* MY SUPPORT REQUESTS */}
        <Route
          path="/my-support-requests"
          element={<MySupportRequests />}
        />

        {/* PRIVATE MESSAGES */}
        <Route
          path="/messages"
          element={<Messages />}
        />

        {/* ADMIN LOGIN */}
        <Route
          path="/admin-login"
          element={<AdminLogin />}
        />

        {/* ADMIN DASHBOARD */}
        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

        {/* ADMIN HOME */}
        <Route
          path="/admin-home"
          element={<AdminHome />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;