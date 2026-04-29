/**
 * FAQ & Q&A Service - Quản lý các câu hỏi thường gặp và trả lời tự động
 */

const { sql } = require("../db");

class FAQService {
  /**
   * Lấy tất cả FAQ
   */
  static async getAllFAQs(category = null, limit = 100) {
    try {
      const pool = await sql.connect();
      let query = `
        SELECT id, question, answer, category, is_active, views, helpful_count
        FROM FAQs
        WHERE is_active = 1
      `;

      if (category) {
        query += ` AND category = '${category}'`;
      }

      query += ` ORDER BY views DESC, helpful_count DESC
        OFFSET 0 ROWS FETCH NEXT ${Math.min(limit, 1000)} ROWS ONLY`;

      const result = await pool.request().query(query);
      return result.recordset;
    } catch (err) {
      console.error("Error getting FAQs:", err);
      return [];
    }
  }

  /**
   * Tìm FAQ tương ứng với câu hỏi của người dùng
   */
  static async findRelevantFAQs(userQuestion, limit = 5) {
    try {
      const keywords = this.extractKeywords(userQuestion);
      if (!keywords.length) return [];

      const pool = await sql.connect();
      const request = pool.request();

      const conditions = keywords.map((k, index) => {
        request.input(`kw${index}`, sql.NVarChar(255), `%${k}%`);
        return `(question LIKE @kw${index} OR answer LIKE @kw${index})`;
      });

      const query = `
        SELECT TOP ${Math.min(limit, 20)}
          id, question, answer, category, helpful_count
        FROM FAQs
        WHERE (${conditions.join(" OR ")})
          AND is_active = 1
        ORDER BY helpful_count DESC, views DESC
      `;

      const result = await request.query(query);
      return result.recordset;
    } catch (err) {
      console.error("Error finding relevant FAQs:", err);
      return [];
    }
  }

  /**
   * Thêm mới FAQ
   */
  static async addFAQ(question, answer, category = "General") {
    try {
      const pool = await sql.connect();
      const result = await pool
        .request()
        .input("question", sql.NVarChar(1000), question)
        .input("answer", sql.NVarChar(2000), answer)
        .input("category", sql.NVarChar(100), category).query(`
          INSERT INTO FAQs (question, answer, category, is_active, created_at)
          VALUES (@question, @answer, @category, 1, GETDATE())
          SELECT SCOPE_IDENTITY() as id
        `);

      return result.recordset[0]?.id;
    } catch (err) {
      console.error("Error adding FAQ:", err);
      return null;
    }
  }

  /**
   * Cập nhật FAQ
   */
  static async updateFAQ(id, question, answer, category) {
    try {
      const pool = await sql.connect();
      await pool
        .request()
        .input("id", sql.Int, id)
        .input("question", sql.NVarChar(1000), question)
        .input("answer", sql.NVarChar(2000), answer)
        .input("category", sql.NVarChar(100), category).query(`
          UPDATE FAQs 
          SET question = @question, answer = @answer, category = @category
          WHERE id = @id
        `);

      return true;
    } catch (err) {
      console.error("Error updating FAQ:", err);
      return false;
    }
  }

  /**
   * Tăng lượt xem FAQ
   */
  static async incrementFAQView(id) {
    try {
      const pool = await sql.connect();
      await pool.request().input("id", sql.Int, id).query(`
          UPDATE FAQs SET views = views + 1 WHERE id = @id
        `);
      return true;
    } catch (err) {
      console.error("Error incrementing FAQ view:", err);
      return false;
    }
  }

  /**
   * Đánh dấu FAQ hữu ích
   */
  static async markFAQHelpful(id) {
    try {
      const pool = await sql.connect();
      await pool.request().input("id", sql.Int, id).query(`
          UPDATE FAQs SET helpful_count = helpful_count + 1 WHERE id = @id
        `);
      return true;
    } catch (err) {
      console.error("Error marking FAQ helpful:", err);
      return false;
    }
  }

  /**
   * Lấy FAQ theo danh mục
   */
  static async getFAQsByCategory(category) {
    try {
      const pool = await sql.connect();
      const result = await pool
        .request()
        .input("category", sql.NVarChar(100), category).query(`
          SELECT id, question, answer, helpful_count
          FROM FAQs
          WHERE category = @category AND is_active = 1
          ORDER BY helpful_count DESC
        `);

      return result.recordset;
    } catch (err) {
      console.error("Error getting FAQs by category:", err);
      return [];
    }
  }

  /**
   * Lấy các danh mục FAQ
   */
  static async getFAQCategories() {
    try {
      const pool = await sql.connect();
      const result = await pool.request().query(`
        SELECT DISTINCT category FROM FAQs WHERE is_active = 1
        ORDER BY category
      `);

      return result.recordset.map((r) => r.category);
    } catch (err) {
      console.error("Error getting FAQ categories:", err);
      return [];
    }
  }

