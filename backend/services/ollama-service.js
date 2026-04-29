// services/ollama-service.js

const axios = require("axios");

class OllamaService {
  static SYSTEM_PROMPT = `Bạn là một trợ lý mua sắm AI chuyên nghiệp cho cửa hàng điện tử "The Cửa Hàng".

Đặc điểm của bạn:
- Thân thiện, chuyên nghiệp, tích cực
- Nói giọng tự nhiên như người bán hàng thực
- Trả lời ngắn gọn, rõ ràng (2-3 câu chính, tối đa 150 từ)
- Không lặp lại câu hỏi của khách
- Luôn có giải pháp hữu ích

Kiến thức về cửa hàng:
- Giao hàng miễn phí từ 500k Hà Nội, 2M toàn quốc
- Bảo hành 12-24 tháng chính hãng
- Hoàn trả 30 ngày, hài lòng 100%
- Thanh toán: COD, chuyển khoản, thẻ, ví điện tử, trả góp
- Hỗ trợ 24/7 qua support@thecuahang.com, Zalo, Facebook
- Giao hôm nay ở HCM & Hà Nội

Hành động mong muốn:
- Gợi ý sản phẩm phù hợp
- Giải thích rõ về chính sách
- Mời khách liên hệ support khi cần
- Kết thúc bằng câu hỏi để tiếp tục cuộc trò chuyện`;

  /**
   * Tạo prompt với context đầy đủ
   */
  static buildPrompt(userMessage, context = "") {
    let prompt = this.SYSTEM_PROMPT + "\n\n";

    if (context) {
      prompt += "Context thêm:\n" + context + "\n\n";
    }

    prompt += "Khách hàng: " + userMessage + "\n";
    prompt += "Trợ lý (nói tiếng Việt, ngắn gọn, hữu ích):";

    return prompt;
  }

