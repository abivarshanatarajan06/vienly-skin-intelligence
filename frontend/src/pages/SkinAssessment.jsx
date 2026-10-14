import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://127.0.0.1:5000";

export default function SkinAssessment() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [acne, setAcne] = useState("0");
  const [darkSpots, setDarkSpots] = useState("0");
  const [dryness, setDryness] = useState("0");
  const [sensitivity, setSensitivity] = useState("0");
  const [oiliness, setOiliness] = useState("Moderate");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const savedUser = JSON.parse(
        localStorage.getItem("user") || "null"
      );
      setUser(savedUser);

      if (!savedUser?.id && !savedUser?.user_id) {
        setError("Please log in before completing your skin assessment.");
      }
    } catch {
      setError("Unable to read your login session. Please log in again.");
    }
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const userId = user?.id ?? user?.user_id;

    if (!userId) {
      setError("Your login session is missing. Please log in again.");
      return;
    }

    setLoading(true);

    const payload = {
      user_id: userId,
      acne: Number(acne),
      dark_spots: Number(darkSpots),
      dryness: Number(dryness),
      sensitivity: Number(sensitivity),
      oiliness,
      notes: notes.trim()
    };

    try {
      const response = await fetch(`${API}/skin-assessment`, {
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
          "Unable to save your skin assessment."
        );
      }

      setMessage("Skin assessment saved! Preparing your recommendations...");

      setTimeout(() => {
        navigate("/recommendations");
      }, 700);
    } catch (err) {
      console.error("SKIN ASSESSMENT ERROR:", err);
      setError(
        err.message ||
        "Unable to connect to the backend. Check that your server is running."
      );
    } finally {
      setLoading(false);
    }
  }

  function renderSeverity(label, value, setter) {
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

  return (
    <div style={styles.page}>
      <main style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.brand}>VIENLY</h1>
            <p style={styles.subtitle}>Personalized Skin Assessment</p>
          </div>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>
        </header>

        <section style={styles.card}>
          <div style={styles.icon}>✨</div>

          <h2 style={styles.title}>Tell us about your skin</h2>

          <p style={styles.description}>
            Rate your current skin concerns. VIENLY will use this
            information with your saved skin profile to prepare product
            recommendations.
          </p>

          {message && <div style={styles.success}>{message}</div>}
          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={styles.grid}>
              {renderSeverity("Acne / Pimples", acne, setAcne)}
              {renderSeverity("Dark Spots", darkSpots, setDarkSpots)}
              {renderSeverity("Dryness", dryness, setDryness)}
              {renderSeverity(
                "Skin Sensitivity Today",
                sensitivity,
                setSensitivity
              )}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Oiliness</label>
              <select
                value={oiliness}
                onChange={(event) => setOiliness(event.target.value)}
                style={styles.input}
              >
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Additional Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Describe any other skin changes..."
                rows={4}
                style={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !user}
              style={{
                ...styles.primaryButton,
                opacity: loading || !user ? 0.65 : 1
              }}
            >
              {loading ? "Saving..." : "Save Assessment & Get Recommendations"}
            </button>
          </form>
        </section>

        <p style={styles.footer}>
          Your responses help personalize your skincare plan; they are not
          a medical diagnosis.
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
  container: {
    maxWidth: "760px",
    margin: "0 auto"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "25px"
  },
  brand: {
    color: "#b52e70",
    marginBottom: "5px"
  },
  subtitle: {
    color: "#765568",
    marginTop: 0
  },
  secondaryButton: {
    background: "#fff",
    color: "#b52e70",
    border: "1px solid #d63384",
    padding: "10px 15px",
    borderRadius: "9px",
    cursor: "pointer"
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
  title: {
    textAlign: "center",
    color: "#733454"
  },
  description: {
    color: "#777",
    lineHeight: 1.7,
    marginBottom: "25px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px"
  },
  field: {
    marginBottom: "18px"
  },
  label: {
    display: "block",
    fontWeight: "600",
    marginBottom: "8px"
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
    marginTop: "12px"
  },
  success: {
    background: "#e8f7ec",
    color: "#236b35",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "15px"
  },
  error: {
    background: "#fff0f0",
    color: "#b42318",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "15px"
  },
  footer: {
    textAlign: "center",
    color: "#806477",
    fontSize: "12px",
    lineHeight: 1.6,
    marginTop: "20px"
  }
};