import { useState } from 'react';
import type { z } from 'zod';

export type FieldErrors<T> = {
  [K in keyof T]?: string;
};

export function useFormValidation<T extends z.ZodType>(schema: T) {
  type FormData = z.infer<T>;
  
  const [errors, setErrors] = useState<FieldErrors<FormData>>({});

  const validate = (data: FormData): boolean => {
    const result = schema.safeParse(data);
    
    if (!result.success) {
      const newErrors: FieldErrors<FormData> = {};
      result.error.errors.forEach((err) => {
        if (err.path.length > 0) {
          const field = err.path[0] as keyof FormData;
          newErrors[field] = err.message;
        }
      });
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const validateField = (field: keyof FormData, value: any): boolean => {
    try {
      // Create a partial schema for single field validation
      const fieldSchema = schema.pick({ [field]: true } as any);
      const result = fieldSchema.safeParse({ [field]: value });
      
      if (!result.success) {
        setErrors((prev) => ({
          ...prev,
          [field]: result.error.errors[0]?.message || 'Ошибка валидации',
        }));
        return false;
      }
      
      // Clear error for this field
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      return true;
    } catch (e) {
      // If pick doesn't work, just validate the whole thing
      const result = schema.safeParse({ [field]: value });
      return result.success;
    }
  };

  const clearError = (field: keyof FormData) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const clearAllErrors = () => {
    setErrors({});
  };

  return {
    errors,
    validate,
    validateField,
    clearError,
    clearAllErrors,
  };
}

