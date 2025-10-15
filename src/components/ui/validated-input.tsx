/**
 * ValidatedInput - Atomic Component
 * Переиспользуемый input с встроенной валидацией
 * 
 * Architecture:
 * - Atomic Design: Molecule (Input + FormField)
 * - Composition pattern
 * - Single Responsibility
 */

import * as React from "react"
import { Input, InputProps } from "@/components/ui/input"
import { FormField } from "@/components/ui/form-field"
import { cn } from "@/lib/utils"

export interface ValidatedInputProps extends Omit<InputProps, 'onChange'> {
  label: string
  error?: string
  onValueChange?: (value: string) => void
  required?: boolean
}

export const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ label, error, onValueChange, required, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange?.(e.target.value)
    }

    return (
      <FormField 
        label={required ? `${label} *` : label} 
        error={error}
      >
        <Input
          ref={ref}
          onChange={handleChange}
          className={cn(error && 'border-red-500', className)}
          {...props}
        />
      </FormField>
    )
  }
)

ValidatedInput.displayName = "ValidatedInput"

