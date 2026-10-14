import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://127.0.0.1:5000";

export default function Analytics() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        const userId = user?.id ?? user?.user_id;

        if (!userId) {
          throw new Error("Please log in to view your skincare analytics.");
        }

        const response = await fetch(`${API}/progress/${userId}`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || data.error || "Unable to load analytics."
          );
        }

        const records = Array.isArray(data)
          ? data
          : Array.isArray(data.progress)
            ? data.progress
            : [];

        if (!cancelled) {
          setHistory(
            records
              .filter((record) => record && record.skin_score != null)
              .sort((a, b) => {
                const dateA = new Date(a.recorded_at || a.created_at || a.date || 0).getTime();
                const dateB = new Date(b.recorded_at || b.created_at || b.date || 0).getTime();
                return dateA - dateB;
              })
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load your analytics.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, []);

  const analytics = useMemo(() => {
    if (!history.length) {
      return {
        average: 0,
        firstScore: 0,
        latestScore: 0,
        change: 0,
        improving: false,
        concerns: []
      };
    }

    const scores = history.map((record) => Number(record.skin_score));
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const firstScore = scores[0];
    const latestScore = scores[scores.length - 1];

    const fields = [
      { key: "acne", label: "Acne / Pimples" },
      { key: "dark_spots", label: "Dark Spots" },
      { key: "dryness", label: "Dryness" },
      { key: "sensitivity", label: "Sensitivity" }
    ];

    const concerns = fields.map((field) => {
      const values = history
        .map((record) => Number(record[field.key]))
        .filter(Number.isFinite);

      const mean = values.length
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : 0;

      return {
        ...field,
        average: mean,
        latest: values.length ? values[values.length - 1] : 0
      };
    });

    return {
      average,
      firstScore,
      latestScore,
      change: latestScore - firstScore,
      improving: latestScore >= firstScore,
      concerns
    };
  }, [history]);

  function formatDate(record) {
    const value = record.recorded_at || record.created_at || record.date;
    if (!value) return "Unknown date";

    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleDateString();
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.empty}>Preparing your skincare analytics...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <main style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.brand}>VIENLY</h1>
            <p style={styles.subtitle}>Skincare Analytics Dashboard</p>
          </div>

          <button
            style={styles.secondaryButton}
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>
        </header>

        <section style={styles.hero}>
          <div style={styles.heroIcon}>📊</div>
          <h2>Your Skin Progress Overview</h2>
          <p>
            Review your recorded skin scores and concern levels over time.
            Results depend on the progress entries you have saved.
          </p>
        </section>

        {error && <div style={styles.error}>{error}</div>}

        {!error && (
          <>
            <section style={styles.metricsGrid}>
              <Metric
                title="Total Records"
                value={history.length}
                description="Saved progress entries"
              />
              <Metric
                title="Average Skin Score"
                value={history.length ? analytics.average.toFixed(1) + "/10" : "—"}
                description="Across recorded entries"
              />
              <Metric
                title="Latest Skin Score"
                value={history.length ? analytics.latestScore + "/10" : "—"}
                description="Most recent entry"
              />
              <Metric
                title="Score Change"
                value={
                  history.length > 1
                    ? (analytics.change > 0 ? "+" : "") + analytics.change.toFixed(1)
                    : "—"
                }
                description="Latest compared with first entry"
              />
            </section>

            <section style={styles.card}>
              <h2>Skin Score Trend</h2>
              {history.length === 0 ? (
                <p style={styles.muted}>
                  No progress records yet. Save your first entry in Progress Tracking
                  to start seeing trends.
                </p>
              ) : (
                <>
                  <div style={styles.chart}>
                    {history.map((record, index) => {
                      const score = Math.max(
                        0,
                        Math.min(10, Number(record.skin_score) || 0)
                      );

                      return (
                        <div style={styles.chartColumn} key={record.id ?? index}>
                          <span style={styles.chartScore}>{score}</span>
                          <div style={styles.barArea}>
                            <div
                              style={{
                                ...styles.bar,
                                height: `${Math.max(score * 10, 3)}%`
                              }}
                              title={`Score: ${score}/10`}
                            />
                          </div>
                          <span style={styles.chartDate}>
                            {formatDate(record)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p style={styles.muted}>
                    Each bar represents one saved progress entry, shown from oldest
                    to newest. A higher score means a higher self-reported skin score,
                    not a medical measurement.
                  </p>
                </>
              )}
            </section>

            <section style={styles.card}>
              <h2>Concern Summary</h2>
              {history.length === 0 ? (
                <p style={styles.muted}>Concern trends will appear after you save progress.</p>
              ) : (
                <div style={styles.concernList}>
                  {analytics.concerns.map((concern) => (
                    <div key={concern.key} style={styles.concernRow}>
                      <div style={styles.concernHeading}>
                        <strong>{concern.label}</strong>
                        <span>Latest: {concern.latest}/3</span>
                      </div>
                      <div style={styles.track}>
                        <div
                          style={{
                            ...styles.fill,
                            width: `${Math.max(0, Math.min(3, concern.average)) / 3 * 100}%`
                          }}
                        />
                      </div>
                      <p style={styles.muted}>
                        Average recorded severity: {concern.average.toFixed(1)}/3
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section style={styles.card}>
              <h2>Recent History</h2>
              {history.length === 0 ? (
                <p style={styles.muted}>No history available.</p>
              ) : (
                <div style={styles.historyList}>
                  {[...history].reverse().slice(0, 10).map((record, index) => (
                    <article
                      key={record.id ?? `${formatDate(record)}-${index}`}
                      style={styles.historyItem}
                    >
                      <div>
                        <strong>{formatDate(record)}</strong>
                        <p style={styles.muted}>
                          Acne: {record.acne ?? "—"} · Dark spots: {record.dark_spots ?? "—"} ·
                          Dryness: {record.dryness ?? "—"} · Sensitivity: {record.sensitivity ?? "—"}
                        </p>
                        {record.notes && <p>{record.notes}</p>}
                      </div>
                      <strong style={styles.score}>
                        {record.skin_score}/10
                      </strong>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <button
              style={styles.primaryButton}
              onClick={() => navigate("/progress")}
            >
              Add Today's Progress
            </button>

            <button
              style={styles.secondaryWideButton}
              onClick={() => navigate("/routine")}
            >
              Return to Daily Routine
            </button>
          </>
        )}

        <footer style={styles.footer}>
          VIENLY Skin Intelligence · Analytics reflect your saved self-reported data.
        </footer>
      </main>
    </div>
  );
}

function Metric({ title, value, description }) {
  return (
    <article style={styles.metricCard}>
      <span style={styles.metricTitle}>{title}</span>
      <strong style={styles.metricValue}>{value}</strong>
      <span style={styles.muted}>{description}</span>
    </article>
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
  container: { maxWidth: "1050px", margin: "0 auto" },
  header: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", flexWrap: "wrap", gap: "12px",
    marginBottom: "25px"
  },
  brand: { color: "#b52e70", marginBottom: "5px" },
  subtitle: { color: "#765568", marginTop: 0 },
  hero: {
    background: "#fff", padding: "28px", borderRadius: "18px",
    textAlign: "center", marginBottom: "22px",
    boxShadow: "0 8px 25px rgba(214,51,132,0.08)"
  },
  heroIcon: { fontSize: "40px" },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "15px", marginBottom: "22px"
  },
  metricCard: {
    background: "#fff", padding: "20px", borderRadius: "14px",
    display: "flex", flexDirection: "column", gap: "10px"
  },
  metricTitle: { color: "#765568", fontSize: "13px" },
  metricValue: { color: "#b52e70", fontSize: "25px" },
  card: {
    background: "#fff", padding: "25px",
    borderRadius: "16px", marginBottom: "22px",
    overflow: "hidden"
  },
  chart: {
    display: "flex", alignItems: "flex-end", gap: "12px",
    minHeight: "230px", overflowX: "auto",
    padding: "20px 5px 10px"
  },
  chartColumn: {
    flex: "1 0 45px", minWidth: "45px",
    height: "210px", display: "flex",
    flexDirection: "column", alignItems: "center",
    gap: "6px"
  },
  chartScore: { fontSize: "12px", fontWeight: "700", color: "#b52e70" },
  barArea: {
    height: "150px", width: "100%", display: "flex",
    alignItems: "flex-end", background: "#fff4f9",
    borderRadius: "8px 8px 0 0", overflow: "hidden"
  },
  bar: {
    width: "100%", background: "#d63384",
    borderRadius: "7px 7px 0 0", minHeight: "3px"
  },
  chartDate: {
    fontSize: "10px", color: "#765568",
    textAlign: "center", overflowWrap: "anywhere"
  },
  concernList: { display: "grid", gap: "20px" },
  concernRow: { display: "grid", gap: "8px" },
  concernHeading: {
    display: "flex", justifyContent: "space-between",
    gap: "12px", flexWrap: "wrap"
  },
  track: {
    height: "10px", background: "#f7dce9",
    borderRadius: "10px", overflow: "hidden"
  },
  fill: {
    height: "100%", background: "#d63384",
    borderRadius: "10px"
  },
  historyList: { display: "grid", gap: "12px" },
  historyItem: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", gap: "15px",
    padding: "16px 0", borderBottom: "1px solid #f4e3eb",
    overflowWrap: "anywhere"
  },
  score: { color: "#b52e70", whiteSpace: "nowrap" },
  muted: { color: "#765568", fontSize: "13px", lineHeight: 1.6 },
  primaryButton: {
    width: "100%", background: "#d63384", color: "#fff",
    border: "none", borderRadius: "10px", padding: "14px",
    fontWeight: "700", cursor: "pointer"
  },
  secondaryButton: {
    background: "#fff", color: "#b52e70",
    border: "1px solid #d63384", padding: "10px 15px",
    borderRadius: "9px", cursor: "pointer"
  },
  secondaryWideButton: {
    width: "100%", background: "#fff", color: "#b52e70",
    border: "1px solid #d63384", borderRadius: "10px",
    padding: "14px", marginTop: "12px",
    fontWeight: "700", cursor: "pointer"
  },
  empty: {
    maxWidth: "600px", margin: "60px auto", padding: "30px",
    background: "#fff", borderRadius: "15px", textAlign: "center"
  },
  error: {
    background: "#fff0f0", color: "#a11",
    padding: "12px", borderRadius: "8px", marginBottom: "15px"
  },
  footer: {
    textAlign: "center", color: "#806477",
    fontSize: "12px", lineHeight: 1.6, marginTop: "28px"
  }
};