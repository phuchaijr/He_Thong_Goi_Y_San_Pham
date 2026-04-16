const express = require("express");
const cors = require("cors");
const path = require("path");
const { sql, connectDB } = require("./db");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/img", express.static("public/img"));
// Serve static files từ thư mục hiện tại
app.use(express.static(__dirname));

async function startServer() {
  await connectDB();

    // API cho sản phẩm
    app.get("/api/products", async (req, res) => {
      try {
        const result = await sql.query(`
          SELECT 
            p.id,
            p.name,
            p.price,
            p.description,
            p.stock,
            p.image_url,
            c.slug AS category,
            c.name AS category_name
          FROM Products p
          JOIN Categories c ON p.category_id = c.id
          ORDER BY p.id
        `);
        res.json(result.recordset);
      } catch (err) {
        console.error("Query error:", err);
        res.status(500).json({ error: err.message });
      }
    // API lấy sản phẩm nổi bật
    app.get("/api/products/featured", async (req, res) => {
      try {
        const result = await sql.query(`
          SELECT TOP 8
            p.id,
            p.name,
            p.price,
            p.description,
            p.stock,
            p.image_url,
            c.slug AS category,
            c.name AS category_name
          FROM Products p
          JOIN Categories c ON p.category_id = c.id
          ORDER BY p.id DESC
        `);
        res.json(result.recordset);
      } catch (err) {
        console.error("Query error:", err);
        res.status(500).json({ error: err.message });
      }
    });

    // API lọc theo category
    app.get("/api/products/category/:category", async (req, res) => {
      try {
        const category = req.params.category;
        const result = await sql.query(`
          SELECT 
            p.id,
            p.name,
            p.price,
            p.description,
            p.stock,
            p.image_url,
            c.slug AS category,
            c.name AS category_name
          FROM Products p
          JOIN Categories c ON p.category_id = c.id
          WHERE c.slug = '${category}'
          ORDER BY p.id
        `);
        res.json(result.recordset);
      } catch (err) {
        console.error("Query error:", err);
        res.status(500).json({ error: err.message });
      }
    });

    // API lấy sản phẩm theo ID
    app.get("/api/products/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await sql.query(`
          SELECT 
            p.id,
            p.name,
            p.price,
            p.description,
            p.stock,
            p.image_url,
            c.slug AS category,
            c.name AS category_name
          FROM Products p
          JOIN Categories c ON p.category_id = c.id
          WHERE p.id = ${id}
        `);
        if (result.recordset.length === 0) {
          return res.status(404).json({ error: "Product not found" });
        }
        res.json(result.recordset[0]);
      } catch (err) {
        console.error("Query error:", err);
        res.status(500).json({ error: err.message });
      }
    });

    // API lấy danh mục
    app.get("/api/categories", async (req, res) => {
      try {
        const result = await sql.query(`
          SELECT id, name, slug
          FROM Categories
          ORDER BY name
        `);
        res.json(result.recordset);
      } catch (err) {
        console.error("Query error:", err);
        res.status(500).json({ error: err.message });
      }
    });

    // API sản phẩm nổi bật (giả sử stock > 20)
    app.get("/api/products/featured", async (req, res) => {
      try {
        const result = await sql.query(`
          SELECT TOP 8
            p.id,
            p.name,
            p.price,
            p.description,
            p.stock,
            p.image_url,
            c.slug AS category,
            c.name AS category_name
          FROM Products p
          JOIN Categories c ON p.category_id = c.id
          WHERE p.stock > 20
          ORDER BY p.price DESC
        `);
        res.json(result.recordset);
      } catch (err) {
        console.error("Query error:", err);
        res.status(500).json({ error: err.message });
      }
    });

    app.listen(3000, () => {
      console.log("🚀 Server running on port 3000");
    });
}
startServer();
