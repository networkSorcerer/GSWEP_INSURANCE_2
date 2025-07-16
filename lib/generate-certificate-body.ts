/**
 * 보험 가입증명서 본문 생성을 위한 입력 데이터 인터페이스
 */
interface CertificateInputData {
  계약자: string
  상품명: string
  가입금액: string
  보장내용: string[]
}

/**
 * 주어진 JSON 데이터를 기반으로 보험 가입증명서 템플릿의 본문을 생성합니다.
 *
 * @param data - 계약자, 상품명, 가입금액, 보장내용을 포함하는 JSON 데이터
 * @returns 생성된 가입증명서 본문 문자열
 */
export function generateCertificateBody(data: CertificateInputData): string {
  const { 계약자, 상품명, 가입금액, 보장내용 } = data

  // 보장내용 배열을 쉼표로 구분된 문자열로 변환
  const coverageDetailsFormatted = 보장내용.join(", ")

  const body = `본 증명서는 아래와 같이 보험 계약이 체결되었음을 확인합니다.

계약자명: ${계약자}
상품명: ${상품명}
가입금액: ${가입금액}
주요 보장내용: ${coverageDetailsFormatted}

이 증명서는 고객의 요청에 의해 발급되었습니다.`

  return body
}

// 사용 예시 (테스트를 위한 코드, 실제 배포 시에는 제거하거나 별도 파일로 분리)
// const exampleData = {
//   "계약자": "홍길동",
//   "상품명": "OO생명 종합건강보험",
//   "가입금액": "1억원",
//   "보장내용": ["암 진단비 5천만원", "입원일당 3만원", "수술비 최대 1천만원"]
// };

// const generatedText = generateCertificateBody(exampleData);
// console.log(generatedText);
