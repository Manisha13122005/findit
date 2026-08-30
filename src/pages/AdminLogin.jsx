import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password!");
      return;
    }

    setLoading(true);

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) throw error;

      const user = data.user;

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

      if (profileError) throw profileError;

      if (!profile?.is_admin) {
        await supabase.auth.signOut();

        alert("Access denied! You are not an administrator.");
        return;
      }

      alert("Welcome Admin 👑");

      // Admin goes directly to the main portal
      navigate("/home");

    } catch (error) {
      alert(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="login-page">

      <div className="login-container">

        <h1>Admin Portal 👑</h1>

        <p>
          Login to access the FindIt Admin Dashboard.
        </p>

        <form onSubmit={handleAdminLogin}>

          <input
            type="email"
            placeholder="📧 Enter admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="password-wrapper">

            <input
              type={showPassword ? "text" : "password"}
              placeholder="🔐 Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              className="show-password-btn"
              onClick={() =>
                setShowPassword(!showPassword)
              }
            >
              {showPassword ? "👁️" : "🙈"}
            </button>

          </div>

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Checking..."
              : "👑 Login as Admin"}
          </button>

        </form>

        <p className="switch-text">

          Not an administrator?

          <button
            type="button"
            className="switch-btn"
            onClick={() => navigate("/login")}
          >
            Student Login
          </button>

        </p>

      </div>

    </div>
  );
}

export default AdminLogin;