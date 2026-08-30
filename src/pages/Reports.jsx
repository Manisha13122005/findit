import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import "./Report.css";

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [user, setUser] = useState(null);

  const [reportToDelete, setReportToDelete] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    getUser();
    fetchReports();
  }, []);

  // =============================
  // GET CURRENT USER
  // =============================

  async function getUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);
  }

  // =============================
  // FETCH REPORTS
  // =============================

  async function fetchReports() {
    setLoading(true);

    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert(error.message);
    } else {
      setReports(data || []);
    }

    setLoading(false);
  }

  // =============================
  // DELETE REPORT
  // =============================

  async function handleDeleteReport() {
    if (!reportToDelete || !user) return;

    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", reportToDelete.id)
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      alert("Could not delete the report: " + error.message);
      return;
    }

    setReports((currentReports) =>
      currentReports.filter(
        (item) => item.id !== reportToDelete.id
      )
    );

    setReportToDelete(null);
  }

  // =============================
  // MESSAGE OWNER
  // =============================

  const handleMessageOwner = (report) => {
    if (!report.user_id) {
      alert("This report does not have an owner connected yet.");
      return;
    }

    if (user && report.user_id === user.id) {
      return;
    }

    navigate(
      `/messages?user=${report.user_id}&report=${report.id}`
    );
  };

  // =============================
  // FILTER REPORTS
  // =============================

  const filteredReports = reports.filter((report) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      report.item_name
        ?.toLowerCase()
        .includes(searchText) ||
      report.location
        ?.toLowerCase()
        .includes(searchText) ||
      report.description
        ?.toLowerCase()
        .includes(searchText);

    const matchesFilter =
      filter === "all" ||
      report.type?.toLowerCase() === filter;

    return matchesSearch && matchesFilter;
  });

  // =============================
  // LOADING
  // =============================

  if (loading) {
    return (
      <div className="lf-reports-page">
        <div className="lf-reports-loading">
          <h2>Loading reports... 🔍</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="lf-reports-page">

      <div className="lf-reports-container">

        {/* BACK BUTTON */}

        <button
          onClick={() => navigate("/home")}
          className="lf-back-home-btn"
        >
          🏠 Back to Home
        </button>


        {/* HEADER */}

        <div className="lf-reports-header">

          <div>
            <h1>Lost & Found Reports 📋</h1>

            <p>
              Browse recently reported items on campus.
            </p>
          </div>

          <div className="lf-reports-count">
            {filteredReports.length} Reports
          </div>

        </div>


        {/* SEARCH */}

        <div className="lf-search-container">

          <input
            type="text"
            placeholder="🔍 Search by item, location or description..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            className="lf-search-input"
          />

        </div>


        {/* FILTERS */}

        <div className="lf-filter-buttons">

          <button
            className={
              filter === "all"
                ? "lf-filter-btn lf-active-all"
                : "lf-filter-btn"
            }
            onClick={() => setFilter("all")}
          >
            📋 All
          </button>


          <button
            className={
              filter === "lost"
                ? "lf-filter-btn lf-lost-filter lf-active-lost"
                : "lf-filter-btn lf-lost-filter"
            }
            onClick={() => setFilter("lost")}
          >
            🔴 Lost
          </button>


          <button
            className={
              filter === "found"
                ? "lf-filter-btn lf-found-filter lf-active-found"
                : "lf-filter-btn lf-found-filter"
            }
            onClick={() => setFilter("found")}
          >
            🟢 Found
          </button>

        </div>


        {/* REPORT CARDS */}

        {filteredReports.length > 0 ? (

          <div className="lf-reports-grid">

            {filteredReports.map((report) => {

              const isFound =
                report.type?.toLowerCase() === "found";

              const isOwner =
                user &&
                report.user_id === user.id;

              return (

                <div
                  key={report.id}
                  className="lf-report-card"
                >

                  {/* IMAGE ONLY IF UPLOADED */}

                  {report.image_url ? (

                    <img
                      src={report.image_url}
                      alt={report.item_name || "Reported item"}
                      className="lf-report-image"
                    />

                  ) : null}


                  {/* CARD CONTENT */}

                  <div className="lf-card-content">


                    {/* STATUS */}

                    <div className="lf-card-top">

                      <span
                        className={
                          isFound
                            ? "lf-status-badge lf-found-badge"
                            : "lf-status-badge lf-lost-badge"
                        }
                      >
                        {isFound
                          ? "🟢 FOUND"
                          : "🔴 LOST"}
                      </span>

                      <span className="lf-report-id">
                        #{report.id}
                      </span>

                    </div>


                    {/* ITEM NAME */}

                    <h2 className="lf-item-name">
                      {report.item_name}
                    </h2>


                    {/* INFO */}

                    <div className="lf-report-info">

                      <p>
                        📍 {report.location}
                      </p>

                      <p>
                        📅 {report.report_date}
                      </p>

                    </div>


                    {/* DESCRIPTION */}

                    {report.description && (

                      <p className="lf-report-description">
                        {report.description}
                      </p>

                    )}


                    {/* BUTTONS */}

                    <div className="lf-card-buttons">

                      <button
                        className="lf-details-btn"
                        onClick={() =>
                          navigate(`/reports/${report.id}`)
                        }
                      >
                        View Details →
                      </button>


                      {isOwner ? (

                        <button
                          className="lf-delete-btn"
                          onClick={() =>
                            setReportToDelete(report)
                          }
                        >
                          🗑️ Delete My Item
                        </button>

                      ) : (

                        <button
                          className="lf-message-btn"
                          onClick={() =>
                            handleMessageOwner(report)
                          }
                        >
                          💬 Message Owner
                        </button>

                      )}

                    </div>

                  </div>

                </div>

              );

            })}

          </div>

        ) : (

          <div className="lf-no-reports">

            <h2>No Matching Reports 😕</h2>

            <p>
              Try searching for something else or changing
              the filter.
            </p>

          </div>

        )}

      </div>


      {/* DELETE MODAL */}

      {reportToDelete && (

        <div className="delete-modal-overlay">

          <div className="delete-modal">

            <div className="delete-modal-icon">
              🗑️
            </div>

            <h2>Delete Report?</h2>

            <p>

              Are you sure you want to delete this item?

              <br />

              <strong className="delete-item-name">
                {reportToDelete.item_name || "Item"}
              </strong>

              <br />

              This action cannot be undone.

            </p>


            <div className="delete-modal-buttons">

              <button
                className="cancel-delete-btn"
                onClick={() =>
                  setReportToDelete(null)
                }
              >
                Cancel
              </button>


              <button
                className="confirm-delete-btn"
                onClick={handleDeleteReport}
              >
                🗑️ Delete
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Reports;