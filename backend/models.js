const { sql } = require("./db");

// Users Model
class Users {
  static async findAll() {
    const result = await sql.query("SELECT * FROM Users");
    return result.recordset;
  }

  static async findById(id) {
    const result = await sql.query(`SELECT * FROM Users WHERE id = ${id}`);
    return result.recordset[0];
  }

  static async findByEmail(email) {
    const result = await sql.query(
      `SELECT * FROM Users WHERE email = '${email}'`,
    );
    return result.recordset[0];
  }

  static async create(userData) {
    const { full_name, email, password_hash, role, phone, address, avatar } =
      userData;
    const result = await sql.query(`
      INSERT INTO Users (full_name, email, password_hash, role, phone, address, avatar)
      OUTPUT INSERTED.*
      VALUES ('${full_name}', '${email}', '${password_hash}', '${role || "user"}', '${phone || ""}', '${address || ""}', '${avatar || ""}')
    `);
    return result.recordset[0];
  }

  static async update(id, userData) {
    const { full_name, email, phone, address, avatar, is_active } = userData;
    const result = await sql.query(`
      UPDATE Users
      SET full_name = '${full_name}', email = '${email}', phone = '${phone || ""}', address = '${address || ""}', avatar = '${avatar || ""}', is_active = ${is_active ? 1 : 0}, updated_at = GETDATE()
      OUTPUT INSERTED.*
      WHERE id = ${id}
    `);
    return result.recordset[0];
  }

  static async delete(id) {
    await sql.query(`DELETE FROM Users WHERE id = ${id}`);
    return { message: "User deleted successfully" };
  }
}

// Categories Model
class Categories {
  static async findAll() {
    const result = await sql.query("SELECT * FROM Categories ORDER BY name");
    return result.recordset;
  }

  static async findById(id) {
    const result = await sql.query(`SELECT * FROM Categories WHERE id = ${id}`);
    return result.recordset[0];
  }

  static async findBySlug(slug) {
    const result = await sql.query(
      `SELECT * FROM Categories WHERE slug = '${slug}'`,
    );
    return result.recordset[0];
  }

  static async create(categoryData) {
    const { name, slug } = categoryData;
    const result = await sql.query(`
      INSERT INTO Categories (name, slug)
      OUTPUT INSERTED.*
      VALUES ('${name}', '${slug}')
    `);
    return result.recordset[0];
  }

  static async update(id, categoryData) {
    const { name, slug } = categoryData;
    const result = await sql.query(`
      UPDATE Categories
      SET name = '${name}', slug = '${slug}'
      OUTPUT INSERTED.*
      WHERE id = ${id}
    `);
    return result.recordset[0];
  }

  static async delete(id) {
    await sql.query(`DELETE FROM Categories WHERE id = ${id}`);
    return { message: "Category deleted successfully" };
  }
}

// Products Model
class Products {
  static async findAll() {
    const result = await sql.query(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM Products p
      LEFT JOIN Categories c ON p.category_id = c.id
      ORDER BY p.id
    `);
    return result.recordset;
  }

  static async findById(id) {
    const result = await sql.query(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM Products p
      LEFT JOIN Categories c ON p.category_id = c.id
      WHERE p.id = ${id}
    `);
    return result.recordset[0];
  }

