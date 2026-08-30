import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import "./HelpSupport.css";

function HelpSupport() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      alert("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("Please login again.");
        return;
      }

      const { error } = await supabase
        .from("support_requests")
        .insert([
          {
            user_id: user.id,
            subject: subject,
            message: message,
          },
        ]);

      if (error) throw error;

      alert("Support request submitted successfully! ✅");

      setSubject("");
      setMessage("");

    } catch (error) {
      console.error(error);

      alert(
        "Error submitting request: " +
        error.message
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* SAME NAVBAR AS PROFILE */}
      <Navbar />

      <div className="help-support-page">

        <main className="help-support-main">

          <div className="help-support-card">

            <div className="help-support-icon">
              ❓
            </div>

            <h1>Help & Support</h1>

            <p className="help-support-subtitle">
              Tell us how we can help you
            </p>


            <form onSubmit={handleSubmit}>

              {/* SUBJECT */}

              <div className="help-support-field">

                <label>
                  📝 Subject
                </label>

                <input
                  type="text"
                  value={subject}
                  onChange={(e) =>
                    setSubject(e.target.value)
                  }
                  placeholder="Enter your issue subject"
                />

              </div>


              {/* MESSAGE */}

              <div className="help-support-field">

                <label>
                  💬 Describe Your Problem
                </label>

                <textarea
                  value={message}
                  onChange={(e) =>
                    setMessage(e.target.value)
                  }
                  placeholder="Explain your problem in detail..."
                  rows="6"
                />

              </div>


              {/* SUBMIT */}

              <button
                type="submit"
                className="help-support-btn"
                disabled={loading}
              >
                {loading
                  ? "Submitting..."
                  : "📩 Submit Request"}
              </button>

            </form>


            {/* BACK HOME */}

            <Link
              to="/home"
              className="help-support-back"
            >
              🏠 Back to Home
            </Link>

          </div>


          {/* FOOTER */}

          <footer className="help-support-footer">

            <p>
              © 2026 LPU FindIt. All rights reserved.
            </p>

          </footer>

        </main>

      </div>
    </>
  );
}

export default HelpSupport;