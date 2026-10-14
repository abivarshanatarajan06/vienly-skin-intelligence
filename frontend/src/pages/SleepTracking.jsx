import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://127.0.0.1:5000";

export default function SleepTracking() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [sleepHours, setSleepHours] = useState("");
  const [sleepQuality, setSleepQuality] = useState("Good");
  const [sleepDate, setSleepDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const savedUser = JSON.parse(
        localStorage.getItem("user") || "null"
      );
      setUser(savedUser);

      if (!savedUser?.id) {
        setError("Please log in before recording your sleep.");
      }
    } catch {
      setError("Unable to read your login session. Please log in again.");
    }
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!user?.id) {
      setError("Your login session is missing. Please log in again.");
      return;
    }

    const hours = Number(sleepHours);

    if (sleepHours === "" || !Number.isFinite(hours) || hours < 0 || hours > 24) {
      setError("Enter a valid sleep duration between 0 and 24 hours.");
      return;
    }

    if (!sleepDate) {
      setError("Please select the sleep date.");
      return;
    }

    setLoading(true);

    const payload = {
      user_id: user.id,
      sleep_hours: hours,
      sleep_quality: sleepQuality,
      sleep_date: sleepDate,
      notes: notes.trim()
    };

    try {
      const response = await fetch(`${API}/sleep-tracking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          "Unable to save sleep details. Check the backend route."
        );
      }

      setMessage("Sleep details saved successfully!");

      setTimeout(() => {
        navigate("/skin-assessment");
      }, 700);
    } catch (err) {
      console.error("SLEEP TRACKING ERROR:", err);
      setError(
        err.message ||
        "Could not connect to the server. Please check that your backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.brand}>VIENLY</h1>
            <p style={styles.subtitle}>Sleep Tracking</p>
          </div>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>
        </header>

        <div style={styles.progress}>
          <span>1. Skin Profile</span>
          <span>2. Lifestyle</span>
          <span style={styles.activeStep}>3. Sleep</span>
          <span>4. Assessment</span>
        </div>

        <section style={styles.card}>
          <div style={styles.icon}>🌙</div>

          <h2>How did you sleep?</h2>

          <p style={styles.description}>
            Record your sleep information to help build a more
            complete picture of your skincare habits.
          </p>

          {message && (
            <div style={styles.successMessage}>
              {message}
            </div>
          )}

          {error && (
            <div style={styles.errorMessage}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label style={styles.label} htmlFor="sleepDate">
              Sleep Date
            </label>

            <input
              id="sleepDate"
              type="date"
              value={sleepDate}
              max={new Date().toLocaleDateString("en-CA")}
              onChange={(event) => setSleepDate(event.target.value)}
              style={styles.input}
              required
            />

            <label style={styles.label} htmlFor="sleepHours">
              Sleep Duration (hours)
            </label>

            <input
              id="sleepHours"
              type="number"
              min="0"
              max="24"
              step="0.5"
              placeholder="Example: 7.5"
              value={sleepHours}
              onChange={(event) => setSleepHours(event.target.value)}
              style={styles.input}
              required
            />

            <label style={styles.label} htmlFor="sleepQuality">
              Sleep Quality
            </label>

            <select
              id="sleepQuality"
              value={sleepQuality}
              onChange={(event) => setSleepQuality(event.target.value)}
              style={styles.input}
              required
            >
              <option value="Poor">Poor</option>
              <option value="Fair">Fair</option>
              <option value="Good">Good</option>
              <option value="Excellent">Excellent</option>
            </select>

            <label style={styles.label} htmlFor="notes">
              Notes (optional)
            </label>

            <textarea
              id="notes"
              placeholder="Anything that affected your sleep?"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              style={styles.input}
            />

            <button
              type="submit"
              style={{
                ...styles.primaryButton,
                opacity: loading ? 0.7 : 1
              }}
              disabled={loading || !user?.id}
            >
              {loading ? "Saving..." : "Save Sleep & Continue"}
            </button>
          </form>

          <button
            type="button"
            style={styles.textButton}
            onClick={() => navigate("/skin-assessment")}
          >
            Continue to Skin Assessment
          </button>
        </section>

        <footer style={styles.footer}>
          VIENLY Skin Intelligence · Your personalized skincare companion
        </footer>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #fff1f7, #ffe5ef)",
    padding: "25px 16px",
    fontFamily: "Arial, Helvetica, sans-serif",
    color: "#333"
  },

  container: {
    maxWidth: "760px",
    margin: "0 auto"
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    flexWrap: "wrap",
    marginBottom: "25px"
  },

  brand: {
    color: "#b52e70",
    marginBottom: "5px"
  },

  subtitle: {
    marginTop: 0,
    color: "#765568"
  },

  progress: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    flexWrap: "wrap",
    fontSize: "12px",
    color: "#806477",
    marginBottom: "20px"
  },

  activeStep: {
    color: "#b52e70",
    fontWeight: "700"
  },

  card: {
    background: "#fff",
    padding: "30px",
    borderRadius: "20px",
    boxShadow: "0 8px 25px rgba(214, 51, 132, 0.12)"
  },

  icon: {
    fontSize: "42px",
    textAlign: "center"
  },

  description: {
    color: "#777",
    lineHeight: 1.7,
    marginBottom: "25px"
  },

  label: {
    display: "block",
    fontWeight: "600",
    marginBottom: "8px",
    marginTop: "18px"
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px",
    border: "1px solid #e7c8d8",
    borderRadius: "10px",
    fontSize: "15px",
    background: "#fffafd",
    color: "#333"
  },

  primaryButton: {
    width: "100%",
    border: "none",
    background: "#d63384",
    color: "#fff",
    padding: "14px",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "25px"
  },

  secondaryButton: {
    background: "#fff",
    color: "#b52e70",
    border: "1px solid #d63384",
    padding: "10px 15px",
    borderRadius: "9px",
    cursor: "pointer"
  },

  textButton: {
    display: "block",
    margin: "18px auto 0",
    background: "transparent",
    color: "#b52e70",
    border: "none",
    cursor: "pointer",
    fontWeight: "600"
  },

  successMessage: {
    background: "#e8f7ec",
    color: "#236b35",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "15px"
  },

  errorMessage: {
    background: "#fff0f0",
    color: "#b42318",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "15px",
    lineHeight: 1.5
  },

  footer: {
    textAlign: "center",
    color: "#806477",
    fontSize: "12px",
    marginTop: "25px",
    lineHeight: 1.6
  }
};