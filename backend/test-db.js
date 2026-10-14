const pool = require("./db");

pool.query("SELECT NOW()", (error, result) => {
  if (error) {
    console.error("Database connection failed:");
    console.error(error.message);
  } else {
    console.log("Database connected successfully!");
    console.log("PostgreSQL time:", result.rows[0].now);
  }

  pool.end();
});