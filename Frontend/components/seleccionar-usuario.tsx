"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { UserCheck, Users, GraduationCap, Shield } from "lucide-react"

/**
 * Componente para seleccionar el tipo de usuario a registrar
 * Permite al empleado elegir entre registrar visitante, estudiante o empleado
 */
export function SeleccionUsuario() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sid = searchParams.get("sid") || ""
  const [isLoading, setIsLoading] = useState(false)

  const handleSeleccion = (tipo: "visitante" | "estudiante" | "maestro") => {
    setIsLoading(true)
    const query = sid ? `?sid=${sid}` : ""
    if (tipo === "visitante") {
      router.push(`/registro-visita${query}`)
    } else if (tipo === "maestro") {
      router.push(`/registro-empleado${query}`)
    } else {
      router.push(`/registro-entrada${query}`)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#003876] via-[#004494] to-[#003876]">
      {/* Header institucional */}
      <header className="bg-[#003876] border-b border-[#FFC107]/20 shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Ingreso UNAH</h1>
            <p className="text-sm text-[#FFC107]">
              Sistema de Control de Acceso
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin")}
            className="bg-transparent border-[#FFC107] text-[#FFC107] hover:bg-[#FFC107] hover:text-[#003876] font-semibold"
          >
            <Shield className="w-4 h-4 mr-2" />
            Administrador
          </Button>
        </div>
      </header>

      {/* Selección de tipo de usuario */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-3">
              Selecciona el tipo de usuario
            </h2>
            <p className="text-xl text-white/80">
              ¿A quién deseas registrar hoy?
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card de Visitante */}
            <Card className="p-8 bg-white shadow-2xl border-none hover:shadow-3xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <button
                onClick={() => handleSeleccion("visitante")}
                disabled={isLoading}
                className="w-full h-full flex flex-col items-center justify-center space-y-6 text-center"
              >
                <div className="w-32 h-32 bg-[#003876] rounded-full flex items-center justify-center shadow-lg">
                  <Users className="w-16 h-16 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold text-[#003876]">Visitante</h3>
                  <p className="text-gray-600 text-lg">
                    Registrar persona externa que viene de visita a la universidad
                  </p>
                </div>
                <Button
                  className="w-full h-12 text-lg font-bold bg-[#FFC107] hover:bg-[#FFB300] text-[#003876] shadow-md"
                  disabled={isLoading}
                >
                  {isLoading ? "Cargando..." : "Seleccionar Visitante"}
                </Button>
              </button>
            </Card>

            {/* Card de Estudiante */}
            <Card className="p-8 bg-white shadow-2xl border-none hover:shadow-3xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <button
                onClick={() => handleSeleccion("estudiante")}
                disabled={isLoading}
                className="w-full h-full flex flex-col items-center justify-center space-y-6 text-center"
              >
                <div className="w-32 h-32 bg-[#003876] rounded-full flex items-center justify-center shadow-lg">
                  <UserCheck className="w-16 h-16 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold text-[#003876]">Estudiante</h3>
                  <p className="text-gray-600 text-lg">
                    Registrar entrada de estudiante de la UNAH
                  </p>
                </div>
                <Button
                  className="w-full h-12 text-lg font-bold bg-[#FFC107] hover:bg-[#FFB300] text-[#003876] shadow-md"
                  disabled={isLoading}
                >
                  {isLoading ? "Cargando..." : "Seleccionar Estudiante"}
                </Button>
              </button>
            </Card>

            {/* Card de Empleado */}
            <Card className="p-8 bg-white shadow-2xl border-none hover:shadow-3xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <button
                onClick={() => handleSeleccion("maestro")}
                disabled={isLoading}
                className="w-full h-full flex flex-col items-center justify-center space-y-6 text-center"
              >
                <div className="w-32 h-32 bg-[#003876] rounded-full flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-16 h-16 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold text-[#003876]">Empleado</h3>
                  <p className="text-gray-600 text-lg">
                    Registrar entrada de empleado de la UNAH
                  </p>
                </div>
                <Button
                  className="w-full h-12 text-lg font-bold bg-[#FFC107] hover:bg-[#FFB300] text-[#003876] shadow-md"
                  disabled={isLoading}
                >
                  {isLoading ? "Cargando..." : "Seleccionar Empleado"}
                </Button>
              </button>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#003876] border-t border-[#FFC107]/20 py-3">
        <div className="container mx-auto px-4">
          <p className="text-sm text-white text-center">© 2026 UNAH (demo). Backend en http://localhost:3000</p>
        </div>
      </footer>
    </div>
  )
}