const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const { Pool } = require("pg");

const app = express();
const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 5432)
});

pool.on("error", err => console.error("Database pool error:", err.message));

function validUserId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function authenticateToken(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Token required" });
  if (!JWT_SECRET) return res.status(500).json({ message: "JWT_SECRET missing" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}

async function setupDatabase() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(150) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS skin_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      skin_type VARCHAR(50),
      concerns TEXT,
      sensitivity VARCHAR(50),
      allergies TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE skin_profiles ADD COLUMN IF NOT EXISTS allergies TEXT`,
    `CREATE TABLE IF NOT EXISTS lifestyle (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      activity_level VARCHAR(50),
      stress_level VARCHAR(50),
      workout_frequency VARCHAR(100),
      diet_type VARCHAR(100),
      water_intake NUMERIC,
      allergies TEXT,
      environmental_exposure TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS lifestyle_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      activity_level VARCHAR(50),
      stress_level VARCHAR(50),
      workout_frequency VARCHAR(100),
      diet_type VARCHAR(100),
      water_intake NUMERIC,
      allergies TEXT,
      environmental_exposure TEXT,
      recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS sleep_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      sleep_duration NUMERIC NOT NULL,
      sleep_quality INTEGER NOT NULL,
      notes TEXT,
      sleep_date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, sleep_date)
    )`,
    `CREATE TABLE IF NOT EXISTS skin_assessments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      acne INTEGER DEFAULT 0,
      dark_spots INTEGER DEFAULT 0,
      dryness INTEGER DEFAULT 0,
      redness INTEGER DEFAULT 0,
      wrinkles INTEGER DEFAULT 0,
      sensitivity INTEGER DEFAULT 0,
      oiliness VARCHAR(30),
      notes TEXT,
      skin_score INTEGER,
      score INTEGER,
      concern_level VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS ingredients (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      benefits TEXT,
      suitable_skin_types TEXT,
      suitable_concerns TEXT,
      sensitivity_level VARCHAR(20)
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      category VARCHAR(100),
      brand VARCHAR(100),
      description TEXT,
      suitable_skin_types TEXT,
      suitable_concerns TEXT,
      price NUMERIC(10,2)
    )`,
    `CREATE TABLE IF NOT EXISTS product_ingredients (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
      UNIQUE(product_id, ingredient_id)
    )`,
    `CREATE TABLE IF NOT EXISTS progress_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      skin_score INTEGER,
      acne INTEGER DEFAULT 0,
      dark_spots INTEGER DEFAULT 0,
      dryness INTEGER DEFAULT 0,
      sensitivity INTEGER DEFAULT 0,
      notes TEXT,
      recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS routine_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      routine_date DATE DEFAULT CURRENT_DATE,
      completed_steps JSONB DEFAULT '{}'::jsonb,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, routine_date)
    )`,
    `CREATE TABLE IF NOT EXISTS care_plans (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      doctor_id INTEGER,
      notes TEXT,
      reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      notification_type VARCHAR(50) DEFAULT 'general',
      title VARCHAR(150) NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS dermatologist_consultations (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      doctor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      notes TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const query of queries) await pool.query(query);
  console.log("Database tables ready");
}
app.get("/", (req, res) => {
  res.json({ message: "VIENLY backend is running" });
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS time");
    res.json({ connected: true, time: result.rows[0].time });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

// REGISTER
app.post("/register", async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        message: "Full name, email and password are required"
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters"
      });
    }

    const hash = await bcrypt.hash(password, 12);
    const safeRole = role === "dermatologist" ? "dermatologist" : "user";

    const result = await pool.query(
      `INSERT INTO users (full_name, email, password, role)
       VALUES ($1,$2,$3,$4)
       RETURNING id, full_name, email, role`,
      [String(full_name).trim(), String(email).trim().toLowerCase(), hash, safeRole]
    );

    res.status(201).json({
      message: "Registration successful",
      user: result.rows[0]
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ message: "Email already registered" });
    }
    console.error("Register error:", err.message);
    res.status(500).json({ message: "Registration failed" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [String(email).trim().toLowerCase()]
    );

    if (!result.rows.length) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const dbUser = result.rows[0];
    let passwordMatches = false;

    if (String(dbUser.password).startsWith("$2")) {
      passwordMatches = await bcrypt.compare(password, dbUser.password);
    } else {
      // Upgrade a previous development account after successful login.
      passwordMatches = password === dbUser.password;

      if (passwordMatches) {
        const hash = await bcrypt.hash(password, 12);
        await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
          hash, dbUser.id
        ]);
      }
    }

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET missing in .env" });
    }

    const user = {
      id: dbUser.id,
      full_name: dbUser.full_name,
      email: dbUser.email,
      role: dbUser.role
    };

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ message: "Login successful", user, token });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Login failed" });
  }
});