  static async findByCategory(categoryId) {
    const result = await sql.query(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM Products p
      LEFT JOIN Categories c ON p.category_id = c.id
      WHERE p.category_id = ${categoryId}
      ORDER BY p.id
    `);
    return result.recordset;
  }

  static async findFeatured(limit = 8) {
    const result = await sql.query(`
      SELECT TOP ${limit} p.*, c.name AS category_name, c.slug AS category_slug
      FROM Products p
      LEFT JOIN Categories c ON p.category_id = c.id
      ORDER BY p.purchase_count DESC
    `);
    return result.recordset;
  }

  static async findDeals(limit = 12) {
    const result = await sql.query(`
      SELECT TOP ${limit} p.*, c.name AS category_name, c.slug AS category_slug
      FROM Products p
      LEFT JOIN Categories c ON p.category_id = c.id
      -- WHERE p.is_weekly_deal = 1
      ORDER BY p.created_at DESC
    `);

    if (result.recordset.length > 0) {
      return result.recordset;
    }

    const fallback = await sql.query(`
      SELECT TOP ${limit} p.*, c.name AS category_name, c.slug AS category_slug
      FROM Products p
      LEFT JOIN Categories c ON p.category_id = c.id
      ORDER BY p.id DESC
    `);
    return fallback.recordset;
  }

  static async create(productData) {
    const {
      name,
      price,
      description,
      image_url,
      stock,
      category_id,
      is_weekly_deal,
    } = productData;
    const weeklyFlag = is_weekly_deal ? 1 : 0;
    const result = await sql.query(`
      INSERT INTO Products (name, price, description, image_url, stock, category_id, purchase_count, rating, review_count, is_weekly_deal)
      OUTPUT INSERTED.*
      VALUES ('${name}', ${price}, '${description}', '${image_url}', ${stock}, ${category_id}, 0, 0, 0, ${weeklyFlag})
    `);
    return result.recordset[0];
  }

  static async update(id, productData) {
    const {
      name,
      price,
      description,
      image_url,
      stock,
      category_id,
      purchase_count,
      rating,
      review_count,
      is_weekly_deal,
    } = productData;
    const weeklyFlag = is_weekly_deal ? 1 : 0;
    const result = await sql.query(`
      UPDATE Products
      SET name = '${name}', price = ${price}, description = '${description}', image_url = '${image_url}', stock = ${stock}, category_id = ${category_id}, purchase_count = ${purchase_count}, rating = ${rating}, review_count = ${review_count}, is_weekly_deal = ${weeklyFlag}
      OUTPUT INSERTED.*
      WHERE id = ${id}
    `);
    return result.recordset[0];
  }

  static async delete(id) {
    await sql.query(`DELETE FROM Products WHERE id = ${id}`);
    return { message: "Product deleted successfully" };
  }
}

// UserCart Model
class UserCart {
  static async findAll() {
    const result = await sql.query(`
      SELECT uc.*, u.username, p.name AS product_name, p.price, p.image_url
      FROM UserCart uc
      JOIN Users u ON uc.user_id = u.id
      JOIN Products p ON uc.product_id = p.id
      ORDER BY uc.added_at DESC
    `);
    return result.recordset;
  }

  static async findByUserId(userId) {
    const result = await sql.query(`
      SELECT uc.*, p.name AS product_name, p.price, p.image_url, p.stock
      FROM UserCart uc
      JOIN Products p ON uc.product_id = p.id
      WHERE uc.user_id = ${userId}
      ORDER BY uc.added_at DESC
    `);
    return result.recordset;
  }

  static async findById(id) {
    const result = await sql.query(`
      SELECT uc.*, u.username, p.name AS product_name, p.price, p.image_url
      FROM UserCart uc
      JOIN Users u ON uc.user_id = u.id
      JOIN Products p ON uc.product_id = p.id
      WHERE uc.id = ${id}
    `);
    return result.recordset[0];
  }

  static async addToCart(userId, productId, quantity = 1) {
    // Check if item already exists
    const existing = await sql.query(`
      SELECT * FROM UserCart WHERE user_id = ${userId} AND product_id = ${productId}
    `);

    if (existing.recordset.length > 0) {
      // Update quantity
      const newQuantity = existing.recordset[0].quantity + quantity;
      const result = await sql.query(`
        UPDATE UserCart
        SET quantity = ${newQuantity}, added_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = ${existing.recordset[0].id}
      `);
      return result.recordset[0];
    } else {
      // Insert new item
      const result = await sql.query(`
        INSERT INTO UserCart (user_id, product_id, quantity)
        OUTPUT INSERTED.*
        VALUES (${userId}, ${productId}, ${quantity})
      `);
      return result.recordset[0];
    }
  }

  static async updateQuantity(id, quantity) {
    const result = await sql.query(`
      UPDATE UserCart
      SET quantity = ${quantity}, added_at = GETDATE()
      OUTPUT INSERTED.*
      WHERE id = ${id}
    `);
    return result.recordset[0];
  }

  static async removeFromCart(id) {
    await sql.query(`DELETE FROM UserCart WHERE id = ${id}`);
    return { message: "Item removed from cart successfully" };
  }

  static async clearUserCart(userId) {
    await sql.query(`DELETE FROM UserCart WHERE user_id = ${userId}`);
    return { message: "Cart cleared successfully" };
  }
}

// ProductEmbeddings Model
class ProductEmbeddings {
  static async findAll() {
    const result = await sql.query(`
      SELECT pe.*, p.name AS product_name
      FROM ProductEmbeddings pe
      JOIN Products p ON pe.product_id = p.id
      ORDER BY pe.created_at DESC
    `);
    return result.recordset;
  }

  static async findByProductId(productId) {
    const result = await sql.query(`
      SELECT pe.*, p.name AS product_name
      FROM ProductEmbeddings pe
      JOIN Products p ON pe.product_id = p.id
      WHERE pe.product_id = ${productId}
      ORDER BY pe.created_at DESC
    `);
    return result.recordset;
  }

  static async findById(id) {
    const result = await sql.query(`
      SELECT pe.*, p.name AS product_name
      FROM ProductEmbeddings pe
      JOIN Products p ON pe.product_id = p.id
      WHERE pe.id = ${id}
    `);
    return result.recordset[0];
  }

  static async create(embeddingData) {
    const { product_id, embedding, embedding_text } = embeddingData;
    const result = await sql.query(`
      INSERT INTO ProductEmbeddings (product_id, embedding, embedding_text)
      OUTPUT INSERTED.*
      VALUES (${product_id}, '${embedding}', '${embedding_text}')
    `);
    return result.recordset[0];
  }

  static async update(id, embeddingData) {
    const { embedding, embedding_text } = embeddingData;
    const result = await sql.query(`
      UPDATE ProductEmbeddings
      SET embedding = '${embedding}', embedding_text = '${embedding_text}'
      OUTPUT INSERTED.*
      WHERE id = ${id}
    `);
    return result.recordset[0];
  }

  static async delete(id) {
    await sql.query(`DELETE FROM ProductEmbeddings WHERE id = ${id}`);
    return { message: "Product embedding deleted successfully" };
  }
}

// UserInteractions Model
class UserInteractions {
  static async findAll() {
    const result = await sql.query(`
      SELECT ui.*, u.username, p.name AS product_name
      FROM UserInteractions ui
      JOIN Users u ON ui.user_id = u.id
      JOIN Products p ON ui.product_id = p.id
      ORDER BY ui.timestamp DESC
    `);
    return result.recordset;
  }

  static async findByUserId(userId) {
    const result = await sql.query(`
      SELECT ui.*, p.name AS product_name
      FROM UserInteractions ui
      JOIN Products p ON ui.product_id = p.id
      WHERE ui.user_id = ${userId}
      ORDER BY ui.timestamp DESC
    `);
    return result.recordset;
  }

  static async findByProductId(productId) {
    const result = await sql.query(`
      SELECT ui.*, u.username
      FROM UserInteractions ui
      JOIN Users u ON ui.user_id = u.id
      WHERE ui.product_id = ${productId}
      ORDER BY ui.timestamp DESC
    `);
    return result.recordset;
  }

  static async findByType(interactionType) {
    const result = await sql.query(`
      SELECT ui.*, u.username, p.name AS product_name
      FROM UserInteractions ui
      JOIN Users u ON ui.user_id = u.id
      JOIN Products p ON ui.product_id = p.id
      WHERE ui.interaction_type = '${interactionType}'
      ORDER BY ui.timestamp DESC
    `);
    return result.recordset;
  }

  static async create(interactionData) {
    const { user_id, product_id, interaction_type } = interactionData;
    const result = await sql.query(`
      INSERT INTO UserInteractions (user_id, product_id, interaction_type)
      OUTPUT INSERTED.*
      VALUES (${user_id}, ${product_id}, '${interaction_type}')
    `);
    return result.recordset[0];
  }

  static async delete(id) {
    await sql.query(`DELETE FROM UserInteractions WHERE id = ${id}`);
    return { message: "User interaction deleted successfully" };
  }
}

// SearchHistory Model
class SearchHistory {
  static async findAll() {
    const result = await sql.query(`
      SELECT sh.*, u.username
      FROM SearchHistory sh
      LEFT JOIN Users u ON sh.user_id = u.id
      ORDER BY sh.timestamp DESC
    `);
    return result.recordset;
  }

  static async findByUserId(userId) {
    const result = await sql.query(`
      SELECT * FROM SearchHistory
      WHERE user_id = ${userId}
      ORDER BY timestamp DESC
    `);
    return result.recordset;
  }

  static async create(searchData) {
    const { user_id, query, results_count } = searchData;
    const result = await sql.query(`
      INSERT INTO SearchHistory (user_id, query, results_count)
      OUTPUT INSERTED.*
      VALUES (${user_id || "NULL"}, '${query}', ${results_count || 0})
    `);
    return result.recordset[0];
  }

  static async delete(id) {
    await sql.query(`DELETE FROM SearchHistory WHERE id = ${id}`);
    return { message: "Search history deleted successfully" };
  }

  static async clearUserHistory(userId) {
    await sql.query(`DELETE FROM SearchHistory WHERE user_id = ${userId}`);
    return { message: "Search history cleared successfully" };
  }
}

module.exports = {
  Users,
  Categories,
  Products,
  UserCart,
  ProductEmbeddings,
  UserInteractions,
  SearchHistory,
};
