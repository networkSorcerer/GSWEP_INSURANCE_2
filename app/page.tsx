"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // 간단한 로그인 시뮬레이션
    setTimeout(() => {
      if (email && password) {
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify({ email, name: "홍길동" }))
        }
        router.push("/upload")
      }
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* 현대해상 로고 영역 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-hyundai-orange rounded-full mb-4">
            <span className="text-white text-3xl font-bold">H</span>
          </div>
          <h1 className="text-2xl font-bold text-hyundai-dark-blue mb-2">현대해상화재보험</h1>
          <p className="text-hyundai-orange font-medium">HYUNDAI MARINE & FIRE INSURANCE</p>
          <p className="text-gray-600 text-sm mt-2">보험가입증명서 발급시스템</p>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-hyundai-dark-blue text-center">로그인</h2>
            <p className="text-gray-600 text-sm text-center mt-1">증명서 발급을 위해 로그인해주세요</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hyundai-orange focus:border-transparent transition-all"
                placeholder="example@hyundai.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hyundai-orange focus:border-transparent transition-all"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-hyundai-orange hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  로그인 중...
                </div>
              ) : (
                "로그인"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">© 2024 현대해상화재보험주식회사. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
