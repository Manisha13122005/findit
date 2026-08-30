import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { supabase } from "../supabase";
import "./Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] =
    useState(false);

  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();


  /* ============================= */
  /* CHECK IF CURRENT PAGE IS HOME */
  /* ============================= */

  const isHomePage =
    location.pathname === "/home";


  /* ============================= */
  /* GET CURRENT USER */
  /* ============================= */

  useEffect(() => {
    getCurrentUser();
  }, []);


  /* ============================= */
  /* LOCK BODY SCROLL WHEN MENU OPEN */
  /* ============================= */

  useEffect(() => {

    if (menuOpen) {

      document.body.style.overflow = "hidden";

    } else {

      document.body.style.overflow = "";

    }


    return () => {
      document.body.style.overflow = "";
    };

  }, [menuOpen]);


  /* ============================= */
  /* CLOSE DROPDOWNS ON PAGE CHANGE */
  /* ============================= */

  useEffect(() => {

    setMenuOpen(false);
    setNotificationOpen(false);

  }, [location.pathname]);


  const getCurrentUser = async () => {

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();


    if (error) {

      console.error(
        "User error:",
        error.message
      );

      return;

    }


    if (user) {

      setUser(user);


      const {
        data,
        error: adminError,
      } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();


      if (!adminError) {

        setIsAdmin(
          data?.is_admin === true
        );

      }

    }

  };


  /* ============================= */
  /* LOAD NOTIFICATIONS */
  /* ============================= */

  const loadNotifications = async (
    currentUser
  ) => {

    if (!currentUser) return;


    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq(
        "user_id",
        currentUser.id
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );


    if (error) {

      console.error(
        "Notification loading error:",
        error.message
      );

      return;

    }


    setNotifications(data || []);

  };


  /* ============================= */
  /* REALTIME NOTIFICATIONS */
  /* ============================= */

  useEffect(() => {

    if (!user) return;


    loadNotifications(user);


    const channel = supabase

      .channel(
        `notifications-${user.id}-${Date.now()}`
      )


      /* INSERT */

      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },

        (payload) => {

          setNotifications((current) => {

            const alreadyExists =
              current.some(
                (item) =>
                  item.id === payload.new.id
              );


            if (alreadyExists) {
              return current;
            }


            return [
              payload.new,
              ...current,
            ];

          });

        }
      )


      /* UPDATE */

      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },

        (payload) => {

          setNotifications((current) =>
            current.map((item) =>
              item.id === payload.new.id
                ? payload.new
                : item
            )
          );

        }
      )


      /* DELETE */

      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },

        (payload) => {

          setNotifications((current) =>
            current.filter(
              (item) =>
                item.id !== payload.old.id
            )
          );

        }
      )


      .subscribe();


    return () => {

      supabase.removeChannel(channel);

    };

  }, [user]);


  /* ============================= */
  /* CREATE CONVERSATION KEY */
  /* ============================= */

  const getConversationKey = (
    notification
  ) => {

    const senderId =
      notification.sender_id || "unknown";


    const reportId =
      notification.report_id
        ? Number(notification.report_id)
        : "general";


    return `${senderId}-${reportId}`;

  };


  /* ============================= */
  /* GROUP NOTIFICATIONS */
  /* ============================= */

  const getGroupedNotifications = () => {

    const grouped = {};


    notifications.forEach((notification) => {

      const key =
        getConversationKey(notification);


      if (!grouped[key]) {

        grouped[key] = notification;

        return;

      }


      const existingDate =
        new Date(
          grouped[key].created_at
        ).getTime();


      const currentDate =
        new Date(
          notification.created_at
        ).getTime();


      if (currentDate > existingDate) {

        grouped[key] = notification;

      }

    });


    return Object.values(grouped).sort(
      (a, b) =>
        new Date(b.created_at) -
        new Date(a.created_at)
    );

  };


  const groupedNotifications =
    getGroupedNotifications();


  /* ============================= */
  /* UNREAD COUNT */
  /* ============================= */

  const unreadConversationKeys =
    new Set();


  notifications.forEach((notification) => {

    if (!notification.is_read) {

      unreadConversationKeys.add(
        getConversationKey(notification)
      );

    }

  });


  const unreadCount =
    unreadConversationKeys.size;


  /* ============================= */
  /* MARK CONVERSATION READ */
  /* ============================= */

  const markConversationNotificationsAsRead =
    async (notification) => {

      if (!user) return;


      const relatedNotifications =
        notifications.filter((item) => {

          const sameSender =
            item.sender_id ===
            notification.sender_id;


          const sameReport =

            notification.report_id

              ? Number(item.report_id) ===
                Number(notification.report_id)

              : (
                  item.report_id === null ||
                  item.report_id === undefined
                );


          return (
            sameSender &&
            sameReport &&
            !item.is_read
          );

        });


      if (
        relatedNotifications.length === 0
      ) {
        return;
      }


      const ids =
        relatedNotifications.map(
          (item) => item.id
        );


      const { error } = await supabase

        .from("notifications")

        .update({
          is_read: true,
        })

        .in("id", ids)

        .eq(
          "user_id",
          user.id
        );


      if (error) {

        console.error(
          "Conversation notification error:",
          error.message
        );

        return;

      }


      setNotifications((current) =>
        current.map((item) => {

          if (
            ids.includes(item.id)
          ) {

            return {
              ...item,
              is_read: true,
            };

          }


          return item;

        })
      );

    };


  /* ============================= */
  /* OPEN NOTIFICATION */
  /* ============================= */

  const openNotification =
    async (notification) => {

      if (!user) return;


      await markConversationNotificationsAsRead(
        notification
      );


      setNotificationOpen(false);


      let url =
        `/messages?user=${notification.sender_id}`;


      if (notification.report_id) {

        url +=
          `&report=${notification.report_id}`;

      }


      navigate(url);

    };


  /* ============================= */
  /* NOTIFICATION BUTTON */
  /* ============================= */

  const handleNotificationClick = () => {

    setNotificationOpen(
      (current) => !current
    );

  };


  /* ============================= */
  /* LOGOUT */
  /* ============================= */

  const handleLogout = async () => {

    const confirmLogout =
      window.confirm(
        "Are you sure you want to logout?"
      );


    if (!confirmLogout) return;


    const { error } =
      await supabase.auth.signOut();


    if (error) {

      alert(error.message);

      return;

    }


    setMenuOpen(false);

    navigate("/login");

  };


  /* ============================= */
  /* CLOSE MENU */
  /* ============================= */

  const closeMenu = () => {
    setMenuOpen(false);
  };


  return (

    <>

      {/* ================= HEADER ================= */}

      <header className="navbar">


        {/* ================= LEFT SIDE ================= */}

        <div className="navbar-left">


          <button
            className="navbar-menu-btn"
            onClick={() =>
              setMenuOpen(!menuOpen)
            }
            aria-label="Open menu"
          >
            ☰
          </button>


          {!isHomePage && (

            <Link
              to="/home"
              className="navbar-logo"
            >

              <span className="navbar-logo-icon">
                🔎
              </span>


              <span className="navbar-logo-text">
                LPU FindIt
              </span>

            </Link>

          )}

        </div>


        {/* ================= NOTIFICATIONS ================= */}

        <div className="navbar-notification-wrapper">


          <button
            className="navbar-notification-btn"
            onClick={handleNotificationClick}
            aria-label="Notifications"
          >

            🔔


            {unreadCount > 0 && (

              <span className="navbar-notification-badge">

                {unreadCount > 99
                  ? "99+"
                  : unreadCount}

              </span>

            )}

          </button>


          {notificationOpen && (

            <div className="navbar-notification-dropdown">


              <h3>
                🔔 Notifications
              </h3>


              {groupedNotifications.length === 0 ? (

                <p className="navbar-no-notifications">
                  No notifications yet 💭
                </p>

              ) : (

                <div className="navbar-notification-list">


                  {groupedNotifications.map(
                    (notification) => (

                      <div

                        className={
                          `navbar-notification-item ${
                            !notification.is_read
                              ? "unread-notification"
                              : ""
                          }`
                        }

                        key={
                          getConversationKey(
                            notification
                          )
                        }

                        onClick={() =>
                          openNotification(
                            notification
                          )
                        }

                      >

                        <div>
                          💬 {notification.message}
                        </div>


                        <small>

                          {notification.created_at

                            ? new Date(
                                notification.created_at
                              ).toLocaleString()

                            : ""

                          }

                        </small>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          )}

        </div>

      </header>


      {/* ================= SIDEBAR ================= */}

      {menuOpen && (

        <>

          <div
            className="navbar-overlay"
            onClick={closeMenu}
          ></div>


          <aside className="navbar-sidebar">


            {/* ================= TOP ================= */}

            <div className="navbar-sidebar-top">


              <Link
                to="/home"
                className="navbar-sidebar-logo"
                onClick={closeMenu}
              >
                🔎 LPU FindIt
              </Link>


              <button
                className="navbar-close-btn"
                onClick={closeMenu}
                aria-label="Close menu"
              >
                ✕
              </button>

            </div>


            <div className="navbar-sidebar-line"></div>


            {/* ================= LINKS ================= */}

            <nav className="navbar-links">


              <Link
                to="/home"
                onClick={closeMenu}
              >
                🏠 Home
              </Link>


              <Link
                to="/profile"
                onClick={closeMenu}
              >
                👤 My Profile
              </Link>


              <Link
                to="/change-password"
                onClick={closeMenu}
              >
                🔐 Change Password
              </Link>


              {!isAdmin && (

                <>

                  <Link
                    to="/help-support"
                    onClick={closeMenu}
                  >
                    ❓ Help & Support
                  </Link>


                  <Link
                    to="/my-support-requests"
                    onClick={closeMenu}
                  >
                    📩 My Support Requests
                  </Link>

                </>

              )}


              {isAdmin && (

                <Link
                  to="/admin"
                  onClick={closeMenu}
                >
                  👑 Admin Dashboard
                </Link>

              )}


              <Link
                to="/messages"
                onClick={closeMenu}
              >
                💬 Private Messages
              </Link>

            </nav>


            {/* ================= LOGOUT ================= */}

            <div className="navbar-sidebar-bottom">

              <button
                className="navbar-logout-btn"
                onClick={handleLogout}
              >
                🚪 Logout
              </button>

            </div>

          </aside>

        </>

      )}

    </>

  );

}

export default Navbar;