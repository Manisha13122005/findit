import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import "./Profile.css";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    registration_number: "",
    department: "",
    semester: "",
  });

  useEffect(() => {
    getUserAndProfile();
  }, []);


  /* ============================= */
  /* GET USER AND PROFILE */
  /* ============================= */

  const getUserAndProfile = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        navigate("/login");
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Profile error:", error);
      }

      if (data) {
        setProfile({
          full_name:
            data.full_name ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            "",

          phone: data.phone || "",

          registration_number:
            data.registration_number || "",

          department: data.department || "",

          semester: data.semester || "",
        });
      } else {
        setProfile({
          full_name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            "",

          phone: "",
          registration_number: "",
          department: "",
          semester: "",
        });
      }

    } catch (error) {
      console.error("Error loading profile:", error);

    } finally {
      setLoading(false);
    }
  };


  /* ============================= */
  /* HANDLE INPUT CHANGE */
  /* ============================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));
  };


  /* ============================= */
  /* SAVE PROFILE */
  /* ============================= */

  const saveProfile = async (e) => {
    e.preventDefault();

    if (!user) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,

            full_name: profile.full_name,

            phone: profile.phone,

            registration_number:
              profile.registration_number,

            department:
              profile.department,

            semester:
              profile.semester,
          },
          {
            onConflict: "id",
          }
        );

      if (error) throw error;

      alert("Profile updated successfully! ✅");

    } catch (error) {
      console.error("Save error:", error);

      alert(
        "Error updating profile: " +
        error.message
      );

    } finally {
      setSaving(false);
    }
  };


  /* ============================= */
  /* LOADING */
  /* ============================= */

  if (loading) {
    return (
      <>
        <Navbar />

        <div className="profile-loading-page">
          <div className="loading-spinner"></div>

          <p>Loading your profile...</p>
        </div>
      </>
    );
  }


  const email = user?.email || "Not available";

  const createdDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString()
    : "Not available";


  /* ============================= */
  /* MAIN RETURN */
  /* ============================= */

  return (
    <>
      <Navbar />

      <div className="profile-page">

        <main className="profile-main">

          <div className="profile-card">


            {/* PROFILE AVATAR */}

            <div className="profile-avatar">
              👤
            </div>


            <h1>My Profile</h1>

            <p className="profile-subtitle">
              Manage your personal details
            </p>


            <form onSubmit={saveProfile}>


              {/* FULL NAME */}

              <div className="profile-field">

                <label>
                  👤 Full Name
                </label>

                <input
                  type="text"
                  name="full_name"
                  value={profile.full_name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />

              </div>


              {/* EMAIL */}

              <div className="profile-field">

                <label>
                  📧 Email
                </label>

                <div className="readonly-value">
                  {email}
                </div>

              </div>


              {/* PHONE */}

              <div className="profile-field">

                <label>
                  📱 Phone Number
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                />

              </div>


              {/* REGISTRATION NUMBER */}

              <div className="profile-field">

                <label>
                  🎓 Registration Number
                </label>

                <input
                  type="text"
                  name="registration_number"
                  value={profile.registration_number}
                  onChange={handleChange}
                  placeholder="Enter registration number"
                />

              </div>


              {/* DEPARTMENT */}

              <div className="profile-field">

                <label>
                  🏛️ Department
                </label>

                <input
                  type="text"
                  name="department"
                  value={profile.department}
                  onChange={handleChange}
                  placeholder="Example: Computer Science"
                />

              </div>


              {/* SEMESTER */}

              <div className="profile-field">

                <label>
                  📚 Semester
                </label>

                <input
                  type="text"
                  name="semester"
                  value={profile.semester}
                  onChange={handleChange}
                  placeholder="Example: Semester 3"
                />

              </div>


              {/* UNIVERSITY */}

              <div className="profile-field">

                <label>
                  🏫 University
                </label>

                <div className="readonly-value">
                  Lovely Professional University
                </div>

              </div>


              {/* ACCOUNT CREATED */}

              <div className="profile-field">

                <label>
                  📅 Account Created
                </label>

                <div className="readonly-value">
                  {createdDate}
                </div>

              </div>


              {/* SAVE BUTTON */}

              <div className="save-button-container">

                <button
                  type="submit"
                  className="save-profile-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "💾 Save Profile"}
                </button>

              </div>

            </form>


            {/* ONLY CHANGE PASSWORD */}

            <div className="profile-actions">

              <Link to="/change-password">

                <button>
                  🔐 Change Password
                </button>

              </Link>

            </div>


            {/* BACK HOME */}

            <Link
              to="/home"
              className="profile-back-home"
            >
              🏠 Back to Home
            </Link>


          </div>


          {/* FOOTER */}

          <footer className="profile-footer">

            <strong>
              Lovely Professional University
            </strong>

            <p>
              © 2026 LPU FindIt. All rights reserved.
            </p>

          </footer>

        </main>

      </div>
    </>
  );
}

export default Profile;