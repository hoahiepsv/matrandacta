import { GoogleGenAI, Type } from "@google/genai";
import { MatrixData, ModelType, MatrixConfig } from "../types";

const SYSTEM_INSTRUCTION = `
Bạn là một chuyên gia giáo dục hàng đầu tại Việt Nam, chuyên về việc xây dựng ma trận đặc tả đề kiểm tra theo chuẩn của Bộ Giáo dục và Đào tạo.
Nhiệm vụ của bạn là phân tích các tài liệu đầu vào (file ma trận đề, file PDF, ảnh chụp) và tạo ra một "Bản đặc tả đề kiểm tra" chi tiết, chính xác.

Yêu cầu đầu ra JSON cụ thể:
1. Phân tích nội dung kiến thức, chủ đề, mức độ nhận thức (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao).
2. TRÍCH XUẤT THÔNG TIN TIÊU ĐỀ: Tên Phòng/Sở GD, Tên Trường, Tên kỳ thi (Giữa kỳ/Cuối kỳ), Năm học.
3. Phân loại số lượng câu hỏi trắc nghiệm (TN) và tự luận (TL) cho từng mục.
4. Tính toán tổng số câu và tỷ lệ phần trăm.
5. Nội dung đặc tả phải chi tiết, sử dụng các động từ chỉ hành vi (ví dụ: "Nhận biết được...", "Giải thích được...", "Vận dụng...").
6. Đảm bảo cấu trúc JSON khớp hoàn toàn với Schema được cung cấp.

Lưu ý đặc biệt:
- Nếu tài liệu đầu vào là ảnh hoặc PDF, hãy trích xuất thông tin chính xác nhất có thể.
- Tính toán toán học (tổng cộng, tỷ lệ %) phải chính xác tuyệt đối và KHỚP VỚI CẤU HÌNH YÊU CẦU nếu được cung cấp.
- QUAN TRỌNG: Tách nhỏ các nội dung kiến thức. Mỗi nội dung nhỏ đi kèm với mức độ đánh giá phải là một dòng (row) riêng biệt trong mảng kết quả. Không gộp chung nhiều nội dung vào một ô. Ví dụ: Nếu một chủ đề có 3 gạch đầu dòng nội dung, hãy tạo 3 rows riêng biệt cho chúng.
`;

// Helper to clean JSON string from Markdown code blocks
const cleanJsonString = (str: string): string => {
  // Remove markdown code blocks (e.g., ```json ... ```)
  let cleaned = str.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  // Trim whitespace
  cleaned = cleaned.trim();
  return cleaned;
};

