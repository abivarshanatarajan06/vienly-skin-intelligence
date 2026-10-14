import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://127.0.0.1:5000";

export default function Recommendations() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadRecommendations() {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        const id = user?.id ?? user?.user_id;

        if (!id) {
          throw new Error("Please log in before viewing recommendations.");
        }

        if (cancelled) return;
        setUserId(id);

        const response = await fetch(
          `${API}/product-recommendations/${id}`
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message ||
            data.error ||
            "Could not load product recommendations."
          );
        }

        if (cancelled) return;

        setRecommendations(
          Array.isArray(data.recommendations)
            ? data.recommendations
            : []
        );
        setProfile(data.profile || null);
        setAssessment(data.assessment || null);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load recommendations.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, []);

  function getProductName(product) {
    return (
      product.product_name ||
      product.name ||
      product.title ||
      "Recommended skincare product"
    );
  }

  function getIngredients(product) {
    const value =
      product.ingredients ||
      product.ingredient_names ||
      product.key_ingredients;

    if (Array.isArray(value)) {
      return value
        .map((item) =>
          typeof item === "string"
            ? item
            : item?.name || item?.ingredient_name || ""
        )
        .filter(Boolean)
        .join(", ");
    }

    if (typeof value === "string" && value.trim()) {
      return value;
    }

    return "Check the product label for its full ingredient list.";
  }

  function getReason(product) {
    return (
      product.reason ||
      product.recommendation_reason ||
      product.match_reason ||
      "Selected from the available product information and your skincare data."
    );
  }

  function getMatch(product) {
    const value =
      product.match_score ??
      product.score ??
      product.compatibility_score;

    if (value === undefined || value === null || value === "") {
      return null;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.messageCard}>Loading your recommendations...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <main style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.brand}>VIENLY</h1>
            <p style={styles.subtitle}>Personalized Product Recommendations</p>
          </div>

          <button
            style={styles.secondaryButton}
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>
        </header>

        <section style={styles.hero}>
          <div style={styles.heroIcon}>🧴</div>
          <h2>Your Skincare Recommendations</h2>
          <p>
            Explore products selected using the skincare information
            available in your account.
          </p>
        </section>

        {error && (
          <div style={styles.error}>
            {error}
            <button
              style={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        {!error && (
          <>
            <section style={styles.summary}>
              <div style={styles.summaryCard}>
                <span style={styles.summaryLabel}>Skin Profile</span>
                <strong>
                  {profile?.skin_type || "Not available"}
                </strong>
              </div>

              <div style={styles.summaryCard}>
                <span style={styles.summaryLabel}>Products Found</span>
                <strong>{recommendations.length}</strong>
              </div>

              <div style={styles.summaryCard}>
                <span style={styles.summaryLabel}>Assessment</span>
                <strong>{assessment ? "Available" : "Not available"}</strong>
              </div>
            </section>

            {recommendations.length === 0 ? (
              <section style={styles.emptyCard}>
                <div style={styles.heroIcon}>🔎</div>
                <h3>No recommendations returned</h3>
                <p>
                  Your backend did not return any matching products. Make
                  sure your products table contains records and your skin
                  profile has been saved.
                </p>
                <button
                  style={styles.primaryButton}
                  onClick={() => navigate("/skin-profile")}
                >
                  Review Skin Profile
                </button>
                <button
                  style={styles.secondaryWideButton}
                  onClick={() => navigate("/skin-assessment")}
                >
                  Update Skin Assessment
                </button>
              </section>
            ) : (
              <section>
                <h2 style={styles.sectionTitle}>Recommended for You</h2>

                <div style={styles.productGrid}>
                  {recommendations.map((product, index) => {
                    const name = getProductName(product);
                    const match = getMatch(product);

                    return (
                      <article
                        key={
                          product.id ??
                          product.product_id ??
                          `${name}-${index}`
                        }
                        style={styles.productCard}
                      >
                        <div style={styles.productIcon}>🧴</div>

                        <h3 style={styles.productName}>{name}</h3>

                        {product.category && (
                          <span style={styles.category}>
                            {product.category}
                          </span>
                        )}

                        {product.brand && (
                          <p style={styles.brandText}>
                            Brand: {product.brand}
                          </p>
                        )}

                        <p style={styles.reason}>{getReason(product)}</p>

                        <div style={styles.ingredientBox}>
                          <strong>Ingredients</strong>
                          <p>{getIngredients(product)}</p>
                        </div>

                        {product.price !== undefined &&
                          product.price !== null && (
                            <p style={styles.price}>
                              Price: ₹{product.price}
                            </p>
                          )}

                        {match !== null && (
                          <p style={styles.match}>
                            Match score: {match}
                          </p>
                        )}

                        <button
                          style={styles.productButton}
                          onClick={() =>
                            navigate("/ingredient-checker", {
                              state: {
                                productId:
                                  product.id ?? product.product_id ?? null,
                                productName: name,
                                ingredients: getIngredients(product)
                              }
                            })
                          }
                        >
                          Check Ingredients
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            <section style={styles.nextSection}>
              <h2>Continue Your Skincare Journey</h2>
              <p>
                Check ingredient compatibility, then build your daily
                morning and evening routine.
              </p>

              <button
                style={styles.primaryButton}
                onClick={() => navigate("/ingredient-checker")}
              >
                Continue to Ingredient Checker
              </button>

              <button
                style={styles.secondaryWideButton}
                onClick={() => navigate("/routine")}
              >
                Open Personalized Routine
              </button>

              <button
                style={styles.linkButton}
                onClick={() => navigate("/progress")}
              >
                View Progress Tracking
              </button>
            </section>
          </>
        )}

        <footer style={styles.footer}>
          VIENLY · Recommendations are informational and are not a substitute
          for professional medical advice.
        </footer>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "25px 16px",
    background: "linear-gradient(135deg, #fff1f7, #ffe5ef)",
    fontFamily: "Arial, Helvetica, sans-serif",
    color: "#333"
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
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
  hero: {
    background: "#fff",
    borderRadius: "20px",
    padding: "30px",
    textAlign: "center",
    boxShadow: "0 8px 25px rgba(214,51,132,0.10)",
    marginBottom: "22px"
  },
  heroIcon: {
    fontSize: "40px"
  },
  summary: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "15px",
    marginBottom: "28px"
  },
  summaryCard: {
    background: "#fff",
    borderRadius: "14px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  summaryLabel: {
    color: "#806477",
    fontSize: "13px"
  },
  sectionTitle: {
    color: "#733454",
    marginBottom: "18px"
  },
  productGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "20px"
  },
  productCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "22px",
    boxShadow: "0 5px 18px rgba(214,51,132,0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: "10px",
    minWidth: 0
  },
  productIcon: {
    fontSize: "32px"
  },
  productName: {
    color: "#733454",
    margin: 0,
    overflowWrap: "anywhere"
  },
  category: {
    display: "inline-block",
    color: "#a52b6a",
    background: "#fff0f7",
    borderRadius: "20px",
    padding: "6px 10px",
    fontSize: "12px",
    alignSelf: "flex-start"
  },
  brandText: {
    color: "#765568",
    margin: 0
  },
  reason: {
    lineHeight: 1.6,
    color: "#666"
  },
  ingredientBox: {
    background: "#fff7fb",
    borderRadius: "10px",
    padding: "12px",
    overflowWrap: "anywhere",
    lineHeight: 1.6
  },
  price: {
    fontWeight: "700",
    color: "#b52e70"
  },
  match: {
    color: "#555",
    fontSize: "13px"
  },
  productButton: {
    marginTop: "auto",
    background: "#d63384",
    color: "#fff",
    border: "none",
    borderRadius: "9px",
    padding: "12px",
    fontWeight: "700",
    cursor: "pointer"
  },
  primaryButton: {
    width: "100%",
    background: "#d63384",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "14px",
    marginTop: "12px",
    fontWeight: "700",
    cursor: "pointer"
  },
  secondaryButton: {
    background: "#fff",
    color: "#b52e70",
    border: "1px solid #d63384",
    padding: "10px 15px",
    borderRadius: "9px",
    cursor: "pointer"
  },
  secondaryWideButton: {
    width: "100%",
    background: "#fff",
    color: "#b52e70",
    border: "1px solid #d63384",
    borderRadius: "10px",
    padding: "13px",
    marginTop: "12px",
    fontWeight: "700",
    cursor: "pointer"
  },
  linkButton: {
    display: "block",
    margin: "18px auto 0",
    background: "transparent",
    color: "#b52e70",
    border: "none",
    cursor: "pointer",
    fontWeight: "700"
  },
  emptyCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "28px",
    textAlign: "center",
    lineHeight: 1.7
  },
  nextSection: {
    background: "#fff",
    borderRadius: "18px",
    padding: "25px",
    marginTop: "30px",
    lineHeight: 1.7
  },
  messageCard: {
    maxWidth: "600px",
    margin: "60px auto",
    padding: "30px",
    background: "#fff",
    borderRadius: "15px",
    textAlign: "center"
  },
  error: {
    background: "#fff0f0",
    color: "#a11",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "20px"
  },
  retryButton: {
    display: "block",
    marginTop: "12px",
    padding: "9px 14px",
    cursor: "pointer"
  },
  footer: {
    textAlign: "center",
    color: "#806477",
    fontSize: "12px",
    lineHeight: 1.6,
    marginTop: "28px"
  }
};