// SAVE OR UPDATE SKIN PROFILE
app.post("/skin-profile", async (req, res) => {
  try {
    const { user_id, skin_type, concerns, sensitivity, allergies } = req.body;
    const userId = validUserId(user_id);

    if (!userId) {
      return res.status(400).json({ message: "Valid user ID required" });
    }

    const concernText = Array.isArray(concerns)
      ? concerns.join(", ")
      : concerns || null;

    const result = await pool.query(
      `INSERT INTO skin_profiles
       (user_id, skin_type, concerns, sensitivity, allergies)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id) DO UPDATE SET
         skin_type = EXCLUDED.skin_type,
         concerns = EXCLUDED.concerns,
         sensitivity = EXCLUDED.sensitivity,
         allergies = EXCLUDED.allergies
       RETURNING *`,
      [userId, skin_type || null, concernText, sensitivity || null, allergies || null]
    );

    res.json({ message: "Skin profile saved", profile: result.rows[0] });
  } catch (err) {
    console.error("Skin profile error:", err.message);
    res.status(500).json({ message: "Failed to save skin profile" });
  }
});

app.get("/skin-profile/:user_id", async (req, res) => {
  try {
    const userId = validUserId(req.params.user_id);
    if (!userId) return res.status(400).json({ message: "Invalid user ID" });

    const result = await pool.query(
      "SELECT * FROM skin_profiles WHERE user_id = $1",
      [userId]
    );

    res.json({ profile: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ message: "Failed to load skin profile" });
  }
});

