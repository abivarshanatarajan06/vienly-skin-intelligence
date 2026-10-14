import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="vienly-home">

      {/* NAVBAR */}
      <nav className="vienly-nav">

        <div className="vienly-brand">
          <span className="brand-main">VIENLY'S</span>
          <span className="brand-sub">SKIN INTELLIGENCE</span>
        </div>

        <div className="vienly-nav-actions">

          <button
            className="nav-login"
            onClick={() => navigate("/login")}
          >
            Sign In
          </button>

          <button
            className="nav-register"
            onClick={() => navigate("/register")}
          >
            Create Account
          </button>

        </div>

      </nav>


      {/* HERO SECTION */}
      <main>

        <section className="vienly-hero">

          <div className="hero-badge">
            PERSONALIZED SKINCARE
          </div>

          <h1>
            Your skin deserves
            <span>a smarter routine.</span>
          </h1>

          <p>
            Understand your skin, track your lifestyle,
            and build better skincare habits with VIENLY'S.
          </p>

          <div className="hero-actions">

            <button
              className="hero-primary"
              onClick={() => navigate("/register")}
            >
              Start Your Journey
              <span>→</span>
            </button>

            <button
              className="hero-secondary"
              onClick={() => navigate("/login")}
            >
              I already have an account
            </button>

          </div>

          <div className="hero-note">
            <span>✓</span>
            Simple • Personal • Designed around you
          </div>

        </section>


        {/* FEATURES */}
        <section className="vienly-features">

          <div className="section-heading">

            <span>HOW VIENLY'S HELPS</span>

            <h2>
              Everything starts with understanding you.
            </h2>

          </div>


          <div className="feature-grid">

            {/* CARD 1 */}
            <article className="feature-item">

              <div className="feature-number">
                01
              </div>

              <div className="feature-icon">
                🧴
              </div>

              <h3>
                Know Your Skin
              </h3>

              <p>
                Create a personal skin profile with your
                skin type and main concerns.
              </p>

            </article>


            {/* CARD 2 */}
            <article className="feature-item">

              <div className="feature-number">
                02
              </div>

              <div className="feature-icon">
                🌙
              </div>

              <h3>
                Track Your Lifestyle
              </h3>

              <p>
                Record sleep, water, exercise and stress
                habits that may affect your skin.
              </p>

            </article>


            {/* CARD 3 */}
            <article className="feature-item">

              <div className="feature-number">
                03
              </div>

              <div className="feature-icon">
                💡
              </div>

              <h3>
                Get Smarter Guidance
              </h3>

              <p>
                Use your personal information as the
                foundation for future skincare guidance.
              </p>

            </article>

          </div>

        </section>

      </main>


      {/* FOOTER */}
      <footer className="vienly-footer">

        <strong>VIENLY'S</strong>

        <span>
          Skin Intelligence • Your skin, understood.
        </span>

      </footer>

    </div>
  );
}

export default Home;