"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { PhotoCapture } from "@/components/photo-capture"

//libreria api
import { API_URL } from "@/lib/api";


interface VehicleRegistrationProps {
  onBack: () => void
  onComplete: (vehicleData: any) => void
  dni: string
}

const MARCAS = [
  "Toyota",
  "Honda",
  "Nissan",
  "Mazda",
  "Hyundai",
  "Kia",
  "Ford",
  "Chevrolet",
  "Mitsubishi",
  "Suzuki",
  "Otro",
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

// Colores más comunes de vehículos
const COLORES = ["Blanco", "Negro", "Gris", "Plata", "Rojo", "Azul", "Verde", "Amarillo", "Naranja", "Café", "Otro"]

export function VehicleRegistration({ onBack, onComplete, dni }: VehicleRegistrationProps) {
  const [formData, setFormData] = useState({
    placa: "",
    marca: "",
    modelo: "",
    color: "",
    otraMarca: "",
    otroModelo: "", // Campo para modelo personalizado
    otroColor: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [placaValidation, setPlacaValidation] = useState<{ isValid: boolean; message: string } | null>(null)
  const [photoData, setPhotoData] = useState<string | null>(null)

  /**
   * Maneja el cambio en el input de placa
   * Formato hondureño: 3 letras + 4 números (ABC1234)
   * Valida en tiempo real para mejor UX
   */
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
        setPlacaValidation({ isValid: true, message: "✓ Formato de placa válido" })
      } else {
        setPlacaValidation({ isValid: false, message: "✗ Formato incorrecto" })
      }
    } else if (value.length > 0) {
      setPlacaValidation({ isValid: false, message: `Faltan ${7 - value.length} caracteres` })
    } else {
      setPlacaValidation(null)
    }
  }

  /**
   * Procesa el registro del vehículo
   * Validaciones:
   * - Formato de placa correcto
   * - Campos obligatorios completos
   * - Campos personalizados si se selecciona "Otro"
   */
 // 🚀 Reemplaza tu handleSubmit completo por este:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const placaRegex = /^[A-Z]{3}[0-9]{4}$/;
  if (!placaRegex.test(formData.placa)) {
    alert("La placa debe tener el formato ABC1234");
    return;
  }

  if (formData.marca === "Otro" && !formData.otraMarca.trim()) return alert("Especifique la marca");
  if (formData.modelo === "Otro" && !formData.otroModelo.trim()) return alert("Especifique el modelo");
  if (formData.color === "Otro" && !formData.otroColor.trim()) return alert("Especifique el color");

  setIsSubmitting(true);

  try {
    // 1) Obtener persona
    const personaRes = await fetch(`${API_URL}/personas/${dni}`);
    const personaData = await personaRes.json();
    const idPersona = personaData.Id_persona;

    // 2) Obtener marcas desde la BD
    const marcasRes = await fetch(`${API_URL}/referencias/marcas`);
    const marcasBD = await marcasRes.json();

    const marcaEncontrada = marcasBD.find(
      (m: any) => m.Marca?.toLowerCase() === formData.marca?.toLowerCase()

    );

    if (!marcaEncontrada) {
      alert("Marca no encontrada en BD");
      setIsSubmitting(false);
      return;
    }

    // 3) Obtener modelos por ID de marca
    const modelosRes = await fetch(`${API_URL}/referencias/modelos/${marcaEncontrada.Id_marca}`);
    const modelosBD = await modelosRes.json();

    const nombreModelo =
      formData.modelo === "Otro" ? formData.otroModelo : formData.modelo;

    const normalize = (str: string) =>
  str
    ?.toLowerCase()
    ?.trim()
    ?.normalize("NFD")
    ?.replace(/[\u0300-\u036f]/g, "") // quita acentos
    ?.replace(/[-–—]/g, "-");         // normaliza guiones

const modeloEncontrado = modelosBD.find(
  (m: any) => normalize(m.Modelo) === normalize(nombreModelo)
);


    if (!modeloEncontrado) {
      alert("Modelo no encontrado en BD");
      setIsSubmitting(false);
      return;
    }
console.log("🚀 ENVIANDO AL PADRE:", {
  placa: formData.placa,
  marca: formData.marca,
  modelo: formData.modelo,
  color: formData.color
});

    // 4) Registrar vehículo
    const vehiculoRes = await fetch(`${API_URL}/vehiculos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Id_modelo: modeloEncontrado.Id_modelo,
        Color: formData.color === "Otro" ? formData.otroColor : formData.color,
        Ano: new Date().getFullYear(),
        Matricula: formData.placa,
        Id_persona: idPersona,
      }),
    });

    if (!vehiculoRes.ok) {
      alert("Error registrando el vehículo");
      setIsSubmitting(false);
      return;
    }

    const vehiculoData = await vehiculoRes.json();
    onComplete({
  placa: formData.placa,
  marca: formData.marca === "Otro" ? formData.otraMarca : formData.marca,
  modelo: formData.modelo === "Otro" ? formData.otroModelo : formData.modelo,
  color: formData.color === "Otro" ? formData.otroColor : formData.color,
db: vehiculoData
});


  } catch (error) {
    console.error(error);
    // Si no hay backend, continuar con datos locales (modo demo)
    onComplete({
      placa: formData.placa,
      marca: formData.marca === "Otro" ? formData.otraMarca : formData.marca,
      modelo: formData.modelo === "Otro" ? formData.otroModelo : formData.modelo,
      color: formData.color === "Otro" ? formData.otroColor : formData.color,
      db: null,
    });
  }

  setIsSubmitting(false);
};

  const modelosDisponibles =
    formData.marca && formData.marca !== "Otro" ? [...MODELOS_POR_MARCA[formData.marca], "Otro"] : ["Otro"]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#003876] via-[#004494] to-[#003876]">
      {/* Header con navegación */}
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

      {/* Formulario de registro de vehículo */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-8 bg-white shadow-2xl border-none">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#003876]">Registrar Vehículo</h2>
              <p className="text-gray-600">Complete la información del vehículo para ingreso vehicular.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo de placa con validación visual */}
              <div className="space-y-2">
                <Label htmlFor="placa" className="text-[#003876] font-medium">
                  Placa <span className="text-red-600">*</span>
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
                  tabIndex={1}
                  className="bg-white border-gray-300 focus:border-[#003876] focus:ring-[#003876] font-mono text-lg"
                  disabled={isSubmitting}
                />
                {placaValidation && (
                  <p className={`text-xs font-medium ${placaValidation.isValid ? "text-green-600" : "text-amber-600"}`}>
                    {placaValidation.message}
                  </p>
                )}
                <p className="text-xs text-gray-500">Formato: 3 letras seguidas de 4 números (Ej: ABC1234)</p>
              </div>

              {/* Selector de marca */}
              <div className="space-y-2">
                <Label htmlFor="marca" className="text-[#003876] font-medium">
                  Marca <span className="text-red-600">*</span>
                </Label>
                <Select
                  value={formData.marca}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, marca: value, modelo: "", otraMarca: "", otroModelo: "" }))
                  }
                  required
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    className="bg-white border-gray-300 focus:border-[#003876] focus:ring-[#003876]"
                    tabIndex={2}
                  >
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
                    Especifique la marca <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="otraMarca"
                    name="otraMarca"
                    type="text"
                    value={formData.otraMarca}
                    onChange={(e) => setFormData((prev) => ({ ...prev, otraMarca: e.target.value }))}
                    placeholder="Ingrese la marca del vehículo"
                    required
                    tabIndex={3}
                    className="bg-white border-gray-300 focus:border-[#003876] focus:ring-[#003876]"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {formData.marca && (
                <div className="space-y-2">
                  <Label htmlFor="modelo" className="text-[#003876] font-medium">
                    Modelo <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={formData.modelo}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, modelo: value, otroModelo: "" }))}
                    required
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      className="bg-white border-gray-300 focus:border-[#003876] focus:ring-[#003876]"
                      tabIndex={4}
                    >
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
                    Especifique el modelo <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="otroModelo"
                    name="otroModelo"
                    type="text"
                    value={formData.otroModelo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, otroModelo: e.target.value }))}
                    placeholder="Ingrese el modelo del vehículo"
                    required
                    tabIndex={5}
                    className="bg-white border-gray-300 focus:border-[#003876] focus:ring-[#003876]"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {/* Selector de color */}
              <div className="space-y-2">
                <Label htmlFor="color" className="text-[#003876] font-medium">
                  Color <span className="text-red-600">*</span>
                </Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, color: value, otroColor: "" }))}
                  required
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    className="bg-white border-gray-300 focus:border-[#003876] focus:ring-[#003876]"
                    tabIndex={6}
                  >
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

              {/* Campo personalizado para color */}
              {formData.color === "Otro" && (
                <div className="space-y-2">
                  <Label htmlFor="otroColor" className="text-[#003876] font-medium">
                    Especifique el color <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="otroColor"
                    name="otroColor"
                    type="text"
                    value={formData.otroColor}
                    onChange={(e) => setFormData((prev) => ({ ...prev, otroColor: e.target.value }))}
                    placeholder="Ingrese el color del vehículo"
                    required
                    tabIndex={7}
                    className="bg-white border-gray-300 focus:border-[#003876] focus:ring-[#003876]"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {/* Captura de foto para enrolamiento facial */}
              <div className="space-y-2 border-t pt-4">
                <h3 className="text-lg font-semibold text-[#003876]">Foto para enrolamiento facial</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Tome una foto de su rostro para el registro de ingreso facial a la universidad.
                </p>
                <PhotoCapture onPhotoCapture={(photo) => setPhotoData(photo)} existingPhoto={null} />
              </div>

              {/* Botón de registro con colores institucionales */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold bg-[#FFC107] hover:bg-[#FFB300] text-[#003876]"
                  disabled={isSubmitting || !photoData}
                  tabIndex={8}
                >
                  {isSubmitting ? "Registrando vehículo..." : "Registrar Vehículo"}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>

      {/* Footer institucional */}
      <footer className="bg-[#003876] border-t border-[#FFC107]/20 py-3">
        <p className="text-sm text-white text-center">© 2026 UNAH - Sistema de Control de Acceso</p>
      </footer>
    </div>
  )
}
