"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Car, UserIcon } from "lucide-react"
import { VisitorRegistration } from "@/components/visitor-registration"

/**
 * Página de registro de visitante
 * Paso 1: Elegir entre ingreso peatonal o vehicular
 * Paso 2: Formulario unificado de visitante (+ vehículo si es vehicular)
 */
export default function VisitorRegistrationPage() {
  const router = useRouter()
  const [entryMethod, setEntryMethod] = useState<"peatonal" | "vehicular" | null>(null)
  const [showVisitorForm, setShowVisitorForm] = useState(false)

  const handleBack = () => router.push("/")

  // Cuando elige peatonal, ir directo al formulario de visitante
  const handlePeatonal = () => {
    setEntryMethod("peatonal")
    setShowVisitorForm(true)
  }

  // Cuando elige vehicular, ir al formulario unificado (visitante + vehículo)
  const handleVehicular = () => {
    setEntryMethod("vehicular")
    setShowVisitorForm(true)
  }

  const handleComplete = (visitorData: any) => {
    console.log("Registro de visitante completado:", visitorData)
    alert("Registro de visita completado exitosamente")
    router.push("/")
  }

  // Mostrar formulario unificado de visitante (incluye vehículo si es vehicular)
  if (showVisitorForm) {
    return (
      <main className="min-h-screen">
        <VisitorRegistration
          onBack={() => { setShowVisitorForm(false); setEntryMethod(null) }}
          onComplete={handleComplete}
          entryMethod={entryMethod}
        />
      </main>
    )
  }

  // Paso 1: Selección de método de ingreso
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#003876] via-[#004494] to-[#003876]">
      <header className="bg-[#003876] border-b border-[#FFC107]/20 shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Ingreso UNAH</h1>
            <p className="text-sm text-[#FFC107]">Registro de Visitante</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleBack} className="text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Login
          </Button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-3">Ingreso como Visitante</h2>
            <p className="text-xl text-white/80">Seleccione su método de ingreso</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Peatonal */}
            <Card className="p-8 bg-white shadow-2xl border-none hover:shadow-3xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <button
                onClick={handlePeatonal}
                className="w-full h-full flex flex-col items-center justify-center space-y-6 text-center"
              >
                <div className="w-32 h-32 bg-[#003876] rounded-full flex items-center justify-center shadow-lg">
                  <UserIcon className="w-16 h-16 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold text-[#003876]">Ingreso Peatonal</h3>
                  <p className="text-gray-600 text-lg">Ingreso a pie por las entradas peatonales</p>
                </div>
                <Button className="w-full h-12 text-lg font-bold bg-[#FFC107] hover:bg-[#FFB300] text-[#003876] shadow-md">
                  Seleccionar
                </Button>
              </button>
            </Card>

            {/* Vehicular */}
            <Card className="p-8 bg-white shadow-2xl border-none hover:shadow-3xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <button
                onClick={handleVehicular}
                className="w-full h-full flex flex-col items-center justify-center space-y-6 text-center"
              >
                <div className="w-32 h-32 bg-[#003876] rounded-full flex items-center justify-center shadow-lg">
                  <Car className="w-16 h-16 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold text-[#003876]">Ingreso Vehicular</h3>
                  <p className="text-gray-600 text-lg">Ingreso en vehículo por las entradas vehiculares</p>
                </div>
                <Button className="w-full h-12 text-lg font-bold bg-[#FFC107] hover:bg-[#FFB300] text-[#003876] shadow-md">
                  Seleccionar
                </Button>
              </button>
            </Card>
          </div>
        </div>
      </div>

      <footer className="bg-[#003876] border-t border-[#FFC107]/20 py-3">
        <div className="container mx-auto px-4">
          <p className="text-sm text-white text-center">© 2026 UNAH - Sistema de Control de Acceso</p>
        </div>
      </footer>
    </div>
  )
}
