import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("Logging in...");

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed");
        return;
      }

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );
      localStorage.setItem("token", data.token);

      setMessage("Login successful!");

      setTimeout(() => {
        if (data.user.role === "dermatologist") {
          navigate("/dermatologist-dashboard");
        } else if (data.user.role === "user") {
          navigate("/onboarding");
        } else {
          setMessage("Invalid account role.");
        }
      }, 700);

    } catch (error) {
      console.error("LOGIN ERROR:", error);
      setMessage("Cannot connect to backend");
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-left">

        <div className="brand">
          <div className="brand-icon">✦</div>
          <h1>VIENLY'S</h1>
          <p>SKIN INTELLIGENCE</p>
        </div>

        <div className="welcome-text">
          <h2>
            Welcome back.
            <br />
            Your skin journey
            <br />
            continues here.
          </h2>

          <p>
            Track your skin, understand your lifestyle,
            and discover personalized skincare guidance.
          </p>
        </div>

      </div>

      <div className="auth-right">

        <div className="login-card">

          <div className="card-heading">

            <span className="eyebrow">
              WELCOME BACK
            </span>

            <h2>
              Sign in to your account
            </h2>

            <p>
              Continue your personalized skincare journey.
            </p>

          </div>

          <form onSubmit={handleLogin}>

            <div className="input-group">

              <label>Email</label>

              <div className="input-box">

                <span>✉</span>

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                />

              </div>

            </div>

            <div className="input-group">

              <label>Password</label>

              <div className="input-box">

                <span>🔒</span>

                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                />

              </div>

            </div>

            <button
              type="submit"
              className="login-submit"
            >
              Sign In →
            </button>

          </form>

          {message && (
            <div className="auth-message">
              {message}
            </div>
          )}

          <div className="create-account">

            <span>
              Don't have an account?
            </span>

            <button
              onClick={() =>
                navigate("/register")
              }
            >
              Create Account
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;