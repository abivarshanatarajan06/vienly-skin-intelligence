import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://127.0.0.1:5000";

function DermatologistDashboard() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          setError("Your login session has expired. Please log in again.");
          return;
        }

        const response = await fetch(
          `${API}/dermatologist/patients`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              data.error ||
              `Unable to load patients (${response.status})`
          );
        }

        if (!Array.isArray(data.patients)) {
          throw new Error(
            "The server response does not contain a valid patient list."
          );
        }

        setPatients(data.patients);
      } catch (err) {
        console.error("Patient loading error:", err);
        setError(err.message || "Unable to load patients.");
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("user_id");
    navigate("/login");
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.logo}>✦ VIENLY'S</div>
          <div style={styles.subtitle}>SKIN INTELLIGENCE</div>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.doctorBadge}>
            🩺 Dermatologist
          </div>

          <button style={styles.logout} onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.welcome}>
          <div>
            <p style={styles.eyebrow}>DERMATOLOGIST PORTAL</p>

            <h1 style={styles.title}>
              Welcome back, Doctor 👋
            </h1>

            <p style={styles.description}>
              Monitor your patients, review their skin health,
              and provide personalized skincare guidance.
            </p>
          </div>

          <div style={styles.healthIcon}>🩺</div>
        </section>

        <section style={styles.stats}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>👥</div>
            <div>
              <p style={styles.statLabel}>TOTAL PATIENTS</p>
              <h2 style={styles.statNumber}>{patients.length}</h2>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>🧴</div>
            <div>
              <p style={styles.statLabel}>SKIN MONITORING</p>
              <h2 style={styles.statNumber}>Active</h2>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>📊</div>
            <div>
              <p style={styles.statLabel}>HEALTH ANALYTICS</p>
              <h2 style={styles.statNumber}>Live</h2>
            </div>
          </div>
        </section>

        <section style={styles.patientSection}>
          <div style={styles.sectionHeader}>
            <div>
              <p style={styles.eyebrow}>PATIENT MANAGEMENT</p>

              <h2 style={styles.sectionTitle}>Your Patients</h2>

              <p style={styles.sectionText}>
                Select a patient to view their skin intelligence profile.
              </p>
            </div>

            <div style={styles.patientCount}>
              {patients.length} Patients
            </div>
          </div>

          {loading ? (
            <div style={styles.empty}>
              <h3>Loading patients...</h3>
              <p>Please wait.</p>
            </div>
          ) : error ? (
            <div style={styles.empty}>
              <h3>Unable to load patients</h3>
              <p style={styles.errorText}>{error}</p>

              <button
                style={styles.viewButton}
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          ) : patients.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>👥</div>
              <h3>No patients found</h3>
              <p>
                No patient accounts were returned by the server.
                Register a normal user and complete their profile,
                then refresh this page.
              </p>
            </div>
          ) : (
            <div style={styles.patientGrid}>
              {patients.map((patient) => (
                <div key={patient.id} style={styles.patientCard}>
                  <div style={styles.patientTop}>
                    <div style={styles.avatar}>
                      {patient.full_name
                        ? patient.full_name.charAt(0).toUpperCase()
                        : "U"}
                    </div>

                    <div style={{ flex: 1 }}>
                      <h3 style={styles.patientName}>
                        {patient.full_name || "Patient"}
                      </h3>

                      <p style={styles.email}>
                        {patient.email || "Email not available"}
                      </p>
                    </div>

                    <span style={styles.active}>● Registered</span>
                  </div>

                  <div style={styles.divider} />

                  <div style={styles.patientInfo}>
                    <div>
                      <span style={styles.infoLabel}>PATIENT ID</span>
                      <span style={styles.infoValue}>#{patient.id}</span>
                    </div>

                    <div>
                      <span style={styles.infoLabel}>ROLE</span>
                      <span style={styles.infoValue}>
                        {patient.role || "Patient"}
                      </span>
                    </div>

                    <div>
                      <span style={styles.infoLabel}>SKIN TYPE</span>
                      <span style={styles.infoValue}>
                        {patient.skin_type || "Not available"}
                      </span>
                    </div>
                  </div>

                  <button
                    style={styles.viewButton}
                    onClick={() => navigate(`/patient/${patient.id}`)}
                  >
                    View Patient Profile <span>→</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer style={styles.footer}>
        <span>VIENLY'S SKIN INTELLIGENCE</span>
        <span>Personalized • Intelligent • Connected</span>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#faf7f8",
    color: "#33272d",
    fontFamily: "Arial, sans-serif"
  },
  header: {
    minHeight: "76px",
    background: "#ffffff",
    borderBottom: "1px solid #eee4e8",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "12px 7%",
    boxSizing: "border-box",
    flexWrap: "wrap"
  },
  logo: {
    fontSize: "22px",
    fontWeight: "700",
    letterSpacing: "2px",
    color: "#b85c7a"
  },
  subtitle: {
    fontSize: "9px",
    letterSpacing: "3px",
    color: "#9b858e",
    marginTop: "3px"
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap"
  },
  doctorBadge: {
    background: "#f8e9ef",
    color: "#a84e6c",
    padding: "10px 17px",
    borderRadius: "25px",
    fontSize: "13px",
    fontWeight: "600"
  },
  logout: {
    border: "1px solid #dfcbd3",
    background: "#ffffff",
    color: "#765c66",
    padding: "10px 18px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "600"
  },
  main: {
    width: "86%",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "45px 0"
  },
  welcome: {
    background: "linear-gradient(135deg, #f8e7ed, #fdf5f7)",
    borderRadius: "24px",
    padding: "38px 45px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    flexWrap: "wrap",
    boxShadow: "0 10px 30px rgba(130,80,100,0.08)"
  },
  eyebrow: {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "2px",
    color: "#b05a77",
    marginBottom: "9px"
  },
  title: {
    fontSize: "34px",
    margin: "0 0 12px",
    fontWeight: "700",
    color: "#3c2c33"
  },
  description: {
    color: "#765f68",
    fontSize: "15px",
    maxWidth: "600px",
    lineHeight: "1.7",
    margin: 0
  },
  healthIcon: {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "40px",
    boxShadow: "0 8px 25px rgba(120,70,90,0.12)"
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginTop: "25px"
  },
  statCard: {
    background: "#ffffff",
    border: "1px solid #eee3e7",
    borderRadius: "18px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "17px",
    boxShadow: "0 5px 18px rgba(80,50,60,0.04)"
  },
  statIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "14px",
    background: "#f8e9ef",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px"
  },
  statLabel: {
    fontSize: "10px",
    letterSpacing: "1.3px",
    color: "#9a858d",
    margin: "0 0 5px",
    fontWeight: "700"
  },
  statNumber: {
    margin: 0,
    fontSize: "22px",
    color: "#47353d"
  },
  patientSection: {
    marginTop: "42px"
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "15px",
    flexWrap: "wrap",
    marginBottom: "22px"
  },
  sectionTitle: {
    fontSize: "27px",
    margin: "0 0 7px",
    color: "#3c2c33"
  },
  sectionText: {
    color: "#806c74",
    margin: 0,
    fontSize: "14px"
  },
  patientCount: {
    background: "#ffffff",
    border: "1px solid #eadde2",
    padding: "10px 17px",
    borderRadius: "20px",
    color: "#a84e6c",
    fontWeight: "600",
    fontSize: "13px"
  },
  patientGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px"
  },
  patientCard: {
    background: "#ffffff",
    border: "1px solid #eee3e7",
    borderRadius: "20px",
    padding: "25px",
    boxShadow: "0 6px 20px rgba(70,40,50,0.05)"
  },
  patientTop: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap"
  },
  avatar: {
    width: "53px",
    height: "53px",
    borderRadius: "50%",
    background: "#f4dce5",
    color: "#a64e6c",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px",
    fontWeight: "700"
  },
  patientName: {
    margin: "0 0 5px",
    fontSize: "17px",
    color: "#403139"
  },
  email: {
    margin: 0,
    fontSize: "12px",
    color: "#948189",
    overflowWrap: "anywhere"
  },
  active: {
    fontSize: "11px",
    color: "#56836a",
    background: "#edf7f0",
    padding: "6px 9px",
    borderRadius: "15px"
  },
  divider: {
    height: "1px",
    background: "#f0e7ea",
    margin: "20px 0"
  },
  patientInfo: {
    display: "flex",
    gap: "25px",
    marginBottom: "20px",
    flexWrap: "wrap"
  },
  infoLabel: {
    display: "block",
    fontSize: "9px",
    letterSpacing: "1px",
    color: "#a18d95",
    marginBottom: "4px"
  },
  infoValue: {
    fontSize: "13px",
    color: "#56434b",
    fontWeight: "600"
  },
  viewButton: {
    width: "100%",
    border: "none",
    background: "#b45c79",
    color: "#ffffff",
    padding: "12px 17px",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "13px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  empty: {
    background: "#ffffff",
    border: "1px solid #eee3e7",
    borderRadius: "20px",
    padding: "40px 25px",
    textAlign: "center",
    overflowWrap: "anywhere"
  },
  emptyIcon: {
    fontSize: "45px",
    marginBottom: "10px"
  },
  errorText: {
    color: "#b42318",
    marginBottom: "20px"
  },
  footer: {
    borderTop: "1px solid #eee4e8",
    padding: "22px 7%",
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    color: "#a18d95",
    fontSize: "10px",
    letterSpacing: "1px"
  }
};

export default DermatologistDashboard;