// SAVE LIFESTYLE AND CREATE A HISTORY RECORD
app.post("/lifestyle", async (req, res) => {
  try {
    const {
      user_id, activity_level, stress_level, workout_frequency,
      diet_type, water_intake, allergies, environmental_exposure,
      exercise_minutes
    } = req.body;

    const userId = validUserId(user_id);
    if (!userId) return res.status(400).json({ message: "Valid user ID required" });

    const water = water_intake == null || water_intake === ""
      ? null : Number(water_intake);

    const values = [
      userId,
      activity_level || (exercise_minutes != null ? `${exercise_minutes} minutes` : null),
      stress_level || null,
      workout_frequency || null,
      diet_type || null,
      Number.isFinite(water) ? water : null,
      allergies || null,
      environmental_exposure || null
    ];

    const result = await pool.query(
      `INSERT INTO lifestyle
       (user_id, activity_level, stress_level, workout_frequency, diet_type,
        water_intake, allergies, environmental_exposure)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (user_id) DO UPDATE SET
         activity_level = EXCLUDED.activity_level,
         stress_level = EXCLUDED.stress_level,
         workout_frequency = EXCLUDED.workout_frequency,
         diet_type = EXCLUDED.diet_type,
         water_intake = EXCLUDED.water_intake,
         allergies = EXCLUDED.allergies,
         environmental_exposure = EXCLUDED.environmental_exposure
       RETURNING *`,
      values
    );

    await pool.query(
      `INSERT INTO lifestyle_logs
       (user_id, activity_level, stress_level, workout_frequency, diet_type,
        water_intake, allergies, environmental_exposure)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      values
    );

    res.json({ message: "Lifestyle saved", lifestyle: result.rows[0] });
  } catch (err) {
    console.error("Lifestyle error:", err.message);
    res.status(500).json({ message: "Failed to save lifestyle" });
  }
});

app.get("/lifestyle/:user_id", async (req, res) => {
  try {
    const userId = validUserId(req.params.user_id);
    if (!userId) return res.status(400).json({ message: "Invalid user ID" });

    const result = await pool.query(
      "SELECT * FROM lifestyle WHERE user_id = $1",
      [userId]
    );

    res.json({ lifestyle: result.rows });
  } catch (err) {
    res.status(500).json({ message: "Failed to load lifestyle" });
  }
});

app.post("/lifestyle-log", async (req, res) => {
  try {
    const {
      user_id, activity_level, stress_level, workout_frequency,
      diet_type, water_intake, allergies, environmental_exposure
    } = req.body;

    const userId = validUserId(user_id);
    if (!userId) return res.status(400).json({ message: "Valid user ID required" });

    const result = await pool.query(
      `INSERT INTO lifestyle_logs
       (user_id, activity_level, stress_level, workout_frequency, diet_type,
        water_intake, allergies, environmental_exposure)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        userId, activity_level || null, stress_level || null,
        workout_frequency || null, diet_type || null,
        water_intake == null || water_intake === "" ? null : Number(water_intake),
        allergies || null, environmental_exposure || null
      ]
    );

    res.status(201).json({ log: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Failed to save lifestyle log" });
  }
});

app.get("/lifestyle-logs/:user_id", async (req, res) => {
  try {
    const userId = validUserId(req.params.user_id);
    if (!userId) return res.status(400).json({ message: "Invalid user ID" });

    const result = await pool.query(
      "SELECT * FROM lifestyle_logs WHERE user_id = $1 ORDER BY recorded_at DESC",
      [userId]
    );

    res.json({ logs: result.rows });
  } catch (err) {
    res.status(500).json({ message: "Failed to load lifestyle logs" });
  }
});

// SLEEP TRACKING: supports both frontend route names
async function saveSleep(req, res) {
  try {
    const {
      user_id, sleep_duration, sleep_hours,
      sleep_quality, notes, sleep_date
    } = req.body;

    const userId = validUserId(user_id);
    const duration = Number(sleep_duration ?? sleep_hours);

    const labels = {
      poor: 1, bad: 1, fair: 2, average: 3,
      moderate: 3, good: 4, excellent: 5
    };

    const qualityText = String(sleep_quality ?? "3").toLowerCase();
    const quality = labels[qualityText] || Number(qualityText);

    if (!userId) return res.status(400).json({ message: "Valid user ID required" });
    if (!Number.isFinite(duration) || duration < 0 || duration > 24) {
      return res.status(400).json({ message: "Sleep hours must be between 0 and 24" });
    }
    if (!Number.isInteger(quality) || quality < 1 || quality > 5) {
      return res.status(400).json({ message: "Sleep quality must be 1–5" });
    }

    const date = sleep_date || new Date().toISOString().slice(0, 10);

    const result = await pool.query(
      `INSERT INTO sleep_logs
       (user_id, sleep_duration, sleep_quality, notes, sleep_date)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id, sleep_date) DO UPDATE SET
         sleep_duration = EXCLUDED.sleep_duration,
         sleep_quality = EXCLUDED.sleep_quality,
         notes = EXCLUDED.notes,
         created_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, duration, quality, notes || null, date]
    );

    res.status(201).json({ message: "Sleep log saved", sleep: result.rows[0] });
  } catch (err) {
    console.error("Sleep error:", err.message);
    res.status(500).json({ message: "Failed to save sleep log" });
  }
}

app.post("/sleep", saveSleep);
app.post("/sleep-tracking", saveSleep);

app.get("/sleep/:user_id", async (req, res) => {
  try {
    const userId = validUserId(req.params.user_id);
    if (!userId) return res.status(400).json({ message: "Invalid user ID" });

    const result = await pool.query(
      "SELECT * FROM sleep_logs WHERE user_id = $1 ORDER BY sleep_date DESC",
      [userId]
    );

    res.json({ sleep_logs: result.rows });
  } catch (err) {
    res.status(500).json({ message: "Failed to load sleep logs" });
  }
});
// ================= SKIN ASSESSMENT =================

app.post("/skin-assessment", async (req, res) => {
  try {
    const {
      user_id, acne, dark_spots, dryness, redness, wrinkles,
      sensitivity, oiliness, notes
    } = req.body;

    const userId = validUserId(user_id);
    if (!userId) {
      return res.status(400).json({ message: "Valid user ID required" });
    }

    // The frontend may send severity values from 0 to 3.
    function severity(value) {
      const n = Number(value ?? 0);
      return Number.isFinite(n) ? Math.max(0, Math.min(3, Math.round(n))) : 0;
    }
    function severity(value) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? Math.max(0, Math.min(3, Math.round(n))) : 0;
}
const a = severity(acne);
const d = severity(dark_spots);
const dry = severity(dryness);
const red = severity(redness);
const wr = severity(wrinkles);
const sens = severity(sensitivity);

const totalConcern = a + d + dry + red + wr + sens;
const score = Math.max(0, 100 - totalConcern * 5);

const concernLevel =
  totalConcern <= 3 ? "Low" :
  totalConcern <= 8 ? "Moderate" : "High";
;

    const result = await pool.query(
      `INSERT INTO skin_assessments
       (user_id, acne, dark_spots, dryness, redness, wrinkles,
        sensitivity, oiliness, notes, skin_score, score, concern_level)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10,$11)
       RETURNING *`,
      
        [
  userId,
  Boolean(a),
  Boolean(d),
  Boolean(dry),
  Boolean(red),
  Boolean(wr),
  String(sensitivity ?? "0"),
  oiliness || null,
  notes || null,
  score,
  concernLevel
]
      
    );

    res.status(201).json({
      message: "Skin assessment saved",
      assessment: result.rows[0]
    });
  } catch (err) {
    console.error("Assessment error:", err.message);
    res.status(500).json({ message: "Failed to save skin assessment" });
  }
});

app.get("/skin-assessment/:user_id", async (req, res) => {
  try {
    const userId = validUserId(req.params.user_id);
    if (!userId) return res.status(400).json({ message: "Invalid user ID" });

    const result = await pool.query(
      `SELECT * FROM skin_assessments
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    res.json({ assessment: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ message: "Failed to load assessment" });
  }
});

// ================= INGREDIENTS =================

app.get("/ingredients", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM ingredients ORDER BY name"
    );
    res.json({ ingredients: result.rows });
  } catch (err) {
    res.status(500).json({ message: "Failed to load ingredients" });
  }
});

