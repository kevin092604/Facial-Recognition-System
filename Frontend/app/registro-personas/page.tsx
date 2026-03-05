"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, AlertCircle, UserPlus, GraduationCap, Briefcase } from "lucide-react"
import { API_URL } from "@/lib/api"

type TipoUsuario = "estudiante" | "empleado"
type Estado = "formulario" | "exito" | "error"

export default function RegistroPersonasPage() {
  const [tipo, setTipo] = useState<TipoUsuario>("estudiante")

  // Campos persona
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
const [telefono, setTelefono] = useState("")
  const [password, setPassword] = useState("")

  // Campos específicos
  const [numeroCuenta, setNumeroCuenta] = useState("")
  const [numeroEmpleado, setNumeroEmpleado] = useState("")

  const [enviando, setEnviando] = useState(false)
  const [estado, setEstado] = useState<Estado>("formulario")
  const [mensaje, setMensaje] = useState("")
  const [errores, setErrores] = useState<Record<string, string>>({})

  const validar = () => {
    const e: Record<string, string> = {}
    if (!nombre.trim()) e.nombre = "Requerido"
    if (!apellido.trim()) e.apellido = "Requerido"
    if (tipo === "empleado" && !password.trim()) e.password = "Requerido"
    if (tipo === "estudiante" && !numeroCuenta.trim()) e.numeroCuenta = "Requerido"
    if (tipo === "empleado" && !numeroEmpleado.trim()) e.numeroEmpleado = "Requerido"
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validar()) return

    setEnviando(true)
    setEstado("formulario")

    try {
      // 1. Crear persona
      const personaRes = await fetch(`${API_URL}/personas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Nombre: nombre.trim(),
          Apellido: apellido.trim(),
Telefono: telefono.trim() || null,
          Password: tipo === "empleado" ? password : null,
        }),
      })

      if (!personaRes.ok) {
        const data = await personaRes.json()
        setMensaje(data.detail || "Error al crear la persona")
        setEstado("error")
        return
      }

      const persona = await personaRes.json()

      // 2. Crear estudiante o empleado
      if (tipo === "estudiante") {
        const estRes = await fetch(`${API_URL}/estudiantes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Id_persona: persona.Id_persona,
            NumeroCuenta: numeroCuenta.trim(),
          }),
        })
        if (!estRes.ok) {
          const data = await estRes.json()
          setMensaje(data.detail || "Error al crear el estudiante")
          setEstado("error")
          return
        }
      } else {
        const empRes = await fetch(`${API_URL}/empleados`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Id_persona: persona.Id_persona,
            NumeroEmpleado: numeroEmpleado.trim(),
          }),
        })
        if (!empRes.ok) {
          const data = await empRes.json()
          setMensaje(data.detail || "Error al crear el empleado")
          setEstado("error")
          return
        }
      }

      setMensaje(
        tipo === "estudiante"
          ? `Estudiante ${nombre} ${apellido} registrado con cuenta ${numeroCuenta}`
          : `Empleado ${nombre} ${apellido} registrado con número ${numeroEmpleado}`
      )
      setEstado("exito")
    } catch {
      setMensaje("Error al conectar con el servidor")
      setEstado("error")
    } finally {
      setEnviando(false)
    }
  }

  const reiniciar = () => {
    setNombre(""); setApellido("")
    setTelefono(""); setPassword(""); setNumeroCuenta("")
    setNumeroEmpleado("")
    setEstado("formulario"); setMensaje(""); setErrores({})
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-white">UNAH</h1>
        <p className="text-gray-400 mt-1">Registro de Personas</p>
      </div>

      <Card className="w-full max-w-lg bg-gray-900 border-gray-800 p-6">

        {estado === "exito" ? (
          <div className="text-center py-6">
            <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-4" />
            <p className="text-white text-lg font-semibold">{mensaje}</p>
            <p className="text-gray-400 text-sm mt-2">
              Ya puede ser enrolado en el sistema de reconocimiento facial.
            </p>
            <Button onClick={reiniciar} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              Registrar otra persona
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Tipo de usuario */}
            <div>
              <Label className="text-gray-300 mb-2 block">Tipo de usuario</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTipo("estudiante")}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                    tipo === "estudiante"
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  <GraduationCap className="w-5 h-5" />
                  Estudiante
                </button>
                <button
                  type="button"
                  onClick={() => setTipo("empleado")}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                    tipo === "empleado"
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  <Briefcase className="w-5 h-5" />
                  Empleado
                </button>
              </div>
            </div>

            {/* Datos personales */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-sm mb-1 block">Nombre *</Label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  placeholder="Juan"
                />
                {errores.nombre && <p className="text-red-400 text-xs mt-1">{errores.nombre}</p>}
              </div>
              <div>
                <Label className="text-gray-300 text-sm mb-1 block">Apellido *</Label>
                <Input
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  placeholder="García"
                />
                {errores.apellido && <p className="text-red-400 text-xs mt-1">{errores.apellido}</p>}
              </div>
            </div>

            <div>
              <Label className="text-gray-300 text-sm mb-1 block">Teléfono</Label>
              <Input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                placeholder="9999-9999"
              />
            </div>

            {/* Campos específicos según tipo */}
            {tipo === "estudiante" ? (
              <div>
                <Label className="text-gray-300 text-sm mb-1 block">Número de Cuenta *</Label>
                <Input
                  value={numeroCuenta}
                  onChange={(e) => setNumeroCuenta(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 font-mono"
                  placeholder="20221003456"
                />
                {errores.numeroCuenta && <p className="text-red-400 text-xs mt-1">{errores.numeroCuenta}</p>}
              </div>
            ) : (
              <>
                <div>
                  <Label className="text-gray-300 text-sm mb-1 block">Número de Empleado *</Label>
                  <Input
                    value={numeroEmpleado}
                    onChange={(e) => setNumeroEmpleado(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 font-mono"
                    placeholder="EMP-003"
                  />
                  {errores.numeroEmpleado && <p className="text-red-400 text-xs mt-1">{errores.numeroEmpleado}</p>}
                </div>
                <div>
                  <Label className="text-gray-300 text-sm mb-1 block">Contraseña *</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                    placeholder="Contraseña de acceso"
                  />
                  {errores.password && <p className="text-red-400 text-xs mt-1">{errores.password}</p>}
                </div>
              </>
            )}

            {estado === "error" && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {mensaje}
              </div>
            )}

            <Button
              type="submit"
              disabled={enviando}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {enviando ? "Registrando..." : "Registrar persona"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}
