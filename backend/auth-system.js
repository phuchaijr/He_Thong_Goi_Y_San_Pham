const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { sql } = require("./db");

class AuthSystem {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || "your_super_secret_key";
    this.tokenExpiry = "7d";
  }

  // ===============================
  // HASH PASSWORD
  // ===============================
  async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // ===============================
  // JWT
  // ===============================
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      this.jwtSecret,
      { expiresIn: this.tokenExpiry },
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      return null;
    }
  }

  // ===============================
  // REGISTER
  // ===============================
  async registerUser(fullname, email, password, confirmPassword) {
    try {
      if (!fullname || !email || !password || !confirmPassword) {
        return { success: false, message: "Vui lòng nhập đầy đủ thông tin" };
      }

      if (password !== confirmPassword) {
        return { success: false, message: "Mật khẩu xác nhận không khớp" };
      }

      const request = new sql.Request();
      request.input("email", sql.NVarChar, email);

      const existingUser = await request.query(`
      SELECT * FROM Users WHERE email = @email
    `);

      if (existingUser.recordset.length > 0) {
        return { success: false, message: "Email đã tồn tại" };
      }

      const hashedPassword = await this.hashPassword(password);

      const insertRequest = new sql.Request();
      insertRequest.input("full_name", sql.NVarChar, fullname);
      insertRequest.input("email", sql.NVarChar, email);
      insertRequest.input("password_hash", sql.NVarChar, hashedPassword);

      const result = await insertRequest.query(`
      INSERT INTO Users (full_name, email, password_hash, role, created_at)
      OUTPUT INSERTED.id
      VALUES (@full_name, @email, @password_hash, 'user', GETDATE())
    `);

      const userId = result.recordset[0].id;

      const token = this.generateToken({
        id: userId,
        email,
        username: fullname,
      });

      return {
        success: true,
        message: "Đăng ký thành công",
        token,
        user: { id: userId, email, fullname },
      };
    } catch (error) {
      return { success: false, message: "Lỗi server: " + error.message };
    }
  }

  // ===============================
  // LOGIN
  // ===============================
  async loginUser(email, password) {
    try {
      const request = new sql.Request();
      request.input("email", sql.NVarChar, email);

      const result = await request.query(`
      SELECT * FROM Users WHERE email = @email
    `);

      if (result.recordset.length === 0) {
        return { success: false, message: "Email không tồn tại" };
      }

      const user = result.recordset[0];

      const isValidPassword = await this.comparePassword(
        password,
        user.password_hash,
      );

      if (!isValidPassword) {
        return { success: false, message: "Mật khẩu không đúng" };
      }

      const token = this.generateToken({
        id: user.id,
        email: user.email,
        username: user.full_name,
      });

      return {
        success: true,
        message: "Đăng nhập thành công",
        token,
        user: {
          id: user.id,
          email: user.email,
          fullname: user.full_name,
        },
      };
    } catch (error) {
      return { success: false, message: "Lỗi server: " + error.message };
    }
  }
  // ===============================
  // MIDDLEWARE: ROLE AUTHORIZATION
  // ===============================
  authorizeRole(role) {
    return (req, res, next) => {
      if (!req.user || req.user.role !== role) {
        return res.status(403).json({ error: "Không có quyền truy cập" });
      }
      next();
    };
  }
}

module.exports = AuthSystem;