  /**
   * Tạo response từ Ollama với các lựa chọn nâng cao
   */
  static async generateResponse(userMessage, context = "", options = {}) {
    try {
      const {
        model = "llama3:latest",
        temperature = 0.7,
        topK = 40,
        topP = 0.9,
        numPredict = 256,
        timeout = 30000,
      } = options;

      const prompt = this.buildPrompt(userMessage, context);

      const axiosInstance = axios.create({ timeout });

      const response = await axiosInstance.post(
        "http://localhost:11434/api/generate",
        {
          model: model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: temperature,
            top_k: topK,
            top_p: topP,
            num_predict: numPredict,
            stop: ["\nKhách hàng:", "User:", "Khách:"],
          },
        },
      );

      return this.cleanResponse(response.data.response);
    } catch (error) {
      console.error("Ollama Error:", error.message);
      return this.getFallbackResponse(userMessage);
    }
  }

  /**
   * Tạo response Ollama với streaming (để future use)
   */
  static async generateResponseStreaming(userMessage, context = "") {
    try {
      const prompt = this.buildPrompt(userMessage, context);

      const response = await axios.post(
        "http://localhost:11434/api/generate",
        {
          model: "llama3:latest",
          prompt: prompt,
          stream: true,
          options: {
            temperature: 0.7,
            num_predict: 256,
          },
        },
        { responseType: "stream" },
      );

      return response.data;
    } catch (error) {
      console.error("Ollama Streaming Error:", error.message);
      return null;
    }
  }

  /**
   * Làm sạch response từ Ollama
   */
  static cleanResponse(text) {
    if (!text) return "Xin lỗi, tôi không thể trả lời ngay bây giờ.";

    // Xóa dấu cách thừa
    text = text.trim();

    // Xóa phần dư
    if (text.includes("Khách hàng:")) {
      text = text.split("Khách hàng:")[0].trim();
    }
    if (text.includes("User:")) {
      text = text.split("User:")[0].trim();
    }

    // Nếu response quá ngắn hoặc quá dài
    if (text.length < 10) {
      return "Bạn cần giúp gì? Tôi sẵn sàng hỗ trợ.";
    }
    if (text.length > 500) {
      // Cắt ngắn và thêm dấu ...
      text = text.substring(0, 500) + "...";
    }

    return text;
  }

  /**
   * Phản hồi dự phòng khi Ollama không sẵn sàng
   */
  static getFallbackResponse(userMessage) {
    const message = userMessage.toLowerCase();

    if (message.includes("giá") || message.includes("bao nhiêu")) {
      return "Giá sản phẩm tùy thuộc vào loại. Bạn có thể xem chi tiết trên website hoặc cho tôi biết sản phẩm cụ thể?";
    }

    if (message.includes("giao") || message.includes("ship")) {
      return "Chúng tôi giao hàng miễn phí từ 500k ở Hà Nội, 2 triệu toàn quốc. Thời gian 1-2 ngày.";
    }

    if (message.includes("bảo hành") || message.includes("warranty")) {
      return "Sản phẩm có bảo hành 12-24 tháng chính hãng. Liên hệ support để được hỗ trợ.";
    }

    if (message.includes("thanh toán") || message.includes("payment")) {
      return "Chúng tôi chấp nhận COD, chuyển khoản, thẻ tín dụng, ví điện tử và trả góp 0%.";
    }

    if (message.includes("hoàn trả") || message.includes("return")) {
      return "Bạn có 30 ngày để hoàn trả sản phẩm chưa sử dụng. Hãy liên hệ support để tạo mã RMA.";
    }

    if (message.includes("gợi ý") || message.includes("recommend")) {
      return "Bạn quan tâm đến loại sản phẩm nào? Laptop, điện thoại, hay tablet?";
    }

    return "Xin lỗi, tôi hiểu. Bạn có thể cho tôi biết thêm chi tiết không?";
  }

  /**
   * Kiểm tra xem Ollama có sẵn sàng không
   */
  static async checkOllamaHealth() {
    try {
      const response = await axios.get("http://localhost:11434/api/tags", {
        timeout: 5000,
      });
      return (
        response.status === 200 &&
        response.data.models &&
        response.data.models.length > 0
      );
    } catch (error) {
      console.warn("Ollama not available:", error.message);
      return false;
    }
  }

  /**
   * Tạo embedding cho semantic search (future use)
   */
  static async generateEmbedding(text, model = "llama3:latest") {
    try {
      const response = await axios.post(
        "http://localhost:11434/api/embeddings",
        {
          model: model,
          prompt: text,
        },
      );
      return response.data.embedding;
    } catch (error) {
      console.error("Embedding Error:", error.message);
      return null;
    }
  }

  /**
   * So sánh độ tương tự của hai văn bản
   */
  static async compareTexts(text1, text2) {
    try {
      const embedding1 = await this.generateEmbedding(text1);
      const embedding2 = await this.generateEmbedding(text2);

      if (!embedding1 || !embedding2) return 0;

      // Tính cosine similarity
      const dotProduct = embedding1.reduce(
        (sum, val, i) => sum + val * embedding2[i],
        0,
      );
      const magnitude1 = Math.sqrt(
        embedding1.reduce((sum, val) => sum + val * val, 0),
      );
      const magnitude2 = Math.sqrt(
        embedding2.reduce((sum, val) => sum + val * val, 0),
      );

      return dotProduct / (magnitude1 * magnitude2);
    } catch (error) {
      console.error("Comparison Error:", error.message);
      return 0;
    }
  }

  /**
   * Tạo response cho một danh sách câu hỏi (batch processing)
   */
  static async generateResponses(questions, context = "") {
    try {
      const responses = [];
      for (const question of questions) {
        const response = await this.generateResponse(question, context);
        responses.push({
          question,
          answer: response,
        });
      }
      return responses;
    } catch (error) {
      console.error("Batch Error:", error.message);
      return [];
    }
  }
}

module.exports = OllamaService;
