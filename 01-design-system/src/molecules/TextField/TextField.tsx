import { useId, type ReactNode } from 'react'
import { Input, type InputProps } from '../../atoms/Input/Input'
import { Text } from '../../atoms/Text/Text'
import styles from './TextField.module.scss'

export interface TextFieldProps extends InputProps {
  /** Always required: a placeholder is not a label (it disappears while typing). */
  label: ReactNode
  /** Helper text, always visible. */
  hint?: ReactNode
  /** Error message. When present the field is marked invalid. */
  error?: ReactNode
}

/**
 * Form field molecule: label + Input atom + hint + error. Hint and error are linked with
 * aria-describedby, so a screen reader reads them together with the label on focus.
 */
export function TextField({
  label,
  hint,
  error,
  id,
  className,
  required,
  'aria-describedby': describedByProp,
  ...rest
}: TextFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const describedBy = [describedByProp, hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            {' '}*
          </span>
        )}
      </label>
      <Input
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {hint && (
        <Text id={hintId} size="sm" tone="muted">
          {hint}
        </Text>
      )}
      {error && (
        <Text id={errorId} size="sm" tone="danger">
          {error}
        </Text>
      )}
    </div>
  )
}
