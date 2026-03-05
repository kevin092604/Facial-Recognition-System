"use client"

import { Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { EnrollmentPanel } from "@/components/enrollment-panel"

function EnrolamientoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const userData = useMemo(() => {
    if (typeof window === 'undefined') return null
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

  if (!userData) {
    router.replace("/")
    return null
  }

  // Solo empleados pueden acceder al enrolamiento
  if (!userData.roles?.includes("empleado")) {
    router.replace("/dashboard?sid=" + searchParams.get("sid"))
    return null
  }

  const handleBack = () => {
    const sessionId = searchParams.get("sid")
    const newSid = Math.random().toString(36).substring(2, 15)
    if (sessionId) {
      sessionStorage.setItem(`session_${newSid}`, JSON.stringify(userData))
    }
    router.push(`/dashboard?sid=${newSid}`)
  }

  return (
    <EnrollmentPanel
      operadorNombre={userData.name}
      onBack={handleBack}
    />
  )
}

export default function EnrolamientoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003876]" />
      </div>
    }>
      <EnrolamientoContent />
    </Suspense>
  )
}
