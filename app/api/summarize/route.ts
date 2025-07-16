import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // 1. 요청 본문에서 프롬프트 내용 받기
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt content is missing." }, { status: 400 })
    }

    // 2. API 키 환경변수 확인
    const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!googleApiKey) {
      console.error("GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set.")
      return NextResponse.json(
        {
          success: false,
          error:
            "Google Generative AI API key is missing. Please set the GOOGLE_GENERATIVE_AI_API_KEY environment variable.",
        },
        { status: 500 },
      )
    }

    // 3. Gemini API 호출 URL 설정
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${googleApiKey}`

    // 4. Gemini API에 보낼 요청 본문 구성
    const geminiRequestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: `다음 텍스트를 요약해줘:\n\n${prompt}` }], // 요약 프롬프트 추가
        },
      ],
      generationConfig: {
        temperature: 0.7, // 요약에 적합한 온도 설정 (창의성 허용)
        maxOutputTokens: 500, // 최대 출력 토큰 제한 (선택 사항)
      },
    }

    // 5. Gemini API 호출
    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(geminiRequestBody),
    })

    // 6. Gemini API 응답 상태 확인
    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => ({ message: "Failed to parse error response." }))
      console.error("Gemini API Error Response:", geminiResponse.status, errorData)
      // Gemini API 응답이 200이 아닐 경우, 상태 코드와 응답 본문을 그대로 전달
      return NextResponse.json(
        {
          success: false,
          error: `Gemini API call failed with status ${geminiResponse.status}`,
          details: errorData,
        },
        { status: geminiResponse.status },
      )
    }

    // 7. Gemini API 응답 파싱 및 요약 텍스트 추출
    const geminiResult = await geminiResponse.json()
    const summaryText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text

    if (!summaryText) {
      console.error("Gemini API did not return expected text content:", geminiResult)
      return NextResponse.json(
        {
          success: false,
          error: "Gemini API did not return expected summary text.",
          rawGeminiResponse: geminiResult,
        },
        { status: 500 },
      )
    }

    // 8. 요약된 텍스트 반환
    return NextResponse.json({ success: true, summary: summaryText }, { status: 200 })
  } catch (error: any) {
    console.error("API Error:", error)
    // 일반적인 API 호출 오류 처리
    return NextResponse.json(
      { success: false, error: error.message || "An unknown error occurred during summarization." },
      { status: 500 },
    )
  }
}
