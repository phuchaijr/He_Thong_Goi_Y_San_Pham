// Initialize Database Schema with User & RAG tables
const { sql, connectDB } = require("./db");

async function initializeDatabase() {
  try {
    await connectDB();
    console.log("📊 Initializing database schema...");

    // Create Users table if not exists
    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' and xtype='U')
      CREATE TABLE Users (
        id INT PRIMARY KEY IDENTITY(1,1),
        full_name NVARCHAR(100) NOT NULL,
        email NVARCHAR(100) UNIQUE NOT NULL,
        password_hash NVARCHAR(255) NOT NULL,
        role NVARCHAR(20) DEFAULT 'user',
        phone NVARCHAR(20),
        address NVARCHAR(255),
        avatar NVARCHAR(255),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        is_active BIT DEFAULT 1
      )
    `);
    console.log("✅ Users table ready");

    // Create Categories table if not exists
    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Categories' and xtype='U')
      CREATE TABLE Categories (
        id INT PRIMARY KEY IDENTITY(1,1),
        name NVARCHAR(100) NOT NULL,
        slug NVARCHAR(100) UNIQUE NOT NULL,
        created_at DATETIME DEFAULT GETDATE()
      )
    `);
    console.log("✅ Categories table ready");

    // Create Products table if not exists
    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Products' and xtype='U')
      CREATE TABLE Products (
        id INT PRIMARY KEY IDENTITY(1,1),
        name NVARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description NVARCHAR(MAX),
        image_url NVARCHAR(500),
        purchase_count INT DEFAULT 0,
        stock INT DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0,
        review_count INT DEFAULT 0,
        category_id INT,
        is_weekly_deal BIT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (category_id) REFERENCES Categories(id) ON DELETE SET NULL
      )
    `);
    console.log("✅ Products table ready");

    // Add weekly deal flag column when upgrading existing schema
    await sql.query(`
      IF NOT EXISTS (
        SELECT * FROM sys.columns
        WHERE object_id = OBJECT_ID('Products')
          AND name = 'is_weekly_deal'
      )
      ALTER TABLE Products ADD is_weekly_deal BIT DEFAULT 0;
    `);
    console.log("✅ Products weekly deal flag ready");
    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UserCart' and xtype='U')
      CREATE TABLE UserCart (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT DEFAULT 1,
        added_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE,
        UNIQUE (user_id, product_id)
      )
    `);
    console.log("✅ UserCart table ready");

    // Create ProductEmbeddings table if not exists
    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ProductEmbeddings' and xtype='U')
      CREATE TABLE ProductEmbeddings (
        id INT PRIMARY KEY IDENTITY(1,1),
        product_id INT NOT NULL,
        embedding NVARCHAR(MAX),
        embedding_text NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ ProductEmbeddings table ready");

    // Create UserInteractions table for RAG personalization
    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UserInteractions' and xtype='U')
      CREATE TABLE UserInteractions (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        interaction_type NVARCHAR(50),
        timestamp DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ UserInteractions table ready");

    // Create SearchHistory table for better RAG context
    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SearchHistory' and xtype='U')
      CREATE TABLE SearchHistory (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT,
        query NVARCHAR(255),
        results_count INT,
        timestamp DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ SearchHistory table ready");

    console.log("✅ Database schema initialized successfully");
    await sql.close();
  } catch (err) {
    console.error("❌ Database initialization failed:", err);
  }
}

initializeDatabase();
