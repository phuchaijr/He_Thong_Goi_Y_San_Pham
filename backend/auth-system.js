const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Users } = require("./models");

class AuthSystem {
  async registerUser(fullname, email, password, confirmPassword) {
    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
    }

    const existingUser = await Users.findByEmail(email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await Users.create({
      full_name: fullname,
      email,
      password_hash: hashedPassword,
      role: "user",
    });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "24h" },
    );

    return {
      message: "User registered successfully",
      user: { id: user.id, full_name: user.full_name, email: user.email },
      token,
    };
  }

  async loginUser(email, password) {
    const user = await Users.findByEmail(email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "24h" },
    );

    return {
      message: "Login successful",
      user: { id: user.id, full_name: user.full_name, email: user.email },
      token,
    };
  }
}

module.exports = AuthSystem;
