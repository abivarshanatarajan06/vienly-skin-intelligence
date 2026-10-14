import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API = "http://127.0.0.1:5000";

function PatientDetails() {
  const { user_id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [skinProfile, setSkinProfile] = useState(null);
  const [lifestyle, setLifestyle] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [sleepLogs, setSleepLogs] = useState([]);
  const [progress, setProgress] = useState([]);
  const [carePlans, setCarePlans] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [notes, setNotes] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);
  const [planMessage, setPlanMessage] = useState("");

  useEffect(() => {
    loadPatient();
  }, [user_id]);

  const loadPatient = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Login session expired. Please login again.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API}/patient/${user_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      console.log("PATIENT DETAILS RESPONSE:", data);

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          "Failed to load patient details"
        );
      }

      setPatient(data.patient || null);
      setSkinProfile(data.skin_profile || null);
      setLifestyle(data.lifestyle || []);
      setAssessment(data.assessment || null);
      setSleepLogs(data.sleep_logs || []);
      setProgress(data.progress || []);
      setCarePlans(data.care_plans || []);
    } catch (err) {
      console.error("PATIENT DETAILS ERROR:", err);
      setError(err.message || "Failed to load patient details");
    } finally {
      setLoading(false);
    }
  };

  const saveCarePlan = async () => {
    if (!notes.trim()) {
      setPlanMessage("Please enter care plan notes.");
      return;
    }

    try {
      setSavingPlan(true);
      setPlanMessage("");

      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");

      const doctorId =
        user?.id ||
        localStorage.getItem("userId") ||
        localStorage.getItem("user_id");

      const response = await fetch(`${API}/care-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: Number(user_id),
          doctor_id: doctorId ? Number(doctorId) : null,
          notes: notes.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          "Failed to save care plan"
        );
      }

      setPlanMessage("Care plan saved successfully.");
      setNotes("");

      loadPatient();
    } catch (err) {
      console.error("CARE PLAN ERROR:", err);
      setPlanMessage(
        err.message || "Failed to save care plan"
      );
    } finally {
      setSavingPlan(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingBox}>
          <h2>Loading Patient Details...</h2>
          <p>Please wait.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.errorBox}>
          <h2>Unable to Load Patient</h2>
          <p>{error}</p>

          <button
            style={styles.primaryButton}
            onClick={() =>
              navigate("/dermatologist-dashboard")
            }
          >
            ← Back to Patient List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Patient Details
            </h1>

            <p style={styles.subtitle}>
              VIENLY Skin Intelligence
            </p>
          </div>

          <button
            style={styles.backButton}
            onClick={() =>
              navigate("/dermatologist-dashboard")
            }
          >
            ← Patient List
          </button>
        </div>

        {/* PATIENT INFORMATION */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>
            👤 Patient Information
          </h2>

          {patient ? (
            <div style={styles.grid}>
              <Info
                label="Name"
                value={patient.full_name}
              />

              <Info
                label="Email"
                value={patient.email}
              />

              <Info
                label="Patient ID"
                value={patient.id}
              />

              <Info
                label="Role"
                value={patient.role}
              />
            </div>
          ) : (
            <p>No patient information available.</p>
          )}
        </section>

        {/* SKIN PROFILE */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>
            🧴 Skin Profile
          </h2>

          {skinProfile ? (
            <div style={styles.grid}>
              <Info
                label="Skin Type"
                value={skinProfile.skin_type}
              />

              <Info
                label="Concerns"
                value={skinProfile.concerns}
              />

              <Info
                label="Sensitivity"
                value={skinProfile.sensitivity}
              />
            </div>
          ) : (
            <p>No skin profile available.</p>
          )}
        </section>

        {/* ASSESSMENT */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>
            🧠 Skin Assessment
          </h2>

          {assessment ? (
            <div style={styles.grid}>
              <Info
                label="Skin Score"
                value={
                  assessment.skin_score !== undefined
                    ? `${assessment.skin_score}/100`
                    : "Not available"
                }
              />

              <Info
                label="Acne"
                value={
                  assessment.acne
                    ? "Yes"
                    : "No"
                }
              />

              <Info
                label="Dark Spots"
                value={
                  assessment.dark_spots
                    ? "Yes"
                    : "No"
                }
              />

              <Info
                label="Dryness"
                value={
                  assessment.dryness
                    ? "Yes"
                    : "No"
                }
              />

              <Info
                label="Redness"
                value={
                  assessment.redness
                    ? "Yes"
                    : "No"
                }
              />

              <Info
                label="Wrinkles"
                value={
                  assessment.wrinkles
                    ? "Yes"
                    : "No"
                }
              />

              <Info
                label="Sensitivity"
                value={assessment.sensitivity}
              />
            </div>
          ) : (
            <p>No assessment available.</p>
          )}
        </section>

        {/* LIFESTYLE */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>
            🏃 Lifestyle
          </h2>

          {lifestyle.length > 0 ? (
            <div>
              {lifestyle.map((item, index) => (
                <div
                  key={item.id || index}
                  style={styles.record}
                >
                  <Info
                    label="Activity Level"
                    value={item.activity_level}
                  />

                  <Info
                    label="Stress Level"
                    value={item.stress_level}
                  />

                  <Info
                    label="Workout Frequency"
                    value={item.workout_frequency}
                  />

                  <Info
                    label="Diet"
                    value={item.diet_type}
                  />

                  <Info
                    label="Water Intake"
                    value={
                      item.water_intake !== null &&
                      item.water_intake !== undefined
                        ? `${item.water_intake} L`
                        : "Not available"
                    }
                  />

                  <Info
                    label="Allergies"
                    value={item.allergies}
                  />

                  <Info
                    label="Environmental Exposure"
                    value={item.environmental_exposure}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p>No lifestyle information available.</p>
          )}
        </section>

        {/* SLEEP */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>
            😴 Sleep Tracking
          </h2>

          {sleepLogs.length > 0 ? (
            <div>
              {sleepLogs.map((item, index) => (
                <div
                  key={item.id || index}
                  style={styles.record}
                >
                  <Info
                    label="Sleep Duration"
                    value={
                      item.sleep_duration !== null &&
                      item.sleep_duration !== undefined
                        ? `${item.sleep_duration} hours`
                        : "Not available"
                    }
                  />

                  <Info
                    label="Sleep Quality"
                    value={item.sleep_quality}
                  />

                  <Info
                    label="Sleep Date"
                    value={item.sleep_date}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p>No sleep records available.</p>
          )}
        </section>

        {/* PROGRESS */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>
            📈 Progress Tracking
          </h2>

          {progress.length > 0 ? (
            <div>
              {progress.map((item, index) => (
                <div
                  key={item.id || index}
                  style={styles.progressRecord}
                >
                  <strong>
                    Skin Score:{" "}
                    {item.skin_score}/100
                  </strong>

                  <p>
                    Acne:{" "}
                    {item.acne ? "Yes" : "No"}
                  </p>

                  <p>
                    Dark Spots:{" "}
                    {item.dark_spots
                      ? "Yes"
                      : "No"}
                  </p>

                  <p>
                    Dryness:{" "}
                    {item.dryness
                      ? "Yes"
                      : "No"}
                  </p>

                  <p>
                    Sensitivity:{" "}
                    {item.sensitivity || "Not available"}
                  </p>

                  <p>
                    Notes:{" "}
                    {item.notes || "No notes"}
                  </p>

                  <small>
                    {item.recorded_at
                      ? new Date(
                          item.recorded_at
                        ).toLocaleString()
                      : ""}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <p>No progress records available.</p>
          )}
        </section>

        {/* CARE PLANS */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>
            🩺 Care Plans
          </h2>

          {carePlans.length > 0 ? (
            <div>
              {carePlans.map((plan, index) => (
                <div
                  key={plan.id || index}
                  style={styles.carePlan}
                >
                  <p>
                    <strong>Doctor:</strong>{" "}
                    {plan.doctor_name ||
                      plan.doctor_id ||
                      "Not available"}
                  </p>

                  <p>
                    <strong>Notes:</strong>{" "}
                    {plan.notes}
                  </p>

                  <p>
                    <strong>Reviewed:</strong>{" "}
                    {plan.reviewed_at
                      ? new Date(
                          plan.reviewed_at
                        ).toLocaleString()
                      : "Not reviewed"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p>No care plans available.</p>
          )}
        </section>

        {/* ADD CARE PLAN */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>
            ✍️ Add Care Plan
          </h2>

          <textarea
            value={notes}
            onChange={(e) =>
              setNotes(e.target.value)
            }
            placeholder="Enter dermatologist care plan notes..."
            style={styles.textarea}
          />

          <button
            style={styles.primaryButton}
            onClick={saveCarePlan}
            disabled={savingPlan}
          >
            {savingPlan
              ? "Saving..."
              : "Save Care Plan"}
          </button>

          {planMessage && (
            <p style={styles.message}>
              {planMessage}
            </p>
          )}
        </section>

        {/* REPORT */}
        <div style={styles.reportSection}>
          <button
            style={styles.reportButton}
            onClick={() =>
              navigate(
                `/patient/${user_id}/report`
              )
            }
          >
            📄 Generate Patient Report
          </button>

          <button
            style={styles.secondaryButton}
            onClick={() =>
              navigate(
                "/dermatologist-dashboard"
              )
            }
          >
            ← Back to Patient List
          </button>
        </div>

      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={styles.infoBox}>
      <span style={styles.label}>
        {label}
      </span>

      <span style={styles.value}>
        {value !== null &&
        value !== undefined &&
        value !== ""
          ? String(value)
          : "Not available"}
      </span>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #fff1f7, #fce7f3)",
    padding: "30px 20px",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    boxSizing: "border-box"
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "25px",
    flexWrap: "wrap"
  },

  title: {
    margin: 0,
    color: "#831843",
    fontSize: "32px"
  },

  subtitle: {
    marginTop: "8px",
    color: "#9d174d"
  },

  card: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "25px",
    marginBottom: "22px",
    boxShadow:
      "0 8px 25px rgba(190, 24, 93, 0.10)"
  },

  sectionTitle: {
    color: "#9d174d",
    marginTop: 0,
    marginBottom: "20px"
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px"
  },

  infoBox: {
    background: "#fff7fb",
    borderRadius: "14px",
    padding: "15px",
    border: "1px solid #fbcfe8"
  },

  label: {
    display: "block",
    color: "#9d174d",
    fontSize: "13px",
    fontWeight: "bold",
    marginBottom: "6px"
  },

  value: {
    color: "#374151",
    fontSize: "15px"
  },

  record: {
    background: "#fff7fb",
    borderRadius: "15px",
    padding: "18px",
    marginBottom: "15px",
    border:
      "1px solid #fbcfe8",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px"
  },

  progressRecord: {
    background: "#fff7fb",
    borderRadius: "15px",
    padding: "18px",
    marginBottom: "15px",
    border:
      "1px solid #fbcfe8"
  },

  carePlan: {
    background: "#fff7fb",
    borderRadius: "15px",
    padding: "18px",
    marginBottom: "15px",
    border:
      "1px solid #fbcfe8"
  },

  textarea: {
    width: "100%",
    minHeight: "130px",
    padding: "15px",
    borderRadius: "14px",
    border: "1px solid #f9a8d4",
    resize: "vertical",
    boxSizing: "border-box",
    fontSize: "15px",
    outline: "none",
    marginBottom: "15px"
  },

  primaryButton: {
    background:
      "linear-gradient(135deg, #db2777, #be185d)",
    color: "#ffffff",
    border: "none",
    padding: "13px 22px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold"
  },

  backButton: {
    background: "#ffffff",
    color: "#9d174d",
    border:
      "1px solid #f9a8d4",
    padding: "12px 18px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold"
  },

  secondaryButton: {
    background: "#ffffff",
    color: "#9d174d",
    border:
      "1px solid #f9a8d4",
    padding: "13px 22px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold"
  },

  reportButton: {
    background:
      "linear-gradient(135deg, #be185d, #9d174d)",
    color: "#ffffff",
    border: "none",
    padding: "14px 24px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold"
  },

  reportSection: {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    flexWrap: "wrap",
    padding: "10px 0 30px"
  },

  message: {
    marginTop: "15px",
    color: "#9d174d",
    fontWeight: "bold"
  },

  loadingBox: {
    maxWidth: "550px",
    margin: "100px auto",
    background: "#ffffff",
    padding: "40px",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow:
      "0 8px 25px rgba(190, 24, 93, 0.12)"
  },

  errorBox: {
    maxWidth: "550px",
    margin: "100px auto",
    background: "#ffffff",
    padding: "40px",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow:
      "0 8px 25px rgba(190, 24, 93, 0.12)"
  }
};

export default PatientDetails;