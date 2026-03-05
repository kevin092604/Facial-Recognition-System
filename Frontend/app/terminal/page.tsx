"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Camera, CheckCircle, XCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { API_URL } from "@/lib/api"

type Estado = "espera" | "camara" | "procesando" | "autorizado" | "denegado"

interface PersonaResult {
  Nombre: string
  Apellido: string
  tipo_usuario: string
  identificador: string
  similitud: number
  ingreso_registrado: number
}

export default function TerminalPage() {
  const [estado, setEstado] = useState<Estado>("espera")
  const [resultado, setResultado] = useState<PersonaResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>("")

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const detenerCamara = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const iniciarCamara = useCallback(async () => {
    setEstado("camara")
    setResultado(null)
    setErrorMsg("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch {
      setEstado("espera")
      setErrorMsg("No se pudo acceder a la cámara")
    }
  }, [])

  const escanear = useCallback(async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const fotoBase64 = canvas.toDataURL("image/jpeg", 0.8)

    detenerCamara()
    setEstado("procesando")

    try {
      const res = await fetch(`${API_URL}/reconocer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ FotoBase64: fotoBase64, Tipo: "Peatonal" }),
      })

      if (res.ok) {
        const data = await res.json()
        setResultado({
          Nombre: data.persona.Nombre,
          Apellido: data.persona.Apellido,
          tipo_usuario: data.persona.tipo_usuario,
          identificador: data.persona.identificador,
          similitud: data.similitud,
          ingreso_registrado: data.ingreso_registrado,
        })
        setEstado("autorizado")
      } else {
        const data = await res.json()
        setErrorMsg(data.detail || "Acceso denegado")
        setEstado("denegado")
      }
    } catch {
      setErrorMsg("Error al conectar con el servidor")
      setEstado("denegado")
    }
  }, [detenerCamara])

  // Reiniciar automáticamente después de 5 segundos
  useEffect(() => {
    if (estado === "autorizado" || estado === "denegado") {
      const timer = setTimeout(() => {
        setEstado("espera")
        setResultado(null)
        setErrorMsg("")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [estado])

  useEffect(() => {
    return () => detenerCamara()
  }, [detenerCamara])

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">UNAH</h1>
        <p className="text-gray-400 mt-1">Control de Acceso — Terminal de Entrada</p>
      </div>

      {/* Panel principal */}
      <div className="w-full max-w-md bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">

        {/* Vista de cámara */}
        <div className="relative w-full aspect-[4/3] bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${estado === "camara" ? "block" : "hidden"}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {estado === "espera" && (
            <div className="text-center text-gray-500">
              <Camera className="w-20 h-20 mx-auto mb-3 opacity-40" />
              <p className="text-lg">Listo para escanear</p>
            </div>
          )}

          {estado === "procesando" && (
            <div className="text-center text-white">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-lg">Identificando...</p>
            </div>
          )}

          {estado === "autorizado" && resultado && (
            <div className="absolute inset-0 bg-green-900/90 flex flex-col items-center justify-center text-white p-6">
              <CheckCircle className="w-20 h-20 text-green-400 mb-4" />
              <p className="text-2xl font-bold">{resultado.Nombre} {resultado.Apellido}</p>
              <p className="text-green-300 mt-1">{resultado.tipo_usuario} · {resultado.identificador}</p>
              <p className="text-green-400 text-sm mt-2">Similitud: {(resultado.similitud * 100).toFixed(1)}%</p>
              <p className="text-green-200 text-xs mt-1">Ingreso #{resultado.ingreso_registrado} registrado</p>
            </div>
          )}

          {estado === "denegado" && (
            <div className="absolute inset-0 bg-red-900/90 flex flex-col items-center justify-center text-white p-6">
              <XCircle className="w-20 h-20 text-red-400 mb-4" />
              <p className="text-2xl font-bold">Acceso Denegado</p>
              <p className="text-red-300 text-sm mt-2 text-center">{errorMsg}</p>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="p-4 space-y-3">
          {estado === "espera" && (
            <Button
              onClick={iniciarCamara}
              className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Camera className="w-5 h-5 mr-2" />
              Activar cámara
            </Button>
          )}

          {estado === "camara" && (
            <Button
              onClick={escanear}
              className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 text-white"
            >
              Escanear rostro
            </Button>
          )}

          {(estado === "autorizado" || estado === "denegado") && (
            <div className="text-center text-gray-400 text-sm">
              <RotateCcw className="w-4 h-4 inline mr-1" />
              Reiniciando en 5 segundos...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
