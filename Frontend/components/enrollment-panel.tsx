"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, CheckCircle, AlertCircle, UserCheck, Car, ChevronRight } from "lucide-react"
import { PhotoCapture } from "@/components/photo-capture"
import { API_URL } from "@/lib/api"

interface PersonaEncontrada {
  Id_persona: number
  Nombre: string
  Apellido: string
  tipo_usuario: string
  identificador: string
  ya_enrolado: boolean
}

interface Marca { Id_marca: number; Marca: string }
interface Modelo { Id_modelo: number; Modelo: string }

const COLORES = ["Blanco", "Negro", "Gris", "Plata", "Rojo", "Azul", "Verde", "Amarillo", "Naranja", "Café", "Otro"]

interface EnrollmentPanelProps {
  operadorNombre: string
  onBack: () => void
}

export function EnrollmentPanel({ operadorNombre, onBack }: EnrollmentPanelProps) {
  // — Búsqueda
  const [identificador, setIdentificador] = useState("")
  const [buscando, setBuscando] = useState(false)
  const [persona, setPersona] = useState<PersonaEncontrada | null>(null)
  const [errorBusqueda, setErrorBusqueda] = useState("")

  // — Enrolamiento facial
  const [photoData, setPhotoData] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [resultadoFace, setResultadoFace] = useState<"exito" | "error" | null>(null)
  const [mensajeFace, setMensajeFace] = useState("")

  // — Vehículo
  const [mostrarVehiculo, setMostrarVehiculo] = useState(false)
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [modelos, setModelos] = useState<Modelo[]>([])
  const [vehiculo, setVehiculo] = useState({ placa: "", idMarca: "", idModelo: "", color: "", otroColor: "" })
  const [placaValida, setPlacaValida] = useState<boolean | null>(null)
  const [enviandoVehiculo, setEnviandoVehiculo] = useState(false)
  const [resultadoVehiculo, setResultadoVehiculo] = useState<"exito" | "error" | null>(null)
  const [mensajeVehiculo, setMensajeVehiculo] = useState("")

  // Cargar marcas cuando se muestra la sección de vehículo
  useEffect(() => {
    if (!mostrarVehiculo || marcas.length > 0) return
    fetch(`${API_URL}/referencias/marcas`)
      .then((r) => r.json())
      .then(setMarcas)
      .catch(() => {})
  }, [mostrarVehiculo])

  // Cargar modelos cuando cambia la marca
  useEffect(() => {
    if (!vehiculo.idMarca) { setModelos([]); return }
    fetch(`${API_URL}/referencias/modelos/${vehiculo.idMarca}`)
      .then((r) => r.json())
      .then(setModelos)
      .catch(() => {})
    setVehiculo((v) => ({ ...v, idModelo: "" }))
  }, [vehiculo.idMarca])

  const buscarPersona = async () => {
    if (!identificador.trim()) return
    setBuscando(true)
    setErrorBusqueda("")
    setPersona(null)
    setPhotoData(null)
    setResultadoFace(null)
    setMostrarVehiculo(false)
    setResultadoVehiculo(null)

    try {
      const res = await fetch(`${API_URL}/enrolar/buscar/${identificador.trim()}`)
      if (res.ok) setPersona(await res.json())
      else setErrorBusqueda("No se encontró ningún estudiante o empleado con ese identificador")
    } catch {
      setErrorBusqueda("Error al conectar con el servidor")
    } finally {
      setBuscando(false)
    }
  }

  const enrolar = async () => {
    if (!persona || !photoData) return
    setEnviando(true)
    setResultadoFace(null)

    try {
      const res = await fetch(`${API_URL}/enrolar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identificador: persona.identificador, FotoBase64: photoData }),
      })
      const data = await res.json()
      if (res.ok) {
        setResultadoFace("exito")
        setMensajeFace(data.mensaje)
        setPersona((prev) => prev ? { ...prev, ya_enrolado: true } : prev)
      } else {
        setResultadoFace("error")
        setMensajeFace(data.detail || "Error al enrolar")
      }
    } catch {
      setResultadoFace("error")
      setMensajeFace("Error al conectar con el servidor")
    } finally {
      setEnviando(false)
    }
  }

  const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7)
    setVehiculo((prev) => ({ ...prev, placa: v }))
    setPlacaValida(v.length === 7 ? /^[A-Z]{3}[0-9]{4}$/.test(v) : null)
  }

  const registrarVehiculo = async () => {
    if (!persona || !vehiculo.placa || !vehiculo.idModelo || !vehiculo.color) return
    if (!placaValida) return
    const color = vehiculo.color === "Otro" ? vehiculo.otroColor : vehiculo.color
    if (!color.trim()) return

    setEnviandoVehiculo(true)
    setResultadoVehiculo(null)

    try {
      const res = await fetch(`${API_URL}/vehiculos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Id_persona: persona.Id_persona,
          Id_modelo: parseInt(vehiculo.idModelo),
          Matricula: vehiculo.placa,
          Color: color,
          Ano: new Date().getFullYear(),
        }),
      })
      if (res.ok) {
        setResultadoVehiculo("exito")
        setMensajeVehiculo(`Vehículo ${vehiculo.placa} registrado correctamente`)
      } else {
        const data = await res.json()
        setResultadoVehiculo("error")
        setMensajeVehiculo(data.detail || "Error al registrar vehículo")
      }
    } catch {
      setResultadoVehiculo("error")
      setMensajeVehiculo("Error al conectar con el servidor")
    } finally {
      setEnviandoVehiculo(false)
    }
  }

  const reiniciar = () => {
    setIdentificador(""); setPersona(null); setPhotoData(null)
    setResultadoFace(null); setMensajeFace(""); setErrorBusqueda("")
    setMostrarVehiculo(false); setResultadoVehiculo(null); setMensajeVehiculo("")
    setVehiculo({ placa: "", idMarca: "", idModelo: "", color: "", otroColor: "" })
    setPlacaValida(null)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F5]">
      <header className="bg-[#003876] shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">ENROLAMIENTO FACIAL</h1>
            <p className="text-sm text-[#FFC107]">Universidad Nacional Autónoma de Honduras</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white text-sm hidden sm:block">Operador: {operadorNombre}</span>
            <Button variant="ghost" size="sm" onClick={onBack} className="text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-8 max-w-2xl">

        {/* Paso 1: Buscar persona */}
        <Card className="p-6 mb-6 bg-white shadow border border-border">
          <h2 className="text-lg font-semibold text-[#003876] mb-4">1. Buscar estudiante o empleado</h2>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="identificador" className="text-sm text-gray-600 mb-1 block">
                Número de Cuenta o Número de Empleado
              </Label>
              <Input
                id="identificador"
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && buscarPersona()}
                placeholder="Ej: 20191001234 o EMP-001"
                className="font-mono"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={buscarPersona} disabled={buscando || !identificador.trim()} className="bg-[#003876] hover:bg-[#003876]/90 text-white">
                {buscando
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {errorBusqueda && (
            <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{errorBusqueda}
            </div>
          )}

          {persona && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-5 h-5 text-[#003876]" />
                <span className="font-semibold text-[#003876]">Persona encontrada</span>
                {persona.ya_enrolado && (
                  <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Ya enrolado</span>
                )}
              </div>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-500">Nombre:</span> <span className="font-medium">{persona.Nombre} {persona.Apellido}</span></p>
                <p><span className="text-gray-500">Tipo:</span> {persona.tipo_usuario}</p>
                <p><span className="text-gray-500">{persona.tipo_usuario === "Estudiante" ? "N° Cuenta:" : "N° Empleado:"}</span> <span className="font-mono">{persona.identificador}</span></p>
              </div>
            </div>
          )}
        </Card>

        {/* Paso 2: Captura de foto */}
        {persona && resultadoFace !== "exito" && (
          <Card className="p-6 mb-6 bg-white shadow border border-border">
            <h2 className="text-lg font-semibold text-[#003876] mb-1">2. Capturar foto de {persona.Nombre}</h2>
            <p className="text-sm text-gray-500 mb-4">Asegúrese de que el rostro esté bien iluminado, centrado y sin obstáculos.</p>
            <PhotoCapture onPhotoCapture={setPhotoData} />
          </Card>
        )}

        {persona && photoData && resultadoFace !== "exito" && (
          <Button onClick={enrolar} disabled={enviando} className="w-full h-12 text-base font-bold bg-[#FFC107] hover:bg-[#FFB300] text-[#003876] mb-6">
            {enviando ? "Enrolando..." : persona.ya_enrolado ? "Actualizar embedding facial" : "Enrolar persona"}
          </Button>
        )}

        {resultadoFace === "error" && (
          <Card className="p-4 mb-6 bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{mensajeFace}</p>
            </div>
          </Card>
        )}

        {/* Paso 3: Éxito enrolamiento + opción vehículo */}
        {resultadoFace === "exito" && (
          <Card className="p-6 mb-6 bg-green-50 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-800">{mensajeFace}</p>
                <p className="text-sm text-green-600">{persona?.Nombre} {persona?.Apellido} puede ingresar por reconocimiento facial.</p>
              </div>
            </div>
          </Card>
        )}

        {/* Paso 3: Registrar vehículo (opcional) */}
        {resultadoFace === "exito" && !mostrarVehiculo && resultadoVehiculo !== "exito" && (
          <div className="flex gap-3 mb-6">
            <Button onClick={() => setMostrarVehiculo(true)} className="flex-1 h-12 bg-[#003876] hover:bg-[#003876]/90 text-white">
              <Car className="w-5 h-5 mr-2" />
              Registrar vehículo
            </Button>
            <Button onClick={reiniciar} variant="outline" className="flex-1 h-12">
              Enrolar otra persona
            </Button>
          </div>
        )}

        {mostrarVehiculo && resultadoVehiculo !== "exito" && (
          <Card className="p-6 mb-6 bg-white shadow border border-border">
            <h2 className="text-lg font-semibold text-[#003876] mb-4">
              <Car className="w-5 h-5 inline mr-2" />
              Registrar vehículo de {persona?.Nombre}
            </h2>

            <div className="space-y-4">
              {/* Placa */}
              <div>
                <Label className="text-sm text-gray-600 mb-1 block">Placa *</Label>
                <Input
                  value={vehiculo.placa}
                  onChange={handlePlacaChange}
                  placeholder="ABC1234"
                  className="font-mono"
                  maxLength={7}
                />
                {vehiculo.placa.length > 0 && (
                  <p className={`text-xs mt-1 ${placaValida ? "text-green-600" : "text-amber-600"}`}>
                    {placaValida ? "✓ Formato válido" : vehiculo.placa.length === 7 ? "✗ Formato incorrecto (debe ser ABC1234)" : `Faltan ${7 - vehiculo.placa.length} caracteres`}
                  </p>
                )}
              </div>

              {/* Marca */}
              <div>
                <Label className="text-sm text-gray-600 mb-1 block">Marca *</Label>
                <Select value={vehiculo.idMarca} onValueChange={(v) => setVehiculo((prev) => ({ ...prev, idMarca: v, idModelo: "" }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccione una marca" /></SelectTrigger>
                  <SelectContent>
                    {marcas.map((m) => (
                      <SelectItem key={m.Id_marca} value={String(m.Id_marca)}>{m.Marca}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Modelo */}
              {vehiculo.idMarca && (
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">Modelo *</Label>
                  <Select value={vehiculo.idModelo} onValueChange={(v) => setVehiculo((prev) => ({ ...prev, idModelo: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccione un modelo" /></SelectTrigger>
                    <SelectContent>
                      {modelos.map((m) => (
                        <SelectItem key={m.Id_modelo} value={String(m.Id_modelo)}>{m.Modelo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Color */}
              <div>
                <Label className="text-sm text-gray-600 mb-1 block">Color *</Label>
                <Select value={vehiculo.color} onValueChange={(v) => setVehiculo((prev) => ({ ...prev, color: v, otroColor: "" }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccione un color" /></SelectTrigger>
                  <SelectContent>
                    {COLORES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {vehiculo.color === "Otro" && (
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">Especifique el color *</Label>
                  <Input
                    value={vehiculo.otroColor}
                    onChange={(e) => setVehiculo((prev) => ({ ...prev, otroColor: e.target.value }))}
                    placeholder="Color del vehículo"
                  />
                </div>
              )}

              {resultadoVehiculo === "error" && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{mensajeVehiculo}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={registrarVehiculo}
                  disabled={enviandoVehiculo || !placaValida || !vehiculo.idModelo || !vehiculo.color}
                  className="flex-1 bg-[#FFC107] hover:bg-[#FFB300] text-[#003876] font-bold"
                >
                  {enviandoVehiculo ? "Registrando..." : "Registrar vehículo"}
                </Button>
                <Button onClick={reiniciar} variant="outline" className="flex-1">
                  Omitir
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Vehículo registrado exitosamente */}
        {resultadoVehiculo === "exito" && (
          <Card className="p-6 mb-6 bg-green-50 border border-green-200 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-green-800">{mensajeVehiculo}</p>
            <p className="text-sm text-green-600 mt-1">Enrolamiento completo para {persona?.Nombre} {persona?.Apellido}.</p>
            <Button onClick={reiniciar} className="mt-4 bg-[#003876] hover:bg-[#003876]/90 text-white">
              Enrolar otra persona
            </Button>
          </Card>
        )}
      </div>

      <footer className="bg-[#003876] py-3">
        <p className="text-sm text-white text-center">© 2026 UNAH - Sistema de Control de Acceso</p>
      </footer>
    </div>
  )
}
