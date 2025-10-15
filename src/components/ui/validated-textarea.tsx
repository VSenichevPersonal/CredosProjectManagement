/**
 * ValidatedTextarea - Atomic Component
 * Переиспользуемый textarea с встроенной валидацией
 * 
 * Architecture:
 * - Atomic Design: Molecule (Textarea + FormField)
 * - Composition pattern
 */

import * as React from "react"
import { Textarea, TextareaProps } from "@/components/ui/textarea"
import { FormField } from "@/components/ui/form-field"
import { cn } from "@/lib/utils"

export interface ValidatedTextareaProps extends Omit<TextareaProps, 'onChange'> {
  label: string
  error?: string
  onValueChange?: (value: string) => void
  required?: boolean
}

export const ValidatedTextarea = React.forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  ({ label, error, onValueChange, required, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onValueChange?.(e.target.value)
    }

    return (
      <FormField 
        label={required ? `${label} *` : label} 
        error={error}
      >
        <Textarea
          ref={ref}
          onChange={handleChange}
          className={cn(error && 'border-red-500', className)}
          {...props}
        />
      </FormField>
    )
  }
)

ValidatedTextarea.displayName = "ValidatedTextarea"