// ================= PRODUCTS =================

app.get("/products", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', i.id,
              'name', i.name,
              'benefits', i.benefits,
              'sensitivity_level', i.sensitivity_level
            )
          ) FILTER (WHERE i.id IS NOT NULL),
          '[]'::json
        ) AS ingredients
      FROM products p
      LEFT JOIN product_ingredients pi ON pi.product_id = p.id
      LEFT JOIN ingredients i ON i.id = pi.ingredient_id
      GROUP BY p.id
      ORDER BY p.id
    `);

    res.json({ products: result.rows });
  } catch (err) {
    console.error("Products error:", err.message);
    res.status(500).json({ message: "Failed to load products" });
  }
});

// ================= INGREDIENT COMPATIBILITY =================

app.get("/ingredient-compatibility/:user_id", async (req, res) => {
  try {
    const userId = validUserId(req.params.user_id);
    if (!userId) return res.status(400).json({ message: "Invalid user ID" });

    const profileResult = await pool.query(
      "SELECT * FROM skin_profiles WHERE user_id = $1",
      [userId]
    );

    const profile = profileResult.rows[0] || null;

    const ingredientResult = await pool.query(
      "SELECT * FROM ingredients ORDER BY name"
    );

    const concerns = String(profile?.concerns || "").toLowerCase();
    const skinType = String(profile?.skin_type || "").toLowerCase();
    const sensitivity = String(profile?.sensitivity || "").toLowerCase();
    const allergies = String(profile?.allergies || "").toLowerCase();

    const ingredients = ingredientResult.rows.map((ingredient) => {
      const name = ingredient.name.toLowerCase();
      const sensitivityLevel =
        String(ingredient.sensitivity_level || "").toLowerCase();

      const allergyWarning =
        allergies.length > 0 && allergies.includes(name);

      const sensitivityWarning =
        ["high", "medium", "very sensitive"].some(v => sensitivity.includes(v)) &&
        sensitivityLevel === "medium";

      const suitableType = String(
        ingredient.suitable_skin_types || ""
      ).toLowerCase().includes(skinType);

      const suitableConcern = concerns
        .split(",")
        .map(v => v.trim())
        .filter(Boolean)
        .some(concern =>
          String(ingredient.suitable_concerns || "")
            .toLowerCase().includes(concern)
        );

      let score = 50;
      if (suitableType) score += 20;
      if (suitableConcern) score += 20;
      if (sensitivityWarning) score -= 25;
      if (allergyWarning) score = 0;

      return {
        ...ingredient,
        compatibility_score: Math.max(0, Math.min(100, score)),
        warning: allergyWarning
          ? "Possible allergy match — avoid until checked with a qualified professional"
          : sensitivityWarning
            ? "May irritate sensitive skin; patch-test and seek professional advice if needed"
            : null
      };
    });

    res.json({ user_id: userId, profile, ingredients });
  } catch (err) {
    console.error("Ingredient compatibility error:", err.message);
    res.status(500).json({ message: "Failed to check ingredient compatibility" });
  }
});

// ================= PRODUCT RECOMMENDATIONS =================

app.get("/product-recommendations/:user_id", async (req, res) => {
  try {
    const userId = validUserId(req.params.user_id);
    if (!userId) return res.status(400).json({ message: "Invalid user ID" });

    const profileResult = await pool.query(
      "SELECT * FROM skin_profiles WHERE user_id = $1",
      [userId]
    );
    const lifestyleResult = await pool.query(
      "SELECT * FROM lifestyle WHERE user_id = $1",
      [userId]
    );
    const assessmentResult = await pool.query(
      `SELECT * FROM skin_assessments
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    const profile = profileResult.rows[0] || null;
    const lifestyle = lifestyleResult.rows[0] || null;
    const assessment = assessmentResult.rows[0] || null;

    if (!profile) {
      return res.status(400).json({
        message: "Complete your skin profile before requesting recommendations",
        recommendations: []
      });
    }

    const productsResult = await pool.query(`
      SELECT p.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', i.id,
              'name', i.name,
              'sensitivity_level', i.sensitivity_level,
              'suitable_skin_types', i.suitable_skin_types,
              'suitable_concerns', i.suitable_concerns
            )
          ) FILTER (WHERE i.id IS NOT NULL),
          '[]'::json
        ) AS ingredients
      FROM products p
      LEFT JOIN product_ingredients pi ON pi.product_id = p.id
      LEFT JOIN ingredients i ON i.id = pi.ingredient_id
      GROUP BY p.id
      ORDER BY p.id
    `);

    const skinType = String(profile.skin_type || "").toLowerCase();
    const concerns = String(profile.concerns || "").toLowerCase();
    const sensitivity = String(profile.sensitivity || "").toLowerCase();
    const allergies = String(profile.allergies || lifestyle?.allergies || "").toLowerCase();

    const recommendations = productsResult.rows.map(product => {
      let score = 0;
      const reasons = [];
      const suitableTypes = String(product.suitable_skin_types || "").toLowerCase();
      const suitableConcerns = String(product.suitable_concerns || "").toLowerCase();

      if (skinType && suitableTypes.includes(skinType)) {
        score += 40;
        reasons.push("Suitable for your skin type");
      }

      const matchingConcern = concerns
        .split(",")
        .map(v => v.trim())
        .filter(Boolean)
        .some(concern => suitableConcerns.includes(concern));

      if (matchingConcern) {
        score += 30;
        reasons.push("Targets one or more of your skin concerns");
      }

      const ingredientNames = product.ingredients.map(i =>
        String(i.name || "").toLowerCase()
      );

      const allergyMatch = ingredientNames.some(name =>
        name && allergies.includes(name)
      );

      const irritationRisk = ["high", "medium", "very sensitive"].some(v =>
        sensitivity.includes(v)
      ) && product.ingredients.some(i =>
        String(i.sensitivity_level || "").toLowerCase() === "medium"
      );

      if (allergyMatch) {
        score = 0;
        reasons.push("Possible allergy match — do not use without professional review");
      } else {
        if (irritationRisk) {
          score = Math.max(0, score - 25);
          reasons.push("Caution: possible irritation for sensitive skin");
        }

        if (Number(lifestyle?.water_intake) > 0 &&
            Number(lifestyle.water_intake) < 2 &&
            String(product.category || "").toLowerCase().includes("moisturizer")) {
          score += 5;
          reasons.push("Hydration support may be useful");
        }

        if (Number(assessment?.acne) > 0 &&
            String(product.category || "").toLowerCase().includes("cleanser")) {
          score += 10;
          reasons.push("May support a routine for acne-prone skin");
        }
      }

      return {
        ...product,
        recommendation_score: Math.max(0, Math.min(100, score)),
        reasons,
        warning: allergyMatch
          ? "Possible allergy match. Avoid until checked with a qualified professional."
          : irritationRisk
            ? "Patch-test cautiously; stop if irritation occurs."
            : null
      };
    })
    .filter(product => product.recommendation_score > 0)
    .sort((a, b) => b.recommendation_score - a.recommendation_score);

    res.json({
      user_id: userId,
      profile,
      lifestyle,
      assessment,
      recommendations
    });
  } catch (err) {
    console.error("Recommendations error:", err.message);
    res.status(500).json({ message: "Failed to generate recommendations" });
  }
});
// ================= INGREDIENT CHECKER =================

