"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, User, GraduationCap, Briefcase, AlertCircle, UserPlus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Definición de las propiedades que recibe el componente
interface UserDashboardProps {
  roles: string[] // Roles del usuario (por ejemplo, estudiante, docente, empleado)
  name: string // Nombre completo del usuario
  accountNumbers?: { role: string; number: string }[] // Números de cuenta del usuario (si existen)
  isActive?: boolean // Estado de la cuenta (activa o inactiva)
  centroUniversitario?: string // Centro universitario al que pertenece el usuario
  onBack: () => void // Función para volver atrás
  onProceedToEnrollment?: () => void // Función para ir al panel de enrolamiento (solo empleados)
}

export function UserDashboard({
  roles,
  name,
  accountNumbers,
  isActive = true,
  centroUniversitario,
  onBack,
  onProceedToEnrollment,
}: UserDashboardProps) {
  // Función para obtener los íconos correspondientes a los roles del usuario
  const getRoleIcons = () => {
    return roles.map((role) => {
      switch (role) {
        case "estudiante":
          return <GraduationCap key={role} className="w-12 h-12 text-[#003876]" /> // Ícono para estudiante
        case "docente":
          return <User key={role} className="w-12 h-12 text-[#003876]" /> // Ícono para docente
        case "empleado":
          return <Briefcase key={role} className="w-12 h-12 text-[#003876]" /> // Ícono para empleado
        default:
          return <User key={role} className="w-12 h-12 text-[#003876]" /> // Ícono por defecto
      }
    })
  }

  // Función para obtener la etiqueta correspondiente al rol del usuario
  const getRoleLabel = (role: string) => {
    switch (role) {
      case "estudiante":
        return "Estudiante"
      case "docente":
        return "Docente"
      case "empleado":
        return "Empleado"
      default:
        return "Usuario"
    }
  }

  // Función para mostrar los roles del usuario de forma concatenada
  const getRolesDisplay = () => {
    return roles.map((role) => getRoleLabel(role)).join(" / ")
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F5]">
      <header className="bg-[#003876] shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">SISTEMA DE INGRESO</h1>
            <p className="text-sm text-[#FFC107]">Universidad Nacional Autónoma de Honduras</p>
          </div>
          {/* Botón para regresar */}
          <Button variant="ghost" size="sm" onClick={onBack} className="text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-8 md:p-12 bg-white shadow-lg border border-border">
          <div className="space-y-8">
            {/* Mostrar el perfil y los roles */}
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-[#003876]">Perfil: {getRolesDisplay()}</h2>
              <div className="flex gap-4 items-center">{getRoleIcons()}</div>
            </div>

            {/* Mostrar alerta si la cuenta está inactiva */}
            {!isActive && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {roles.includes("estudiante")
                    ? "Tu cuenta de estudiante no está activa. Verifica tu matrícula o forma 03 con VOAE."
                    : "Tu cuenta de empleado/docente no está activa. Contacta con RRHH para más información."}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {/* Mostrar nombre del usuario */}
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Nombre:</span>
                <span className="font-medium text-[#003876]">{name}</span>
              </div>

              {/* Mostrar números de cuenta si existen */}
              {accountNumbers && accountNumbers.length > 0 && (
                <div className="space-y-2">
                  {accountNumbers.map((account) => (
                    <div key={account.role} className="flex items-center gap-2">
                      <span className="text-gray-600">
                        {account.role === "estudiante" ? "Número de Cuenta:" : "Número de Empleado:"}
                      </span>
                      <span className="font-mono font-medium text-[#003876]">{account.number}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="pt-4">
              {onProceedToEnrollment && (
                <Button
                  onClick={onProceedToEnrollment}
                  className="w-full h-12 text-base font-bold bg-[#FFC107] hover:bg-[#FFB300] text-[#003876]"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Enrolar personas
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      <footer className="bg-[#003876] py-3">
        <p className="text-sm text-white text-center">© 2026 UNAH - Sistema de Control de Acceso</p>
      </footer>
    </div>
  )
}
