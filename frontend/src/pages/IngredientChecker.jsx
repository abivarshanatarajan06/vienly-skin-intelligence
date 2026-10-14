import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API = "http://127.0.0.1:5000";

export default function IngredientChecker() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [productName, setProductName] = useState(
    location.state?.productName || ""
  );
  const [ingredients, setIngredients] = useState(
    typeof location.state?.ingredients === "string"
      ? location.state.ingredients
      : ""
  );
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setUser(JSON.parse(localStorage.getItem("user") || "null"));
    } catch {
      setError("Please log in again to use the Ingredient Checker.");
    }
  }, []);

  async function handleCheck(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    const userId = user?.id ?? user?.user_id;

    if (!userId) {
      setError("Please log in before checking ingredients.");
      return;
    }

    if (!ingredients.trim()) {
      setError("Enter the product's ingredient list first.");
      return;
    }

    setLoading(true);

    try {
      /*
       * This request expects your backend to provide POST /ingredient-checker.
       * If your server uses a different route or request format, that backend
       * endpoint must be matched before this feature can work.
       */
      const response = await fetch(`${API}/ingredient-checker`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: userId,
          product_name: productName.trim() || "My skincare product",
          ingredients: ingredients.trim()
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          "The ingredient-checking endpoint is not available yet."
        );
      }

      setResult(data);
    } catch (err) {
      console.error("INGREDIENT CHECK ERROR:", err);
      setError(
        err.message ||
        "Could not connect to the ingredient checker."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <main style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.brand}>VIENLY</h1>
            <p style={styles.subtitle}>Ingredient Compatibility Checker</p>
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
          <div style={styles.icon}>🧪</div>
          <h2>Check Your Product Ingredients</h2>
          <p style={styles.description}>
            Review ingredient information against your skincare profile.
            Always check the product label and patch-test new products.
          </p>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleCheck}>
            <label style={styles.label} htmlFor="productName">
              Product Name
            </label>
            <input
              id="productName"
              value={productName}
              onChange={(event) => setProductName(event.target.value)}
              placeholder="Enter product name"
              style={styles.input}
            />

            <label style={styles.label} htmlFor="ingredients">
              Ingredients
            </label>
            <textarea
              id="ingredients"
              value={ingredients}
              onChange={(event) => setIngredients(event.target.value)}
              placeholder="Paste the ingredient list from the product label"
              rows={6}
              style={styles.input}
              required
            />

            <button
              type="submit"
              style={styles.primaryButton}
              disabled={loading || !user}
            >
              {loading ? "Checking..." : "Check Compatibility"}
            </button>
          </form>
        </section>

        {result && (
          <section style={styles.resultCard}>
            <h2>Ingredient Check Result</h2>
            <p>
              <strong>Product:</strong>{" "}
              {result.product_name || productName || "Selected product"}
            </p>

            {result.compatibility !== undefined && (
              <p>
                <strong>Compatibility:</strong>{" "}
                {String(result.compatibility)}
              </p>
            )}

            {result.score !== undefined && (
              <p>
                <strong>Score:</strong> {result.score}
              </p>
            )}

            {result.message && <p>{result.message}</p>}

            {Array.isArray(result.warnings) && result.warnings.length > 0 && (
              <>
                <h3>Warnings</h3>
                <ul>
                  {result.warnings.map((warning, index) => (
                    <li key={index}>{String(warning)}</li>
                  ))}
                </ul>
              </>
            )}

            {Array.isArray(result.ingredients) && (
              <>
                <h3>Ingredient Details</h3>
                <ul>
                  {result.ingredients.map((item, index) => (
                    <li key={index}>
                      {typeof item === "string"
                        ? item
                        : item.name || item.ingredient_name || JSON.stringify(item)}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <p style={styles.disclaimer}>
              This result is informational and cannot guarantee that a product
              is safe for you or predict allergic reactions.
            </p>
          </section>
        )}

        <section style={styles.nextCard}>
          <h3>Ready for your daily routine?</h3>
          <p>
            Continue to your morning and evening skincare routine.
          </p>
          <button
            type="button"
            style={styles.primaryButton}
            onClick={() => navigate("/routine")}
          >
            Continue to Personalized Routine
          </button>
          <button
            type="button"
            style={styles.textButton}
            onClick={() => navigate("/recommendations")}
          >
            Back to Product Recommendations
          </button>
        </section>

        <footer style={styles.footer}>
          VIENLY Skin Intelligence
        </footer>
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
    maxWidth: "800px",
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
  card: {
    background: "#fff",
    padding: "28px",
    borderRadius: "18px",
    boxShadow: "0 8px 25px rgba(214,51,132,0.10)"
  },
  icon: {
    fontSize: "40px",
    textAlign: "center"
  },
  description: {
    color: "#777",
    lineHeight: 1.7
  },
  label: {
    display: "block",
    fontWeight: "600",
    marginTop: "20px",
    marginBottom: "8px"
  },
  input: {
    display: "block",
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
    background: "#d63384",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "14px",
    marginTop: "20px",
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
  textButton: {
    width: "100%",
    background: "transparent",
    color: "#b52e70",
    border: "none",
    padding: "12px",
    marginTop: "8px",
    cursor: "pointer",
    fontWeight: "600"
  },
  error: {
    background: "#fff0f0",
    color: "#a11",
    padding: "12px",
    borderRadius: "8px",
    lineHeight: 1.6
  },
  resultCard: {
    marginTop: "20px",
    padding: "25px",
    background: "#fff",
    borderRadius: "16px",
    lineHeight: 1.7,
    overflowWrap: "anywhere"
  },
  disclaimer: {
    fontSize: "13px",
    color: "#765568",
    lineHeight: 1.6
  },
  nextCard: {
    marginTop: "22px",
    background: "#fff",
    borderRadius: "16px",
    padding: "25px",
    lineHeight: 1.7
  },
  footer: {
    textAlign: "center",
    color: "#806477",
    fontSize: "12px",
    marginTop: "25px"
  }
};