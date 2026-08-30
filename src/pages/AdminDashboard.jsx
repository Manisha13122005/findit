import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [supportRequests, setSupportRequests] = useState([]);
  const [profiles, setProfiles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [userSearch, setUserSearch] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);

  const [deleteModal, setDeleteModal] = useState({
    show: false,
    type: null,
    id: null,
  });

  const navigate = useNavigate();


  /* ============================= */
  /* CHECK ADMIN */
  /* ============================= */

  useEffect(() => {
    checkAdmin();
  }, []);


  const checkAdmin = async () => {
    try {

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();


      if (userError || !user) {
        navigate("/login");
        return;
      }


      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();


      if (profileError) {
        console.error("Profile error:", profileError);
        navigate("/home");
        return;
      }


      if (!profile?.is_admin) {
        alert("Access denied! Admins only.");
        navigate("/home");
        return;
      }


      setIsAdmin(true);

      await loadAdminData();

    } catch (error) {

      console.error("Admin error:", error);

      navigate("/home");

    } finally {

      setLoading(false);

    }
  };


  /* ============================= */
  /* LOAD ADMIN DATA */
  /* ============================= */

  const loadAdminData = async () => {
    try {

      /* REPORTS */

      const {
        data: reportsData,
        error: reportsError,
      } = await supabase
        .from("reports")
        .select("*");


      if (reportsError) {

        console.error(
          "Reports error:",
          reportsError.message
        );

      } else {

        const sortedReports =
          [...(reportsData || [])].sort(
            (a, b) =>
              new Date(b.created_at || 0) -
              new Date(a.created_at || 0)
          );

        setReports(sortedReports);

      }


      /* SUPPORT REQUESTS */

      const {
        data: supportData,
        error: supportError,
      } = await supabase
        .from("support_requests")
        .select("*");


      if (supportError) {

        console.error(
          "Support request error:",
          supportError.message
        );

      } else {

        const sortedSupportRequests =
          [...(supportData || [])].sort(
            (a, b) =>
              new Date(b.created_at || 0) -
              new Date(a.created_at || 0)
          );

        setSupportRequests(
          sortedSupportRequests
        );

      }


      /* PROFILES */

      const {
        data: profilesData,
        error: profilesError,
      } = await supabase
        .from("profiles")
        .select("*");


      if (profilesError) {

        console.error(
          "Profiles error:",
          profilesError.message
        );

      } else {

        setProfiles(profilesData || []);

      }

    } catch (error) {

      console.error(
        "Error loading admin data:",
        error
      );

    }
  };


  /* ============================= */
  /* DELETE MODAL */
  /* ============================= */

  const deleteReport = (reportId) => {

    setDeleteModal({
      show: true,
      type: "report",
      id: reportId,
    });

  };


  const deleteSupportRequest = (requestId) => {

    setDeleteModal({
      show: true,
      type: "support",
      id: requestId,
    });

  };


  const cancelDelete = () => {

    setDeleteModal({
      show: false,
      type: null,
      id: null,
    });

  };


  /* ============================= */
  /* CONFIRM DELETE */
  /* ============================= */

  const confirmDelete = async () => {

    try {

      if (deleteModal.type === "report") {

        const { error } = await supabase
          .from("reports")
          .delete()
          .eq("id", deleteModal.id);


        if (error) throw error;


        setReports((current) =>
          current.filter(
            (report) =>
              report.id !== deleteModal.id
          )
        );

      }


      if (deleteModal.type === "support") {

        const { error } = await supabase
          .from("support_requests")
          .delete()
          .eq("id", deleteModal.id);


        if (error) throw error;


        setSupportRequests((current) =>
          current.filter(
            (request) =>
              request.id !== deleteModal.id
          )
        );

      }


      cancelDelete();

    } catch (error) {

      console.error(
        "Delete error:",
        error
      );

      alert(
        "Error deleting: " +
        error.message
      );

    }
  };


  /* ============================= */
  /* USER SEARCH */
  /* ============================= */

  const filteredUsers = profiles.filter((profile) => {

    const searchText =
      userSearch.toLowerCase();

    return (

      profile.full_name
        ?.toLowerCase()
        .includes(searchText)

      ||

      profile.registration_number
        ?.toLowerCase()
        .includes(searchText)

      ||

      profile.department
        ?.toLowerCase()
        .includes(searchText)

      ||

      profile.phone
        ?.toLowerCase()
        .includes(searchText)

    );

  });


  /* ============================= */
  /* LOADING */
  /* ============================= */

  if (loading) {

    return (

      <div className="admin-page">

        <div className="admin-loading">
          👑 Loading Admin Dashboard...
        </div>

      </div>

    );

  }


  if (!isAdmin) {
    return null;
  }


  /* ============================= */
  /* MAIN UI */
  /* ============================= */

  return (

    <div className="admin-page">

      <div className="admin-container">


        {/* ================= HEADER ================= */}

        <div className="admin-header">

          <div>

            <div className="admin-crown">
              👑
            </div>

            <h1>
              Admin Dashboard
            </h1>

            <p>
              Welcome to the  FindIt control center.
            </p>

          </div>


          <button
            className="admin-home-btn"
            onClick={() => navigate("/home")}
          >
            🏠 Go to User Portal
          </button>

        </div>


        {/* ================= STATS ================= */}

        <div className="admin-stats">


          <div className="admin-stat-card">

            <div className="stat-icon">
              📋
            </div>

            <div>

              <h2>
                {reports.length}
              </h2>

              <p>
                Total Reports
              </p>

            </div>

          </div>


          <div className="admin-stat-card">

            <div className="stat-icon">
              📩
            </div>

            <div>

              <h2>
                {supportRequests.length}
              </h2>

              <p>
                Support Requests
              </p>

            </div>

          </div>


          <div className="admin-stat-card">

            <div className="stat-icon">
              👥
            </div>

            <div>

              <h2>
                {profiles.length}
              </h2>

              <p>
                Registered Users
              </p>

            </div>

          </div>


        </div>


        {/* ================= REPORTS ================= */}

        <div className="admin-section">


          <div className="admin-section-title">

            <h2>
              📋 Manage Reports
            </h2>

            <span>
              {reports.length}
            </span>

          </div>


          {reports.length === 0 ? (

            <p className="admin-empty">
              No reports available.
            </p>

          ) : (

            <div className="admin-table-wrapper">

              <table className="admin-table">

                <thead>

                  <tr>

                    <th>
                      Item
                    </th>

                    <th>
                      Type
                    </th>

                    <th>
                      Location
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {reports.map((report) => (

                    <tr key={report.id}>


                      <td>
                        {report.item_name ||
                          "Unnamed Item"}
                      </td>


                      <td>
                        {report.type ||
                          "Unknown"}
                      </td>


                      <td>
                        {report.location ||
                          "Not provided"}
                      </td>


                      <td>

                        {report.created_at

                          ? new Date(
                              report.created_at
                            ).toLocaleDateString()

                          : "Not available"

                        }

                      </td>


                      <td>

                        <button
                          className="delete-btn"
                          onClick={() =>
                            deleteReport(report.id)
                          }
                        >
                          🗑️ Delete
                        </button>

                      </td>


                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>


        {/* ================= SUPPORT ================= */}

        <div className="admin-section">


          <div className="admin-section-title">

            <h2>
              📩 Support Requests
            </h2>

            <span>
              {supportRequests.length}
            </span>

          </div>


          {supportRequests.length === 0 ? (

            <p className="admin-empty">
              No support requests yet.
            </p>

          ) : (

            <div className="support-list">

              {supportRequests.map((request) => (

                <div
                  className="admin-support-card"
                  key={request.id}
                >


                  <div className="support-info">

                    <h3>

                      {request.subject ||
                        "Support Request"}

                    </h3>


                    <p>

                      {request.message ||
                        request.description ||
                        "No message provided"}

                    </p>


                    {request.email && (

                      <p>
                        📧 {request.email}
                      </p>

                    )}


                    <small>

                      {request.created_at

                        ? new Date(
                            request.created_at
                          ).toLocaleString()

                        : ""

                      }

                    </small>

                  </div>


                  <button
                    className="delete-btn"
                    onClick={() =>
                      deleteSupportRequest(
                        request.id
                      )
                    }
                  >
                    🗑️ Delete
                  </button>


                </div>

              ))}

            </div>

          )}

        </div>


        {/* ================= USERS ================= */}

        <div className="admin-section">


          <div className="admin-users-header">

            <div>

              <h2>
                👥 Registered Users
              </h2>

              <p>
                View and manage all registered users.
              </p>

            </div>


            <span className="users-count">
              {profiles.length}
            </span>

          </div>


          {/* SEARCH */}

          <div className="admin-user-search">

            <span>
              🔍
            </span>

            <input
              type="text"
              placeholder="Search by name, registration number, department or phone..."
              value={userSearch}
              onChange={(e) =>
                setUserSearch(e.target.value)
              }
            />

          </div>


          {/* USERS LIST */}

          {filteredUsers.length === 0 ? (

            <p className="admin-empty">
              No users found.
            </p>

          ) : (

            <div className="admin-users-list">


              {filteredUsers.map((profile) => (

                <div
                  className="admin-user-card"
                  key={profile.id}
                >


                  <div className="admin-user-top">


                    <div className="admin-user-avatar">
                      👤
                    </div>


                    <div className="admin-user-basic">

                      <h3>

                        {profile.full_name ||
                          profile.name ||
                          "LPU Student"}

                      </h3>


                      <p>

                        {profile.is_admin

                          ? "👑 Administrator"

                          : "🎓 Student"

                        }

                      </p>

                    </div>


                  </div>


                  <div className="admin-user-preview">

                    <p>

                      🎓 {profile.registration_number ||
                        "Registration number not added"}

                    </p>


                    <p>

                      🏛️ {profile.department ||
                        "Department not added"}

                    </p>

                  </div>


                  <button
                    className="view-user-btn"
                    onClick={() =>
                      setSelectedUser(profile)
                    }
                  >
                    👁️ View Full Details
                  </button>


                </div>

              ))}


            </div>

          )}

        </div>


      </div>


      {/* ================= USER DETAILS MODAL ================= */}

      {selectedUser && (

        <div
          className="user-modal-overlay"
          onClick={() =>
            setSelectedUser(null)
          }
        >

          <div
            className="user-details-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >


            <button
              className="user-modal-close"
              onClick={() =>
                setSelectedUser(null)
              }
            >
              ✕
            </button>


            <div className="user-modal-header">

              <div className="user-modal-avatar">
                👤
              </div>


              <div>

                <h2>

                  {selectedUser.full_name ||
                    selectedUser.name ||
                    "LPU Student"}

                </h2>


                <p>

                  {selectedUser.is_admin

                    ? "👑 Administrator"

                    : "🎓 Student"

                  }

                </p>

              </div>

            </div>


            <div className="user-details-list">


              <div className="user-detail-item">

                <span>
                  👤
                </span>

                <div>

                  <small>
                    Full Name
                  </small>

                  <p>
                    {selectedUser.full_name ||
                      "Not provided"}
                  </p>

                </div>

              </div>


              <div className="user-detail-item">

                <span>
                  📱
                </span>

                <div>

                  <small>
                    Phone Number
                  </small>

                  <p>
                    {selectedUser.phone ||
                      "Not provided"}
                  </p>

                </div>

              </div>


              <div className="user-detail-item">

                <span>
                  🎓
                </span>

                <div>

                  <small>
                    Registration Number
                  </small>

                  <p>
                    {selectedUser.registration_number ||
                      "Not provided"}
                  </p>

                </div>

              </div>


              <div className="user-detail-item">

                <span>
                  🏛️
                </span>

                <div>

                  <small>
                    Department
                  </small>

                  <p>
                    {selectedUser.department ||
                      "Not provided"}
                  </p>

                </div>

              </div>


              <div className="user-detail-item">

                <span>
                  📚
                </span>

                <div>

                  <small>
                    Semester
                  </small>

                  <p>
                    {selectedUser.semester ||
                      "Not provided"}
                  </p>

                </div>

              </div>


              <div className="user-detail-item">

                <span>
                  🏫
                </span>

                <div>

                  <small>
                    University
                  </small>

                  <p>
                    Lovely Professional University
                  </p>

                </div>

              </div>


              <div className="user-detail-item">

                <span>
                  🆔
                </span>

                <div>

                  <small>
                    User ID
                  </small>

                  <p className="user-id">
                    {selectedUser.id}
                  </p>

                </div>

              </div>


            </div>


            <button
              className="close-details-btn"
              onClick={() =>
                setSelectedUser(null)
              }
            >
              Close
            </button>


          </div>

        </div>

      )}


      {/* ================= DELETE MODAL ================= */}

      {deleteModal.show && (

        <div className="delete-modal-overlay">

          <div className="delete-modal">


            <div className="delete-modal-icon">
              🗑️
            </div>


            <h2>
              Delete Confirmation
            </h2>


            <p>

              Are you sure you want to delete this{" "}

              {deleteModal.type === "report"

                ? "report"

                : "support request"

              }

              ?

            </p>


            <div className="delete-modal-buttons">


              <button
                className="cancel-delete-btn"
                onClick={cancelDelete}
              >
                Cancel
              </button>


              <button
                className="confirm-delete-btn"
                onClick={confirmDelete}
              >
                🗑️ Yes, Delete
              </button>


            </div>


          </div>

        </div>

      )}


    </div>

  );
}

export default AdminDashboard;