app.post("/ingredient-checker", async (req, res) => {
  try {
    const { user_id, product_name, ingredients } = req.body;
    const userId = validUserId(user_id);

    if (!userId) {
      return res.status(400).json({ message: "Valid user ID required" });
    }

    const profileResult = await pool.query(
      "SELECT * FROM skin_profiles WHERE user_id = $1",
      [userId]
    );

    const profile = profileResult.rows[0] || null;

    const suppliedIngredients = Array.isArray(ingredients)
      ? ingredients.map(item =>
          typeof item === "string" ? item.trim() : String(item.name || "").trim()
        ).filter(Boolean)
      : String(ingredients || "")
          .split(",")
          .map(item => item.trim())
          .filter(Boolean);

    const knownResult = await pool.query(
      "SELECT * FROM ingredients ORDER BY name"
    );

    const allergies = String(profile?.allergies || "").toLowerCase();
    const sensitivity = String(profile?.sensitivity || "").toLowerCase();

    const checkedIngredients = suppliedIngredients.map(name => {
      const known = knownResult.rows.find(
        item => item.name.toLowerCase() === name.toLowerCase()
      );

      const allergyMatch = allergies.includes(name.toLowerCase());
      const sensitivityRisk =
        ["high", "medium", "very sensitive"].some(value =>
          sensitivity.includes(value)
        ) &&
        ["medium", "high"].includes(
          String(known?.sensitivity_level || "").toLowerCase()
        );

      return {
        name,
        found_in_database: Boolean(known),
        benefits: known?.benefits || "No ingredient details available",
        sensitivity_level: known?.sensitivity_level || "Unknown",
        warning: allergyMatch
          ? "Possible allergy match. Avoid until checked with a qualified professional."
          : sensitivityRisk
            ? "Potential irritation risk for sensitive skin."
            : null
      };
    });

    const warnings = checkedIngredients
      .filter(item => item.warning)
      .map(item => ({ name: item.name, warning: item.warning }));

    res.json({
      product_name: product_name || "Unnamed product",
      profile,
      ingredients: checkedIngredients,
      warnings,
      overall_status: warnings.length ? "Caution" : "Review ingredients before use"
    });
  } catch (err) {
    console.error("Ingredient checker error:", err.message);
    res.status(500).json({ message: "Ingredient check failed" });
  }
});

