"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera, X, AlertCircle } from "lucide-react"

// Definición de las propiedades que recibe el componente
interface PhotoCaptureProps {
  onPhotoCapture: (photo: string) => void // Función para capturar la foto
  existingPhoto?: string | null // Foto existente (si el usuario ya tiene una)
}

export function PhotoCapture({ onPhotoCapture, existingPhoto }: PhotoCaptureProps) {
  const [isCameraActive, setIsCameraActive] = useState(false) // Estado que indica si la cámara está activa
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null) // Estado que guarda la foto capturada
  const [error, setError] = useState<string | null>(null) // Estado para manejar errores
  const videoRef = useRef<HTMLVideoElement>(null) // Referencia al video que muestra la cámara
  const canvasRef = useRef<HTMLCanvasElement>(null) // Referencia al canvas para capturar la imagen
  const streamRef = useRef<MediaStream | null>(null) // Referencia a la transmisión de la cámara

  // Efecto para cargar la foto existente si la hay
  useEffect(() => {
    if (existingPhoto && !capturedPhoto) {
      setCapturedPhoto(existingPhoto)
    }
  }, [existingPhoto])

  // Efecto para ejecutar la función de captura de foto cuando se actualiza `capturedPhoto`
  useEffect(() => {
    if (capturedPhoto) {
      onPhotoCapture(capturedPhoto) // Llamar la función `onPhotoCapture` con la foto capturada
    }
  }, [capturedPhoto, onPhotoCapture])

  // Limpiar la cámara cuando el componente se desmonte
  useEffect(() => {
    return () => {

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop()) // Detener los tracks de la cámara
      }
    }
  }, [])

  // Función que inicia la cámara
  const startCamera = useCallback(async () => {

    setError(null) // Limpiar cualquier error previo

    try {
      // Solicitar acceso a la cámara
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }, // Cámara frontal
        audio: false,
      })


      streamRef.current = stream // Guardar el stream en la referencia

      if (videoRef.current) {
        videoRef.current.srcObject = stream // Asignar el stream al video

        // Esperar a que el video esté listo
        await videoRef.current.play()

        setIsCameraActive(true) // Cambiar el estado a activo cuando la cámara esté funcionando
      }
    } catch (err: any) {

      let errorMessage = "No se pudo acceder a la cámara."

      // Manejo de distintos tipos de errores relacionados con la cámara
      if (err.name === "NotAllowedError") {
        errorMessage = "Permisos de cámara denegados."
      } else if (err.name === "NotFoundError") {
        errorMessage = "No se encontró ninguna cámara."
      } else if (err.name === "NotReadableError") {
        errorMessage = "La cámara está en uso por otra aplicación."
      }

      setError(errorMessage) // Mostrar el mensaje de error
    }
  }, [])

  // Función que detiene la cámara
  const stopCamera = useCallback(() => {

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop()) // Detener los tracks de la cámara
      streamRef.current = null // Limpiar el stream
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null // Limpiar la fuente del video
    }
    setIsCameraActive(false) // Cambiar el estado a inactivo
  }, [])

  // Función que toma la foto usando el canvas
  const tomarFoto = useCallback(() => {

    const video = videoRef.current
    const canvas = canvasRef.current

    if (video && canvas) {
      canvas.width = video.videoWidth // Establecer el ancho del canvas igual al del video
      canvas.height = video.videoHeight // Establecer el alto del canvas igual al del video

      const context = canvas.getContext("2d") // Obtener el contexto del canvas
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height) // Dibujar la imagen del video en el canvas
        const photoData = canvas.toDataURL("image/jpeg", 0.8) // Convertir la imagen del canvas en un string base64


        setCapturedPhoto(photoData) // Guardar la foto capturada
        stopCamera() // Detener la cámara después de capturar la foto
      }
    }
  }, [])

  // Función que permite retomar la captura de la foto
  const retomar = useCallback(() => {

    setCapturedPhoto(null) // Limpiar la foto capturada
    startCamera() // Reiniciar la cámara
  }, [startCamera])

  return (
    <div className="space-y-4">
      {/* Mostrar el error si ocurre */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="text-sm">{error}</div>
        </div>
      )}

      <div className="relative w-full aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
        {/* Mensaje cuando la cámara está inactiva y no hay foto capturada */}
        {!isCameraActive && !capturedPhoto && (
          <div className="text-center p-8">
            <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400">Presiona "Activar cámara" para tomar tu foto</p>
          </div>
        )}

        {/* Video de la cámara, oculto cuando no está activo o ya se ha capturado la foto */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isCameraActive && !capturedPhoto ? "block" : "hidden"}`}
        />

        {/* Mostrar la foto capturada si existe */}
        {capturedPhoto && (
          <img src={capturedPhoto || "/placeholder.svg"} alt="Foto capturada" className="w-full h-full object-cover" />
        )}

        {/* Canvas oculto para capturar la imagen del video */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex gap-2">
        {/* Botones para activar la cámara, tomar la foto, o retomar */}
        {!isCameraActive && !capturedPhoto && (
          <Button onClick={startCamera} className="flex-1 bg-[#3B5998] hover:bg-[#3B5998]/90 text-white">
            <Camera className="w-4 h-4 mr-2" />
            Activar cámara
          </Button>
        )}

        {isCameraActive && !capturedPhoto && (
          <>
            <Button onClick={tomarFoto} className="flex-1 bg-[#3B5998] hover:bg-[#3B5998]/90 text-white">
              Tomar foto
            </Button>
            <Button onClick={stopCamera} variant="outline" className="flex-1 bg-transparent">
              Cancelar
            </Button>
          </>
        )}

        {capturedPhoto && (
          <Button onClick={retomar} variant="outline" className="flex-1 bg-transparent">
            <X className="w-4 h-4 mr-2" />
            Tomar otra foto
          </Button>
        )}
      </div>
    </div>
  )
}
