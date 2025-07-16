// import pdfParse from "pdf-parse" // pdf-parse 라이브러리 임포트 제거

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("pdfFile") as File | null

    if (!file) {
      return new Response(JSON.stringify({ success: false, error: "No PDF file uploaded." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // 임시 플레이스홀더 텍스트 사용 (pdf-parse 문제 진단을 위함)
    const pdfContent = `
    보험가입증명서
    발급일: 2024. 06. 01
    증권번호: F-2024-0331735
    보험기간: 2024. 06. 02~2026.06.02
    피보험자: HYUNDAI KIM (910202-2156321)
    ENGIN KIM (020215-123456)
    피보험자 수: 2
    계약자: HYUNDAI ENGINEERING CO.LTD (101-81-66755)
    수익자: Heir-at-law
    보장지역: WORLDWIDE
    총 보험료: 미기재
    보장내용: Death
    Hospitalization Expenses (Accident)
    Hospitalization Expenses (Sickness)
    보험가입금액: 50,000,000 KRW
    비고: This certificate ensures the travel insurance covers worldwide with above coverage and amount.
    `

    const prompt = `
    다음은 보험증권 문서의 내용입니다. 이 문서에서 다음 정보를 정확히 추출해주세요.

    추출할 정보:
    1. 발급일 (Issue Date) - YYYY. MM. DD 형식
    2. 증권번호 (Policy Number)
    3. 보험기간 (Policy Period) - YYYY. MM. DD~YYYY.MM.DD 형식
    4. 피보험자 (Insured) - 여러 명일 경우 줄바꿈으로 구분
    5. 피보험자 수 (Number of Insureds)
    6. 계약자 (Contractor)
    7. 수익자 (Beneficiary)
    8. 보장지역 (Country)
    9. 총 보험료 (Total Premium)
    10. 보장내용 (Coverage) - 여러 항목일 경우 줄바꿈으로 구분
    11. 보험가입금액 (Amount Insured)
    12. 비고 (Remark)

    응답은 반드시 다음 JSON 형식으로만 제공해주세요:
    {
        "issueDate": "YYYY. MM. DD",
        "policyNumber": "추출된 증권번호",
        "policyPeriod": "YYYY. MM. DD~YYYY.MM.DD",
        "insured": "피보험자명1\\n피보험자명2",
        "numberOfInsureds": "피보험자 수",
        "contractor": "계약자",
        "beneficiary": "수익자",
        "country": "보장지역",
        "totalPremium": "총 보험료",
        "coverage": "보장내용1\\n보장내용2",
        "amountInsured": "보험가입금액",
        "remark": "비고 내용"
    }

    만약 특정 정보를 찾을 수 없다면 해당 필드에 "정보 없음"을 입력해주세요.
    
    보험증권 내용:
    ${pdfContent}
    `

    // GEMINI_API_KEY 환경 변수 확인
    const googleApiKey = process.env.GEMINI_API_KEY
    if (!googleApiKey) {
      console.error("GEMINI_API_KEY environment variable is not set.")
      return new Response(
        JSON.stringify({
          success: false,
          error: "API 키가 설정되지 않았습니다. GEMINI_API_KEY 환경 변수를 설정해주세요.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Gemini API 호출 URL 설정 (gemini-pro 모델로 변경)
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${googleApiKey}`

    const maxRetries = 3 // 최대 재시도 횟수
    let retries = 0
    let geminiResponse: Response | null = null
    let rawGeminiResponseText = ""

    while (retries < maxRetries) {
      try {
        geminiResponse = await fetch(GEMINI_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0, // 정확한 정보 추출을 위해 낮은 온도 설정
            },
          }),
        })

        rawGeminiResponseText = await geminiResponse.text()

        if (geminiResponse.ok) {
          // 성공적인 응답이면 루프 종료
          break
        } else if (geminiResponse.status === 503 || geminiResponse.status === 429) {
          // 503 (Service Unavailable) 또는 429 (Too Many Requests) 오류 시 재시도
          console.warn(
            `Gemini API returned status ${geminiResponse.status}. Retrying... (${retries + 1}/${maxRetries})`,
          )
          retries++
          const delay = Math.pow(2, retries) * 100 + Math.random() * 100 // 지수 백오프 (200ms, 400ms, 800ms...)
          await new Promise((resolve) => setTimeout(resolve, delay))
        } else {
          // 404와 같은 다른 종류의 오류는 재시도 없이 바로 반환
          console.error("Gemini API Error Response:", geminiResponse.status, rawGeminiResponseText)
          return new Response(
            JSON.stringify({
              success: false,
              error: `Gemini API 호출 실패: ${geminiResponse.status}`,
              details: rawGeminiResponseText,
            }),
            {
              status: geminiResponse.status,
              headers: { "Content-Type": "application/json" },
            },
          )
        }
      } catch (fetchError: any) {
        // 네트워크 오류 등 fetch 자체에서 발생하는 오류
        console.error("Fetch error during Gemini API call:", fetchError)
        retries++
        const delay = Math.pow(2, retries) * 100 + Math.random() * 100
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    // 모든 재시도 후에도 성공적인 응답을 받지 못했을 경우
    if (!geminiResponse || !geminiResponse.ok) {
      console.error("Gemini API call failed after multiple retries.")
      return new Response(
        JSON.stringify({
          success: false,
          error: "Gemini API 호출이 여러 번의 재시도 후에도 실패했습니다. 잠시 후 다시 시도해주세요.",
          details: rawGeminiResponseText || "응답 없음",
        }),
        {
          status: geminiResponse?.status || 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Gemini API 응답이 성공적일 경우 (2xx 상태 코드), 텍스트를 JSON으로 파싱 시도
    let geminiResult: any
    try {
      geminiResult = JSON.parse(rawGeminiResponseText)
    } catch (jsonParseError: any) {
      console.error("Gemini API response JSON parsing error:", jsonParseError)
      return new Response(
        JSON.stringify({
          success: false,
          error: "Gemini API 응답이 유효한 JSON 형식이 아닙니다.",
          details: jsonParseError.message,
          rawGeminiResponse: rawGeminiResponseText,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const generatedText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      console.error("Gemini API did not return expected text content:", geminiResult)
      return new Response(
        JSON.stringify({
          success: false,
          error: "Gemini API가 예상되는 텍스트 내용을 반환하지 않았습니다.",
          rawGeminiResponse: geminiResult,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // 마크다운 코드 블록 제거 로직
    const jsonBlockRegex = /```(?:json)?\n([\s\S]*?)\n```/
    const match = generatedText.match(jsonBlockRegex)

    let jsonString = generatedText
    if (match && match[1]) {
      jsonString = match[1].trim()
    } else {
      jsonString = generatedText.trim()
    }

    let extractedData
    try {
      extractedData = JSON.parse(jsonString)
    } catch (jsonError: any) {
      console.error("JSON Parsing Error from Gemini response (after markdown removal):", jsonError)
      return new Response(
        JSON.stringify({
          success: false,
          error: "AI 응답을 JSON으로 파싱하는 데 실패했습니다.",
          details: jsonError.message,
          rawAiResponse: generatedText,
          parsedJsonStringAttempt: jsonString,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    return new Response(JSON.stringify({ success: true, data: extractedData }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error: any) {
    console.error("API Error:", error)
    return new Response(JSON.stringify({ success: false, error: error.message || "서버 내부 오류가 발생했습니다." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
