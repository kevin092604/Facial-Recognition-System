"use client"

import { Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { UserDashboard } from "@/components/user-dashboard"

function DashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const userData = useMemo(() => {
    const sessionId = searchParams.get("sid")

    if (!sessionId) return null

    const sessionData = sessionStorage.getItem(`session_${sessionId}`)
    if (!sessionData) return null

    try {
      return JSON.parse(sessionData)
    } catch {
      return null
    }
  }, [searchParams])

  const handleBack = () => {
    const sessionId = searchParams.get("sid")
    if (sessionId) {
      sessionStorage.removeItem(`session_${sessionId}`)
    }
    router.push("/")
  }

  const handleProceedToEnrollment = () => {
    if (userData) {
      const newSessionId = Math.random().toString(36).substring(2, 15)
      sessionStorage.setItem(`session_${newSessionId}`, JSON.stringify(userData))
      router.push(`/enrolamiento?sid=${newSessionId}`)
    }
  }

  if (!userData) {
    router.replace("/")
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003876] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <UserDashboard
      roles={userData.roles}
      name={userData.name}
      accountNumbers={userData.accountNumbers}
      isActive={userData.isActive}
      centroUniversitario={userData.centroUniversitario}
      onBack={handleBack}
      onProceedToEnrollment={handleProceedToEnrollment}
    />
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003876] mx-auto"></div><p className="mt-4 text-gray-600">Cargando perfil...</p></div></div>}>
      <main className="min-h-screen">
        <DashboardContent />
      </main>
    </Suspense>
  )
}
