"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { PhotoCapture } from "@/components/photo-capture"

//mi libreria de api
import { API_URL } from "@/lib/api";

// Marcas y modelos de vehículos
const MARCAS = [
  "Toyota", "Honda", "Nissan", "Mazda", "Hyundai",
  "Kia", "Ford", "Chevrolet", "Mitsubishi", "Suzuki", "Otro",
]

const MODELOS_POR_MARCA: Record<string, string[]> = {
  Toyota: ["Corolla", "Camry", "RAV4", "Hilux", "Prado", "Yaris", "4Runner", "Tacoma"],
  Honda: ["Civic", "Accord", "CR-V", "HR-V", "Pilot", "Fit", "Odyssey"],
  Nissan: ["Sentra", "Altima", "Versa", "Kicks", "X-Trail", "Frontier", "Pathfinder"],
  Mazda: ["Mazda3", "Mazda6", "CX-3", "CX-5", "CX-9", "BT-50"],
  Hyundai: ["Accent", "Elantra", "Tucson", "Santa Fe", "Creta", "Kona"],
  Kia: ["Rio", "Forte", "Sportage", "Sorento", "Seltos", "Soul"],
  Ford: ["Fiesta", "Focus", "Escape", "Explorer", "F-150", "Ranger", "Mustang"],
  Chevrolet: ["Spark", "Cruze", "Equinox", "Traverse", "Silverado", "Colorado"],
  Mitsubishi: ["Mirage", "Lancer", "Outlander", "Montero", "L200"],
  Suzuki: ["Swift", "Vitara", "Jimny", "Ertiga", "Ciaz"],
}

const COLORES = ["Blanco", "Negro", "Gris", "Plata", "Rojo", "Azul", "Verde", "Amarillo", "Naranja", "Café", "Otro"]

// Definición de las propiedades que recibe el componente
interface VisitorRegistrationProps {
  onBack: () => void
  onComplete: (visitorData: any) => void
  entryMethod?: "peatonal" | "vehicular" | null
}

