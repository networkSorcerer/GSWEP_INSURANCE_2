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

    // 3. Gemini API 호출 URL 설정 (gemini-2.0-flash, v1beta)
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleApiKey}`

    // 4. Gemini API에 보낼 요청 본문 구성
    const geminiRequestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: `다음 보험 증권 내용을 요약해줘:\n\n${prompt}` }], // 보험 증권 요약 프롬프트
        },
      ],
      generationConfig: {
        temperature: 0.7, // 요약에 적합한 온도 설정
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
      const errorText = await geminiResponse.text()
      console.error("Gemini API Error Response:", geminiResponse.status, errorText)
      // Gemini API 응답이 200이 아닐 경우, 상태 코드와 응답 본문을 그대로 전달
      return new Response(errorText, {
        status: geminiResponse.status,
        headers: { "Content-Type": "application/json" }, // JSON으로 반환하도록 헤더 설정
      })
    }

    // 7. Gemini API 응답 파싱 및 클라이언트에 그대로 반환
    const geminiResult = await geminiResponse.json()
    return NextResponse.json(geminiResult, { status: 200 })
  } catch (error: any) {
    console.error("API Error:", error)
    // 일반적인 API 호출 오류 처리
    return NextResponse.json(
      { success: false, error: error.message || "An unknown error occurred during summarization." },
      { status: 500 },
    )
  }
}
