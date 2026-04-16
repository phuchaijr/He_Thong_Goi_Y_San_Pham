const sql = require("mssql");

const config = {
  user: "nhom12user",
  password: "123456",
  server: "DESKTOP-CEOPGPT\\SQLEXPRESS",
  database: "Nhom12Shop",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function connectDB() {
  try {
    await sql.connect(config);
    console.log("✅ Connected to SQL Server");
  } catch (err) {
    console.error("❌ DB connection failed:", err);
  }
}

module.exports = { sql, connectDB };