  /**
   * Trích xuất từ khóa từ câu hỏi
   */
  static extractKeywords(question) {
    const stopwords = new Set([
      "để",
      "được",
      "là",
      "từ",
      "nên",
      "có",
      "không",
      "hay",
      "và",
      "hoặc",
      "nhưng",
      "mà",
      "với",
      "về",
      "tại",
      "ở",
      "trong",
      "ngoài",
      "trên",
      "dưới",
      "phía",
      "bên",
      "giữa",
      "giống",
      "khác",
      "này",
      "kia",
      "nào",
      "nó",
      "cái",
      "chiếc",
      "những",
      "mấy",
      "bao",
      "lắm",
      "rất",
      "nhiều",
      "ít",
      "một",
      "hai",
      "ba",
      "bốn",
      "năm",
      "sáu",
      "bảy",
      "tám",
      "chín",
      "mười",
      "cách",
      "làm",
      "sao",
      "như",
      "thế",
      "đó",
      "cái",
      "gì",
    ]);

    const words = question
      .toLowerCase()
      .replace(/[!\"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 1 && !stopwords.has(word));

    return [...new Set(words)];
  }

  /**
   * Tạo cơ sở dữ liệu FAQ mặc định
   */
  static getDefaultFAQs() {
    return [
      {
        category: "Đặt hàng",
        faqs: [
          {
            question: "Làm sao để đặt hàng?",
            answer:
              "1. Chọn sản phẩm trên trang shop\n2. Thêm vào giỏ hàng\n3. Nhấp 'Thanh toán'\n4. Chọn địa chỉ giao và phương thức thanh toán\n5. Xác nhận đơn hàng",
          },
          {
            question: "Có thể đặt hàng trên di động không?",
            answer:
              "Có! Website của chúng tôi hoàn toàn tương thích với di động. Bạn có thể đặt hàng bằng điện thoại thông minh hoặc máy tính bảng.",
          },
          {
            question: "Đặt hàng rồi có thể thay đổi được không?",
            answer:
              "Nếu đơn hàng chưa được xử lý, bạn có thể hủy và đặt lại. Nếu đã xử lý, vui lòng liên hệ support trong 2 giờ để thay đổi.",
          },
        ],
      },
      {
        category: "Giao hàng",
        faqs: [
          {
            question: "Phí giao hàng là bao nhiêu?",
            answer:
              "Miễn phí giao hàng cho đơn từ 500.000đ ở Hà Nội hoặc 2.000.000đ toàn quốc.\nCác đơn hàng nhỏ hơn tính phí giao hàng theo khoảng cách (20.000đ - 50.000đ).",
          },
          {
            question: "Thời gian giao hàng bao lâu?",
            answer:
              "Hà Nội: 1-2 ngày\nCác tỉnh khác: 2-3 ngày\nGiao hôm nay: ở Hà Nội & TP.HCM (đặt trước 11h)",
          },
          {
            question: "Có thể chọn thời gian giao cụ thể không?",
            answer:
              "Có. Tại trang thanh toán, bạn có thể chọn khung giờ giao (sáng 8h-12h, chiều 13h-18h).",
          },
        ],
      },
      {
        category: "Thanh toán",
        faqs: [
          {
            question: "Có những phương thức thanh toán nào?",
            answer:
              "1. Thanh toán khi nhận hàng (COD)\n2. Chuyển khoản ngân hàng\n3. Thẻ tín dụng / Thẻ ghi nợ\n4. Ví điện tử (Momo, Zalopay, Airpay)\n5. Trả góp 0% (AEON, HSBC, etc.)",
          },
          {
            question: "Trả góp có lãi suất không?",
            answer:
              "Không! Chúng tôi cung cấp trả góp 0% lãi suất qua các hãng tài chính.",
          },
          {
            question: "Giao dịch có an toàn không?",
            answer:
              "100% an toàn! Tất cả giao dịch được mã hóa SSL 256-bit và tuân thủ các tiêu chuẩn bảo mật quốc tế.",
          },
        ],
      },
      {
        category: "Hoàn trả & Hỗ trợ",
        faqs: [
          {
            question: "Tôi có thể hoàn trả sản phẩm không?",
            answer:
              "Có! Bạn có 30 ngày để hoàn trả sản phẩm chưa sử dụng với lý do bất kỳ.\nĐiều kiện: Sản phẩm nguyên vẹn, chưa kích hoạt, còn toàn bộ phụ kiện.",
          },
          {
            question: "Làm sao để hoàn trả?",
            answer:
              "1. Liên hệ support@thecuahang.com\n2. Cung cấp mã đơn hàng\n3. Nhận mã RMA\n4. Gửi sản phẩm về\n5. Nhận hoàn tiền trong 5-7 ngày",
          },
          {
            question: "Phí hoàn trả có bao nhiêu?",
            answer:
              "Miễn phí hoàn trả nếu lỗi từ cửa hàng.\nNếu bạn thay đổi ý định, phí vận chuyển chiều về là 30.000đ.",
          },
        ],
      },
      {
        category: "Bảo hành",
        faqs: [
          {
            question: "Sản phẩm bảo hành bao lâu?",
            answer:
              "Hầu hết sản phẩm: 12 tháng bảo hành chính hãng\nSản phẩm cao cấp: 24 tháng\nBảo hành bao gồm lỗi kỹ thuật, không bao gồm vỡ hoặc nước.",
          },
          {
            question: "Cách nộp bảo hành?",
            answer:
              "1. Liên hệ support với mã đơn hàng\n2. Gửi hình ảnh sản phẩm\n3. Nhận hướng dẫn vận chuyển\n4. Gửi sản phẩm về\n5. Nhận sản phẩm mới hoặc sửa chữa trong 5-10 ngày",
          },
          {
            question: "Bảo hành có bao gồm rơi vỡ không?",
            answer:
              "Không. Bảo hành chỉ bao gồm lỗi kỹ thuật, không bao gồm thiệt hại từ va chạm, rơi vỡ hoặc tiếp xúc với nước.",
          },
        ],
      },
      {
        category: "Khuyến mãi & Giảm giá",
        faqs: [
          {
            question: "Có mã giảm giá nào không?",
            answer:
              "Có! Sử dụng:\n- WELCOME10: Giảm 10% cho khách lần đầu\n- MEMBER15: Giảm 15% cho thành viên\n- FREESHIP50: Miễn phí vận chuyển (đơn từ 50k)",
          },
          {
            question: "Khuyến mãi diễn ra khi nào?",
            answer:
              "Chúng tôi có khuyến mãi hàng tuần:\n- Thứ 2-4: Giảm giá đặc biệt\n- Thứ 5-6: Flash sale\n- Cuối tuần: Combo ưu đãi",
          },
          {
            question: "Làm sao biết khuyến mãi mới nhất?",
            answer:
              "Theo dõi:\n- Trang 'Khuyến mãi' trên website\n- Đăng ký nhận email\n- Follow Facebook: /thecuahang.official",
          },
        ],
      },
      {
        category: "Tài khoản & Hồ sơ",
        faqs: [
          {
            question: "Làm sao để tạo tài khoản?",
            answer:
              "1. Nhấp 'Đăng ký' ở góc trên phải\n2. Nhập email và mật khẩu\n3. Xác nhận email\n4. Tài khoản của bạn đã sẵn sàng!",
          },
          {
            question: "Quên mật khẩu làm sao?",
            answer:
              "Nhấp 'Quên mật khẩu' ở trang đăng nhập. Nhập email, chúng tôi sẽ gửi link để đặt lại mật khẩu.",
          },
          {
            question: "Có thể thay đổi thông tin cá nhân không?",
            answer:
              "Có! Vào 'Hồ sơ cá nhân' để cập nhật thông tin địa chỉ, số điện thoại, etc.",
          },
        ],
      },
      {
        category: "Theo dõi đơn hàng",
        faqs: [
          {
            question: "Làm sao để theo dõi đơn hàng?",
            answer:
              "1. Đăng nhập tài khoản\n2. Vào 'Đơn hàng của tôi'\n3. Chọn đơn cần theo dõi\n4. Xem trạng thái chi tiết và tracking",
          },
          {
            question: "Đơn hàng đang ở đâu?",
            answer:
              "Tại trang theo dõi đơn hàng, bạn sẽ thấy trạng thái hiện tại và vị trí gần đây nhất.",
          },
          {
            question: "Đơn hàng bị thất lạc?",
            answer:
              "Nếu đơn hàng bị thất lạc, liên hệ support ngay. Chúng tôi sẽ điều tra và giải quyết trong 24h.",
          },
        ],
      },
    ];
  }

  /**
   * Khởi tạo bảng FAQs (nếu chưa có)
   */
  static async initializeFAQTable() {
    try {
      const pool = await sql.connect();

      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='FAQs' AND xtype='U')
        CREATE TABLE FAQs (
          id INT PRIMARY KEY IDENTITY(1,1),
          question NVARCHAR(1000) NOT NULL,
          answer NVARCHAR(2000) NOT NULL,
          category NVARCHAR(100) DEFAULT 'General',
          is_active BIT DEFAULT 1,
          views INT DEFAULT 0,
          helpful_count INT DEFAULT 0,
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE()
        )
      `);

      console.log("FAQs table initialized successfully");
    } catch (err) {
      console.error("Error initializing FAQs table:", err);
    }
  }

  /**
   * Thêm FAQs mặc định vào database
   */
  static async seedDefaultFAQs() {
    try {
      const defaultFAQs = this.getDefaultFAQs();
      let count = 0;

      for (const categoryFAQs of defaultFAQs) {
        for (const faq of categoryFAQs.faqs) {
          await this.addFAQ(faq.question, faq.answer, categoryFAQs.category);
          count++;
        }
      }

      console.log(`Seeded ${count} FAQs successfully`);
    } catch (err) {
      console.error("Error seeding FAQs:", err);
    }
  }
}

module.exports = FAQService;
