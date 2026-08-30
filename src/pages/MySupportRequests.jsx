import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import "./MySupportRequests.css";

function MySupportRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupportRequests();
  }, []);

  const fetchSupportRequests = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("support_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) throw error;

      setRequests(data || []);

    } catch (error) {
      console.error(
        "Error loading support requests:",
        error
      );

      alert("Error: " + error.message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* SAME MENU + NOTIFICATION NAVBAR */}
      <Navbar />

      <div className="support-requests-page">

        <main className="support-requests-main">

          <section className="support-requests-card">

            {/* HEADER */}

            <div className="support-page-header">

              <div className="support-page-icon">
                📩
              </div>

              <h1>
                My Support Requests
              </h1>

              <p>
                View all the support requests you have submitted.
              </p>

            </div>


            {/* LOADING */}

            {loading ? (

              <div className="support-loading">

                <div className="support-spinner"></div>

                <p>
                  Loading your support requests...
                </p>

              </div>

            ) : requests.length === 0 ? (

              /* EMPTY STATE */

              <div className="empty-support">

                <div className="empty-icon">
                  📭
                </div>

                <h2>
                  No Support Requests Yet
                </h2>

                <p>
                  You haven't submitted any support requests yet.
                </p>

                <Link to="/help-support">

                  <button
                    type="button"
                    className="support-primary-btn"
                  >
                    🛠️ Get Help & Support
                  </button>

                </Link>

              </div>

            ) : (

              /* SUPPORT REQUESTS */

              <div className="support-requests-list">

                {requests.map((request) => (

                  <div
                    className="support-request-item"
                    key={request.id}
                  >

                    <div className="support-request-header">

                      <h3>
                        📝 {request.subject}
                      </h3>

                      <span className="request-status">
                        Open
                      </span>

                    </div>


                    <p className="support-request-message">
                      {request.message}
                    </p>


                    <div className="support-request-date">

                      📅 Submitted on{" "}

                      {new Date(
                        request.created_at
                      ).toLocaleString()}

                    </div>

                  </div>

                ))}

              </div>

            )}


            {/* BOTTOM ACTIONS */}

            <div className="support-page-actions">

              <Link
                to="/help-support"
                className="support-action-link"
              >

                <button
                  type="button"
                  className="support-secondary-btn"
                >
                  🛠️ Help & Support
                </button>

              </Link>


              <Link
                to="/home"
                className="support-action-link"
              >

                <button
                  type="button"
                  className="support-primary-btn"
                >
                  🏠 Back to Home
                </button>

              </Link>

            </div>

          </section>


          {/* FOOTER */}

          <footer className="support-requests-footer">

            © 2026 FindIt. All rights reserved.

          </footer>

        </main>

      </div>
    </>
  );
}

export default MySupportRequests;