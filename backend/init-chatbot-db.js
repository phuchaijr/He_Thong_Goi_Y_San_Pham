/**
 * Database Initialization - Chatbot & Recommendation System
 * Thêm các bảng mới cho hệ thống gợi ý sản phẩm và chatbot
 */

const { sql, connectDB } = require("./db");

async function initializeChatbotDatabase() {
  try {
    await connectDB();
    console.log("📊 Initializing Chatbot Database Schema...");

    // 1. SessionLogs - Lưu thống kê phiên làm việc
    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SessionLogs' and xtype='U')
      CREATE TABLE SessionLogs (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT,
        session_id NVARCHAR(100) NOT NULL,
        page NVARCHAR(255),
        total_interactions INT DEFAULT 0,
        session_duration INT DEFAULT 0,  -- seconds
        time_on_page INT DEFAULT 0,      -- seconds
        scroll_depth INT DEFAULT 0,      -- percentage
        click_count INT DEFAULT 0,
        device_type NVARCHAR(20),        -- desktop, mobile, tablet
        mouse_activity_count INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL
      )
    `);
    console.log("✅ SessionLogs table ready");

    // 2. ChatHistory - Lưu lịch sử trò chuyện chatbot
    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ChatHistory' and xtype='U')
      CREATE TABLE ChatHistory (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT,
        user_message NVARCHAR(MAX) NOT NULL,
        bot_response NVARCHAR(MAX) NOT NULL,
        intent NVARCHAR(50),
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ ChatHistory table ready");

    // 3. RecommendationLog - Lưu các gợi ý được hiển thị
    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RecommendationLog' and xtype='U')
      CREATE TABLE RecommendationLog (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT,
        product_id INT NOT NULL,
        source NVARCHAR(50),           -- personalized, collaborative, popular, new, cart_based
        confidence DECIMAL(3,2),        -- 0.0 - 1.0
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ RecommendationLog table ready");

    // 4. RecommendationClickLog - Lưu khi người dùng click vào gợi ý
    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RecommendationClickLog' and xtype='U')
      CREATE TABLE RecommendationClickLog (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT,
        product_id INT NOT NULL,
        source NVARCHAR(50),            -- recommendation source
        clicked_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ RecommendationClickLog table ready");

    // 5. ProductViewLog - Chi tiết logs xem sản phẩm
    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ProductViewLog' and xtype='U')
      CREATE TABLE ProductViewLog (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT,
        product_id INT NOT NULL,
        view_duration INT DEFAULT 0,    -- seconds
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ ProductViewLog table ready");

    // 6. Cập nhật UserInteractions để lưu chi tiết event
    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UserInteractions' and xtype='U')
      CREATE TABLE UserInteractions (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT,
        product_id INT,
        category_id INT,
        event_type NVARCHAR(50),       -- view, click, add_to_cart, purchase, wishlist, rating, etc
        event_data NVARCHAR(MAX),      -- JSON format for additional data
        session_id NVARCHAR(100),
        time_on_page INT DEFAULT 0,
        scroll_depth INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES Categories(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ UserInteractions table ready");

    // 7. Cập nhật SearchHistory để lưu chi tiết tìm kiếm
    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SearchHistory' and xtype='U')
      CREATE TABLE SearchHistory (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT,
        query NVARCHAR(255) NOT NULL,
        results_count INT DEFAULT 0,
        search_data NVARCHAR(MAX),     -- JSON format (filters, position, etc)
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ SearchHistory table ready");

    // 8. ProductSimilarity - Lưu điểm tương đồng giữa các sản phẩm
    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ProductSimilarity' and xtype='U')
      CREATE TABLE ProductSimilarity (
        id INT PRIMARY KEY IDENTITY(1,1),
        product_id_1 INT NOT NULL,
        product_id_2 INT NOT NULL,
        similarity_score DECIMAL(5,4),  -- 0.0 - 1.0
        reason NVARCHAR(255),           -- why they are similar
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (product_id_1) REFERENCES Products(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id_2) REFERENCES Products(id) ON DELETE CASCADE,
        UNIQUE (product_id_1, product_id_2)
      )
    `);
    console.log("✅ ProductSimilarity table ready");

    // 9. UserPreferences - Lưu sở thích cá nhân hóa của người dùng
    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UserPreferences' and xtype='U')
      CREATE TABLE UserPreferences (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT NOT NULL UNIQUE,
        preferred_categories NVARCHAR(MAX),  -- JSON array of category IDs
        price_range_min DECIMAL(10,2),
        price_range_max DECIMAL(10,2),
        preferred_brands NVARCHAR(MAX),      -- JSON array
        recommendation_frequency NVARCHAR(20), -- daily, weekly, never
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ UserPreferences table ready");

    // 10. Tạo Indexes để tối ưu performance
    console.log("📈 Creating indexes for performance optimization...");

    const indexQueries = [
      `IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name='IDX_UI_user_id')
       CREATE INDEX IDX_UI_user_id ON UserInteractions(user_id)`,

      `IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name='IDX_UI_product_id')
       CREATE INDEX IDX_UI_product_id ON UserInteractions(product_id)`,

      `IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name='IDX_UI_event_type')
       CREATE INDEX IDX_UI_event_type ON UserInteractions(event_type)`,

      `IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name='IDX_UI_created_at')
       CREATE INDEX IDX_UI_created_at ON UserInteractions(created_at DESC)`,

      `IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name='IDX_SH_user_id')
       CREATE INDEX IDX_SH_user_id ON SearchHistory(user_id)`,

      `IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name='IDX_REC_user_product')
       CREATE INDEX IDX_REC_user_product ON RecommendationLog(user_id, product_id)`,

      `IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name='IDX_PVL_user_id')
       CREATE INDEX IDX_PVL_user_id ON ProductViewLog(user_id)`,

      `IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name='IDX_SL_session_id')
       CREATE INDEX IDX_SL_session_id ON SessionLogs(session_id)`,
    ];

    for (const query of indexQueries) {
      await sql.query(query);
    }
    console.log("✅ Indexes created successfully");

    console.log(
      "\n✅ Database schema for Chatbot & Recommendation System initialized successfully!",
    );
    console.log("\n📋 Summary of Tables Created:");
    console.log("  • SessionLogs - Session tracking data");
    console.log("  • ChatHistory - Chatbot conversation history");
    console.log("  • RecommendationLog - Recommendations shown to users");
    console.log("  • RecommendationClickLog - User clicks on recommendations");
    console.log("  • ProductViewLog - Product view tracking");
    console.log("  • UserInteractions (Enhanced) - All user interactions");
    console.log("  • SearchHistory (Enhanced) - Search query history");
    console.log("  • ProductSimilarity - Product similarity scores");
    console.log("  • UserPreferences - User preferences for personalization");
    console.log("  • Indexes - Performance optimization indexes");

    await sql.close();
  } catch (err) {
    console.error("❌ Chatbot database initialization failed:", err);
  }
}

initializeChatbotDatabase();
