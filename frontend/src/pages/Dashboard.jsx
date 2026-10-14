import React, { useEffect, useState } from "react";

const API = "http://127.0.0.1:5000";

function Dashboard() {
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const [dashboard, setDashboard] = useState(null);
  const [profile, setProfile] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [routineSteps, setRoutineSteps] = useState({});
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) {
      setError("User session not found. Please log in again.");
      setLoading(false);
      return;
    }

    let active = true;
    const userId = user.id;

    async function loadData() {
      const requests = await Promise.allSettled([
        fetch(`${API}/dashboard/${userId}`).then((r) => {
          if (!r.ok) throw new Error("Dashboard request failed");
          return r.json();
        }),
        fetch(`${API}/skin-profile/${userId}`).then((r) => {
          if (!r.ok) throw new Error("Skin profile request failed");
          return r.json();
        }),
        fetch(`${API}/skin-assessment/${userId}`).then((r) => {
          if (!r.ok) throw new Error("Skin assessment request failed");
          return r.json();
        }),
        fetch(`${API}/product-recommendations/${userId}`).then((r) => {
          if (!r.ok) throw new Error("Recommendations request failed");
          return r.json();
        }),
        fetch(`${API}/routine/${userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`
          }
        }).then((r) => {
          if (!r.ok) throw new Error("Routine request failed");
          return r.json();
        }),
        fetch(`${API}/progress/${userId}`).then((r) => {
          if (!r.ok) throw new Error("Progress request failed");
          return r.json();
        })
      ]);

      if (!active) return;

      const value = (index) =>
        requests[index].status === "fulfilled"
          ? requests[index].value
          : null;

      setDashboard(value(0));
      setProfile(value(1)?.profile || null);
      setAssessment(value(2)?.assessment || null);

      const recommendationData = value(3);

      setRecommendations(
        Array.isArray(recommendationData?.recommendations)
          ? recommendationData.recommendations
          : []
      );

      setRoutineSteps(value(4)?.routine?.completed_steps || {});

      const progressData = value(5);

      if (Array.isArray(progressData?.progress)) {
        setProgress(progressData.progress);
      } else if (Array.isArray(progressData)) {
        setProgress(progressData);
      } else {
        setProgress([]);
      }

      setLoading(false);
    }

    loadData().catch((err) => {
      console.error("DASHBOARD ERROR:", err);

      if (active) {
        setError("Unable to load your dashboard. Please try again.");
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [user]);

  const openPage = (path) => {
    window.location.href = path;
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          <h2>Loading Your Dashboard...</h2>
          <p>Preparing your personalized skincare journey.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          <h2>VIENLY Dashboard</h2>
          <p style={styles.error}>{error}</p>
          <button
            style={styles.primaryButton}
            onClick={() => openPage("/login")}
          >
            Login Again
          </button>
          <button
            style={styles.secondaryButton}
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalRoutineSteps = 7;

  const completedRoutineSteps = Object.values(routineSteps).filter(
    (value) => value === true
  ).length;

  const routineComplete = completedRoutineSteps >= totalRoutineSteps;
  const routineStarted = completedRoutineSteps > 0;
  const profileComplete = Boolean(profile?.id);
  const assessmentComplete = Boolean(assessment?.id);

  const recommendationsReady =
    profileComplete &&
    assessmentComplete &&
    recommendations.length > 0;

  const progressComplete = progress.length > 0;

  const journey = [
    {
      id: "profile",
      title: "Skin Profile",
      description: "Save your skin type, concerns, and sensitivity.",
      done: profileComplete,
      path: "/skin-profile",
      button: "Open Skin Profile"
    },
    {
      id: "lifestyle",
      title: "Lifestyle Tracking",
      description: "Record water intake, exercise, and stress.",
      done: false,
      path: "/lifestyle",
      button: "Enter Lifestyle Details",
      locked: !profileComplete
    },
    {
      id: "sleep",
      title: "Sleep Tracking",
      description: "Record sleep duration and sleep quality.",
      done: false,
      path: "/sleep-tracking",
      button: "Record Sleep",
      locked: !profileComplete
    },
    {
      id: "assessment",
      title: "Skin Assessment",
      description: "Record your current skin condition.",
      done: assessmentComplete,
      path: "/skin-assessment",
      button: "Start Assessment",
      locked: !profileComplete
    },
    {
      id: "recommendations",
      title: "Product Recommendations",
      description: "Explore products matched to your skin information.",
      done: recommendationsReady,
      path: "/recommendations",
      button: "View Recommendations",
      locked: !profileComplete || !assessmentComplete
    },
    {
      id: "ingredients",
      title: "Ingredient Checker",
      description: "Review ingredients and product compatibility.",
      done: false,
      path: "/ingredient-checker",
      button: "Check Ingredients",
      locked: !recommendationsReady
    },
    {
      id: "routine",
      title: "Personalized Skincare Routine",
      description: `${completedRoutineSteps} of ${totalRoutineSteps} routine steps completed.`,
      done: routineComplete,
      inProgress: routineStarted && !routineComplete,
      path: "/routine",
      button: routineStarted ? "Continue Routine" : "Start Routine",
      locked: !recommendationsReady
    },
    {
      id: "progress",
      title: "Progress Tracking",
      description: "Save and review your skin progress records.",
      done: progressComplete,
      path: "/progress",
      button: "Track My Progress",
      locked: !routineComplete
    },
    {
      id: "analytics",
      title: "Skincare Analytics",
      description: "Review your progress history and trends.",
      done: false,
      path: "/analytics",
      button: "View Analytics",
      locked: !progressComplete
    }
  ];

  const nextAvailableStep = journey.find(
    (step) => !step.done && !step.locked
  );

  const latestProgress = progress[0] || null;

  const rawScore =
    assessment?.skin_score ??
    assessment?.score ??
    latestProgress?.skin_score ??
    dashboard?.skin_score;

  const skinScore =
    rawScore !== null &&
    rawScore !== undefined &&
    rawScore !== "" &&
    Number.isFinite(Number(rawScore))
      ? Number(rawScore)
      : null;

  let skinStatus = "Not assessed";

  if (skinScore !== null) {
    if (skinScore < 50) {
      skinStatus = "Needs Attention";
    } else if (skinScore < 75) {
      skinStatus = "Moderate";
    } else {
      skinStatus = "Good";
    }
  }

  const displayName = user?.full_name || user?.name || "User";

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.brand}>VIENLY Skin Intelligence</h1>
          <p>Welcome back, {displayName}!</p>
        </div>

        <div style={styles.headerActions}>
          <button
            style={styles.notificationButton}
            onClick={() => openPage("/notifications")}
          >
            🔔 Notifications
          </button>

          <button style={styles.logoutButton} onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <section style={styles.welcomeCard}>
        <h2>Your Personalized Skin Dashboard</h2>
        <p>
          Complete your skin profile, lifestyle and sleep details,
          skin assessment, and product selection to build your
          personalized skincare routine.
        </p>
      </section>

      <section style={styles.journeySection}>
        <h2>Your Skincare Journey</h2>
        <p style={styles.muted}>
          Select a section to continue. Your saved information
          can be revisited whenever needed.
        </p>

        <div style={styles.nextCard}>
          <div>
            <span style={styles.nextLabel}>
              {nextAvailableStep ? "YOUR NEXT STEP" : "KEEP GOING"}
            </span>
            <h3>
              {nextAvailableStep
                ? nextAvailableStep.title
                : "Review your skincare progress"}
            </h3>
            <p>
              {nextAvailableStep
                ? nextAvailableStep.description
                : "Visit your routine, progress records, and analytics."}
            </p>
          </div>

          <button
            style={styles.primaryButton}
            onClick={() =>
              openPage(nextAvailableStep?.path || "/progress")
            }
          >
            {nextAvailableStep ? nextAvailableStep.button : "View Progress"}
          </button>
        </div>

        <div style={styles.journeyList}>
          {journey.map((step, index) => {
            const status = step.done
              ? "Completed"
              : step.locked
              ? "Complete earlier steps first"
              : step.inProgress
              ? "In progress"
              : "Ready to open";

            return (
              <div key={step.id} style={styles.journeyItem}>
                <div style={styles.stepNumber}>
                  {step.done ? "✓" : index + 1}
                </div>

                <div style={styles.stepContent}>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  <span
                    style={{
                      ...styles.status,
                      ...(step.done
                        ? styles.statusDone
                        : step.locked
                        ? styles.statusLocked
                        : step.inProgress
                        ? styles.statusProgress
                        : styles.statusPending)
                    }}
                  >
                    {status}
                  </span>
                </div>

                <button
                  style={{
                    ...styles.smallButton,
                    ...(step.locked ? styles.disabledButton : {})
                  }}
                  disabled={step.locked}
                  onClick={() => openPage(step.path)}
                >
                  {step.done ? "Revisit" : "Open"}
                </button>
              </div>
            );
          })}
        </div>
      </section>
      <section style={styles.scoreSection}>
        <div style={styles.scoreCard}>
          <h3>Skin Health Score</h3>
          <div style={styles.scoreCircle}>
            <span style={styles.scoreNumber}>
              {skinScore !== null ? skinScore : "--"}
            </span>
            <span style={styles.scoreTotal}>/100</span>
          </div>
          <p style={styles.scoreStatus}>{skinStatus}</p>
          <button
            style={styles.primaryButton}
            onClick={() =>
              openPage(
                assessmentComplete
                  ? "/skin-assessment"
                  : "/skin-profile"
              )
            }
          >
            {assessmentComplete ? "Review Assessment" : "Start Skin Journey"}
          </button>
        </div>

        <div style={styles.infoCard}>
          <h3>Your Skin Intelligence</h3>
          <p>
            VIENLY uses your saved skin profile and assessment
            to help provide personalized product recommendations.
            Keep your details accurate and review product
            ingredients before use.
          </p>
          <button
            style={styles.secondaryButton}
            onClick={() => openPage("/skin-profile")}
          >
            View Skin Profile
          </button>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2>Product Recommendations</h2>
            <p>Products selected using your available skin information.</p>
          </div>
          <button
            style={styles.linkButton}
            onClick={() => openPage("/recommendations")}
          >
            View All Products
          </button>
        </div>

        {recommendations.length === 0 ? (
          <div style={styles.emptyCard}>
            <h3>No recommendations available yet</h3>
            <p>
              Save your skin profile and complete your assessment
              to check for matching products.
            </p>
            <button
              style={styles.primaryButton}
              onClick={() =>
                openPage(
                  profileComplete ? "/skin-assessment" : "/skin-profile"
                )
              }
            >
              {profileComplete ? "Complete Assessment" : "Create Skin Profile"}
            </button>
          </div>
        ) : (
          <div style={styles.productGrid}>
            {recommendations.slice(0, 3).map((product, index) => (
              <div
                key={product.id || product.product_id || index}
                style={styles.productCard}
              >
                <div style={styles.productIcon}>🧴</div>
                <h3>
                  {product.name || product.product_name || "Skincare Product"}
                </h3>
                <p style={styles.productCategory}>
                  {product.category || "Skincare"}
                </p>
                {product.brand && <p>Brand: {product.brand}</p>}
                {product.price != null && (
                  <p style={styles.price}>₹{product.price}</p>
                )}
                {product.recommendation_score != null && (
                  <p style={styles.matchScore}>
                    Suitability Score: {product.recommendation_score}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2>My Progress</h2>
            <p>Review your recorded skin health and progress history.</p>
          </div>
          <button
            style={styles.primaryButton}
            onClick={() => openPage("/progress")}
          >
            View Progress
          </button>
        </div>

        <div style={styles.progressGrid}>
          <div style={styles.progressCard}>
            <h3>Current Score</h3>
            <strong style={styles.progressNumber}>
              {skinScore !== null ? `${skinScore}/100` : "--"}
            </strong>
            <p>{skinStatus}</p>
          </div>

          <div style={styles.progressCard}>
            <h3>Progress Records</h3>
            <strong style={styles.progressNumber}>{progress.length}</strong>
            <p>Saved records</p>
          </div>

          <div style={styles.progressCard}>
            <h3>Skincare Analytics</h3>
            <div style={styles.productIcon}>📊</div>
            <p>Explore your skincare trends.</p>
            <button
              style={styles.smallButton}
              onClick={() => openPage("/analytics")}
            >
              Open Analytics
            </button>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2>Quick Access</h2>
            <p>Return to any section of your skincare journey.</p>
          </div>
        </div>

        <div style={styles.quickGrid}>
          {[
            ["Skin Profile", "/skin-profile", "👤"],
            ["Lifestyle", "/lifestyle", "🌿"],
            ["Sleep Tracking", "/sleep-tracking", "🌙"],
            ["Skin Assessment", "/skin-assessment", "🔎"],
            ["Recommendations", "/recommendations", "🧴"],
            ["Dermatologist Consultation", "/consultation", ""],
            ["Ingredient Checker", "/ingredient-checker", "🧪"],
            ["Daily Routine", "/routine", "✨"],
            ["Progress", "/progress", "📈"],
            ["Analytics", "/analytics", "📊"],
            ["Notifications", "/notifications", "🔔"]
          ].map(([title, path, emoji]) => (
            <button
              key={path}
              style={styles.quickButton}
              onClick={() => openPage(path)}
            >
              <span style={styles.quickIcon}>{emoji}</span>
              <span>{title}</span>
            </button>
          ))}
        </div>
      </section>

      <footer style={styles.footer}>
        <h3>VIENLY Skin Intelligence</h3>
        <p>Your personalized skincare companion.</p>
        <p>
          Keep your information updated and record your progress regularly.
        </p>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #fff1f7, #ffe5ef)",
    padding: "30px 20px",
    fontFamily: "Arial, Helvetica, sans-serif",
    color: "#333"
  },
  loadingCard: {
    maxWidth: "600px",
    margin: "80px auto",
    padding: "35px",
    background: "#fff",
    borderRadius: "18px",
    textAlign: "center",
    boxShadow: "0 8px 25px rgba(214, 51, 132, 0.12)"
  },
  error: { color: "#b42318", lineHeight: 1.6 },
  header: {
    maxWidth: "1150px",
    margin: "0 auto 25px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap"
  },
  headerActions: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap"
  },
  brand: { color: "#b52e70" },
  welcomeCard: {
    maxWidth: "1150px",
    margin: "0 auto 25px",
    background: "linear-gradient(135deg, #d63384, #f783ac)",
    color: "#fff",
    padding: "30px",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(214, 51, 132, 0.18)",
    lineHeight: 1.7
  },
  journeySection: {
    maxWidth: "1150px",
    margin: "0 auto 25px",
    background: "#fff",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 8px 25px rgba(214, 51, 132, 0.10)"
  },
  muted: { color: "#777", lineHeight: 1.6 },
  nextCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
    background: "#fff5fa",
    border: "1px solid #f3d3e1",
    borderRadius: "15px",
    padding: "22px",
    margin: "20px 0"
  },
  nextLabel: {
    color: "#b52e70",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "1px"
  },
  journeyList: { display: "grid", gap: "12px" },
  journeyItem: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "17px",
    border: "1px solid #f1d5e2",
    borderRadius: "13px",
    background: "#fff",
    flexWrap: "wrap"
  },
  stepNumber: {
    minWidth: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "#fce1ed",
    color: "#b52e70",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700"
  },
  stepContent: { flex: 1, minWidth: "180px" },
  status: {
    display: "inline-block",
    fontSize: "12px",
    padding: "5px 9px",
    borderRadius: "20px",
    marginTop: "5px"
  },
  statusDone: { background: "#dcfce7", color: "#166534" },
  statusLocked: { background: "#f3f4f6", color: "#6b7280" },
  statusProgress: { background: "#fef3c7", color: "#92400e" },
  statusPending: { background: "#fce7f3", color: "#9d174d" },
  scoreSection: {
    maxWidth: "1150px",
    margin: "0 auto 25px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px"
  },
  scoreCard: {
    background: "#fff",
    borderRadius: "20px",
    padding: "25px",
    textAlign: "center",
    boxShadow: "0 8px 25px rgba(214, 51, 132, 0.10)"
  },
  scoreCircle: {
    width: "130px",
    height: "130px",
    margin: "20px auto",
    borderRadius: "50%",
    border: "8px solid #f3c1d7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "3px",
    color: "#b52e70"
  },
  scoreNumber: { fontSize: "36px", fontWeight: "700" },
  scoreTotal: { fontSize: "14px" },
  scoreStatus: { fontWeight: "700", color: "#b52e70" },
  infoCard: {
    background: "#fff",
    borderRadius: "20px",
    padding: "25px",
    lineHeight: 1.8,
    boxShadow: "0 8px 25px rgba(214, 51, 132, 0.10)"
  },
  section: {
    maxWidth: "1150px",
    margin: "0 auto 25px",
    background: "#fff",
    padding: "25px",
    borderRadius: "20px",
    boxShadow: "0 8px 25px rgba(214, 51, 132, 0.10)"
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    flexWrap: "wrap",
    marginBottom: "20px"
  },
  emptyCard: {
    background: "#fff5fa",
    borderRadius: "14px",
    padding: "25px",
    textAlign: "center"
  },
  productGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px"
  },
  productCard: {
    border: "1px solid #f1d5e2",
    borderRadius: "15px",
    padding: "20px",
    background: "#fffafd"
  },
  productIcon: { fontSize: "28px" },
  productCategory: { color: "#777" },
  price: { color: "#b52e70", fontWeight: "700" },
  matchScore: { color: "#166534", fontWeight: "700" },
  progressGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px"
  },
  progressCard: {
    padding: "20px",
    border: "1px solid #f1d5e2",
    borderRadius: "15px",
    background: "#fffafd"
  },
  progressNumber: { fontSize: "28px", color: "#b52e70" },
  quickGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px"
  },
  quickButton: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "16px",
    border: "1px solid #f1d5e2",
    borderRadius: "12px",
    background: "#fff5fa",
    color: "#8e2458",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600"
  },
  quickIcon: { fontSize: "20px" },
  primaryButton: {
    background: "#c72e78",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    cursor: "pointer",
    fontWeight: "700"
  },
  notificationButton: {
    background: "#fff",
    color: "#a52362",
    border: "1px solid #e9a7c5",
    borderRadius: "10px",
    padding: "12px 16px",
    cursor: "pointer",
    fontWeight: "700"
  },
  logoutButton: {
    background: "#fff",
    color: "#b42318",
    border: "1px solid #f0b5b0",
    borderRadius: "10px",
    padding: "12px 18px",
    cursor: "pointer",
    fontWeight: "700"
  },
  secondaryButton: {
    background: "#fff",
    color: "#b52e70",
    border: "1px solid #d63384",
    borderRadius: "10px",
    padding: "12px 18px",
    cursor: "pointer",
    fontWeight: "700"
  },
  smallButton: {
    background: "#d63384",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: "600"
  },
  disabledButton: {
    background: "#e5e7eb",
    color: "#6b7280",
    cursor: "not-allowed"
  },
  linkButton: {
    background: "transparent",
    color: "#b52e70",
    border: "none",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px"
  },
  footer: {
    maxWidth: "1150px",
    margin: "35px auto 0",
    textAlign: "center",
    color: "#8e2458",
    lineHeight: 1.7
  }
};

export default Dashboard;