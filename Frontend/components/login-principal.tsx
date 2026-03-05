"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { User, Lock } from "lucide-react"
import { API_URL } from "@/lib/api"

/**
 * Componente de login principal unificado
 * Acepta número de cuenta de estudiante o número de empleado + contraseña
 * Redirige según el rol del usuario
 */
export default function LoginPrincipal() {
  const router = useRouter()
  const [numeroCuenta, setNumeroCuenta] = useState("")
  const [contrasena, setContrasena] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!numeroCuenta || !contrasena) {
      setError("Por favor ingrese su número de cuenta y contraseña")
      return
    }

    setIsLoading(true)

    try {
      // 1. Autenticar contra el backend
      const loginRes = await fetch(`${API_URL}/personas/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dni: numeroCuenta, password: contrasena }),
      })

      if (!loginRes.ok) {
        if (loginRes.status === 404) setError("Usuario no encontrado")
        else if (loginRes.status === 401) setError("Contraseña incorrecta")
        else setError("Error en autenticación")
        setIsLoading(false)
        return
      }

      const persona = await loginRes.json()

      // 2. Determinar roles (estudiante / empleado)
      const roles: string[] = []
      const accountNumbers: { role: string; number: string }[] = []
      let centroUniversitario = ""

      const [estRes, empRes] = await Promise.all([
        fetch(`${API_URL}/estudiantes/por-persona/${persona.Id_persona}`),
        fetch(`${API_URL}/empleados/por-persona/${persona.Id_persona}`),
      ])

      if (estRes.ok) {
        const est = await estRes.json()
        roles.push("estudiante")
        accountNumbers.push({ role: "estudiante", number: est.NumeroCuenta || "" })
        centroUniversitario = est.CentroUniversitario || ""
      }

      if (empRes.ok) {
        const emp = await empRes.json()
        roles.push("empleado")
        accountNumbers.push({ role: "empleado", number: emp.NumeroEmpleado || "" })
      }

      if (!roles.includes("empleado")) {
        setError("Acceso restringido. Solo los empleados pueden iniciar sesión en este sistema.")
        setIsLoading(false)
        return
      }

      // 3. Guardar sesión y redirigir al dashboard
      const sid = Math.random().toString(36).substring(2, 15)

      sessionStorage.setItem(
        `session_${sid}`,
        JSON.stringify({
          dni: numeroCuenta,
          name: `${persona.Nombre} ${persona.Apellido}`,
          roles,
          accountNumbers,
          centroUniversitario,
          isActive: true,
          Id_persona: persona.Id_persona,
        })
      )

      router.push(`/dashboard?sid=${sid}`)
    } catch (err) {
      console.error(err)
      setError("Error al conectar con el servidor")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#003876] via-[#004494] to-[#003876]">
      {/* Header institucional */}
      <header className="bg-[#003876] border-b border-[#FFC107]/20 shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Ingreso UNAH</h1>
            <p className="text-sm text-[#FFC107]">Sistema de Control de Acceso</p>
          </div>
        </div>
      </header>

      {/* Formulario de login */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-8 md:p-12 bg-white shadow-2xl border-none">
          <div className="space-y-6">
            <div className="space-y-3 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-[#003876] rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
              </div>
              <h2 className="text-4xl font-bold text-[#003876]">Iniciar Sesión</h2>
              <p className="text-lg text-gray-600">
                Acceso exclusivo para empleados
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo de número de cuenta / empleado */}
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Número de cuenta o número de empleado"
                    value={numeroCuenta}
                    onChange={(e) => { setNumeroCuenta(e.target.value); setError("") }}
                    className="h-14 text-lg pl-12 bg-white border-2 border-gray-300 focus:border-[#003876] focus:ring-[#003876] text-gray-900 placeholder:text-gray-400"
                    disabled={isLoading}
                    autoFocus
                    tabIndex={1}
                  />
                </div>
              </div>

              {/* Campo de contraseña */}
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="password"
                    placeholder="Contraseña"
                    value={contrasena}
                    onChange={(e) => { setContrasena(e.target.value); setError("") }}
                    className="h-14 text-lg pl-12 bg-white border-2 border-gray-300 focus:border-[#003876] focus:ring-[#003876] text-gray-900 placeholder:text-gray-400"
                    disabled={isLoading}
                    tabIndex={2}
                  />
                </div>
                {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
              </div>

              {/* Botón de inicio de sesión */}
              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold bg-[#FFC107] hover:bg-[#FFB300] text-[#003876] shadow-md"
                disabled={isLoading}
                tabIndex={3}
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>

          </div>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-[#003876] border-t border-[#FFC107]/20 py-3">
        <div className="container mx-auto px-4">
          <p className="text-sm text-white text-center">© 2026 UNAH - Sistema de Control de Acceso</p>
        </div>
      </footer>
    </div>
  )
}
