import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://127.0.0.1:5000";

const routineSteps = [
  { id: "morning_cleanser", time: "Morning", title: "Cleanser", description: "Gently cleanse your face." },
  { id: "morning_treatment", time: "Morning", title: "Treatment", description: "Apply a suitable treatment if recommended." },
  { id: "morning_moisturizer", time: "Morning", title: "Moisturizer", description: "Apply moisturizer to support the skin barrier." },
  { id: "morning_sunscreen", time: "Morning", title: "Sunscreen", description: "Finish with broad-spectrum SPF 30 or higher." },
  { id: "evening_cleanser", time: "Evening", title: "Cleanser", description: "Remove sunscreen, makeup and daily buildup." },
  { id: "evening_treatment", time: "Evening", title: "Treatment", description: "Use only treatments suitable for your skin." },
  { id: "evening_moisturizer", time: "Evening", title: "Moisturizer", description: "Moisturize to help reduce dryness." }
];

function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Routine() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [completed, setCompleted] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const date = todayString();
  const token = localStorage.getItem("token");

  useEffect(() => {
    let cancelled = false;

    async function loadRoutine() {
      try {
        const savedUser = JSON.parse(localStorage.getItem("user") || "null");
        const userId = savedUser?.id ?? savedUser?.user_id;

        if (!userId) {
          throw new Error("Please log in to access your skincare routine.");
        }

        if (cancelled) return;
        setUser(savedUser);

        const response = await fetch(`${API}/routine/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || data.error || "Could not load your routine.");
        }

        if (cancelled) return;

        const saved = data.routine?.completed_steps || {};
        const savedDate = data.routine?.routine_date || data.routine?.date;

        if (savedDate && savedDate !== date) {
          setCompleted({});
        } else {
          setCompleted(saved);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load routine.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRoutine();

    return () => {
      cancelled = true;
    };
  }, [date, token]);

  function toggleStep(id) {
    setCompleted((previous) => ({
      ...previous,
      [id]: !previous[id]
    }));
    setMessage("");
  }

  async function saveRoutine() {
    const userId = user?.id ?? user?.user_id;

    if (!userId) {
      setError("Please log in again.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API}/routine`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          user_id: userId,
          completed_steps: completed,
          routine_date: date
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || "Could not save routine.");
      }

      setMessage("Today's routine progress has been saved.");
    } catch (err) {
      setError(err.message || "Could not connect to the backend.");
    } finally {
      setSaving(false);
    }
  }

  const completedCount = routineSteps.filter((step) => completed[step.id]).length;
  const percentage = Math.round((completedCount / routineSteps.length) * 100);

  if (loading) {
    return <div style={styles.page}><div style={styles.card}>Loading your routine...</div></div>;
  }

  return (
    <div style={styles.page}>
      <main style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.brand}>VIENLY</h1>
            <p style={styles.subtitle}>Your Personalized Skincare Routine</p>
          </div>
          <button style={styles.secondaryButton} onClick={() => navigate("/dashboard")}>
            Dashboard
          </button>
        </header>

        <section style={styles.card}>
          <h2>Today's Routine</h2>
          <p style={styles.date}>{date}</p>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${percentage}%` }} />
          </div>
          <p style={styles.progressText}>
            {completedCount} of {routineSteps.length} steps completed ({percentage}%)
          </p>
        </section>

        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={styles.success}>{message}</div>}

        {["Morning", "Evening"].map((period) => (
          <section key={period} style={styles.section}>
            <h2>{period === "Morning" ? "☀️ Morning Routine" : "🌙 Evening Routine"}</h2>

            {routineSteps.filter((step) => step.time === period).map((step, index) => (
              <label key={step.id} style={styles.step}>
                <input
                  type="checkbox"
                  checked={Boolean(completed[step.id])}
                  onChange={() => toggleStep(step.id)}
                  style={styles.checkbox}
                />
                <div style={{ flex: 1 }}>
                  <strong style={completed[step.id] ? styles.completedTitle : {}}>
                    {index + 1}. {step.title}
                  </strong>
                  <p style={styles.description}>{step.description}</p>
                </div>
                {completed[step.id] && <span style={styles.done}>Done</span>}
              </label>
            ))}
          </section>
        ))}

        <button
          style={styles.primaryButton}
          onClick={saveRoutine}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Today's Progress"}
        </button>

        <button style={styles.secondaryWideButton} onClick={() => navigate("/progress")}>
          Continue to Progress Tracking
        </button>

        <button style={styles.textButton} onClick={() => navigate("/recommendations")}>
          Back to Recommendations
        </button>

        <p style={styles.disclaimer}>
          Follow product label instructions. Introduce new products gradually and stop using a product if it causes a reaction.
        </p>
      </main>
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
  container: { maxWidth: "800px", margin: "0 auto" },
  header: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", flexWrap: "wrap", gap: "12px",
    marginBottom: "25px"
  },
  brand: { color: "#b52e70", marginBottom: "5px" },
  subtitle: { color: "#765568", marginTop: 0 },
  card: {
    background: "#fff", padding: "25px", borderRadius: "16px",
    boxShadow: "0 8px 25px rgba(214,51,132,0.10)", marginBottom: "22px"
  },
  date: { color: "#765568" },
  progressTrack: {
    height: "10px", background: "#f7dce9",
    borderRadius: "10px", overflow: "hidden"
  },
  progressFill: {
    height: "100%", background: "#d63384",
    borderRadius: "10px", transition: "width 0.2s"
  },
  progressText: { color: "#765568", fontSize: "14px" },
  section: {
    background: "#fff", padding: "22px",
    borderRadius: "16px", marginBottom: "20px"
  },
  step: {
    display: "flex", alignItems: "flex-start", gap: "12px",
    padding: "16px 0", borderBottom: "1px solid #f4e3eb",
    cursor: "pointer"
  },
  checkbox: {
    width: "20px", height: "20px",
    accentColor: "#d63384", marginTop: "2px"
  },
  description: {
    color: "#777", margin: "6px 0 0",
    lineHeight: 1.5, fontSize: "14px"
  },
  completedTitle: {
    textDecoration: "line-through", color: "#777"
  },
  done: {
    color: "#287541", fontSize: "12px", fontWeight: "700"
  },
  primaryButton: {
    width: "100%", background: "#d63384", color: "#fff",
    border: "none", borderRadius: "10px", padding: "14px",
    marginTop: "10px", fontWeight: "700", cursor: "pointer"
  },
  secondaryButton: {
    background: "#fff", color: "#b52e70",
    border: "1px solid #d63384", padding: "10px 15px",
    borderRadius: "9px", cursor: "pointer"
  },
  secondaryWideButton: {
    width: "100%", background: "#fff", color: "#b52e70",
    border: "1px solid #d63384", borderRadius: "10px",
    padding: "13px", marginTop: "12px",
    fontWeight: "700", cursor: "pointer"
  },
  textButton: {
    display: "block", margin: "15px auto",
    background: "transparent", color: "#b52e70",
    border: "none", cursor: "pointer", fontWeight: "600"
  },
  error: {
    background: "#fff0f0", color: "#a11",
    padding: "12px", borderRadius: "8px", marginBottom: "15px"
  },
  success: {
    background: "#e8f7ec", color: "#236b35",
    padding: "12px", borderRadius: "8px", marginBottom: "15px"
  },
  disclaimer: {
    color: "#806477", fontSize: "12px",
    lineHeight: 1.6, marginTop: "22px"
  }
};