"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

interface ExtractedData {
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

export default function UploadPage() {
  const [user, setUser] = useState<any>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [editableData, setEditableData] = useState<ExtractedData | null>(null)
  const [customFields, setCustomFields] = useState<{ id: number; label: string; value: string }[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user")
      if (!userData) {
        router.push("/")
        return
      }
      setUser(JSON.parse(userData))
    }
  }, [router])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("PDF 파일만 업로드 가능합니다.")
      return
    }

    setError("")
    setIsAnalyzing(true)

    const formData = new FormData()
    formData.append("pdfFile", file)

    try {
      const response = await fetch("/api/analyze-pdf", {
        method: "POST",
        body: formData,
      })

      // 응답의 Content-Type을 확인하여 JSON 파싱 오류 방지
      const contentType = response.headers.get("content-type")
      let responseData: any

      if (contentType && contentType.includes("application/json")) {
        try {
          responseData = await response.json()
        } catch (jsonParseError) {
          console.error("JSON 응답 파싱 실패:", jsonParseError)
          setError(`서버 응답 파싱 중 오류 발생: ${jsonParseError}`)
          setIsAnalyzing(false)
          return
        }
      } else {
        // JSON이 아닌 응답 (예: HTML 오류 페이지, 일반 텍스트) 처리
        const textError = await response.text()
        console.error("서버에서 JSON이 아닌 응답을 보냈습니다:", textError)
        setError(`서버 오류: ${textError.substring(0, 200)}... (자세한 내용은 콘솔 확인)`)
        setIsAnalyzing(false)
        return
      }

      if (!response.ok) {
        // 서버에서 2xx 외의 상태 코드를 보냈을 때 (JSON 응답이더라도)
        setError(responseData.error || "PDF 분석에 실패했습니다.")
        setIsAnalyzing(false)
        return
      }

      // 성공적인 JSON 응답 처리
      if (responseData.success) {
        setExtractedData(responseData.data)
        setEditableData(responseData.data)
        setCustomFields([]) // Reset custom fields on new upload
        setIsAnalyzing(false)
      } else {
        setError(responseData.error || "PDF 분석에 실패했습니다.")
        setIsAnalyzing(false)
      }
    } catch (err: any) {
      // 네트워크 오류 등 fetch 자체에서 발생하는 오류
      setError(err.message || "파일 업로드 및 분석 중 알 수 없는 오류가 발생했습니다.")
      setIsAnalyzing(false)
    }
  }

  const handleInputChange = (field: keyof ExtractedData, value: string) => {
    if (editableData) {
      setEditableData({
        ...editableData,
        [field]: value,
      })
    }
  }

  const handleCustomFieldChange = (id: number, field: "label" | "value", value: string) => {
    setCustomFields((prevFields) => prevFields.map((f) => (f.id === id ? { ...f, [field]: value } : f)))
  }

  const addCustomField = () => {
    setCustomFields((prevFields) => [
      ...prevFields,
      { id: Date.now(), label: "", value: "" }, // 고유 ID 부여
    ])
  }

  const removeCustomField = (id: number) => {
    setCustomFields((prevFields) => prevFields.filter((f) => f.id !== id))
  }

  const toggleEditMode = () => {
    setIsEditing((prevIsEditing) => {
      const newIsEditing = !prevIsEditing
      if (prevIsEditing && editableData) {
        // 편집 완료 시 (isEditing이 true -> false로 바뀔 때)
        // 원본 데이터와 customFields를 업데이트
        setExtractedData({ ...editableData, customFields: customFields.map(({ id, ...rest }) => rest) })
      } else if (!prevIsEditing && extractedData) {
        // 편집 모드 진입 시 (isEditing이 false -> true로 바뀔 때)
        // 기존 extractedData의 customFields를 editableData와 customFields 상태에 반영
        setEditableData(extractedData)
        if (extractedData.customFields) {
          setCustomFields(extractedData.customFields.map((field, index) => ({ ...field, id: Date.now() + index })))
        } else {
          setCustomFields([])
        }
      }
      return newIsEditing
    })
  }

  const handleGenerateCertificate = () => {
    const dataToSave = {
      ...(editableData || extractedData),
      customFields: customFields.map(({ id, ...rest }) => rest), // ID 제거하고 저장
    }
    if (dataToSave && typeof window !== "undefined") {
      localStorage.setItem("certificateData", JSON.stringify(dataToSave))
      router.push("/certificate")
    }
  }

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user")
    }
    router.push("/")
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
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
              <span className="text-sm text-gray-700">안녕하세요, {user.name}님</span>
              <button
                onClick={handleLogout}
                className="text-sm text-hyundai-dark-blue hover:text-hyundai-orange font-medium"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 제목 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-hyundai-dark-blue mb-2">보험증권 업로드</h2>
          <p className="text-gray-600">가입증명서 발급을 위해 보험증권 PDF 파일을 업로드해주세요.</p>
        </div>

        {/* 업로드 영역 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
              isDragOver
                ? "border-hyundai-orange bg-orange-50"
                : "border-gray-300 hover:border-hyundai-orange hover:bg-orange-50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="mb-4">
              <svg
                className="mx-auto h-16 w-16 text-hyundai-orange"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-hyundai-dark-blue mb-2">보험증권 PDF 파일을 업로드하세요</h3>
            <p className="text-gray-500 mb-4">파일을 드래그하여 놓거나 클릭하여 선택하세요</p>
            <p className="text-sm text-gray-400">PDF 파일만 지원됩니다 (최대 10MB)</p>

            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* 분석 중 표시 */}
        {isAnalyzing && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hyundai-orange mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-hyundai-dark-blue mb-2">AI가 증권을 분석하고 있습니다</h3>
            <p className="text-gray-500">잠시만 기다려주세요...</p>
          </div>
        )}

        {/* 추출된 데이터 표시 */}
        {extractedData && editableData && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-hyundai-dark-blue">추출된 증권 정보</h3>
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  분석 완료
                </span>
                <button
                  onClick={toggleEditMode}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isEditing
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-hyundai-orange hover:bg-orange-700 text-white"
                  }`}
                >
                  {isEditing ? "편집 완료" : "정보 수정"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">발급일</label>
                <input
                  type="text"
                  value={editableData.issueDate}
                  onChange={(e) => handleInputChange("issueDate", e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg transition-colors ${
                    isEditing
                      ? "bg-white focus:ring-2 focus:ring-hyundai-orange focus:border-transparent"
                      : "bg-gray-50"
                  }`}
                  readOnly={!isEditing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">증권번호</label>
                <input
                  type="text"
                  value={editableData.policyNumber}
                  onChange={(e) => handleInputChange("policyNumber", e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg transition-colors ${
                    isEditing
                      ? "bg-white focus:ring-2 focus:ring-hyundai-orange focus:border-transparent"
                      : "bg-gray-50"
                  }`}
                  readOnly={!isEditing}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">보험기간</label>
                <input
                  type="text"
                  value={editableData.policyPeriod}
                  onChange={(e) => handleInputChange("policyPeriod", e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg transition-colors ${
                    isEditing
                      ? "bg-white focus:ring-2 focus:ring-hyundai-orange focus:border-transparent"
                      : "bg-gray-50"
                  }`}
                  readOnly={!isEditing}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">피보험자</label>
                <textarea
                  value={editableData.insured}
                  onChange={(e) => handleInputChange("insured", e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg transition-colors ${
                    isEditing
                      ? "bg-white focus:ring-2 focus:ring-hyundai-orange focus:border-transparent"
                      : "bg-gray-50"
                  }`}
                  rows={3}
                  readOnly={!isEditing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">피보험자 수</label>
                <input
                  type="text"
                  value={editableData.numberOfInsureds}
                  onChange={(e) => handleInputChange("numberOfInsureds", e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg transition-colors ${
                    isEditing
                      ? "bg-white focus:ring-2 focus:ring-hyundai-orange focus:border-transparent"
                      : "bg-gray-50"
                  }`}
                  readOnly={!isEditing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">보장지역</label>
                <input
                  type="text"
                  value={editableData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg transition-colors ${
                    isEditing
                      ? "bg-white focus:ring-2 focus:ring-hyundai-orange focus:border-transparent"
                      : "bg-gray-50"
                  }`}
                  readOnly={!isEditing}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">계약자</label>
                <input
                  type="text"
                  value={editableData.contractor}
                  onChange={(e) => handleInputChange("contractor", e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg transition-colors ${
                    isEditing
                      ? "bg-white focus:ring-2 focus:ring-hyundai-orange focus:border-transparent"
                      : "bg-gray-50"
                  }`}
                  readOnly={!isEditing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">수익자</label>
                <input
                  type="text"
                  value={editableData.beneficiary}
                  onChange={(e) => handleInputChange("beneficiary", e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg transition-colors ${
                    isEditing
                      ? "bg-white focus:ring-2 focus:ring-hyundai-orange focus:border-transparent"
                      : "bg-gray-50"
                  }`}
                  readOnly={!isEditing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">총 보험료</label>
                <input
                  type="text"
                  value={editableData.totalPremium}
                  onChange={(e) => handleInputChange("totalPremium", e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg transition-colors ${
                    isEditing
                      ? "bg-white focus:ring-2 focus:ring-hyundai-orange focus:border-transparent"
                      : "bg-gray-50"
                  }`}
                  readOnly={!isEditing}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">보장내용</label>
                <textarea
                  value={editableData.coverage}
                  onChange={(e) => handleInputChange("coverage", e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg transition-colors ${
                    isEditing
                      ? "bg-white focus:ring-2 focus:ring-hyundai-orange focus:border-transparent"
                      : "bg-gray-50"
                  }`}
                  rows={3}
                  readOnly={!isEditing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">보험가입금액</label>
                <input
                  type="text"
                  value={editableData.amountInsured}
                  onChange={(e) => handleInputChange("amountInsured", e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg transition-colors ${
                    isEditing
                      ? "bg-white focus:ring-2 focus:ring-hyundai-orange focus:border-transparent"
                      : "bg-gray-50"
                  }`}
                  readOnly={!isEditing}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">비고</label>
                <textarea
                  value={editableData.remark}
                  onChange={(e) => handleInputChange("remark", e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg transition-colors ${
                    isEditing
                      ? "bg-white focus:ring-2 focus:ring-hyundai-orange focus:border-transparent"
                      : "bg-gray-50"
                  }`}
                  rows={3}
                  readOnly={!isEditing}
                />
              </div>

              {/* 동적으로 추가되는 항목들 */}
              {customFields.map((field) => (
                <React.Fragment key={field.id}>
                  <div className="flex items-end gap-2">
                    <div className="flex-grow">
                      <label className="block text-sm font-medium text-gray-700 mb-2">항목명</label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleCustomFieldChange(field.id, "label", e.target.value)}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg transition-colors ${
                          isEditing
                            ? "bg-white focus:ring-2 focus:ring-hyundai-orange focus:border-transparent"
                            : "bg-gray-50"
                        }`}
                        readOnly={!isEditing}
                        placeholder="새 항목명"
                      />
                    </div>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => removeCustomField(field.id)}
                        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors h-[42px]"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
                    <textarea
                      value={field.value}
                      onChange={(e) => handleCustomFieldChange(field.id, "value", e.target.value)}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg transition-colors ${
                        isEditing
                          ? "bg-white focus:ring-2 focus:ring-hyundai-orange focus:border-transparent"
                          : "bg-gray-50"
                      }`}
                      rows={2}
                      readOnly={!isEditing}
                      placeholder="새 항목 내용"
                    />
                  </div>
                </React.Fragment>
              ))}
            </div>

            {isEditing && (
              <div className="mb-6">
                <button
                  type="button"
                  onClick={addCustomField}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg transition-colors"
                >
                  + 항목 추가
                </button>
              </div>
            )}

            {isEditing && (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-hyundai-orange mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-orange-700">
                    편집 모드입니다. 필요한 정보를 수정한 후 "편집 완료" 버튼을 클릭하세요.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleGenerateCertificate}
                className="bg-hyundai-orange hover:bg-orange-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                가입증명서 생성하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
