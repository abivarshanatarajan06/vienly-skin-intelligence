import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://127.0.0.1:5000";

function Onboarding() {
  const navigate = useNavigate();

  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;

  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");

  const [skinData, setSkinData] = useState({
    skin_type: "",
    concerns: "",
    sensitivity: ""
  });

  const [lifestyleData, setLifestyleData] = useState({
    activity_level: "",
    stress_level: "",
    exercise: "",
    diet: "",
    water_intake: "",
    allergies: "",
    environmental_exposure: ""
  });

  const [sleepData, setSleepData] = useState({
    sleep_duration: "",
    sleep_quality: ""
  });

  // ================================
  // SAVE SKIN PROFILE
  // ================================

  const saveSkinProfile = async () => {
    setMessage("");

    if (!user || !user.id) {
      setMessage("User session not found. Please login again.");
      return;
    }

    if (!skinData.skin_type) {
      setMessage("Please select your skin type.");
      return;
    }

    try {
      const response = await fetch(`${API}/skin-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: Number(user.id),
          skin_type: skinData.skin_type,
          concerns: skinData.concerns,
          sensitivity: skinData.sensitivity
        })
      });

      const data = await response.json();

      console.log("SKIN PROFILE RESPONSE:", data);

      if (!response.ok) {
        setMessage(
          data.message || "Failed to save skin profile"
        );
        return;
      }

      setMessage("Skin profile saved successfully!");

      setTimeout(() => {
        setMessage("");
        setStep(2);
      }, 500);

    } catch (error) {
      console.error("SKIN PROFILE ERROR:", error);
      setMessage("Unable to connect to the server.");
    }
  };

  // ================================
  // SAVE LIFESTYLE
  // ================================

  const saveLifestyle = async () => {
    setMessage("");

    if (!user || !user.id) {
      setMessage("User session not found. Please login again.");
      return;
    }

    try {
      const response = await fetch(`${API}/lifestyle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: Number(user.id),
          activity_level:
            lifestyleData.activity_level || "",
          stress_level:
            lifestyleData.stress_level || "",
          workout_frequency:
            lifestyleData.exercise || "",
          diet_type:
            lifestyleData.diet || "",
          water_intake:
            Number(lifestyleData.water_intake) || 0,
          allergies:
            lifestyleData.allergies || "",
          environmental_exposure:
            lifestyleData.environmental_exposure || ""
        })
      });

      const data = await response.json();

      console.log("LIFESTYLE RESPONSE:", data);

      if (!response.ok) {
        setMessage(
          data.message || "Failed to save lifestyle"
        );
        return;
      }

      setMessage("Lifestyle saved successfully!");

      setTimeout(() => {
        setMessage("");
        setStep(3);
      }, 500);

    } catch (error) {
      console.error("LIFESTYLE ERROR:", error);
      setMessage("Unable to connect to the server.");
    }
  };

  // ================================
  // SAVE SLEEP
  // ================================

  const saveSleep = async () => {
    setMessage("");

    if (!user || !user.id) {
      setMessage("User session not found. Please login again.");
      return;
    }

    const duration = Number(sleepData.sleep_duration);
    const quality = Number(sleepData.sleep_quality);

    if (sleepData.sleep_duration === "") {
      setMessage("Please enter your sleep duration.");
      return;
    }

    if (
      Number.isNaN(duration) ||
      duration < 0 ||
      duration > 24
    ) {
      setMessage(
        "Sleep duration must be between 0 and 24 hours"
      );
      return;
    }

    if (sleepData.sleep_quality === "") {
      setMessage("Please select your sleep quality.");
      return;
    }

    if (
      Number.isNaN(quality) ||
      quality < 1 ||
      quality > 5
    ) {
      setMessage(
        "Sleep quality must be between 1 and 5"
      );
      return;
    }

    try {
      const response = await fetch(`${API}/sleep`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: Number(user.id),

          // IMPORTANT:
          // Backend expects sleep_duration
          sleep_duration: duration,

          // Backend expects 1 to 5
          sleep_quality: quality
        })
      });

      const data = await response.json();

      console.log("SLEEP RESPONSE:", data);

      if (!response.ok) {
        setMessage(
          data.message || "Failed to save sleep information"
        );
        return;
      }

      setMessage(
        "Sleep information saved successfully!"
      );

      setTimeout(() => {
        setMessage("");
        setStep(4);
      }, 700);

    } catch (error) {
      console.error("SLEEP ERROR:", error);
      setMessage("Unable to connect to the server.");
    }
  };

  // ================================
  // GO TO SKIN ASSESSMENT
  // ================================

  const goToAssessment = () => {
    navigate("/skin-assessment");
  };

  // ================================
  // UI
  // ================================

  return (
    <div style={styles.page}>

      <div style={styles.container}>

        <h1 style={styles.title}>
          VIENLY'S SKIN INTELLIGENCE
        </h1>

        <p style={styles.subtitle}>
          Let's understand your skin and lifestyle
        </p>

        <div style={styles.stepText}>
          Step {step} of 4
        </div>

        {message && (
          <div style={styles.message}>
            {message}
          </div>
        )}

        {/* ========================================= */}
        {/* STEP 1 - SKIN PROFILE */}
        {/* ========================================= */}

        {step === 1 && (
          <div style={styles.card}>

            <h2 style={styles.heading}>
              Skin Profile
            </h2>

            <label style={styles.label}>
              Skin Type
            </label>

            <select
              value={skinData.skin_type}
              onChange={(e) =>
                setSkinData({
                  ...skinData,
                  skin_type: e.target.value
                })
              }
              style={styles.input}
            >
              <option value="">
                Select skin type
              </option>

              <option value="normal">
                Normal
              </option>

              <option value="oily">
                Oily
              </option>

              <option value="dry">
                Dry
              </option>

              <option value="combination">
                Combination
              </option>

              <option value="sensitive">
                Sensitive
              </option>
            </select>

            <label style={styles.label}>
              Skin Concerns
            </label>

            <input
              type="text"
              placeholder="Example: Acne, Dark spots"
              value={skinData.concerns}
              onChange={(e) =>
                setSkinData({
                  ...skinData,
                  concerns: e.target.value
                })
              }
              style={styles.input}
            />

            <label style={styles.label}>
              Sensitivity
            </label>

            <select
              value={skinData.sensitivity}
              onChange={(e) =>
                setSkinData({
                  ...skinData,
                  sensitivity: e.target.value
                })
              }
              style={styles.input}
            >
              <option value="">
                Select sensitivity
              </option>

              <option value="low">
                Low
              </option>

              <option value="medium">
                Medium
              </option>

              <option value="high">
                High
              </option>
            </select>

            <button
              onClick={saveSkinProfile}
              style={styles.button}
            >
              Save & Continue
            </button>

          </div>
        )}

        {/* ========================================= */}
        {/* STEP 2 - LIFESTYLE */}
        {/* ========================================= */}

        {step === 2 && (
          <div style={styles.card}>

            <h2 style={styles.heading}>
              Lifestyle Information
            </h2>

            <label style={styles.label}>
              Activity Level
            </label>

            <select
              value={lifestyleData.activity_level}
              onChange={(e) =>
                setLifestyleData({
                  ...lifestyleData,
                  activity_level: e.target.value
                })
              }
              style={styles.input}
            >
              <option value="">
                Select activity level
              </option>

              <option value="low">
                Low
              </option>

              <option value="moderate">
                Moderate
              </option>

              <option value="high">
                High
              </option>
            </select>

            <label style={styles.label}>
              Stress Level
            </label>

            <select
              value={lifestyleData.stress_level}
              onChange={(e) =>
                setLifestyleData({
                  ...lifestyleData,
                  stress_level: e.target.value
                })
              }
              style={styles.input}
            >
              <option value="">
                Select stress level
              </option>

              <option value="low">
                Low
              </option>

              <option value="moderate">
                Moderate
              </option>

              <option value="high">
                High
              </option>
            </select>

            <label style={styles.label}>
              Exercise / Workout Frequency
            </label>

            <input
              type="text"
              placeholder="Example: 3 times per week"
              value={lifestyleData.exercise}
              onChange={(e) =>
                setLifestyleData({
                  ...lifestyleData,
                  exercise: e.target.value
                })
              }
              style={styles.input}
            />

            <label style={styles.label}>
              Diet
            </label>

            <input
              type="text"
              placeholder="Example: Balanced diet"
              value={lifestyleData.diet}
              onChange={(e) =>
                setLifestyleData({
                  ...lifestyleData,
                  diet: e.target.value
                })
              }
              style={styles.input}
            />

            <label style={styles.label}>
              Water Intake (Litres)
            </label>

            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="Example: 2"
              value={lifestyleData.water_intake}
              onChange={(e) =>
                setLifestyleData({
                  ...lifestyleData,
                  water_intake: e.target.value
                })
              }
              style={styles.input}
            />

            <label style={styles.label}>
              Allergies / Sensitivities
            </label>

            <input
              type="text"
              placeholder="Example: Fragrance"
              value={lifestyleData.allergies}
              onChange={(e) =>
                setLifestyleData({
                  ...lifestyleData,
                  allergies: e.target.value
                })
              }
              style={styles.input}
            />

            <label style={styles.label}>
              Environmental Exposure
            </label>

            <input
              type="text"
              placeholder="Example: Pollution / Sun exposure"
              value={
                lifestyleData.environmental_exposure
              }
              onChange={(e) =>
                setLifestyleData({
                  ...lifestyleData,
                  environmental_exposure:
                    e.target.value
                })
              }
              style={styles.input}
            />

            <button
              onClick={saveLifestyle}
              style={styles.button}
            >
              Save & Continue
            </button>

          </div>
        )}

        {/* ========================================= */}
        {/* STEP 3 - SLEEP */}
        {/* ========================================= */}

        {step === 3 && (
          <div style={styles.card}>

            <h2 style={styles.heading}>
              Sleep Information
            </h2>

            <label style={styles.label}>
              Sleep Duration (Hours)
            </label>

            <input
              type="number"
              min="0"
              max="24"
              step="0.1"
              placeholder="Example: 7"
              value={sleepData.sleep_duration}
              onChange={(e) =>
                setSleepData({
                  ...sleepData,
                  sleep_duration: e.target.value
                })
              }
              style={styles.input}
            />

            <label style={styles.label}>
              Sleep Quality
            </label>

            <select
              value={sleepData.sleep_quality}
              onChange={(e) =>
                setSleepData({
                  ...sleepData,
                  sleep_quality: e.target.value
                })
              }
              style={styles.input}
            >
              <option value="">
                Select sleep quality
              </option>

              <option value="1">
                Poor
              </option>

              <option value="2">
                Average
              </option>

              <option value="3">
                Good
              </option>

              <option value="4">
                Very Good
              </option>

              <option value="5">
                Excellent
              </option>
            </select>

            <button
              onClick={saveSleep}
              style={styles.button}
            >
              Save & Continue
            </button>

          </div>
        )}

        {/* ========================================= */}
        {/* STEP 4 - SKIN ASSESSMENT */}
        {/* ========================================= */}

        {step === 4 && (
          <div style={styles.card}>

            <h2 style={styles.heading}>
              Skin Assessment
            </h2>

            <p style={styles.description}>
              Your basic skin profile, lifestyle and sleep
              information has been saved successfully.
            </p>

            <p style={styles.description}>
              Now let's analyze your skin concerns and
              generate your personalized skin intelligence.
            </p>

            <button
              onClick={goToAssessment}
              style={styles.button}
            >
              Continue to Skin Assessment
            </button>

          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #fff0f5, #ffe4ec)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "30px",
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif"
  },

  container: {
    width: "100%",
    maxWidth: "650px",
    textAlign: "center"
  },

  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#8b3a62",
    marginBottom: "8px"
  },

  subtitle: {
    fontSize: "16px",
    color: "#777",
    marginBottom: "20px"
  },

  stepText: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#9b496f",
    marginBottom: "15px"
  },

  message: {
    background: "#ffffff",
    color: "#8b3a62",
    borderRadius: "10px",
    padding: "12px",
    marginBottom: "15px",
    fontWeight: "600",
    border: "1px solid #f0bfd2"
  },

  card: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "30px",
    boxShadow:
      "0 10px 30px rgba(120, 60, 90, 0.12)",
    textAlign: "left"
  },

  heading: {
    textAlign: "center",
    color: "#8b3a62",
    marginBottom: "25px"
  },

  label: {
    display: "block",
    marginBottom: "8px",
    marginTop: "15px",
    fontWeight: "600",
    color: "#555"
  },

  input: {
    width: "100%",
    padding: "13px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    fontSize: "15px",
    boxSizing: "border-box",
    outline: "none",
    background: "#fff"
  },

  button: {
    width: "100%",
    marginTop: "25px",
    padding: "14px",
    border: "none",
    borderRadius: "10px",
    background: "#c45a85",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer"
  },

  description: {
    color: "#666",
    lineHeight: "1.6",
    textAlign: "center",
    marginBottom: "15px"
  }
};

export default Onboarding;