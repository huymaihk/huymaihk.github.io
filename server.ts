import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Lazy initialize GoogleGenAI with warning triggers
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey !== "") {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
} catch (error) {
  console.error("Failed to initialize GoogleGenAI", error);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API general health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      geminiActive: !!ai,
      time: new Date().toISOString()
    });
  });

  // API endpoint for SEO optimization and automated tag creation
  app.post("/api/gemini/generate-seo", async (req, res) => {
    try {
      if (!ai) {
        return res.status(503).json({ error: "Gemini API key is not configured. Hướng dẫn: Bạn có thể nhập khoá API trong panel Settings > Secrets ở góc màn hình." });
      }

      const { name, category, subcategory, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Product name is required for SEO generation." });
      }

      const prompt = `Bạn là chuyên gia marketing SEO cho cửa hàng Máy Ảnh Cũ & Ống Kính Đã Qua Sử Dụng (bán lẻ máy ảnh DSLR, Mirrorless cũ chất lượng, uy tín).
Hãy viết tiêu đề SEO tối ưu (seoTitle), mô tả SEO hấp dẫn dưới 160 ký tự (seoDescription) và từ khóa SEO ngăn cách bởi dấu phẩy phù hợp (seoKeywords) cho sản phẩm sau:
- Tên sản phẩm: ${name}
- Danh mục: ${category} / ${subcategory}
- Mô tả thô: ${description || "Không có mô tả bổ sung"}

LƯU Ý: Viết hoàn toàn bằng tiếng Việt, phản ánh đúng các thông tin kĩ thuật, máy ảnh chính hãng (Canon, Sony, Nikon, Fuji), số shot và cam kết bảo hành uy tín.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              seoTitle: {
                type: Type.STRING,
                description: "Tiêu đề SEO của sản phẩm máy ảnh, khoảng 50-60 ký tự, hấp dẫn kích thích click bứt phá thứ hạng."
              },
              seoDescription: {
                type: Type.STRING,
                description: "Mô tả SEO meta description dưới 160 ký tự để hiển thị trên kết quả tìm kiếm Google Việt Nam."
              },
              seoKeywords: {
                type: Type.STRING,
                description: "Thẻ khóa SEO phân cách bằng dấu phẩy. Ví dụ: 'máy ảnh cũ, mua máy ảnh cũ, canon 5d3 cũ, lens cũ giá rẻ'"
              }
            },
            required: ["seoTitle", "seoDescription", "seoKeywords"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response returned from Gemini.");
      }

      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (err: any) {
      console.error("SEO Generation Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate SEO tags" });
    }
  });

  // NEW ENDPOINT: Analyze product content SEO score & checklist
  app.post("/api/gemini/analyze-seo", async (req, res) => {
    try {
      if (!ai) {
        return res.status(503).json({ error: "Gemini API key is not configured." });
      }

      const { name, description, seoTitle, seoDescription, seoKeywords } = req.body;

      const prompt = `Bạn là Chuyên gia Kiểm tra Chất lượng SEO & Đánh giá Google Rank cho cửa hàng Máy Ảnh Cũ & Ống Kính Đã Qua Sử Dụng Nhật Bản.
Hãy phân tích nội dung sản phẩm sau và đánh giá mức độ tối ưu hóa tìm kiếm Google Việt Nam.
- Tên sản phẩm: ${name || "Chưa nhập"}
- Mô tả sản phẩm: ${description || "Chưa nhập"}
- Tiêu đề SEO (Meta Title): ${seoTitle || "Chưa nhập"}
- Thẻ mô tả SEO (Meta Description): ${seoDescription || "Chưa nhập"}
- Từ khóa SEO (Meta Keywords): ${seoKeywords || "Chưa nhập"}

Hãy tính toán một điểm số tổng quan SEO lý tưởng từ 0 đến 100 (score).
Đồng thời trả về một Mảng Checklist các tiêu chuẩn kỹ thuật (độ dài tiêu đề, mật độ từ khóa có xuất hiện trong mô tả hay không, sự lôi cuốn của thẻ description, sự hiện diện của thông tin thấu kính, tình trạng trầy xước, số shot đã chụp hoặc bảo hành từ cửa hàng).
Kèm theo danh sách đề xuất hành động thực tiễn để tăng hạng.

Cấu trúc JSON phản hồi bắt buộc chuẩn xác:`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: {
                type: Type.INTEGER,
                description: "Điểm số tối ưu hóa SEO tổng thể, từ 0 đến 100."
              },
              checklist: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    item: { type: Type.STRING, description: "Tên tiêu chí (ví dụ: 'Độ dài thẻ Tiêu đề SEO', 'Sự xuất hiện của từ khóa chính')" },
                    passed: { type: Type.BOOLEAN, description: "Đạt chuẩn (true) hay Chưa đạt (false)" },
                    feedback: { type: Type.STRING, description: "Nhận xét chi tiết và cách khắc phục nếu chưa đạt." }
                  },
                  required: ["item", "passed", "feedback"]
                }
              },
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Các đề xuất bổ sung từ chuyên gia để dễ lên top tìm kiếm Google tại thị trường Việt Nam."
              }
            },
            required: ["score", "checklist", "suggestions"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from Gemini.");
      res.json(JSON.parse(text));
    } catch (err: any) {
      console.error("SEO Analysis Error:", err);
      res.status(500).json({ error: err.message || "Failed to analyze SEO" });
    }
  });

  // NEW ENDPOINT: Hot trending search keywords recommendation
  app.post("/api/gemini/suggest-keywords", async (req, res) => {
    try {
      if (!ai) {
        return res.status(503).json({ error: "Gemini API key is not configured." });
      }

      const { name, category, subcategory } = req.body;

      const prompt = `Bạn là kỹ sư nghiên cứu từ khóa (SEO Keyword Researcher) tại thị trường Việt Nam cho các sản phẩm thiết bị nhiếp ảnh, máy ảnh cũ, ống kính lướt chính hãng.
Dựa trên sản phẩm: 
- Tên: ${name || "Máy ảnh cũ"}
- Danh mục: ${category || ""} ${subcategory || ""}

Hãy gợi ý khoảng 8-10 từ khóa đuôi dài (long-tail keywords) và từ khóa thịnh hành có lượng tìm kiếm cao nhất trên Google Việt Nam liên quan đến thiết bị này để người dùng nâng cao thứ hạng bán hàng.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              keywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Mảng chứa các từ khóa gợi ý. Ví dụ: ['máy ảnh canon cũ hà nội', 'lens sony cũ giá rẻ', 'fujifilm x-t3 cũ lướt']"
              }
            },
            required: ["keywords"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from Gemini.");
      res.json(JSON.parse(text));
    } catch (err: any) {
      console.error("Keywords Suggestion Error:", err);
      res.status(500).json({ error: err.message || "Failed to suggest keywords" });
    }
  });

  // API endpoint for detailed Uniqlo-style fashion copy-writing
  app.post("/api/gemini/generate-description", async (req, res) => {
    try {
      if (!ai) {
        return res.status(503).json({ error: "Gemini API key is not configured. Hướng dẫn: Bạn có thể nhập khoá API trong panel Settings > Secrets ở góc màn hình." });
      }

      const { name, category, subcategory, bulletPoints } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Product name is required." });
      }

      const prompt = `Bạn là chuyên gia thẩm định và biên tập viên nội dung thiết bị nhiếp ảnh chuyên nghiệp cho Cửa Hàng Máy Ảnh & Ống Kính Cũ Nhật Bản.
Hãy viết mô tả chi tiết sản phẩm máy ảnh/ống kính/phụ kiện chân thực, hấp dẫn, làm rõ độ tin cậy của thiết bị cũ, chất ảnh và tinh thần đam mê nhiếp ảnh tại Việt Nam.

Thông tin ban đầu:
- Tên sản phẩm: ${name}
- Danh mục: ${category} / ${subcategory}
- Ý chính/Bullet points: ${bulletPoints || "Máy nguyên bản hoạt động tốt, kính đẹp không mốc rễ tre"}

Hãy viết một đoạn mô tả chi tiết gồm các phần:
1. Giới thiệu tổng quan (phân khúc sử dụng, thiết kế, thương hiệu).
2. Thông số kỹ thuật & Tình trạng thực tế (số shot, độ đẹp cũ/mới bao nhiêu %, tình trạng thấu kính, gương lật hay cảm biến).
3. Bộ phụ kiện đi kèm hoàn chỉnh (pin, sạc, dây đeo, thẻ nhớ tặng kèm).
4. Chính sách bảo hành uy tín & Đổi trả an tâm (bảo hành 6-12 tháng, lỗi là đổi trong 7 ngày).

Mô tả phải thật chuyên nghiệp, tạo độ tin cậy tuyệt đối để người mua máy cũ yên tâm xuống tiền. Trình bày thật đẹp, rõ ràng bằng các gạch đầu dòng rõ ràng, gọn gàng chất lượng.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });

      const text = response.text;
      res.json({ description: text });
    } catch (err: any) {
      console.error("Description Generation Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate product description" });
    }
  });

  // Vite integrated server configurations
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
