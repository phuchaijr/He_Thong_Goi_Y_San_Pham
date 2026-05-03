require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { connectDB } = require("./db");

const productRoutes = require("./routes/product.routes");
const categoryRoutes = require("./routes/category.routes");
const authRoutes = require("./routes/auth.routes");
const cartRoutes = require("./routes/cart.routes");
const embeddingsRoutes = require("./routes/embeddings.routes");
const interactionsRoutes = require("./routes/interactions.routes");
const searchRoutes = require("./routes/search.routes");
const trackingRoutes = require("./routes/tracking.routes");
const checkoutRoutes = require("./routes/checkout.routes");
const chatbotRoutes = require("./routes/chatbot.routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:5173", // frontend của bạn
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan("dev"));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
});

app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);

/* ROUTES */
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/embeddings", embeddingsRoutes);
app.use("/api/interactions", interactionsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/chatbot", chatbotRoutes);

/* SPA - Only serve index.html for routes without file extensions */

/* ERROR */
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});

async function startServer() {
  try {
    await connectDB();
    console.log("✅ Database Connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed:", err);
  }
}
const timeout = require("connect-timeout");

app.use(timeout("10s"));
app.use((req, res, next) => {
  if (!req.timedout) next();
});
const compression = require("compression");
app.use(compression());
startServer();