export const generateMatrix = async (
  apiKey: string,
  modelType: ModelType,
  files: { mimeType: string; data: string }[],
  config?: MatrixConfig, // Accept config
  additionalInstructions: string = ""
): Promise<MatrixData> => {
  
  const ai = new GoogleGenAI({ apiKey });

  // JSON Schema for structured output
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      department_name: { type: Type.STRING, description: "Tên cơ quan chủ quản/Phòng GD (VD: ỦY BAN NHÂN DÂN... hoặc PHÒNG GD&ĐT...)" },
      school_name: { type: Type.STRING, description: "Tên Trường (VD: TRƯỜNG THCS VÕ VĂN KIỆT)" },
      title: { type: Type.STRING, description: "Tiêu đề gốc của ma trận đề (VD: MA TRẬN ĐỀ THAM KHẢO KIỂM TRA...)" },
      exam_name: { type: Type.STRING, description: "Tên kỳ kiểm tra cụ thể để điền vào dòng 'BẢN ĐẶC TẢ...' (VD: GIỮA HỌC KỲ I)" },
      school_year: { type: Type.STRING, description: "Năm học (VD: 2025 - 2026)" },
      subject: { type: Type.STRING, description: "Môn học (VD: TOÁN 8)" },
      grade: { type: Type.STRING, description: "Khối lớp" },
      time: { type: Type.STRING, description: "Thời gian làm bài (VD: 90 phút)" },
      rows: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            tt: { type: Type.STRING, description: "Số thứ tự" },
            topic: { type: Type.STRING, description: "Chủ đề" },
            content: { type: Type.STRING, description: "Nội dung kiến thức (Mỗi dòng là một nội dung cụ thể, không gộp)" },
            assessment_level: { type: Type.STRING, description: "Mức độ đánh giá (Nhận biết/Thông hiểu/Vận dụng/Vận dụng cao)" },
            recognition_tn: { type: Type.NUMBER, description: "Số câu TN Nhận biết" },
            recognition_tl: { type: Type.NUMBER, description: "Số câu TL Nhận biết" },
            understanding_tn: { type: Type.NUMBER, description: "Số câu TN Thông hiểu" },
            understanding_tl: { type: Type.NUMBER, description: "Số câu TL Thông hiểu" },
            application_tn: { type: Type.NUMBER, description: "Số câu TN Vận dụng" },
            application_tl: { type: Type.NUMBER, description: "Số câu TL Vận dụng" },
            high_application_tn: { type: Type.NUMBER, description: "Số câu TN Vận dụng cao" },
            high_application_tl: { type: Type.NUMBER, description: "Số câu TL Vận dụng cao" },
          }
        }
      },
      summary: {
        type: Type.OBJECT,
        properties: {
          total_recognition: { type: Type.NUMBER },
          total_understanding: { type: Type.NUMBER },
          total_application: { type: Type.NUMBER },
          total_high_application: { type: Type.NUMBER },
          percent_recognition: { type: Type.NUMBER },
          percent_understanding: { type: Type.NUMBER },
          percent_application: { type: Type.NUMBER },
          percent_high_application: { type: Type.NUMBER },
          general_percent_basic: { type: Type.NUMBER, description: "Tổng % Nhận biết + Thông hiểu" },
          general_percent_advanced: { type: Type.NUMBER, description: "Tổng % Vận dụng + Vận dụng cao" }
        }
      }
    }
  };

  const parts = files.map(f => ({
    inlineData: {
      mimeType: f.mimeType,
      data: f.data
    }
  }));

  let prompt = `
    Hãy phân tích tài liệu và tạo một Ma trận đặc tả đề kiểm tra chi tiết.
    
    1. Trích xuất chính xác tên Phòng/Sở, Tên Trường, Tiêu đề ma trận, Môn, Thời gian, Năm học từ phần đầu tài liệu.
    2. Nếu có file mẫu ma trận, hãy ưu tiên cấu trúc và cách diễn đạt của file mẫu.
    3. Nếu không có, hãy sử dụng chuẩn chung của Bộ Giáo dục.
  `;

  if (config) {
    prompt += `
    
    QUAN TRỌNG - YÊU CẦU CẤU TRÚC VÀ SỐ LƯỢNG CÂU HỎI:
    Bạn BẮT BUỘC phải phân bổ chính xác số lượng câu hỏi sau đây vào các chủ đề/nội dung kiến thức được tìm thấy trong tài liệu.
    Đây là số lượng CỐ ĐỊNH, không được thay đổi:
    
    1. Mức độ Nhận biết:
       - Tỉ lệ điểm: ${config.recognition.percent}%
       - Số câu Trắc nghiệm: ${config.recognition.tn}
       - Số câu Tự luận: ${config.recognition.tl}
       
    2. Mức độ Thông hiểu:
       - Tỉ lệ điểm: ${config.understanding.percent}%
       - Số câu Trắc nghiệm: ${config.understanding.tn}
       - Số câu Tự luận: ${config.understanding.tl}
       
    3. Mức độ Vận dụng:
       - Tỉ lệ điểm: ${config.application.percent}%
       - Số câu Trắc nghiệm: ${config.application.tn}
       - Số câu Tự luận: ${config.application.tl}
       
    4. Mức độ Vận dụng cao:
       - Tỉ lệ điểm: ${config.high_application.percent}%
       - Số câu Trắc nghiệm: ${config.high_application.tn}
       - Số câu Tự luận: ${config.high_application.tl}
       
    Hãy phân chia các câu hỏi này vào các dòng (rows) dựa trên nội dung kiến thức trong file đính kèm.
    
    YÊU CẦU TRÌNH BÀY:
    - Với mỗi "Nội dung kiến thức" và "Mức độ đánh giá", hãy tạo ra một dòng (object) riêng biệt trong mảng 'rows'. 
    - Tuyệt đối KHÔNG gộp nhiều ý vào chung một ô nội dung (không dùng gạch đầu dòng trong 1 ô). Hãy tách chúng thành các dòng riêng để khi hiển thị trên bảng, mỗi dòng được kẻ ô riêng biệt.
    
    Tổng số câu hỏi ở cuối ma trận (phần summary) PHẢI KHỚP CHÍNH XÁC với các con số trên.
    `;
  }

  if (additionalInstructions) {
      prompt += `\nLưu ý thêm: ${additionalInstructions}`;
  }
  
  // Provide the prompt as text
  parts.push({ text: prompt } as any);

  try {
    const response = await ai.models.generateContent({
      model: modelType,
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        // Removed maxOutputTokens to allow model default (usually sufficient or higher)
        temperature: 0.2,
        // Disable safety filters to prevent false positives on educational content
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ] as any,
      }
    });

    let text = response.text;
    
    // Fallback: Try to get text from candidates if top-level text is empty
    if (!text && response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
             text = candidate.content.parts[0].text;
        }
    }
    
    if (!text) {
      console.error("Empty response from AI:", response);
      const candidate = response.candidates?.[0];
      if (candidate?.finishReason === 'MAX_TOKENS') {
         throw new Error(`Nội dung quá dài (MAX_TOKENS). Vui lòng chia nhỏ file đầu vào hoặc giảm bớt yêu cầu chi tiết.`);
      }
      if (candidate?.finishReason) {
         throw new Error(`AI từ chối tạo nội dung. Lý do: ${candidate.finishReason}. Vui lòng kiểm tra lại tài liệu.`);
      }
      throw new Error("AI không trả về kết quả nào (Empty Response). Vui lòng thử lại sau.");
    }
    
    try {
      const cleanedText = cleanJsonString(text);
      return JSON.parse(cleanedText) as MatrixData;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.log("Raw Text:", text);
      const candidate = response.candidates?.[0];
      if (candidate?.finishReason === 'MAX_TOKENS') {
         throw new Error("Kết quả bị cắt bớt do quá dài (MAX_TOKENS). Vui lòng giảm bớt số lượng tài liệu hoặc chia nhỏ nội dung.");
      }
      throw new Error("Dữ liệu trả về từ AI không đúng định dạng JSON. Vui lòng thử lại.");
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message && (error.message.includes("SAFETY") || error.message.includes("blocked"))) {
      throw new Error("Nội dung bị chặn bởi bộ lọc an toàn của Google. Vui lòng kiểm tra lại tài liệu.");
    }
    throw error;
  }
};