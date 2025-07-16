"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

interface CertificateData {
  issueDate: string
  policyNumber: string
  policyPeriod: string
  insured: string
  numberOfInsureds: string
  contractor: string
  beneficiary: string
  country: string
  totalPremium: string
  coverage: string
  amountInsured: string
  remark: string
  customFields?: { label: string; value: string }[]
}

type Language = "ko" | "en"

const translations = {
  ko: {
    certificateTitle: "보험가입증명서",
    certificateSubtitle: "INSURANCE COVERAGE CERTIFICATE",
    issueDate: "발급일",
    policyNumber: "증권번호",
    policyPeriod: "보험기간",
    insured: "피보험자",
    numberOfInsureds: "피보험자 수",
    contractor: "계약자",
    beneficiary: "수익자",
    country: "보장지역",
    totalPremium: "총 보험료",
    coverage: "보장내용",
    amountInsured: "보험가입금액",
    remark: "비고",
    statement: "위와 같이 보험에 가입되어 있음을 증명합니다.",
    companyName: "현대해상화재보험주식회사",
    companyAddress: "서울특별시 종로구 세종대로 163 (세종로)",
    companyContact: "대표전화 1588-5656",
    print: "🖨️ 인쇄",
    download: "📥 PDF 다운로드",
    newCertificate: "새 증명서",
    logout: "로그아웃",
    pageTitle: "가입증명서",
    inWitness:
      "IN WITNESS WHEREOF, HYUNDAI MARINE & FIRE INSURANCE CO., LTD. Has caused this policy to be signed by its president or authorized representative, and countersigned on the Declarations page by a duly authorized representative. Signed at Seoul, Korea",
  },
  en: {
    certificateTitle: "INSURANCE COVERAGE CERTIFICATE",
    certificateSubtitle: "INSURANCE COVERAGE CERTIFICATE", // Subtitle is same as title in English for this template
    issueDate: "Issue Date",
    policyNumber: "Policy No.",
    policyPeriod: "Policy Period",
    insured: "Insured",
    numberOfInsureds: "Number of Insureds",
    contractor: "Contractor",
    beneficiary: "Beneficiary",
    country: "COUNTRY",
    totalPremium: "Total Premium",
    coverage: "Coverage",
    amountInsured: "Amount Insured",
    remark: "Remark",
    statement: "This certifies that the above insurance has been taken out.",
    companyName: "HYUNDAI MARINE & FIRE INSURANCE CO., LTD.",
    companyAddress: "163, Sejong-daero, Jongno-gu, Seoul, Korea (Sejong-ro)",
    companyContact: "Tel: 1588-5656",
    print: "🖨️ Print",
    download: "📥 Download PDF",
    newCertificate: "New Certificate",
    logout: "Logout",
    pageTitle: "Certificate",
    inWitness:
      "IN WITNESS WHEREOF, HYUNDAI MARINE & FIRE INSURANCE CO., LTD. Has caused this policy to be signed by its president or authorized representative, and countersigned on the Declarations page by a duly authorized representative. Signed at Seoul, Korea",
  },
}

