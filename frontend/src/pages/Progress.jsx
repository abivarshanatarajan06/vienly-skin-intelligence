import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://127.0.0.1:5000";

export default function Progress() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [skinScore, setSkinScore] = useState("5");
  const [acne, setAcne] = useState("0");
  const [darkSpots, setDarkSpots] = useState("0");
  const [dryness, setDryness] = useState("0");
  const [sensitivity, setSensitivity] = useState("0");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      try {
        const savedUser = JSON.parse(localStorage.getItem("user") || "null");
        const userId = savedUser?.id ?? savedUser?.user_id;

        if (!userId) {
          throw new Error("Please log in to track your skincare progress.");
        }

        if (!cancelled) setUser(savedUser);

        const response = await fetch(`${API}/progress/${userId}`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || data.error || "Could not load progress history.");
        }

        if (!cancelled) {
          setHistory(Array.isArray(data) ? data : Array.isArray(data.progress) ? data.progress : []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load progress.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProgress();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const userId = user?.id ?? user?.user_id;

    if (!userId) {
      setError("Please log in again.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          skin_score: Number(skinScore),
          acne: Number(acne),
          dark_spots: Number(darkSpots),
          dryness: Number(dryness),
          sensitivity: Number(sensitivity),
          notes: notes.trim()
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || "Unable to save progress.");
      }

      setMessage("Today's skin progress has been saved.");
      setNotes("");

      const refreshed = await fetch(`${API}/progress/${userId}`);
      const refreshedData = await refreshed.json().catch(() => ({}));

      if (refreshed.ok) {
        setHistory(
          Array.isArray(refreshedData)
            ? refreshedData
            : Array.isArray(refreshedData.progress)
              ? refreshedData.progress
              : history
        );
      }
    } catch (err) {
      setError(err.message || "Could not save your progress.");
    } finally {
      setSaving(false);
    }
  }

  function severityField(label, value, setter) {
    return (
      <div style={styles.field} key={label}>
        <label style={styles.label}>{label}</label>
        <select
          value={value}
          onChange={(event) => setter(event.target.value)}
          style={styles.input}
        >
          <option value="0">None</option>
          <option value="1">Mild</option>
          <option value="2">Moderate</option>
          <option value="3">Severe</option>
        </select>
      </div>
    );
  }

  function displayDate(record) {
    const raw = record.recorded_at || record.created_at || record.date;
    if (!raw) return "Date unavailable";

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime())
      ? String(raw)
      : parsed.toLocaleDateString();
  }

  if (loading) {
    return <div style={styles.page}><div style={styles.card}>Loading your progress...</div></div>;
  }

  return (
    <div style={styles.page}>
      <main style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.brand}>VIENLY</h1>
            <p style={styles.subtitle}>Skin Progress Tracking</p>
          </div>
          <button style={styles.secondaryButton} onClick={() => navigate("/dashboard")}>
            Dashboard
          </button>
        </header>

        <section style={styles.card}>
          <h2>Record Today's Skin Progress</h2>
          <p style={styles.description}>
            Record how your skin looks and feels today. Save a new entry when
            you want to compare changes over time.
          </p>

          {error && <div style={styles.error}>{error}</div>}
          {message && <div style={styles.success}>{message}</div>}

          <form onSubmit={handleSubmit}>
            <div style={styles.field}>
              <label style={styles.label}>Overall Skin Score (1–10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={skinScore}
                onChange={(event) => setSkinScore(event.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.grid}>
              {severityField("Acne / Pimples", acne, setAcne)}
              {severityField("Dark Spots", darkSpots, setDarkSpots)}
              {severityField("Dryness", dryness, setDryness)}
              {severityField("Sensitivity", sensitivity, setSensitivity)}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Notes (optional)</label>
              <textarea
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Any changes or reactions you noticed today?"
                style={styles.input}
              />
            </div>

            <button type="submit" disabled={saving} style={styles.primaryButton}>
              {saving ? "Saving..." : "Save Progress"}
            </button>
          </form>
        </section>

        <section style={styles.historySection}>
          <div style={styles.historyHeader}>
            <h2>Previous Progress</h2>
            <span style={styles.count}>{history.length} record(s)</span>
          </div>

          {history.length === 0 ? (
            <div style={styles.emptyCard}>
              No progress records yet. Save your first entry above to start
              building your history.
            </div>
          ) : (
            <div style={styles.historyList}>
              {history.map((record, index) => (
                <article
                  key={record.id ?? `${record.recorded_at ?? "record"}-${index}`}
                  style={styles.historyCard}
                >
                  <div style={styles.historyHeader}>
                    <strong>{displayDate(record)}</strong>
                    <span style={styles.score}>
                      Score: {record.skin_score ?? "—"}/10
                    </span>
                  </div>

                  <div style={styles.metrics}>
                    <span>Acne: {record.acne ?? "—"}</span>
                    <span>Dark spots: {record.dark_spots ?? "—"}</span>
                    <span>Dryness: {record.dryness ?? "—"}</span>
                    <span>Sensitivity: {record.sensitivity ?? "—"}</span>
                  </div>

                  {record.notes && <p style={styles.notes}>{record.notes}</p>}
                </article>
              ))}
            </div>
          )}
        </section>

        <button style={styles.secondaryWideButton} onClick={() => navigate("/analytics")}>
          View Skincare Analytics
        </button>

        <button style={styles.textButton} onClick={() => navigate("/routine")}>
          Back to Daily Routine
        </button>
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
  container: { maxWidth: "850px", margin: "0 auto" },
  header: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", flexWrap: "wrap", gap: "12px",
    marginBottom: "25px"
  },
  brand: { color: "#b52e70", marginBottom: "5px" },
  subtitle: { color: "#765568", marginTop: 0 },
  card: {
    background: "#fff", padding: "28px", borderRadius: "18px",
    boxShadow: "0 8px 25px rgba(214,51,132,0.10)"
  },
  description: { color: "#777", lineHeight: 1.7 },
  field: { marginBottom: "18px" },
  label: { display: "block", fontWeight: "600", marginBottom: "8px" },
  input: {
    display: "block", width: "100%", boxSizing: "border-box",
    padding: "13px", border: "1px solid #e7c8d8",
    borderRadius: "10px", fontSize: "15px",
    background: "#fffafd", color: "#333"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px"
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
  historySection: { marginTop: "30px" },
  historyHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", flexWrap: "wrap", gap: "10px"
  },
  count: {
    background: "#fff", color: "#b52e70",
    padding: "7px 12px", borderRadius: "20px", fontSize: "13px"
  },
  historyList: { display: "grid", gap: "14px", marginTop: "15px" },
  historyCard: {
    background: "#fff", padding: "20px",
    borderRadius: "14px", overflowWrap: "anywhere"
  },
  metrics: {
    display: "flex", flexWrap: "wrap",
    gap: "10px", marginTop: "12px", color: "#765568",
    fontSize: "13px"
  },
  score: { color: "#b52e70", fontWeight: "700" },
  notes: { color: "#666", lineHeight: 1.6 },
  emptyCard: {
    background: "#fff", padding: "22px",
    borderRadius: "14px", lineHeight: 1.7
  },
  secondaryWideButton: {
    width: "100%", background: "#fff", color: "#b52e70",
    border: "1px solid #d63384", borderRadius: "10px",
    padding: "14px", marginTop: "20px",
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
  }
};