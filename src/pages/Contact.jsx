import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";

function Contact() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      setLoading(false);
    }

    getUser();
  }, []);

  const name =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "LPU Student";

  const phone =
    user?.user_metadata?.phone ||
    "Mobile number not available";

  const email = user?.email || "Email not available";

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="loading-text">
          Loading contact details...
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="contact-card">

        <div className="contact-icon">
          📞
        </div>

        <h1>Contact Details</h1>

        <p className="contact-subtitle">
          Your private contact information and portal support.
        </p>


        {/* MY CONTACT DETAILS */}

        <div className="contact-section-title">
          👤 My Contact Information
        </div>

        <div className="contact-details">

          <div className="contact-item">
            <div className="contact-emoji">👤</div>

            <div>
              <h3>Full Name</h3>
              <p>{name}</p>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-emoji">📧</div>

            <div>
              <h3>Email Address</h3>
              <p>{email}</p>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-emoji">📱</div>

            <div>
              <h3>Mobile Number 🔒</h3>
              <p>{phone}</p>
            </div>
          </div>

        </div>


        {/* PORTAL SUPPORT */}

        <div className="contact-section-title support-title">
          🛠️ Portal Support
        </div>

        <div className="contact-details">

          <div className="contact-item">
            <div className="contact-emoji">📧</div>

            <div>
              <h3>Email Support</h3>
              <p>support@lpufindit.com</p>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-emoji">🏫</div>

            <div>
              <h3>University</h3>
              <p>Lovely Professional University</p>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-emoji">📍</div>

            <div>
              <h3>Address</h3>

              <p>
                Jalandhar-Delhi G.T. Road,<br />
                Phagwara, Punjab 144411,<br />
                India
              </p>
            </div>
          </div>

        </div>


        <div className="contact-support">
          🔒 Your mobile number is private and will not be shown publicly
          on Lost & Found reports.
        </div>


        <div className="contact-buttons">

          <Link to="/profile">
            <button className="secondary-btn">
              ← Back to Profile
            </button>
          </Link>

          <Link to="/home">
            <button className="primary-btn">
              🏠 Back to Home
            </button>
          </Link>

        </div>

      </div>
    </div>
  );
}

export default Contact;