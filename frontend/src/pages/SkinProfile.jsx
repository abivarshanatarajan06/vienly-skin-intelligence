import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://127.0.0.1:5000";

function SkinProfile() {
const navigate = useNavigate();

const [user, setUser] = useState(null);
const [skinType, setSkinType] = useState("");
const [concerns, setConcerns] = useState([]);
const [sensitivity, setSensitivity] = useState("");
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState("");
const [error, setError] = useState("");

useEffect(() => {
let savedUser = null;

try {
  savedUser = JSON.parse(localStorage.getItem("user") || "null");
} catch {
  savedUser = null;
}

if (!savedUser?.id) {
  setError("Please log in before creating your skin profile.");
  return;
}

setUser(savedUser);

async function loadProfile() {
  try {
    const response = await fetch(
      `${API}/skin-profile/${savedUser.id}`
    );

    if (!response.ok) {
      throw new Error("Unable to load your skin profile.");
    }

    const data = await response.json();
    const profile = data.profile;

    if (profile) {
      setSkinType(profile.skin_type || "");
      setSensitivity(profile.sensitivity || "");

      if (profile.concerns) {
        setConcerns(
          Array.isArray(profile.concerns)
            ? profile.concerns
            : profile.concerns
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
        );
      }
    }
  } catch (err) {
    setError(err.message || "Unable to load your profile.");
  }
}

loadProfile();

}, []);

const toggleConcern = (concern) => {
setConcerns((previous) =>
previous.includes(concern)
? previous.filter((item) => item !== concern)
: [...previous, concern]
);
};

const handleSubmit = async (event) => {
event.preventDefault();
setError("");
setMessage("");

if (!user?.id) {
  setError("Please log in again and try.");
  return;
}

if (!skinType || !sensitivity || concerns.length === 0) {
  setError(
    "Please select your skin type, at least one skin concern, and sensitivity."
  );
  return;
}

setLoading(true);

try {
  const response = await fetch(`${API}/skin-profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: user.id,
      skin_type: skinType,
      concerns: concerns.join(", "),
      sensitivity: sensitivity,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to save your skin profile."
    );
  }

  setMessage("Skin profile saved successfully!");

  // Continue to the next step in the skincare journey.
  setTimeout(() => {
    navigate("/lifestyle");
  }, 700);
} catch (err) {
  setError(err.message || "Something went wrong while saving.");
} finally {
  setLoading(false);
}

};

const styles = {
page: {
minHeight: "100vh",
background: "linear-gradient(135deg, #fff1f7, #fce7f3)",
display: "flex",
justifyContent: "center",
alignItems: "center",
padding: "30px 16px",
fontFamily: "Arial, sans-serif",
boxSizing: "border-box",
},
card: {
background: "#ffffff",
width: "100%",
maxWidth: "600px",
padding: "32px",
borderRadius: "20px",
boxShadow: "0 10px 35px rgba(157, 23, 77, 0.12)",
boxSizing: "border-box",
},
heading: {
color: "#9d174d",
textAlign: "center",
marginBottom: "8px",
},
subtitle: {
color: "#777777",
textAlign: "center",
marginBottom: "28px",
lineHeight: 1.5,
},
label: {
display: "block",
fontWeight: "bold",
color: "#444444",
marginBottom: "10px",
marginTop: "22px",
},
options: {
display: "flex",
flexWrap: "wrap",
gap: "10px",
},
option: {
border: "1px solid #e9a8c6",
borderRadius: "10px",
padding: "11px 15px",
cursor: "pointer",
background: "#fff7fb",
color: "#6b2146",
},
selected: {
border: "2px solid #be185d",
borderRadius: "10px",
padding: "10px 14px",
cursor: "pointer",
background: "#fce7f3",
color: "#9d174d",
fontWeight: "bold",
},
button: {
width: "100%",
padding: "14px",
marginTop: "28px",
background: "#be185d",
color: "#ffffff",
border: "none",
borderRadius: "10px",
fontSize: "16px",
fontWeight: "bold",
cursor: "pointer",
},
message: {
color: "#15803d",
background: "#f0fdf4",
padding: "12px",
borderRadius: "8px",
marginTop: "16px",
},
error: {
color: "#b91c1c",
background: "#fef2f2",
padding: "12px",
borderRadius: "8px",
marginTop: "16px",
},
};

const skinTypes = ["Oily", "Dry", "Combination", "Normal"];
const skinConcerns = [
"Acne",
"Dark spots",
"Dryness",
"Redness",
"Wrinkles",
"Uneven skin tone",
];
const sensitivities = ["Low", "Medium", "High"];

return (
<div style={styles.page}>
<div style={styles.card}>
<h1 style={styles.heading}>Your Skin Profile</h1>

    <p style={styles.subtitle}>
      Tell us about your skin so VIENLY can personalize your skincare
      journey.
    </p>

    <form onSubmit={handleSubmit}>
      <label style={styles.label}>1. What is your skin type?</label>

      <div style={styles.options}>
        {skinTypes.map((type) => (
          <button
            key={type}
            type="button"
            style={skinType === type ? styles.selected : styles.option}
            onClick={() => setSkinType(type)}
          >
            {type}
          </button>
        ))}
      </div>

      <label style={styles.label}>
        2. What are your skin concerns?
      </label>

      <div style={styles.options}>
        {skinConcerns.map((concern) => (
          <label
            key={concern}
            style={{
              ...(
                concerns.includes(concern)
                  ? styles.selected
                  : styles.option
              ),
              display: "flex",
              alignItems: "center",
              gap: "7px",
            }}
          >
            <input
              type="checkbox"
              checked={concerns.includes(concern)}
              onChange={() => toggleConcern(concern)}
            />
            {concern}
          </label>
        ))}
      </div>

      <label style={styles.label}>
        3. How sensitive is your skin?
      </label>

      <div style={styles.options}>
        {sensitivities.map((level) => (
          <button
            key={level}
            type="button"
            style={
              sensitivity === level ? styles.selected : styles.option
            }
            onClick={() => setSensitivity(level)}
          >
            {level}
          </button>
        ))}
      </div>

      {message && <div style={styles.message}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}

      <button
        type="submit"
        disabled={loading}
        style={{
          ...styles.button,
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Saving..." : "Save Profile & Continue"}
      </button>
    </form>
  </div>
</div>

);
}

export default SkinProfile;