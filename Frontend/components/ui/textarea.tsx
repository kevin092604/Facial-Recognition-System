import * as React from "react" // Importa React para utilizar JSX y hooks

import { cn } from "@/lib/utils" // Importa la función 'cn' que se usa para concatenar clases condicionalmente

// Componente Textarea personalizado utilizando React.forwardRef
const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className, // Aplica clases predeterminadas y las clases adicionales pasadas por prop
        )}
        ref={ref} // Pasa la referencia a la etiqueta textarea
        {...props} // Pasa el resto de props al textarea (como 'value', 'onChange', etc.)
      />
    )
  },
)
Textarea.displayName = "Textarea" // Establece el nombre del componente para facilitar la depuración en React

// Exporta el componente Textarea para que se pueda utilizar en otras partes de la aplicación
export { Textarea }
