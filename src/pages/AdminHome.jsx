import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./AdminHome.css";

function AdminHome() {
  return (
    <>
      {/* SAME NAVBAR AS OTHER PAGES */}
      <Navbar />

      <div className="admin-home-page">

        <div className="admin-home-container">

          <div className="admin-home-header">

            <div className="admin-crown">
              👑
            </div>

            <h1>Admin Portal</h1>

            <p>
              Welcome to the LPU FindIt Admin Portal.
            </p>

          </div>


          <div className="admin-home-buttons">

            <Link to="/admin">
              <button className="admin-portal-btn">
                📊 Open Admin Dashboard
              </button>
            </Link>


            <Link to="/home">
              <button className="admin-normal-btn">
                🏠 Go to User Portal
              </button>
            </Link>

          </div>

        </div>

      </div>
    </>
  );
}

export default AdminHome;