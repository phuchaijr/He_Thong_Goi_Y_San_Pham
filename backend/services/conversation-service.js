const { sql } = require("../db");

class ConversationService {
  static async saveContext(userId, context) {
    if (!userId) {
      return;
    }

    try {
      const pool = await sql.connect();

      await pool
        .request()
        .input("user_id", sql.Int, userId)
        .input("context_data", sql.NVarChar(sql.MAX), JSON.stringify(context))
        .query(`
          MERGE ConversationContext AS target
          USING (SELECT @user_id AS user_id) AS source
          ON target.user_id = source.user_id
          WHEN MATCHED THEN
            UPDATE SET context_data = @context_data, updated_at = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (user_id, context_data, updated_at)
            VALUES (@user_id, @context_data, GETDATE());
        `);
    } catch (err) {
      console.error("Error saving context:", err);
    }
  }

  static async getContext(userId) {
    try {
      const pool = await sql.connect();

      const result = await pool.request().input("user_id", sql.Int, userId)
        .query(`
          SELECT context_data
          FROM ConversationContext
          WHERE user_id = @user_id
        `);

      if (!result.recordset.length) return {};

      return JSON.parse(result.recordset[0].context_data);
    } catch (err) {
      console.error("Error getting context:", err);
      return {};
    }
  }
}

module.exports = ConversationService;
