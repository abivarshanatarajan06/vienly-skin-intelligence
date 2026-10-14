import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000";

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userId = user?.id;
  console.log("Logged-in user:", user);
  console.log("Logged-in user ID:", userId);

  const loadNotifications = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API}/notifications/${userId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load notifications");
      }

      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("NOTIFICATION ERROR:", err);
      setError(err.message || "Could not connect to the backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  const markAsRead = async (id) => {
    try {
      const response = await fetch(
        `${API}/notifications/${id}/read`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: userId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not mark as read");
      }

      await loadNotifications();
    } catch (err) {
      console.error("MARK READ ERROR:", err);
      setError(err.message || "Could not update notification");
    }
  };

  const unreadCount = notifications.filter(
    (item) => !item.is_read
  ).length;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🔔 Notifications</h1>
          <p style={styles.subtitle}>
            Your skincare reminders and important updates
          </p>
          <p style={styles.count}>
            {unreadCount} unread notification(s)
          </p>
        </div>

        <button
          style={styles.backButton}
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </div>

      <div style={styles.container}>
        {loading && (
          <div style={styles.empty}>Loading notifications...</div>
        )}

        {!loading && !userId && (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>🔐</div>
            <h2>Please log in again</h2>
            <p>Your user information could not be found.</p>
            <button
              style={styles.readButton}
              onClick={() => navigate("/login")}
            >
              Go to Login
            </button>
          </div>
        )}

        {!loading && error && (
          <div style={styles.error}>
            {error}
            <button style={styles.retryButton} onClick={loadNotifications}>
              Try again
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          userId &&
          notifications.length === 0 && (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>🔔</div>
              <h2>No notifications yet</h2>
              <p>
                Your scheduled reminders will appear here when generated.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          notifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                ...styles.notification,
                backgroundColor: notification.is_read
                  ? "#ffffff"
                  : "#fff0f6",
              }}
            >
              <div style={styles.icon}>
                {notification.notification_type === "hydration"
                  ? "💧"
                  : notification.notification_type === "progress"
                  ? "📈"
                  : notification.notification_type === "sleep"
                  ? "😴"
                  : notification.notification_type === "skincare"
                  ? "🧴"
                  : "🔔"}
              </div>

              <div style={styles.content}>
                <h3 style={styles.notificationTitle}>
                  {notification.title}
                </h3>

                <p style={styles.message}>
                  {notification.message}
                </p>

                <small style={styles.date}>
                  {new Date(notification.created_at).toLocaleString()}
                </small>
              </div>

              {!notification.is_read && (
                <button
                  style={styles.readButton}
                  onClick={() => markAsRead(notification.id)}
                >
                  Mark as read
                </button>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #fff5f8, #ffe8f0)",
    padding: "30px",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    maxWidth: "1000px",
    margin: "0 auto 25px",
    display: "flex",
    flexWrap: "wrap",
    gap: "15px",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    margin: 0,
    color: "#d6336c",
    fontSize: "32px",
  },
  subtitle: { color: "#777" },
  count: { color: "#d6336c", fontWeight: "bold" },
  backButton: {
    border: "none",
    background: "#d6336c",
    color: "white",
    padding: "12px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  container: { maxWidth: "1000px", margin: "0 auto" },
  notification: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "18px",
    padding: "20px",
    marginBottom: "15px",
    borderRadius: "14px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  },
  icon: { fontSize: "30px" },
  content: { flex: 1, minWidth: "180px" },
  notificationTitle: { margin: "0 0 7px", color: "#333" },
  message: { color: "#555", margin: "0 0 8px" },
  date: { color: "#999" },
  readButton: {
    border: "none",
    background: "#d6336c",
    color: "white",
    padding: "9px 14px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  retryButton: {
    marginLeft: "12px",
    padding: "8px 12px",
    cursor: "pointer",
  },
  error: {
    background: "#fff",
    color: "#b42318",
    padding: "20px",
    borderRadius: "12px",
  },
  empty: {
    background: "white",
    padding: "60px 20px",
    borderRadius: "18px",
    textAlign: "center",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  },
  emptyIcon: { fontSize: "50px" },
};

export default Notifications;