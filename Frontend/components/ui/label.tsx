"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label" // Importa la librería de Radix UI para el componente de Label
import { cn } from "@/lib/utils" // Importa una función para concatenar clases

// Componente Label personalizado que utiliza el componente de Label de Radix UI
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref} // Pasa la referencia al componente Label de Radix
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", // Clases predeterminadas para el Label
      className, // Añade cualquier clase adicional que se pase como prop
    )}
    {...props} // Pasa cualquier otro prop que se pase al componente
  />
))

// Establece el nombre del componente para fines de depuración
Label.displayName = LabelPrimitive.Root.displayName

// Exporta el componente para que se pueda utilizar en otros lugares
export { Label }
