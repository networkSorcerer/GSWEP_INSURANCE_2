import { GoogleGenAI } from "@google/genai"

// API 키는 환경 변수 (예: GEMINI_KEY 또는 GOOGLE_API_KEY)에서 자동으로 로드됩니다.
// 명시적으로 설정하려면 다음과 같이 할 수 있습니다:
// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY, httpOptions: { apiVersion: "v1alpha" } });
const ai = new GoogleGenAI({
  httpOptions: { apiVersion: "v1alpha" },
})

async function main() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro", // 모델을 gemini-2.5-pro로 변경
      contents: [{ text: "Explain how AI works" }], // contents는 배열 형태여야 합니다.
    })
    console.log(response.text)
  } catch (error) {
    console.error("Error generating content:", error)
    // 503 UNAVAILABLE 또는 403 PERMISSION_DENIED 오류가 발생할 수 있습니다.
    // 이는 모델 가용성, 할당량 또는 API 키 권한 문제일 수 있습니다.
  }
}

await main()
