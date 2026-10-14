import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Lifestyle.css";

const API = "http://127.0.0.1:5000";

function Lifestyle() {
  const navigate = useNavigate();

  const [sleepHours, setSleepHours] = useState("");
  const [waterIntake, setWaterIntake] = useState("");
  const [exerciseMinutes, setExerciseMinutes] = useState("");
  const [stressLevel, setStressLevel] = useState("Low");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!sleepHours || !waterIntake || !exerciseMinutes) {
      setMessage("Please complete all the fields.");
      return;
    }

    const sleep = Number(sleepHours);
    const water = Number(waterIntake);
    const exercise = Number(exerciseMinutes);

    if (
      !Number.isFinite(sleep) ||
      sleep < 0 ||
      sleep > 24 ||
      !Number.isFinite(water) ||
      water <= 0 ||
      !Number.isFinite(exercise) ||
      exercise < 0 ||
      exercise > 1440
    ) {
      setMessage("Please enter valid lifestyle values.");
      return;
    }

    let user;

    try {
      user = JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      user = null;
    }

    const userId = user?.id ?? user?.user_id;

    if (!userId) {
      setMessage("Please log in again before saving your lifestyle.");
      return;
    }

    setSaving(true);
    setMessage("Saving your lifestyle information...");

    const data = {
      user_id: userId,
      sleep_hours: sleep,
      water_intake: water,
      exercise_minutes: exercise,
      stress_level: stressLevel,
    };

    try {
      const response = await fetch(`${API}/lifestyle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      console.log("BACKEND RESPONSE:", result);

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to save lifestyle information."
        );
      }

      setMessage("Lifestyle saved! Opening Sleep Tracking...");

      // Continue to the next stage of the VIENLY journey.
      navigate("/sleep-tracking", {
        state: { fromLifestyle: true },
      });
    } catch (error) {
      console.error("Lifestyle error:", error);
      setMessage(
        error.message || "Cannot connect to backend."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="lifestyle-page">
      <header className="lifestyle-header">
        <div className="lifestyle-logo">
          <div className="lifestyle-logo-icon">✦</div>
          <div>
            <h1>VIENLY'S</h1>
            <span>SKIN INTELLIGENCE</span>
          </div>
        </div>

        <div className="lifestyle-badge">
          🌙 DAILY WELLNESS
        </div>
      </header>

      <main className="lifestyle-main">
        <section className="lifestyle-intro">
          <div className="lifestyle-intro-icon">🌙</div>
          <span className="intro-label">YOUR DAILY HABITS</span>

          <h2>
            Sleep, Move,
            <br />
            <span>Take Care.</span>
          </h2>

          <p>
            Your everyday habits can influence how your skin
            looks and feels. Keep track of your lifestyle to
            understand your skin better.
          </p>
        </section>

        <form className="lifestyle-card" onSubmit={handleSave}>
          <section className="lifestyle-section">
            <div className="lifestyle-section-heading">
              <div className="lifestyle-number">01</div>
              <div>
                <h3>Sleep</h3>
                <p>How many hours did you sleep?</p>
              </div>
            </div>

            <div className="input-wrapper">
              <span className="input-icon">🌙</span>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                placeholder="e.g. 7"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                required
              />
              <span className="input-unit">hours</span>
            </div>
          </section>

          <section className="lifestyle-section">
            <div className="lifestyle-section-heading">
              <div className="lifestyle-number">02</div>
              <div>
                <h3>Water Intake</h3>
                <p>How much water do you drink each day?</p>
              </div>
            </div>

            <div className="input-wrapper">
              <span className="input-icon">💧</span>
              <input
                type="number"
                min="0.1"
                step="0.1"
                placeholder="e.g. 2.5"
                value={waterIntake}
                onChange={(e) => setWaterIntake(e.target.value)}
                required
              />
              <span className="input-unit">litres</span>
            </div>
          </section>

          <section className="lifestyle-section">
            <div className="lifestyle-section-heading">
              <div className="lifestyle-number">03</div>
              <div>
                <h3>Exercise</h3>
                <p>How many minutes do you exercise?</p>
              </div>
            </div>

            <div className="input-wrapper">
              <span className="input-icon">🏃</span>
              <input
                type="number"
                min="0"
                max="1440"
                step="1"
                placeholder="e.g. 30"
                value={exerciseMinutes}
                onChange={(e) => setExerciseMinutes(e.target.value)}
                required
              />
              <span className="input-unit">minutes</span>
            </div>
          </section>

          <section className="lifestyle-section">
            <div className="lifestyle-section-heading">
              <div className="lifestyle-number">04</div>
              <div>
                <h3>Stress Level</h3>
                <p>How would you describe your stress today?</p>
              </div>
            </div>

            <div className="stress-options">
              {[
                {
                  value: "Low",
                  emoji: "😊",
                  description: "Feeling relaxed",
                  className: "low",
                },
                {
                  value: "Medium",
                  emoji: "😐",
                  description: "A little stressed",
                  className: "medium",
                },
                {
                  value: "High",
                  emoji: "😟",
                  description: "Feeling overwhelmed",
                  className: "high",
                },
              ].map((option) => (
                <label
                  key={option.value}
                  className={
                    stressLevel === option.value
                      ? `stress-option selected ${option.className}`
                      : "stress-option"
                  }
                >
                  <input
                    type="radio"
                    name="stress"
                    value={option.value}
                    checked={stressLevel === option.value}
                    onChange={(e) => setStressLevel(e.target.value)}
                  />

                  <span>{option.emoji}</span>

                  <div>
                    <strong>{option.value}</strong>
                    <small>{option.description}</small>
                  </div>

                  {stressLevel === option.value && <b>✓</b>}
                </label>
              ))}
            </div>
          </section>

          <button
            type="submit"
            className="save-lifestyle"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save & Continue to Sleep Tracking"}
            <span>→</span>
          </button>

          {message && (
            <div
              role="status"
              className={
                message.includes("saved!")
                  ? "lifestyle-message success"
                  : "lifestyle-message"
              }
            >
              {message}
            </div>
          )}
        </form>

        <section className="wellness-tip">
          <div className="wellness-tip-icon">♡</div>
          <div>
            <span>VIENLY'S WELLNESS TIP</span>
            <h3>Healthy habits support healthy-looking skin.</h3>
            <p>
              Keep your daily routine consistent and use your
              lifestyle history to understand your skincare journey.
            </p>
          </div>
        </section>
      </main>

      <footer className="lifestyle-footer">
        © 2026 VIENLY'S Skin Intelligence · Your skin, understood.
      </footer>
    </div>
  );
}

export default Lifestyle;