export function VisitorRegistration({ onBack, onComplete, entryMethod }: VisitorRegistrationProps) {
  const isVehicular = entryMethod === "vehicular"

  // Estado que maneja los datos del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    tipoVisita: "",
    tipoVisitaOtro: "",
    motivo: "",
    // Campos de vehículo
    placa: "",
    marca: "",
    modelo: "",
    color: "",
    otraMarca: "",
    otroModelo: "",
    otroColor: "",
  })

  const [photoData, setPhotoData] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [placaValidation, setPlacaValidation] = useState<{ isValid: boolean; message: string } | null>(null)

  // Función que maneja los cambios en los campos de entrada del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Función que maneja los cambios en la selección de tipo de visita
  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, tipoVisita: value, tipoVisitaOtro: "" }))
  }

  // Función para capturar la foto del usuario
  const handlePhotoCapture = (photo: string) => {
    setPhotoData(photo)
  }

  // Manejo de placa con validación en tiempo real
  const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase()
    value = value.replace(/[^A-Z0-9]/g, "")

    if (value.length <= 3) {
      value = value.replace(/[^A-Z]/g, "")
    } else if (value.length <= 7) {
      const letters = value.slice(0, 3).replace(/[^A-Z]/g, "")
      const numbers = value.slice(3, 7).replace(/[^0-9]/g, "")
      value = letters + numbers
    } else {
      value = value.slice(0, 7)
    }

    setFormData((prev) => ({ ...prev, placa: value }))

    const placaRegex = /^[A-Z]{3}[0-9]{4}$/
    if (value.length === 7) {
      if (placaRegex.test(value)) {
        setPlacaValidation({ isValid: true, message: "Formato de placa válido" })
      } else {
        setPlacaValidation({ isValid: false, message: "Formato incorrecto" })
      }
    } else if (value.length > 0) {
      setPlacaValidation({ isValid: false, message: `Faltan ${7 - value.length} caracteres` })
    } else {
      setPlacaValidation(null)
    }
  }

  const modelosDisponibles =
    formData.marca && formData.marca !== "Otro" ? [...MODELOS_POR_MARCA[formData.marca], "Otro"] : ["Otro"]

  // Función que maneja el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones de visitante
    if (formData.tipoVisita === "otro" && !formData.tipoVisitaOtro.trim()) {
      alert("Por favor especifica el tipo de visita");
      return;
    }

    if (!photoData) {
      alert("Por favor tome una foto para el reconocimiento facial");
      return;
    }

    // Validaciones de vehículo (solo si es vehicular)
    if (isVehicular) {
      const placaRegex = /^[A-Z]{3}[0-9]{4}$/;
      if (!placaRegex.test(formData.placa)) {
        alert("La placa debe tener el formato ABC1234");
        return;
      }
      if (formData.marca === "Otro" && !formData.otraMarca.trim()) { alert("Especifique la marca"); return; }
      if (formData.modelo === "Otro" && !formData.otroModelo.trim()) { alert("Especifique el modelo"); return; }
      if (formData.color === "Otro" && !formData.otroColor.trim()) { alert("Especifique el color"); return; }
    }

    setIsSubmitting(true);

    const finalTipoVisita =
      formData.tipoVisita === "otro"
        ? formData.tipoVisitaOtro
        : formData.tipoVisita;

    try {
      // 1) Crear PERSONA
      const personaRes = await fetch(`${API_URL}/personas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Nombre: formData.nombre,
          Apellido: formData.apellido,
          Telefono: formData.telefono
        })
      });

      if (!personaRes.ok) {
        throw new Error("Error creando la persona");
      }

      const persona = await personaRes.json();

      // 2) Crear VISITA
      const visitaRes = await fetch(`${API_URL}/visitas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Id_persona: persona.Id_persona,
          TipoVisita: finalTipoVisita,
          Motivo: formData.motivo,
          Telefono: formData.telefono,
          FotoBase64: photoData
        })
      });

      if (!visitaRes.ok) {
        throw new Error("Error registrando la visita");
      }

      const visita = await visitaRes.json();

      // 3) Si es vehicular, registrar vehículo
      let vehiculoData = null;
      if (isVehicular) {
        const marcasRes = await fetch(`${API_URL}/referencias/marcas`);
        const marcasBD = await marcasRes.json();
        const marcaEncontrada = marcasBD.find(
          (m: any) => m.Marca?.toLowerCase() === formData.marca?.toLowerCase()
        );

        if (marcaEncontrada) {
          const modelosRes = await fetch(`${API_URL}/referencias/modelos/${marcaEncontrada.Id_marca}`);
          const modelosBD = await modelosRes.json();
          const nombreModelo = formData.modelo === "Otro" ? formData.otroModelo : formData.modelo;

          const normalize = (str: string) =>
            str?.toLowerCase()?.trim()?.normalize("NFD")?.replace(/[\u0300-\u036f]/g, "")?.replace(/[-\u2013\u2014]/g, "-");

          const modeloEncontrado = modelosBD.find(
            (m: any) => normalize(m.Modelo) === normalize(nombreModelo)
          );

          if (modeloEncontrado) {
            const vehiculoRes = await fetch(`${API_URL}/vehiculos`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                Id_modelo: modeloEncontrado.Id_modelo,
                Color: formData.color === "Otro" ? formData.otroColor : formData.color,
                Ano: new Date().getFullYear(),
                Matricula: formData.placa,
                Id_persona: persona.Id_persona,
              }),
            });
            if (vehiculoRes.ok) {
              vehiculoData = await vehiculoRes.json();
            }
          }
        }
      }

      onComplete({
        name: formData.nombre,
        apellido: formData.apellido,
        tipoVisita: finalTipoVisita,
        motivo: formData.motivo,
        telefono: formData.telefono,
        photoBase64: photoData,
        id_persona: persona.Id_persona,
        id_visita: visita.Id_visita ?? visita.id ?? null,
        ...(isVehicular && {
          placa: formData.placa,
          marca: formData.marca === "Otro" ? formData.otraMarca : formData.marca,
          modelo: formData.modelo === "Otro" ? formData.otroModelo : formData.modelo,
          color: formData.color === "Otro" ? formData.otroColor : formData.color,
          vehiculo_db: vehiculoData,
        }),
      });

    } catch (error) {
      console.error(error);
      // Si no hay backend, continuar con datos locales (modo demo)
      onComplete({
        name: formData.nombre,
        apellido: formData.apellido,
        tipoVisita: finalTipoVisita,
        motivo: formData.motivo,
        telefono: formData.telefono,
        photoBase64: photoData,
        id_persona: null,
        id_visita: null,
        ...(isVehicular && {
          placa: formData.placa,
          marca: formData.marca === "Otro" ? formData.otraMarca : formData.marca,
          modelo: formData.modelo === "Otro" ? formData.otroModelo : formData.modelo,
          color: formData.color === "Otro" ? formData.otroColor : formData.color,
          vehiculo_db: null,
        }),
      });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#003876] via-[#004494] to-[#003876]">
      <header className="bg-[#003876] border-b border-[#FFC107]/20 shadow-md">
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
        <Card className="w-full max-w-2xl p-8 bg-white shadow-2xl border-none">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#003876]">
                {isVehicular ? "Registro de Visita - Ingreso Vehicular" : "Registro de Visita"}
              </h2>
              <p className="text-gray-600">
                {isVehicular
                  ? "Complete el formulario con sus datos personales y del vehículo."
                  : "Complete el formulario para registrar su visita."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="text-[#003876] font-medium">
                    Nombre *
                  </Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    type="text"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="border-gray-300 focus:border-[#003876] focus:ring-[#003876]"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellido" className="text-[#003876] font-medium">
                    Apellido *
                  </Label>
                  <Input
                    id="apellido"
                    name="apellido"
                    type="text"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    required
                    className="border-gray-300 focus:border-[#003876] focus:ring-[#003876]"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <Label htmlFor="telefono" className="text-[#003876] font-medium">
                  Teléfono *
                </Label>
                <Input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  required
                  className="border-gray-300 focus:border-[#003876] focus:ring-[#003876]"
                  disabled={isSubmitting}
                />
              </div>

              {/* Selección del tipo de visita */}
              <div className="space-y-2">
                <Label htmlFor="tipoVisita" className="text-[#003876] font-medium">
                  Tipo de Visita *
                </Label>
                <Select value={formData.tipoVisita} onValueChange={handleSelectChange} disabled={isSubmitting}>
                  <SelectTrigger className="border-gray-300 focus:border-[#003876] focus:ring-[#003876]">
                    <SelectValue placeholder="Seleccione el tipo de visita" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proveedor">Proveedor</SelectItem>
                    <SelectItem value="paciente">Paciente (Clínica/Hospital)</SelectItem>
                    <SelectItem value="familiar">Familiar de estudiante</SelectItem>
                    <SelectItem value="consulta_administrativa">Consulta administrativa</SelectItem>
                    <SelectItem value="entrevista">Entrevista</SelectItem>
                    <SelectItem value="evento">Asistencia a evento</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.tipoVisita === "otro" && (
                <div className="space-y-2">
                  <Label htmlFor="tipoVisitaOtro" className="text-[#003876] font-medium">
                    Especifique el tipo de visita *
                  </Label>
                  <Input
                    id="tipoVisitaOtro"
                    name="tipoVisitaOtro"
                    type="text"
                    value={formData.tipoVisitaOtro}
                    onChange={handleInputChange}
                    required
                    className="border-gray-300 focus:border-[#003876] focus:ring-[#003876]"
                    placeholder="Describa el tipo de visita"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {/* Justificación o motivo de la visita */}
              <div className="space-y-2">
                <Label htmlFor="motivo" className="text-[#003876] font-medium">
                  Justificación / Motivo de la Visita *
                </Label>
                <Textarea
                  id="motivo"
                  name="motivo"
                  value={formData.motivo}
                  onChange={handleInputChange}
                  required
                  className="border-gray-300 focus:border-[#003876] focus:ring-[#003876] min-h-[100px]"
                  placeholder="Describe detalladamente el motivo de tu visita a la UNAH"
                  disabled={isSubmitting}
                />
              </div>

              {/* ===== SECCIÓN DE VEHÍCULO (solo si es vehicular) ===== */}
              {isVehicular && (
                <div className="border-t pt-4 space-y-4">
                  <h3 className="text-lg font-semibold text-[#003876]">Datos del Vehículo</h3>

                  {/* Placa */}
                  <div className="space-y-2">
                    <Label htmlFor="placa" className="text-[#003876] font-medium">
                      Placa *
                    </Label>
                    <Input
                      id="placa"
                      name="placa"
                      type="text"
                      value={formData.placa}
                      onChange={handlePlacaChange}
                      placeholder="ABC1234"
                      maxLength={7}
                      required
                      className="border-gray-300 focus:border-[#003876] focus:ring-[#003876] font-mono text-lg"
                      disabled={isSubmitting}
                    />
                    {placaValidation && (
                      <p className={`text-xs font-medium ${placaValidation.isValid ? "text-green-600" : "text-amber-600"}`}>
                        {placaValidation.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">Formato: 3 letras seguidas de 4 números (Ej: ABC1234)</p>
                  </div>

                  {/* Marca */}
                  <div className="space-y-2">
                    <Label htmlFor="marca" className="text-[#003876] font-medium">
                      Marca *
                    </Label>
                    <Select
                      value={formData.marca}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, marca: value, modelo: "", otraMarca: "", otroModelo: "" }))
                      }
                      required
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-[#003876] focus:ring-[#003876]">
                        <SelectValue placeholder="Seleccione la marca" />
                      </SelectTrigger>
                      <SelectContent>
                        {MARCAS.map((marca) => (
                          <SelectItem key={marca} value={marca}>
                            {marca}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.marca === "Otro" && (
                    <div className="space-y-2">
                      <Label htmlFor="otraMarca" className="text-[#003876] font-medium">
                        Especifique la marca *
                      </Label>
                      <Input
                        id="otraMarca"
                        name="otraMarca"
                        type="text"
                        value={formData.otraMarca}
                        onChange={handleInputChange}
                        placeholder="Ingrese la marca del vehículo"
                        required
                        className="border-gray-300 focus:border-[#003876] focus:ring-[#003876]"
                        disabled={isSubmitting}
                      />
                    </div>
                  )}

                  {/* Modelo */}
                  {formData.marca && (
                    <div className="space-y-2">
                      <Label htmlFor="modelo" className="text-[#003876] font-medium">
                        Modelo *
                      </Label>
                      <Select
                        value={formData.modelo}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, modelo: value, otroModelo: "" }))}
                        required
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-[#003876] focus:ring-[#003876]">
                          <SelectValue placeholder="Seleccione el modelo" />
                        </SelectTrigger>
                        <SelectContent>
                          {modelosDisponibles.map((modelo) => (
                            <SelectItem key={modelo} value={modelo}>
                              {modelo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">Modelos disponibles para {formData.marca}</p>
                    </div>
                  )}

                  {formData.modelo === "Otro" && (
                    <div className="space-y-2">
                      <Label htmlFor="otroModelo" className="text-[#003876] font-medium">
                        Especifique el modelo *
                      </Label>
                      <Input
                        id="otroModelo"
                        name="otroModelo"
                        type="text"
                        value={formData.otroModelo}
                        onChange={handleInputChange}
                        placeholder="Ingrese el modelo del vehículo"
                        required
                        className="border-gray-300 focus:border-[#003876] focus:ring-[#003876]"
                        disabled={isSubmitting}
                      />
                    </div>
                  )}

                  {/* Color */}
                  <div className="space-y-2">
                    <Label htmlFor="color" className="text-[#003876] font-medium">
                      Color *
                    </Label>
                    <Select
                      value={formData.color}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, color: value, otroColor: "" }))}
                      required
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-[#003876] focus:ring-[#003876]">
                        <SelectValue placeholder="Seleccione el color" />
                      </SelectTrigger>
                      <SelectContent>
                        {COLORES.map((color) => (
                          <SelectItem key={color} value={color}>
                            {color}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.color === "Otro" && (
                    <div className="space-y-2">
                      <Label htmlFor="otroColor" className="text-[#003876] font-medium">
                        Especifique el color *
                      </Label>
                      <Input
                        id="otroColor"
                        name="otroColor"
                        type="text"
                        value={formData.otroColor}
                        onChange={handleInputChange}
                        placeholder="Ingrese el color del vehículo"
                        required
                        className="border-gray-300 focus:border-[#003876] focus:ring-[#003876]"
                        disabled={isSubmitting}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Reconocimiento facial */}
              <div className="border-t pt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#003876]">Mi rostro (enrolamiento)</h3>
                  <p className="text-sm text-gray-600">
                    Permite ingresar por FACIAL en portones con lector facial. (Demo: guardamos la imagen como base64).
                  </p>
                  <PhotoCapture
                    onPhotoCapture={handlePhotoCapture}
                    existingPhoto={null}
                  />
                </div>
              </div>

              {/* Botón para completar el registro */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-bold bg-[#FFC107] hover:bg-[#FFB300] text-[#003876]"
                disabled={isSubmitting || !photoData}
              >
                {isSubmitting
                  ? "Registrando..."
                  : isVehicular
                    ? "Registrar Visita e Ingreso Vehicular"
                    : "Registrar Visita"}
              </Button>
            </form>
          </div>
        </Card>
      </div>

      <footer className="bg-[#003876] border-t border-[#FFC107]/20 py-3">
        <p className="text-sm text-white text-center">© 2026 UNAH - Sistema de Control de Acceso</p>
      </footer>
    </div>
  )
}