export default function CertificatePage() {
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null)
  const [user, setUser] = useState<any>(null)
  const [displayLanguage, setDisplayLanguage] = useState<Language>("ko") // 기본 언어 한국어
  const certificateRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user")
      const certData = localStorage.getItem("certificateData")
      const savedLang = localStorage.getItem("certificateLanguage") as Language

      if (!userData || !certData) {
        router.push("/")
        return
      }

      setUser(JSON.parse(userData))
      setCertificateData(JSON.parse(certData))
      if (savedLang) {
        setDisplayLanguage(savedLang)
      }
    }
  }, [router])

  const t = translations[displayLanguage]

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    alert("PDF 다운로드가 시작됩니다.")
  }

  const handleNewCertificate = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("certificateData")
    }
    router.push("/upload")
  }

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user")
      localStorage.removeItem("certificateData")
    }
    router.push("/")
  }

  const handleLanguageChange = (lang: Language) => {
    setDisplayLanguage(lang)
    if (typeof window !== "undefined") {
      localStorage.setItem("certificateLanguage", lang)
    }
  }

  if (!certificateData || !user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-hyundai-orange rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-lg font-bold">H</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-hyundai-dark-blue">현대해상화재보험</h1>
                <p className="text-xs text-gray-500">보험가입증명서 발급시스템</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleNewCertificate}
                className="text-sm text-hyundai-dark-blue hover:text-hyundai-orange font-medium"
              >
                {t.newCertificate}
              </button>
              <button
                onClick={handleLogout}
                className="text-sm text-hyundai-dark-blue hover:text-hyundai-orange font-medium"
              >
                {t.logout}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 액션 버튼 및 언어 선택 */}
        <div className="flex justify-between items-center mb-8 print:hidden">
          <h2 className="text-2xl font-bold text-hyundai-dark-blue">{t.pageTitle}</h2>
          <div className="flex items-center space-x-3">
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => handleLanguageChange("ko")}
                className={`px-3 py-1 text-sm font-medium ${
                  displayLanguage === "ko"
                    ? "bg-hyundai-dark-blue text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                한국어
              </button>
              <button
                onClick={() => handleLanguageChange("en")}
                className={`px-3 py-1 text-sm font-medium ${
                  displayLanguage === "en"
                    ? "bg-hyundai-dark-blue text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                English
              </button>
            </div>
            <button
              onClick={handlePrint}
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {t.print}
            </button>
            <button
              onClick={handleDownload}
              className="bg-hyundai-orange hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {t.download}
            </button>
          </div>
        </div>

        {/* 증명서 */}
        <div
          ref={certificateRef}
          className="bg-white shadow-lg print:shadow-none mx-auto border border-gray-200"
          style={{
            width: "210mm",
            minHeight: "297mm",
            padding: "20mm",
            fontSize: "14px",
            lineHeight: "1.4",
            boxSizing: "border-box",
          }}
        >
          {/* 상단 로고 및 제목 */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex-grow">
              <h1 className="text-3xl font-bold text-hyundai-dark-blue mb-2 text-center">{t.certificateTitle}</h1>
              <p className="text-lg font-medium text-hyundai-orange text-center">{t.certificateSubtitle}</p>
            </div>
            <div className="w-16 h-16 bg-hyundai-orange rounded-full flex items-center justify-center flex-shrink-0 ml-4">
              <span className="text-white text-3xl font-bold">H</span>
            </div>
          </div>

          {/* 증명서 내용 테이블 */}
          <div className="mb-8 border border-gray-300">
            <table className="w-full border-collapse">
              <tbody>
                {[
                  { label: t.issueDate, value: certificateData.issueDate },
                  { label: t.policyNumber, value: certificateData.policyNumber },
                  { label: t.policyPeriod, value: certificateData.policyPeriod },
                  { label: t.insured, value: certificateData.insured },
                  { label: t.numberOfInsureds, value: certificateData.numberOfInsureds },
                  { label: t.contractor, value: certificateData.contractor },
                  { label: t.beneficiary, value: certificateData.beneficiary },
                  { label: t.country, value: certificateData.country },
                  { label: t.totalPremium, value: certificateData.totalPremium },
                  { label: t.coverage, value: certificateData.coverage },
                  { label: t.amountInsured, value: certificateData.amountInsured },
                  { label: t.remark, value: certificateData.remark },
                ].map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2 bg-gray-50 font-semibold w-1/3">{item.label}</td>
                    <td className="border border-gray-300 px-4 py-2 whitespace-pre-wrap">{item.value}</td>
                  </tr>
                ))}
                {/* 동적으로 추가된 항목들을 렌더링 */}
                {certificateData.customFields &&
                  certificateData.customFields.map((field, index) => (
                    <tr key={`custom-${index}`}>
                      <td className="border border-gray-300 px-4 py-2 bg-gray-50 font-semibold w-1/3">{field.label}</td>
                      <td className="border border-gray-300 px-4 py-2 whitespace-pre-wrap">{field.value}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* 서명 및 도장 영역 */}
          <div className="mt-16">
            <p className="text-sm text-gray-700 mb-12 leading-relaxed">{t.inWitness}</p>

            <div className="flex justify-between items-end">
              {/* 도장 */}
              <div className="text-center">
                <div className="w-24 h-24 bg-hyundai-orange rounded-full flex items-center justify-center mb-3 mx-auto border-4 border-orange-500 shadow-lg relative">
                  <span className="text-white text-4xl font-bold">H</span>
                  {/* 월계수 잎 장식 효과 (로고 이미지에 맞춰 제거 또는 변경 가능) */}
                  <div className="absolute inset-0 rounded-full border-2 border-orange-300 opacity-50"></div>
                </div>
              </div>

              {/* 회사 정보 및 서명 */}
              <div className="text-right">
                <div className="mb-6">
                  <div className="text-xl font-bold text-hyundai-dark-blue mb-1">{t.companyName}</div>
                </div>

                <div className="border-t border-gray-400 pt-3 mb-4">
                  <div className="text-sm font-medium">{t.president}</div>
                </div>

                <div className="text-xs text-gray-600 leading-relaxed">
                  <div>{t.companyAddress}</div>
                  <div>{t.companyContact}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
        /* 텍스트 영역에서 줄바꿈이 적용되도록 */
        .whitespace-pre-wrap {
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  )
}