// ================= ROUTINE TRACKING =================

app.get("/routine/:user_id", async (req, res) => {
  try {
    const userId = validUserId(req.params.user_id);
    if (!userId) return res.status(400).json({ message: "Invalid user ID" });

    const date = req.query.date || new Date().toISOString().slice(0, 10);

    const result = await pool.query(
      `SELECT * FROM routine_logs
       WHERE user_id = $1 AND routine_date = $2`,
      [userId, date]
    );

    res.json({
      routine: result.rows[0] || {
        user_id: userId,
        routine_date: date,
        completed_steps: {}
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load routine" });
  }
});

app.post("/routine", async (req, res) => {
  try {
    const userId = validUserId(req.body.user_id);
    if (!userId) return res.status(400).json({ message: "Invalid user ID" });

    const completedSteps = req.body.completed_steps;
    const routineDate =
      req.body.routine_date || new Date().toISOString().slice(0, 10);

    if (
      !completedSteps ||
      typeof completedSteps !== "object" ||
      Array.isArray(completedSteps)
    ) {
      return res.status(400).json({
        message: "completed_steps must be an object"
      });
    }

    const result = await pool.query(
      `INSERT INTO routine_logs (user_id, routine_date, completed_steps, updated_at)
       VALUES ($1, $2, $3::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, routine_date)
       DO UPDATE SET completed_steps = EXCLUDED.completed_steps,
                     updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, routineDate, JSON.stringify(completedSteps)]
    );

    res.json({ message: "Routine saved", routine: result.rows[0] });
  } catch (err) {
    console.error("Routine error:", err.message);
    res.status(500).json({ message: "Failed to save routine" });
  }
});

// ================= PROGRESS TRACKING =================

app.get("/progress/:user_id", async (req, res) => {
  try {
    const userId = validUserId(req.params.user_id);
    if (!userId) return res.status(400).json({ message: "Invalid user ID" });

    const result = await pool.query(
      `SELECT * FROM progress_logs
       WHERE user_id = $1
       ORDER BY recorded_at DESC`,
      [userId]
    );

    res.json({ progress: result.rows });
  } catch (err) {
    res.status(500).json({ message: "Failed to load progress" });
  }
});

app.post("/progress", async (req, res) => {
  try {
    const {
      user_id, skin_score, acne, dark_spots, dryness,
      sensitivity, notes
    } = req.body;

    const userId = validUserId(user_id);
    if (!userId) return res.status(400).json({ message: "Invalid user ID" });

    let score = Number(skin_score ?? 0);

    if (!Number.isFinite(score)) {
      return res.status(400).json({ message: "Invalid skin score" });
    }

    // Accept a 1–10 score from the frontend and store it on a 0–100 scale.
    if (score > 0 && score <= 10) score = score * 10;
    score = Math.max(0, Math.min(100, Math.round(score)));

    const result = await pool.query(
      `INSERT INTO progress_logs
       (user_id, skin_score, acne, dark_spots, dryness, sensitivity, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      
        [
  userId,
  score,
  Number(acne || 0) > 0,
  Number(dark_spots || 0) > 0,
  Number(dryness || 0) > 0,
  Number(sensitivity || 0) > 0,
  notes || null
]
      
    );

    res.status(201).json({
      message: "Progress saved",
      progress: result.rows[0]
    });
  } catch (err) {
    console.error("Progress save error:", err.message);
    res.status(500).json({ message: "Failed to save progress" });
  }
});

app.delete("/progress/:id", async (req, res) => {
  try {
    const progressId = validUserId(req.params.id);
    const userId = validUserId(req.query.user_id);

    if (!progressId || !userId) {
      return res.status(400).json({
        message: "Valid progress ID and user ID required"
      });
    }

    const result = await pool.query(
      "DELETE FROM progress_logs WHERE id = $1 AND user_id = $2 RETURNING id",
      [progressId, userId]
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: "Progress record not found" });
    }

    res.json({ message: "Progress record deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete progress" });
  }
});

// ================= ANALYTICS =================

app.get("/analytics/:user_id", async (req, res) => {
  try {
    const userId = validUserId(req.params.user_id);
    if (!userId) return res.status(400).json({ message: "Invalid user ID" });

    const progressResult = await pool.query(
      `SELECT COUNT(*)::int AS total_records,
              ROUND(AVG(skin_score)) AS average_score,
              MAX(skin_score) AS best_score,
              MIN(skin_score) AS lowest_score
       FROM progress_logs
       WHERE user_id = $1`,
      [userId]
    );

    const sleepResult = await pool.query(
      `SELECT ROUND(AVG(sleep_duration)::numeric, 1) AS average_sleep,
              ROUND(AVG(sleep_quality)::numeric, 1) AS average_sleep_quality
       FROM sleep_logs
       WHERE user_id = $1`,
      [userId]
    );

    const routineResult = await pool.query(
      `SELECT COUNT(*)::int AS days_tracked
       FROM routine_logs
       WHERE user_id = $1`,
      [userId]
    );

    res.json({
      progress: progressResult.rows[0],
      sleep: sleepResult.rows[0],
      routine: routineResult.rows[0]
    });
  } catch (err) {
    console.error("Analytics error:", err.message);
    res.status(500).json({ message: "Failed to load analytics" });
  }
});
// ================= DASHBOARD =================

app.get("/dashboard/:user_id", async (req, res) => {
  try {
    const userId = validUserId(req.params.user_id);
    if (!userId) return res.status(400).json({ message: "Invalid user ID" });

    const [
      userResult,
      profileResult,
      assessmentResult,
      progressResult,
      sleepResult,
      routineResult
    ] = await Promise.all([
      pool.query(
        "SELECT id, full_name, email, role FROM users WHERE id = $1",
        [userId]
      ),
      pool.query("SELECT * FROM skin_profiles WHERE user_id = $1", [userId]),
      pool.query(
        `SELECT * FROM skin_assessments
         WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [userId]
      ),
      pool.query(
        `SELECT * FROM progress_logs
         WHERE user_id = $1 ORDER BY recorded_at DESC LIMIT 5`,
        [userId]
      ),
      pool.query(
        `SELECT * FROM sleep_logs
         WHERE user_id = $1 ORDER BY sleep_date DESC LIMIT 7`,
        [userId]
      ),
      pool.query(
        `SELECT * FROM routine_logs
         WHERE user_id = $1 ORDER BY routine_date DESC LIMIT 1`,
        [userId]
      )
    ]);

    res.json({
      user: userResult.rows[0] || null,
      profile: profileResult.rows[0] || null,
      assessment: assessmentResult.rows[0] || null,
      progress: progressResult.rows,
      sleep: sleepResult.rows,
      routine: routineResult.rows[0] || null
    });
  } catch (err) {
    console.error("Dashboard error:", err.message);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
});

// ================= CARE PLANS =================

app.get("/care-plans/:user_id", async (req, res) => {
  try {
    const userId = validUserId(req.params.user_id);
    if (!userId) return res.status(400).json({ message: "Invalid user ID" });

    const result = await pool.query(
      `SELECT * FROM care_plans
       WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ care_plans: result.rows });
  } catch (err) {
    res.status(500).json({ message: "Failed to load care plans" });
  }
});

app.post("/care-plans", async (req, res) => {
  try {
    const userId = validUserId(req.body.user_id);
    if (!userId) return res.status(400).json({ message: "Invalid user ID" });

    const result = await pool.query(
      `INSERT INTO care_plans (user_id, doctor_id, notes)
       VALUES ($1, $2, $3) RETURNING *`,
      [
        userId,
        validUserId(req.body.doctor_id),
        req.body.notes || null
      ]
    );

    res.status(201).json({
      message: "Care plan created",
      care_plan: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to create care plan" });
  }
});


// ================= NOTIFICATIONS =================

app.get("/notifications/:user_id", async (req, res) => {
  try {
    const userId = validUserId(req.params.user_id);
    if (!userId) return res.status(400).json({ message: "Invalid user ID" });

    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ notifications: result.rows });
  } catch (err) {
    res.status(500).json({ message: "Failed to load notifications" });
  }
});

app.post("/notifications", async (req, res) => {
  try {
    const userId = validUserId(req.body.user_id);
    const { title, message, notification_type } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        message: "user_id, title and message are required"
      });
    }

    const result = await pool.query(
      `INSERT INTO notifications
       (user_id, title, message, notification_type)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, title, message, notification_type || "general"]
    );

    res.status(201).json({
      message: "Notification created",
      notification: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to create notification" });
  }
});

app.patch("/notifications/:id/read", async (req, res) => {
  try {
    const notificationId = validUserId(req.params.id);
    const userId = validUserId(req.body.user_id);

    if (!notificationId || !userId) {
      return res.status(400).json({ message: "Valid IDs required" });
    }

    const result = await pool.query(
      `UPDATE notifications SET is_read = TRUE
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [notificationId, userId]
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({
      message: "Notification marked as read",
      notification: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update notification" });
  }
});

// ================= DERMATOLOGIST =================

app.get("/dermatologist/patients", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.full_name, u.email,
             sp.skin_type, sp.concerns, sp.sensitivity,
             dc.status AS consultation_status,
             dc.notes AS consultation_notes
      FROM users u
      LEFT JOIN skin_profiles sp ON sp.user_id = u.id
      LEFT JOIN dermatologist_consultations dc ON dc.patient_id = u.id
      WHERE u.role = 'user'
      ORDER BY u.id DESC
    `);

    res.json({ patients: result.rows });
  } catch (err) {
    console.error("Patients error:", err.message);
    res.status(500).json({ message: "Failed to load patients" });
  }
});

app.get("/patient/:user_id", async (req, res) => {
  try {
    const userId = validUserId(req.params.user_id);
    if (!userId) return res.status(400).json({ message: "Invalid user ID" });

    const [
      userResult,
      profileResult,
      assessmentResult,
      progressResult,
      sleepResult
    ] = await Promise.all([
      pool.query(
        "SELECT id, full_name, email, role FROM users WHERE id = $1",
        [userId]
      ),
      pool.query("SELECT * FROM skin_profiles WHERE user_id = $1", [userId]),
      pool.query(
        `SELECT * FROM skin_assessments
         WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [userId]
      ),
      pool.query(
        "SELECT * FROM progress_logs WHERE user_id = $1 ORDER BY recorded_at DESC",
        [userId]
      ),
      pool.query(
        "SELECT * FROM sleep_logs WHERE user_id = $1 ORDER BY sleep_date DESC",
        [userId]
      )
    ]);

    res.json({
      user: userResult.rows[0] || null,
      profile: profileResult.rows[0] || null,
      assessment: assessmentResult.rows[0] || null,
      progress: progressResult.rows,
      sleep: sleepResult.rows
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load patient details" });
  }
});

