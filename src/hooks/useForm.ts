/**
 * 表单处理Hook
 * 统一的表单状态管理和验证
 */

import { useState, useCallback } from 'react';
import { logger } from '@/utils/logger';

export interface FormField {
  value: any;
  error?: string;
  touched: boolean;
}

export interface FormFields {
  [key: string]: FormField;
}

export interface UseFormOptions {
  initialValues: { [key: string]: any };
  validate?: (values: { [key: string]: any }) => { [key: string]: string };
  onSubmit: (values: { [key: string]: any }) => Promise<void> | void;
}

export interface UseFormReturn {
  values: { [key: string]: any };
  errors: { [key: string]: string };
  touched: { [key: string]: boolean };
  handleChange: (field: string, value: any) => void;
  handleBlur: (field: string) => void;
  handleSubmit: () => Promise<void>;
  resetForm: () => void;
  setFieldValue: (field: string, value: any) => void;
  setFieldError: (field: string, error: string) => void;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

/**
 * 表单处理Hook
 */
export function useForm(options: UseFormOptions): UseFormReturn {
  const { initialValues, validate, onSubmit } = options;

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 处理字段变化
  const handleChange = useCallback((field: string, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    
    // 清除该字段的错误
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // 处理字段失焦
  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    // 验证该字段
    if (validate) {
      const validationErrors = validate(values);
      if (validationErrors[field]) {
        setErrors((prev) => ({ ...prev, [field]: validationErrors[field] }));
      }
    }
  }, [values, validate]);

  // 提交表单
  const handleSubmit = useCallback(async () => {
    // 验证所有字段
    if (validate) {
      const validationErrors = validate(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        // 标记所有字段为已触摸
        const allTouched = Object.keys(values).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {}
        );
        setTouched(allTouched);
        logger.warn('表单验证失败', validationErrors);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
      logger.info('表单提交成功');
    } catch (error: any) {
      logger.error('表单提交失败', error);
      // 设置表单级别的错误
      if (error.message) {
        setErrors({ form: error.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit]);

  // 重置表单
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    logger.info('表单已重置');
  }, [initialValues]);

  // 设置字段值
  const setFieldValue = useCallback((field: string, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  // 设置字段错误
  const setFieldError = useCallback((field: string, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  // 计算表单状态
  const isValid = Object.keys(errors).length === 0;
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    isSubmitting,
    isValid,
    isDirty,
  };
}

/**
 * 常用验证规则
 */
export const validators = {
  required: (message = '此字段必填') => (value: any) => {
    if (value === undefined || value === null || value === '') {
      return message;
    }
    return undefined;
  },

  email: (message = '邮箱格式不正确') => (value: string) => {
    if (!value) return undefined;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? undefined : message;
  },

  minLength: (min: number, message?: string) => (value: string) => {
    if (!value) return undefined;
    return value.length >= min
      ? undefined
      : message || `最少需要${min}个字符`;
  },

  maxLength: (max: number, message?: string) => (value: string) => {
    if (!value) return undefined;
    return value.length <= max
      ? undefined
      : message || `最多允许${max}个字符`;
  },

  pattern: (regex: RegExp, message: string) => (value: string) => {
    if (!value) return undefined;
    return regex.test(value) ? undefined : message;
  },

  url: (message = 'URL格式不正确') => (value: string) => {
    if (!value) return undefined;
    try {
      new URL(value);
      return undefined;
    } catch {
      return message;
    }
  },

  number: (message = '必须是数字') => (value: any) => {
    if (!value) return undefined;
    return !isNaN(Number(value)) ? undefined : message;
  },

  min: (min: number, message?: string) => (value: number) => {
    if (value === undefined || value === null) return undefined;
    return value >= min ? undefined : message || `最小值为${min}`;
  },

  max: (max: number, message?: string) => (value: number) => {
    if (value === undefined || value === null) return undefined;
    return value <= max ? undefined : message || `最大值为${max}`;
  },
};

/**
 * 组合多个验证器
 */
export function composeValidators(...validators: Function[]) {
  return (value: any) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) {
        return error;
      }
    }
    return undefined;
  };
}
