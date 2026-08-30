import { useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [isOtpScreen, setIsOtpScreen] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // LOGIN / SIGN UP
  const handleAuth = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password!");
      return;
    }

    if (!isLogin && (!fullName || !phone)) {
      alert("Please enter your full name and mobile number!");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        alert("Login successful! 🎉");
        navigate("/home");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
            },
          },
        });

        if (error) throw error;

        if (data.user && data.user.identities?.length === 0) {
          alert("This email is already registered. Please login.");
          setIsLogin(true);
          setPassword("");
          return;
        }

        alert("OTP sent to your email! 📧");

        setIsOtpScreen(true);
        setPassword("");
      }
    } catch (error) {
      alert(error.message);
    }

    setLoading(false);
  };

  // VERIFY OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp) {
      alert("Please enter the OTP!");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "signup",
      });

      if (error) throw error;

      alert("Email verified successfully! 🎉 Welcome!");

      navigate("/home");
    } catch (error) {
      alert(error.message);
    }

    setLoading(false);
  };

  // RESEND OTP
  const resendOtp = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) throw error;

      alert("New OTP sent! 📧");
    } catch (error) {
      alert(error.message);
    }

    setLoading(false);
  };

  // FORGOT PASSWORD
  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!email) {
      alert("Please enter your email address!");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password",
      });

      if (error) throw error;

      alert("Password reset link sent to your email! 📧");
    } catch (error) {
      alert(error.message);
    }

    setLoading(false);
  };

  // OTP SCREEN
  if (isOtpScreen) {
    return (
      <div className="login-page">
        <div className="login-container">
          <h1>Verify Email 📧</h1>

          <p>
            We sent an OTP to <strong>{email}</strong>
          </p>

          <form onSubmit={handleVerifyOtp}>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Verifying..." : "✅ Verify OTP"}
            </button>
          </form>

          <p className="switch-text">
            Didn't receive the OTP?

            <button
              type="button"
              className="switch-btn"
              onClick={resendOtp}
              disabled={loading}
            >
              {" "}
              Resend OTP
            </button>
          </p>

          <button
            type="button"
            className="switch-btn"
            onClick={() => {
              setIsOtpScreen(false);
              setOtp("");
              setEmail("");
              setPassword("");
              setFullName("");
              setPhone("");
              setIsLogin(false);
            }}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // FORGOT PASSWORD SCREEN
  if (isForgotPassword) {
    return (
      <div className="login-page">
        <div className="login-container">
          <h1>Reset Password 🔑</h1>

          <p>
            Enter your email and we'll send you a password reset link.
          </p>

          <form onSubmit={handleForgotPassword}>
            <input
              type="email"
              placeholder="📧 Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "📧 Send Reset Link"}
            </button>
          </form>

          <button
            type="button"
            className="switch-btn"
            onClick={() => {
              setIsForgotPassword(false);
              setEmail("");
            }}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    );
  }

  // LOGIN / SIGNUP SCREEN
  return (
    <div className="login-page">
      <div className="login-container">
        <h1>
          {isLogin ? "Welcome Back 👋" : "Create Account ✨"}
        </h1>

        <p>
          {isLogin
            ? "Login to manage your Lost & Found reports."
            : "Create an account to start using Lost & Found Portal."}
        </p>

        <form onSubmit={handleAuth}>
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="👤 Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <input
                type="tel"
                placeholder="📱 Enter your mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </>
          )}

          <input
            type="email"
            placeholder="📧 Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* PASSWORD WITH EYE BUTTON */}
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="🔐 Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              className="show-password-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "👁️" : "🙈"}
            </button>
          </div>

          {/* FORGOT PASSWORD */}
          {isLogin && (
            <div className="forgot-password">
              <button
                type="button"
                className="forgot-password-btn"
                onClick={() => setIsForgotPassword(true)}
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : isLogin
              ? "🔐 Login"
              : "✨ Sign Up"}
          </button>
        </form>

        <p className="switch-text">
          {isLogin
            ? "Don't have an account?"
            : "Already have an account?"}

          <button
            type="button"
            className="switch-btn"
            onClick={() => {
              setIsLogin(!isLogin);
              setEmail("");
              setPassword("");
              setFullName("");
              setPhone("");
              setShowPassword(false);
            }}
          >
            {isLogin ? " Sign Up" : " Login"}
          </button>
        </p>
        {isLogin && (
  <p className="admin-portal-link">
    👑 Are you an administrator?

    <button
      type="button"
      className="admin-login-btn"
      onClick={() => navigate("/admin-login")}
    >
      Admin Portal
    </button>
  </p>
)}
      </div>
    </div>
  );
}

export default Login;