app.patch(
  "/dermatologist/patients/:patient_id/consultation",
  async (req, res) => {
    try {
      const patientId = validUserId(req.params.patient_id);
      const { doctor_id, notes, status } = req.body;

      if (!patientId) {
        return res.status(400).json({ message: "Invalid patient ID" });
      }

      const allowedStatuses = ["pending", "reviewed", "completed"];
      const consultationStatus = allowedStatuses.includes(status)
        ? status
        : "reviewed";

      const result = await pool.query(
        `INSERT INTO dermatologist_consultations
         (patient_id, doctor_id, notes, status, updated_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (patient_id)
         DO UPDATE SET doctor_id = EXCLUDED.doctor_id,
                       notes = EXCLUDED.notes,
                       status = EXCLUDED.status,
                       updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [
          patientId,
          validUserId(doctor_id),
          notes || null,
          consultationStatus
        ]
      );

      res.json({
        message: "Consultation updated",
        consultation: result.rows[0]
      });
    } catch (err) {
      console.error("Consultation error:", err.message);
      res.status(500).json({ message: "Failed to update consultation" });
    }
  }
);
// ================= AUTOMATIC SKINCARE REMINDERS =================

const cron = require("node-cron");

async function sendDailyReminder(title, message, notificationType) {
  try {
    const users = await pool.query(
      "SELECT id FROM users WHERE role = 'user'"
    );

    for (const user of users.rows) {
      await pool.query(
        `INSERT INTO notifications
           (user_id, title, message, notification_type)
         SELECT $1, $2, $3, $4
         WHERE NOT EXISTS (
           SELECT 1
           FROM notifications
           WHERE user_id = $1
             AND title = $2
             AND created_at::date = CURRENT_DATE
         )`,
        [user.id, title, message, notificationType]
      );
    }

    console.log("Reminder checked:", title);
  } catch (err) {
    console.error("Reminder error:", title, err.message);
  }
}

// 8:00 AM — Morning skincare
cron.schedule("0 8 * * *", () => {
  sendDailyReminder(
    "Morning Skincare Reminder",
    "Good morning! Remember your morning skincare routine. Follow your personalized plan.",
    "skincare"
  );
}, { timezone: "Asia/Kolkata" });

// 8:30 PM — Skin progress
cron.schedule("30 20 * * *", () => {
  sendDailyReminder(
    "Daily Skin Progress",
    "Take a moment to record your skin progress and update your skincare journey.",
    "progress"
  );
}, { timezone: "Asia/Kolkata" });

// 9:00 PM — Night skincare
cron.schedule("0 21 * * *", () => {
  sendDailyReminder(
    "Night Skincare Reminder",
    "It's time for your night skincare routine. Complete your planned steps.",
    "skincare"
  );
}, { timezone: "Asia/Kolkata" });

// 10:00 PM — Sleep tracking
cron.schedule("0 22 * * *", () => {
  sendDailyReminder(
    "Sleep Tracking Reminder",
    "Before bed, record your sleep details and aim for a consistent sleep schedule.",
    "sleep"
  );
}, { timezone: "Asia/Kolkata" });

console.log("Automatic reminders scheduled for Asia/Kolkata");

// ================= SERVER START =================

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl
  });
});

async function startServer() {
  if (!JWT_SECRET) {
    console.error("JWT_SECRET is missing from backend/.env");
    process.exit(1);
  }

  await setupDatabase();

  app.listen(PORT, () => {
    console.log(`VIENLY backend running at http://localhost:${PORT}`);
    console.log(`Database: ${process.env.DB_NAME}`);
  });
}

startServer().catch(err => {
  console.error("Server startup failed:", err.message);
  process.exit(1);
});