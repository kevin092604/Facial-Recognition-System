"use client"

// Importación de tipos y componentes necesarios
import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"


//libreria api
import { API_URL } from "@/lib/api";

// Componente principal que maneja la entrada del identificador
export function DniInput() {
  const router = useRouter()
  const [dni, setDni] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDni(e.target.value)
    setError("")
  }

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!dni.trim()) {
    setError("Por favor ingrese su número de cuenta o número de empleado");
    return;
  }

  setIsLoading(true);

  try {
    //
    // 1️⃣ Buscar persona interna de la UNAH por NumeroCuenta o NumeroEmpleado
    //
    const personaRes = await fetch(`${API_URL}/personas/${dni.trim()}`);

    if (personaRes.ok) {
      const persona = await personaRes.json();

      const roles: string[] = [];
      const accountNumbers: { role: string; number: string }[] = [];
      let centroUniversitario = "";

      // Buscar estudiante y empleado en paralelo
      const [estRes, empRes] = await Promise.all([
        fetch(`${API_URL}/estudiantes/por-persona/${persona.Id_persona}`),
        fetch(`${API_URL}/empleados/por-persona/${persona.Id_persona}`),
      ]);

      if (estRes.ok) {
        const est = await estRes.json();
        roles.push("estudiante");
        accountNumbers.push({ role: "estudiante", number: est.NumeroCuenta || "" });
        centroUniversitario = est.CentroUniversitario || "";
      }

      if (empRes.ok) {
        const emp = await empRes.json();
        roles.push("empleado");
        accountNumbers.push({ role: "empleado", number: emp.NumeroEmpleado || "" });
      }

      // Si es interno
      if (roles.length > 0) {
        const sid = Math.random().toString(36).substring(2, 15);

        sessionStorage.setItem(
          `session_${sid}`,
          JSON.stringify({
            dni: dni.trim(),
            name: `${persona.Nombre} ${persona.Apellido}`,
            roles,
            accountNumbers,
            centroUniversitario,
            isActive: true,
            Id_persona: persona.Id_persona,
          })
        );

        router.push(`/autenticacion?sid=${sid}`);
        setIsLoading(false);
        return;
      }
    }

    //
    // 2️⃣ No existe → enviar a registro de visita
    //
    const newSid = Math.random().toString(36).substring(2, 15);

    sessionStorage.setItem(
      `session_${newSid}`,
      JSON.stringify({
        isNewVisitor: true,
      })
    );

    router.push(`/registro-visita?sid=${newSid}`);
  } catch (error) {
    console.error(error);
    setError("No se pudo conectar al servidor");
  }

  setIsLoading(false);
};


  /**
   * Función que determina si la universidad está abierta
   * Horario: 6:00 AM - 10:00 PM
   */
  const getUniversityHoursMessage = () => {
    const now = new Date()
    const hour = now.getHours()

    // Si es fuera del horario de apertura, mostrar mensaje
    if (hour < 6 || hour >= 22) {
      return "Nota: La universidad está cerrada en este momento (horario: 6:00 AM - 10:00 PM). Puedes registrar tu entrada para mañana."
    }
    return null // Dentro del horario de apertura
  }

  const hoursMessage = getUniversityHoursMessage() // Obtener el mensaje de horario

  // Renderizado del componente
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#003876] via-[#004494] to-[#003876]">
      {/* Header con branding UNAH */}
      <header className="bg-[#003876] border-b border-[#FFC107]/20 shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Ingreso UNAH</h1>
            <p className="text-sm text-[#FFC107]">Panel de escritorio</p>
          </div>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
            Inicio
          </Button>
        </div>
      </header>

      {/* Formulario principal de ingreso de DNI */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-8 md:p-12 bg-white shadow-2xl border-none">
          <div className="space-y-6">
            <div className="space-y-3 text-center">
              <h2 className="text-4xl font-bold text-[#003876]">Bienvenido</h2>
              <p className="text-lg text-gray-600">
                Escribe tu número de cuenta o número de empleado y presiona buscar.
              </p>
            </div>

            {/* Alerta de horario fuera de operación */}
            {hoursMessage && (
              <Alert className="border-[#FFC107] bg-[#FFC107]/10">
                <AlertCircle className="h-4 w-4 text-[#FFC107]" />
                <AlertDescription className="text-gray-700">{hoursMessage}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Número de cuenta o número de empleado"
                  value={dni}
                  onChange={handleInputChange}
                  className="h-14 text-lg bg-white border-2 border-gray-300 focus:border-[#003876] focus:ring-[#003876] text-gray-900 placeholder:text-gray-400"
                  disabled={isLoading}
                  autoFocus
                  tabIndex={1}
                />
                {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
                <p className="text-xs text-gray-500">Ejemplo: 20191001234 o EMP-001</p>
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold bg-[#FFC107] hover:bg-[#FFB300] text-[#003876] shadow-md"
                disabled={isLoading || !dni.trim()}
                tabIndex={2}
              >
                {isLoading ? "Buscando..." : "Buscar"}
              </Button>
            </form>
          </div>
        </Card>
      </div>

      {/* Footer institucional */}
      <footer className="bg-[#003876] border-t border-[#FFC107]/20 py-3">
        <div className="container mx-auto px-4">
          <p className="text-sm text-white text-center">© 2026 UNAH (demo). Backend en http://localhost:3000</p>
        </div>
      </footer>
    </div>
  )
}
