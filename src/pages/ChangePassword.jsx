import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import "./ChangePassword.css";

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  /* ============================= */
  /* CHANGE PASSWORD */
  /* ============================= */

  async function handleChangePassword(e) {
    e.preventDefault();

    setMessage("");

    /* CURRENT PASSWORD CHECK */

    if (!currentPassword.trim()) {
      setMessage("❌ Please enter your current password.");
      return;
    }

    /* NEW PASSWORD CHECK */

    if (password.length < 6) {
      setMessage("❌ New password must be at least 6 characters.");
      return;
    }

    /* SAME PASSWORD CHECK */

    if (currentPassword === password) {
      setMessage(
        "❌ Your new password cannot be the same as your current password."
      );
      return;
    }

    /* CONFIRM PASSWORD CHECK */

    if (password !== confirmPassword) {
      setMessage("❌ New passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      /* ============================= */
      /* GET CURRENT USER */
      /* ============================= */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Unable to find your account. Please login again."
        );
      }

      /* ============================= */
      /* VERIFY CURRENT PASSWORD */
      /* ============================= */

      const { error: verifyError } =
        await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

      if (verifyError) {
        setMessage("❌ Current password is incorrect.");
        setLoading(false);
        return;
      }

      /* ============================= */
      /* UPDATE PASSWORD */
      /* ============================= */

      const { error: updateError } =
        await supabase.auth.updateUser({
          password: password,
        });

      if (updateError) {
        throw updateError;
      }

      /* SUCCESS */

      setMessage("✅ Password updated successfully!");

      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");

    } catch (error) {
      console.error(error);

      setMessage(
        "❌ " + (error.message || "Something went wrong.")
      );
    }

    setLoading(false);
  }

  /* ============================= */
  /* MAIN RETURN */
  /* ============================= */

  return (
    <>
      <Navbar />

      <div className="change-password-page">

        <main className="change-password-main">

          <div className="change-password-card">

            {/* ICON */}

            <div className="change-form-icon">
              🔐
            </div>

            {/* TITLE */}

            <h1>
              Change Password
            </h1>

            <p className="change-form-subtitle">
              Verify your current password and create a new secure password.
            </p>

            {/* FORM */}

            <form onSubmit={handleChangePassword}>

              {/* ============================= */}
              {/* CURRENT PASSWORD */}
              {/* ============================= */}

              <div className="change-input-group">

                <label>
                  🔑 Current Password
                </label>

                <input
                  type="password"
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) =>
                    setCurrentPassword(e.target.value)
                  }
                  required
                />

              </div>


              {/* ============================= */}
              {/* NEW PASSWORD */}
              {/* ============================= */}

              <div className="change-input-group">

                <label>
                  🔒 New Password
                </label>

                <input
                  type="password"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                />

              </div>


              {/* ============================= */}
              {/* CONFIRM PASSWORD */}
              {/* ============================= */}

              <div className="change-input-group">

                <label>
                  🔐 Confirm New Password
                </label>

                <input
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  required
                />

              </div>


              {/* UPDATE BUTTON */}

              <button
                type="submit"
                className="change-primary-btn"
                disabled={loading}
              >
                {loading
                  ? "Updating..."
                  : "🔐 Update Password"}
              </button>

            </form>


            {/* MESSAGE */}

            {message && (
              <p className="change-message-text">
                {message}
              </p>
            )}


            {/* BACK BUTTONS */}

            <div className="change-back-buttons">

              <Link
                to="/profile"
                className="change-back-profile"
              >
                ← Back to Profile
              </Link>

              <Link
                to="/home"
                className="change-back-home"
              >
                🏠 Back to Home
              </Link>

            </div>

          </div>


          {/* FOOTER */}

          <footer className="change-password-footer">

            <p>
              © 2026 LPU FindIt. All rights reserved.
            </p>

          </footer>

        </main>

      </div>
    </>
  );
}

export default ChangePassword;