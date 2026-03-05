"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Eye, EyeOff, AlertCircle } from "lucide-react"

// Import API URL
import { API_URL } from "@/lib/api"

// Props del componente
interface PasswordAuthenticationProps {
  userData: {
    dni: string
    name: string
    roles: string[]
    accountNumbers: Record<string, string>
    centroUniversitario: string
    isActive: boolean
  }
  onBack: () => void
  onAuthenticated: () => void
}

export function PasswordAuthentication({ userData, onBack, onAuthenticated }: PasswordAuthenticationProps) {
  const [password, setPassword] = useState("") 
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Permitir Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && password) {
      handleSubmit(e as any)
    }
  }

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  if (!password) {
    setError("Por favor ingrese su contraseña");
    return;
  }

  setIsLoading(true);

  try {
const rutaLogin = userData.roles.includes("visitante")
  ? `${API_URL}/visitas/login`
  : `${API_URL}/personas/login`;

const res = await fetch(rutaLogin, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ dni: userData.dni, password }),
});


    if (!res.ok) {
      if (res.status === 401) setError("Contraseña incorrecta");
      else if (res.status === 404) setError("Usuario no encontrado");
      else setError("Error en autenticación");
      setIsLoading(false);
      return;
    }

    const data = await res.json();
    // aquí podrías actualizar sessionStorage con lo que devuelva el back si quieres
    onAuthenticated();
  } catch (err) {
    console.error(err);
    setError("Error al conectar con el servidor");
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F5]">
      <header className="bg-[#003876] shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Ingreso UNAH</h1>
            <p className="text-sm text-[#FFC107]">Sistema de Control de Acceso</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onBack} className="text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-white shadow-lg">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold text-[#003876]">Ingresa tu clave</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">Identificador:</p>
                <p className="text-xl font-mono font-bold text-[#003876]">{userData.dni}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#003876] font-medium">Contraseña</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError("")
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Ingrese su contraseña"
                    className="pr-10 border-gray-300 focus:border-[#003876] focus:ring-[#003876]"
                    disabled={isLoading}
                    autoFocus
                    tabIndex={1}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-bold bg-[#FFC107] hover:bg-[#FFB300] text-[#003876]"
                disabled={isLoading || !password}
                tabIndex={2}
              >
                {isLoading ? "Verificando..." : "Ingresar"}
              </Button>
            </form>

            <p className="text-xs text-center text-gray-500">
              ¿Olvidaste tu contraseña? Contacta al administrador del sistema
            </p>
          </div>
        </Card>
      </div>

      <footer className="bg-[#003876] py-3">
        <p className="text-sm text-white text-center">© 2026 UNAH - Sistema de Control de Acceso</p>
      </footer>
    </div>
  )
}
