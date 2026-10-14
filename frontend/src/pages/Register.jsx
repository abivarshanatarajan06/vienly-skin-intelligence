import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

const API = "http://127.0.0.1:5000";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (form.password.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      setMessage("Account created successfully! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      setMessage(
        error.message ||
          "Could not connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-left">
        <div className="brand">
          <div className="brand-icon">✦</div>
          <h1>VIENLY</h1>
          <p>SKIN INTELLIGENCE</p>
        </div>

        <div className="welcome-text">
          <h2>Your skin deserves a routine as unique as you.</h2>
          <p>
            Create your account to begin your personalized skincare journey
            with VIENLY.
          </p>
        </div>

        <div className="benefits">
          <div>✦ Personalized skin profiles</div>
          <div>✦ Tailored product recommendations</div>
          <div>✦ Daily skincare routines</div>
        </div>
      </section>

      <section className="auth-right">
        <div className="login-card">
          <div className="mobile-logo">
            <div className="brand-icon">✦</div>
            <h1>VIENLY</h1>
          </div>

          <div className="card-heading">
            <span className="eyebrow">BEGIN YOUR JOURNEY</span>
            <h2>Create Account</h2>
            <p>Start your personalized skincare journey.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="full_name">Full Name</label>
              <div className="input-box">
                <span>👤</span>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.full_name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-box">
                <span>✉</span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="input-box">
                <span>🔒</span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-box">
                <span>🔒</span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="role">Account Type</label>
              <div className="input-box">
                <span>👤</span>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  required
                >
                  <option value="user">User</option>
                  <option value="dermatologist">Dermatologist</option>
                </select>
              </div>
            </div>

            <button
              className="login-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
              <span>→</span>
            </button>
          </form>

          {message && (
            <div className="auth-message" role="status">
              {message}
            </div>
          )}

          <div className="divider">
            <span>ALREADY A MEMBER?</span>
          </div>

          <div className="create-account">
            Already have an account?
            <Link to="/login">
              <button type="button">Login</button>
            </Link>
          </div>

          <div className="secure-note">
            Your skincare journey starts here.
          </div>
        </div>
      </section>
    </div>
  );
}

export default Register;