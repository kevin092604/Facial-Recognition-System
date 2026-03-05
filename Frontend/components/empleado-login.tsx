"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, User, Lock, Shield, ArrowLeft } from "lucide-react"
import { API_URL } from "@/lib/api"

/**
 * Componente de login para administradores de la UNAH
 * Permite autenticación con número de cuenta y contraseña
 */
export default function EmpleadoLogin() {
  const router = useRouter()
  const [numeroCuenta, setNumeroCuenta] = useState("")
  const [contrasena, setContrasena] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Valida el formato del número de cuenta (DESHABILITADO)
   */
  const validateNumeroCuenta = (value: string): boolean => {
    return true // Validación deshabilitada
  }

  /**
   * Valida que la contraseña no esté vacía (DESHABILITADO)
   */
  const validateContrasena = (value: string): boolean => {
    return true // Validación deshabilitada
  }

  /**
   * Maneja cambios en el input de número de cuenta
   */
  const handleNumeroCuentaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNumeroCuenta(value)
    setError("")
  }

  /**
   * Maneja cambios en el input de contraseña
   */
  const handleContrasenaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContrasena(e.target.value)
    setError("")
  }

  /**
   * Maneja el envío del formulario de login
   * Valida credenciales contra el backend y verifica que sea empleado
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!numeroCuenta || !contrasena) {
      setError("Por favor ingrese sus credenciales")
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

      // 2. Verificar que sea empleado
      const empRes = await fetch(`${API_URL}/empleados/por-persona/${persona.Id_persona}`)

      if (!empRes.ok) {
        setError("No tiene permisos de administrador")
        setIsLoading(false)
        return
      }

      const empleado = await empRes.json()

      // 3. Guardar sesión y redirigir
      const sid = Math.random().toString(36).substring(2, 15)

      sessionStorage.setItem(
        `session_${sid}`,
        JSON.stringify({
          numero_cuenta: empleado.NumeroEmpleado || numeroCuenta,
          nombre: `${persona.Nombre} ${persona.Apellido}`,
          rol: empleado.Rol || "admin",
          dni: numeroCuenta,
          Id_persona: persona.Id_persona,
        })
      )

      router.push(`/seleccion-usuario?sid=${sid}`)
    } catch (err) {
      console.error(err)
      setError("Error al conectar con el servidor")
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Verifica si el horario de la universidad está activo
   */
  const getUniversityHoursMessage = () => {
    const now = new Date()
    const hour = now.getHours()

    if (hour < 6 || hour >= 22) {
      return "Nota: La universidad está cerrada en este momento (horario: 6:00 AM - 10:00 PM)."
    }
    return null
  }

  const hoursMessage = getUniversityHoursMessage()

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#003876] via-[#004494] to-[#003876]">
      {/* Header institucional */}
      <header className="bg-[#003876] border-b border-[#FFC107]/20 shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Ingreso UNAH</h1>
            <p className="text-sm text-[#FFC107]">Portal de Administración</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </header>

      {/* Formulario de login */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-8 md:p-12 bg-white shadow-2xl border-none">
          <div className="space-y-6">
            <div className="space-y-3 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-[#003876] rounded-full flex items-center justify-center">
                  <Shield className="w-10 h-10 text-white" />
                </div>
              </div>
              <h2 className="text-4xl font-bold text-[#003876]">Acceso Administrador</h2>
              <p className="text-lg text-gray-600">
                Ingresa con tus credenciales de administrador
              </p>
            </div>

            {/* Alerta de horario */}
            {hoursMessage && (
              <Alert className="border-[#FFC107] bg-[#FFC107]/10">
                <AlertCircle className="h-4 w-4 text-[#FFC107]" />
                <AlertDescription className="text-gray-700">{hoursMessage}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo de número de cuenta */}
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Número de empleado"
                    value={numeroCuenta}
                    onChange={handleNumeroCuentaChange}
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
                    onChange={handleContrasenaChange}
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

              {/* Link de recuperación de contraseña */}
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-[#003876] hover:underline"
                  onClick={() => router.push("/recuperar-contrasena")}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </form>
          </div>
        </Card>
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