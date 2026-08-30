import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import "./ReportDetails.css";

function ReportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    getCurrentUser();
    fetchReport();
  }, [id]);

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setCurrentUser(user);
  };

  const fetchReport = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      setReport(null);
    } else {
      setReport(data);
    }

    setLoading(false);
  };

  const handleMessageOwner = () => {
    if (!report?.user_id) {
      alert("The owner information is not available for this report.");
      return;
    }

    navigate(
      `/messages?user=${report.user_id}&report=${report.id}`
    );
  };

  if (loading) {
    return (
      <div className="details-page">
        <div className="details-loading">
          <h2>Loading report... 🔍</h2>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="details-page">
        <div className="details-container">
          <div className="not-found-card">
            <h2>Report not found 😕</h2>

            <button
              className="back-button"
              onClick={() => navigate("/reports")}
            >
              ← Back to Reports
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isFound =
    report.type?.toLowerCase() === "found";

  const isOwnReport =
    currentUser &&
    report.user_id === currentUser.id;

  return (
    <div className="details-page">

      <div className="details-container">

        <button
          className="back-button"
          onClick={() => navigate("/reports")}
        >
          ← Back to Reports
        </button>

        <div
          className={`details-card ${
            isFound ? "found-card" : "lost-card"
          }`}
        >

          <div className="details-status">
            {isFound
              ? "🟢 FOUND ITEM"
              : "🔴 LOST ITEM"}
          </div>

          <h1>{report.item_name}</h1>

          {report.image_url && (
            <div className="details-image-container">
              <img
                src={report.image_url}
                alt={report.item_name || "Reported item"}
                className="details-image"
              />
            </div>
          )}

          <div className="details-info">

            <div className="info-row">
              <span>📍 Location</span>
              <p>{report.location || "Not available"}</p>
            </div>

            <div className="info-row">
              <span>📅 Date</span>
              <p>
                {report.report_date
                  ? new Date(
                      report.report_date + "T00:00:00"
                    ).toLocaleDateString()
                  : "Not available"}
              </p>
            </div>

            <div className="info-row">
              <span>📝 Description</span>
              <p>
                {report.description || "Not available"}
              </p>
            </div>

          </div>

          {!isOwnReport && report.user_id && (

            <div className="message-owner-section">

              <div className="message-owner-icon">
                💬
              </div>

              <h3>Interested in this item?</h3>

              <p>
                Contact the person who posted this item
                privately through LPU FindIt.
              </p>

              <button
                className="message-owner-button"
                onClick={handleMessageOwner}
              >
                💬 Message Owner
              </button>

            </div>

          )}

          {isOwnReport && (
            <div className="your-report-section">
              👤 This is your report
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

export default ReportDetails;