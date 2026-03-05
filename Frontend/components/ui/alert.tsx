import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority" // Importa la utilidad cva para manejar variaciones de clases

import { cn } from "@/lib/utils" // Importa una función para concatenar clases

// Variantes de clases para el componente de alerta
const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    // Define variantes para el tipo de alerta
    variants: {
      variant: {
        default: "bg-background text-foreground", // Estilo por defecto
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive", // Estilo destructivo (para errores o alertas críticas)
      },
    },
    defaultVariants: {
      variant: "default", // Define "default" como la variante predeterminada
    },
  },
)

// Componente de alerta, que utiliza las variantes definidas anteriormente
const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
))
Alert.displayName = "Alert" // Establece el nombre del componente para fines de depuración

// Componente para el título de la alerta
const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />
  ),
)
AlertTitle.displayName = "AlertTitle" // Establece el nombre del componente para fines de depuración

// Componente para la descripción de la alerta
const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
  ),
)
AlertDescription.displayName = "AlertDescription" // Establece el nombre del componente para fines de depuración

// Exporta los componentes para que se puedan utilizar en otros lugares
export { Alert, AlertTitle, AlertDescription }
