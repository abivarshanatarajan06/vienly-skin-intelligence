import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

const API = "http://127.0.0.1:5000";

function PatientReport() {
  const { user_id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReport = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Login session expired. Please login again.");
        }

        const response = await fetch(
          `${API}/patient/${user_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Unable to load report"
          );
        }

        setData(result);
      } catch (err) {
        console.error("PATIENT REPORT ERROR:", err);
        setError(err.message);
      }
    };

    loadReport();
  }, [user_id]);

  if (error) {
    return (
      <div style={{ padding: "40px", fontFamily: "Arial" }}>
        <h2>Unable to Load Report</h2>

        <p>{error}</p>

        <button
          onClick={() =>
            navigate(`/patient/${user_id}`)
          }
        >
          Back to Patient
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "40px", fontFamily: "Arial" }}>
        <h2>Loading Patient Report...</h2>
      </div>
    );
  }

  const patient = data.patient || {};
  const skin = data.skin_profile || {};

  const lifestyle = Array.isArray(data.lifestyle)
    ? data.lifestyle[0] || {}
    : data.lifestyle || {};

  const assessment = data.assessment || {};
  const sleep = data.sleep_logs || [];
  const progress = data.progress || [];
  const carePlans = data.care_plans || [];

  const printReport = () => {
    window.print();
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    let y = 20;

    const checkPage = () => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
    };

    const title = (text) => {
      checkPage();

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(text, 20, y);

      y += 10;
    };

    const line = (label, value) => {
      checkPage();

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 20, y);

      doc.setFont("helvetica", "normal");

      const text = String(value ?? "Not provided");

      const wrapped = doc.splitTextToSize(
        text,
        120
      );

      doc.text(wrapped, 65, y);

      y += Math.max(
        7,
        wrapped.length * 5
      );
    };

    const separator = () => {
      checkPage();

      y += 3;
      doc.line(20, y, 190, y);
      y += 10;
    };

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("VIENLY", 20, y);

    y += 10;

    doc.setFontSize(16);
    doc.text(
      "Patient Skin Health Report",
      20,
      y
    );

    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text(
      "Generated from the VIENLY Skin Intelligence System",
      20,
      y
    );

    y += 15;

    title("Patient Information");

    line(
      "Name",
      patient.full_name || "Not provided"
    );

    line(
      "Email",
      patient.email || "Not provided"
    );

    separator();

    title("Skin Profile");

    line(
      "Skin Type",
      skin.skin_type || "Not provided"
    );

    line(
      "Concerns",
      skin.concerns || "Not provided"
    );

    line(
      "Sensitivity",
      skin.sensitivity || "Not provided"
    );

    separator();

    title("Skin Assessment");

    line(
      "Skin Score",
      `${assessment.skin_score ?? assessment.score ?? "Not available"}/100`
    );

    line(
      "Concern Level",
      assessment.concern_level ||
        "Not available"
    );

    line(
      "Acne",
      assessment.acne ? "Yes" : "No"
    );

    line(
      "Dark Spots",
      assessment.dark_spots
        ? "Yes"
        : "No"
    );

    line(
      "Dryness",
      assessment.dryness
        ? "Yes"
        : "No"
    );

    line(
      "Redness",
      assessment.redness
        ? "Yes"
        : "No"
    );

    line(
      "Wrinkles",
      assessment.wrinkles
        ? "Yes"
        : "No"
    );

    line(
      "Sensitivity",
      assessment.sensitivity ||
        "Not available"
    );

    separator();

    title("Lifestyle");

    line(
      "Activity Level",
      lifestyle.activity_level ||
        "Not provided"
    );

    line(
      "Stress Level",
      lifestyle.stress_level ||
        "Not provided"
    );

    line(
      "Workout Frequency",
      lifestyle.workout_frequency ||
        "Not provided"
    );

    line(
      "Diet",
      lifestyle.diet_type ||
        "Not provided"
    );

    line(
      "Water Intake",
      lifestyle.water_intake !==
      undefined
        ? `${lifestyle.water_intake} L`
        : "Not provided"
    );

    line(
      "Allergies",
      lifestyle.allergies ||
        "None reported"
    );

    line(
      "Environmental Exposure",
      lifestyle.environmental_exposure ||
        "Not provided"
    );

    separator();

    title("Sleep History");

    if (sleep.length === 0) {
      line(
        "Sleep Records",
        "No sleep records available"
      );
    } else {
      sleep.forEach((item, index) => {
        line(
          `Record ${index + 1} Date`,
          item.sleep_date ||
            "Not available"
        );

        line(
          "Duration",
          item.sleep_duration !==
          undefined
            ? `${item.sleep_duration} hours`
            : "Not available"
        );

        line(
          "Quality",
          item.sleep_quality ||
            "Not available"
        );
      });
    }

    separator();

    title("Progress History");

    if (progress.length === 0) {
      line(
        "Progress",
        "No progress records available"
      );
    } else {
      progress.forEach(
        (item, index) => {
          line(
            `Record ${index + 1} Skin Score`,
            `${item.skin_score}/100`
          );

          line(
            "Acne",
            item.acne ? "Yes" : "No"
          );

          line(
            "Dark Spots",
            item.dark_spots
              ? "Yes"
              : "No"
          );

          line(
            "Dryness",
            item.dryness
              ? "Yes"
              : "No"
          );

          line(
            "Sensitivity",
            item.sensitivity ||
              "Not available"
          );

          line(
            "Notes",
            item.notes ||
              "No notes"
          );

          line(
            "Recorded",
            item.recorded_at
              ? new Date(
                  item.recorded_at
                ).toLocaleString()
              : "Not available"
          );
        }
      );
    }

    separator();

    title(
      "Dermatologist Care Plans"
    );

    if (carePlans.length === 0) {
      line(
        "Care Plans",
        "No care plans available"
      );
    } else {
      carePlans.forEach(
        (plan, index) => {
          line(
            `Care Plan ${index + 1}`,
            plan.notes ||
              "No notes"
          );

          line(
            "Dermatologist",
            plan.doctor_name ||
              "Not available"
          );

          line(
            "Reviewed",
            plan.reviewed_at
              ? new Date(
                  plan.reviewed_at
                ).toLocaleString()
              : "Not available"
          );
        }
      );
    }

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    doc.text(
      "VIENLY Skin Intelligence & Personalized Skincare",
      20,
      285
    );

    const fileName = `${
      patient.full_name || "Patient"
    }_Skin_Health_Report.pdf`;

    doc.save(fileName);
  };
  const generateExcel = () => {
    const rows = [];

    const addRow = (section, field, value) => {
      rows.push({
        Section: section,
        Field: field,
        Value: value ?? "Not provided"
      });
    };

    addRow(
      "Patient Information",
      "Name",
      patient.full_name || "Not provided"
    );

    addRow(
      "Patient Information",
      "Email",
      patient.email || "Not provided"
    );

    addRow(
      "Skin Profile",
      "Skin Type",
      skin.skin_type || "Not provided"
    );

    addRow(
      "Skin Profile",
      "Concerns",
      skin.concerns || "Not provided"
    );

    addRow(
      "Skin Profile",
      "Sensitivity",
      skin.sensitivity || "Not provided"
    );

    addRow(
      "Skin Assessment",
      "Skin Score",
      assessment.skin_score ??
        assessment.score ??
        "Not available"
    );

    addRow(
      "Skin Assessment",
      "Concern Level",
      assessment.concern_level ||
        "Not available"
    );

    addRow(
      "Skin Assessment",
      "Acne",
      assessment.acne ? "Yes" : "No"
    );

    addRow(
      "Skin Assessment",
      "Dark Spots",
      assessment.dark_spots
        ? "Yes"
        : "No"
    );

    addRow(
      "Skin Assessment",
      "Dryness",
      assessment.dryness
        ? "Yes"
        : "No"
    );

    addRow(
      "Skin Assessment",
      "Redness",
      assessment.redness
        ? "Yes"
        : "No"
    );

    addRow(
      "Skin Assessment",
      "Wrinkles",
      assessment.wrinkles
        ? "Yes"
        : "No"
    );

    addRow(
      "Skin Assessment",
      "Sensitivity",
      assessment.sensitivity ||
        "Not available"
    );

    addRow(
      "Lifestyle",
      "Activity Level",
      lifestyle.activity_level ||
        "Not provided"
    );

    addRow(
      "Lifestyle",
      "Stress Level",
      lifestyle.stress_level ||
        "Not provided"
    );

    addRow(
      "Lifestyle",
      "Workout Frequency",
      lifestyle.workout_frequency ||
        "Not provided"
    );

    addRow(
      "Lifestyle",
      "Diet",
      lifestyle.diet_type ||
        "Not provided"
    );

    addRow(
      "Lifestyle",
      "Water Intake",
      lifestyle.water_intake !==
      undefined
        ? `${lifestyle.water_intake} L`
        : "Not provided"
    );

    addRow(
      "Lifestyle",
      "Allergies",
      lifestyle.allergies ||
        "None reported"
    );

    addRow(
      "Lifestyle",
      "Environmental Exposure",
      lifestyle.environmental_exposure ||
        "Not provided"
    );

    sleep.forEach(
      (item, index) => {
        addRow(
          "Sleep History",
          `Record ${index + 1} Date`,
          item.sleep_date ||
            "Not available"
        );

        addRow(
          "Sleep History",
          `Record ${index + 1} Duration`,
          item.sleep_duration !==
          undefined
            ? `${item.sleep_duration} hours`
            : "Not available"
        );

        addRow(
          "Sleep History",
          `Record ${index + 1} Quality`,
          item.sleep_quality ||
            "Not available"
        );
      }
    );

    progress.forEach(
      (item, index) => {
        addRow(
          "Progress History",
          `Record ${index + 1} Skin Score`,
          `${item.skin_score}/100`
        );

        addRow(
          "Progress History",
          `Record ${index + 1} Acne`,
          item.acne ? "Yes" : "No"
        );

        addRow(
          "Progress History",
          `Record ${index + 1} Dark Spots`,
          item.dark_spots
            ? "Yes"
            : "No"
        );

        addRow(
          "Progress History",
          `Record ${index + 1} Dryness`,
          item.dryness
            ? "Yes"
            : "No"
        );

        addRow(
          "Progress History",
          `Record ${index + 1} Sensitivity`,
          item.sensitivity ||
            "Not available"
        );

        addRow(
          "Progress History",
          `Record ${index + 1} Notes`,
          item.notes ||
            "No notes"
        );

        addRow(
          "Progress History",
          `Record ${index + 1} Recorded`,
          item.recorded_at
            ? new Date(
                item.recorded_at
              ).toLocaleString()
            : "Not available"
        );
      }
    );

    carePlans.forEach(
      (plan, index) => {
        addRow(
          "Dermatologist Care Plan",
          `Care Plan ${index + 1}`,
          plan.notes ||
            "No notes"
        );

        addRow(
          "Dermatologist Care Plan",
          `Care Plan ${index + 1} Dermatologist`,
          plan.doctor_name ||
            "Not available"
        );

        addRow(
          "Dermatologist Care Plan",
          `Care Plan ${index + 1} Reviewed`,
          plan.reviewed_at
            ? new Date(
                plan.reviewed_at
              ).toLocaleString()
            : "Not available"
        );
      }
    );

    const worksheet =
      XLSX.utils.json_to_sheet(
        rows
      );

    worksheet["!cols"] = [
      { wch: 28 },
      { wch: 40 },
      { wch: 60 }
    ];

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Patient Report"
    );

    const fileName = `${
      patient.full_name || "Patient"
    }_Skin_Health_Report.xlsx`;

    XLSX.writeFile(
      workbook,
      fileName
    );
  };

  return (
    <div
      style={{
        background: "#fff5f8",
        minHeight: "100vh",
        padding: "30px",
        fontFamily: "Arial"
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "auto",
          background: "white",
          padding: "35px",
          borderRadius: "15px",
          boxShadow:
            "0 5px 20px rgba(0,0,0,0.08)"
        }}
      >
        <div
          style={{
            textAlign: "center"
          }}
        >
          <h1
            style={{
              color: "#d63384"
            }}
          >
            VIENLY
          </h1>

          <h2>
            Patient Skin Health Report
          </h2>

          <p>
            Generated from the VIENLY Skin
            Intelligence System
          </p>
        </div>

        <hr />

        <h2>
          Patient Information
        </h2>

        <p>
          <b>Name:</b>{" "}
          {patient.full_name ||
            "Not provided"}
        </p>

        <p>
          <b>Email:</b>{" "}
          {patient.email ||
            "Not provided"}
        </p>

        <hr />

        <h2>Skin Profile</h2>

        <p>
          <b>Skin Type:</b>{" "}
          {skin.skin_type ||
            "Not provided"}
        </p>

        <p>
          <b>Concerns:</b>{" "}
          {skin.concerns ||
            "Not provided"}
        </p>

        <p>
          <b>Sensitivity:</b>{" "}
          {skin.sensitivity ||
            "Not provided"}
        </p>

        <hr />

        <h2>
          Skin Assessment
        </h2>

        <p>
          <b>Skin Score:</b>{" "}
          {assessment.skin_score ??
            assessment.score ??
            "Not available"}
          /100
        </p>

        <p>
          <b>Concern Level:</b>{" "}
          {assessment.concern_level ||
            "Not available"}
        </p>

        <p>
          <b>Acne:</b>{" "}
          {assessment.acne
            ? "Yes"
            : "No"}
        </p>

        <p>
          <b>Dark Spots:</b>{" "}
          {assessment.dark_spots
            ? "Yes"
            : "No"}
        </p>

        <p>
          <b>Dryness:</b>{" "}
          {assessment.dryness
            ? "Yes"
            : "No"}
        </p>

        <p>
          <b>Redness:</b>{" "}
          {assessment.redness
            ? "Yes"
            : "No"}
        </p>

        <p>
          <b>Wrinkles:</b>{" "}
          {assessment.wrinkles
            ? "Yes"
            : "No"}
        </p>

        <p>
          <b>Sensitivity:</b>{" "}
          {assessment.sensitivity ||
            "Not available"}
        </p>

        <hr />

        <h2>Lifestyle</h2>

        <p>
          <b>Activity Level:</b>{" "}
          {lifestyle.activity_level ||
            "Not provided"}
        </p>

        <p>
          <b>Stress Level:</b>{" "}
          {lifestyle.stress_level ||
            "Not provided"}
        </p>

        <p>
          <b>Workout Frequency:</b>{" "}
          {lifestyle.workout_frequency ||
            "Not provided"}
        </p>

        <p>
          <b>Diet:</b>{" "}
          {lifestyle.diet_type ||
            "Not provided"}
        </p>

        <p>
          <b>Water Intake:</b>{" "}
          {lifestyle.water_intake !==
          undefined
            ? `${lifestyle.water_intake} L`
            : "Not provided"}
        </p>

        <p>
          <b>Allergies:</b>{" "}
          {lifestyle.allergies ||
            "None reported"}
        </p>

        <p>
          <b>
            Environmental Exposure:
          </b>{" "}
          {lifestyle.environmental_exposure ||
            "Not provided"}
        </p>

        <hr />

        <h2>Sleep History</h2>

        {sleep.length === 0 ? (
          <p>
            No sleep records available.
          </p>
        ) : (
          sleep.map((item) => (
            <div key={item.id}>
              <p>
                <b>Date:</b>{" "}
                {item.sleep_date ||
                  "Not available"}
              </p>

              <p>
                <b>Duration:</b>{" "}
                {item.sleep_duration !==
                undefined
                  ? `${item.sleep_duration} hours`
                  : "Not available"}
              </p>

              <p>
                <b>Quality:</b>{" "}
                {item.sleep_quality ||
                  "Not available"}
              </p>

              <hr />
            </div>
          ))
        )}

        <h2>
          Progress History
        </h2>

        {progress.length === 0 ? (
          <p>
            No progress records available.
          </p>
        ) : (
          progress.map((item) => (
            <div
              key={item.id}
              style={{
                padding: "10px",
                marginBottom: "10px",
                background: "#fff0f5",
                borderRadius: "8px"
              }}
            >
              <p>
                <b>Skin Score:</b>{" "}
                {item.skin_score}/100
              </p>

              <p>
                <b>Acne:</b>{" "}
                {item.acne
                  ? "Yes"
                  : "No"}
              </p>

              <p>
                <b>Dark Spots:</b>{" "}
                {item.dark_spots
                  ? "Yes"
                  : "No"}
              </p>

              <p>
                <b>Dryness:</b>{" "}
                {item.dryness
                  ? "Yes"
                  : "No"}
              </p>

              <p>
                <b>Sensitivity:</b>{" "}
                {item.sensitivity ||
                  "Not available"}
              </p>

              <p>
                <b>Notes:</b>{" "}
                {item.notes ||
                  "No notes"}
              </p>

              <p>
                <b>Recorded:</b>{" "}
                {item.recorded_at
                  ? new Date(
                      item.recorded_at
                    ).toLocaleString()
                  : "Not available"}
              </p>
            </div>
          ))
        )}

        <h2>
          Dermatologist Care Plans
        </h2>

        {carePlans.length === 0 ? (
          <p>
            No care plans available.
          </p>
        ) : (
          carePlans.map((plan) => (
            <div
              key={plan.id}
              style={{
                padding: "12px",
                marginBottom: "10px",
                background: "#fff0f5",
                borderRadius: "8px"
              }}
            >
              <p>
                <b>Care Plan:</b>{" "}
                {plan.notes ||
                  "No notes"}
              </p>

              <p>
                <b>Dermatologist:</b>{" "}
                {plan.doctor_name ||
                  "Not available"}
              </p>

              <p>
                <b>Reviewed:</b>{" "}
                {plan.reviewed_at
                  ? new Date(
                      plan.reviewed_at
                    ).toLocaleString()
                  : "Not available"}
              </p>
            </div>
          ))
        )}

        <hr />

        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            marginTop: "25px",
            flexWrap: "wrap"
          }}
        >
          <button
            onClick={generatePDF}
            style={{
              padding: "12px 25px",
              background: "#d63384",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Download PDF
          </button>

          <button
            onClick={generateExcel}
            style={{
              padding: "12px 25px",
              background: "#198754",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Download Excel
          </button>

          <button
            onClick={printReport}
            style={{
              padding: "12px 25px",
              background: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Print Report
          </button>

          <button
            onClick={() =>
              navigate(
                `/patient/${user_id}`
              )
            }
            style={{
              padding: "12px 25px",
              background: "#eee",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default PatientReport;