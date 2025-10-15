/**
 * ValidatedSelect - Atomic Component
 * Переиспользуемый select с встроенной валидацией
 * 
 * Architecture:
 * - Atomic Design: Molecule (Select + FormField)
 * - Composition pattern
 */

import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormField } from "@/components/ui/form-field"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: string
}

export interface ValidatedSelectProps {
  label: string
  error?: string
  value?: string
  onValueChange?: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export const ValidatedSelect = React.forwardRef<HTMLButtonElement, ValidatedSelectProps>(
  ({ label, error, value, onValueChange, options, placeholder, required, disabled, className }, ref) => {
    return (
      <FormField 
        label={required ? `${label} *` : label} 
        error={error}
      >
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
          <SelectTrigger 
            ref={ref}
            className={cn(error && 'border-red-500', className)}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    )
  }
)

ValidatedSelect.displayName = "ValidatedSelect"

