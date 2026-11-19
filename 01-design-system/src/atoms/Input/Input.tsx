import type { ComponentProps, MouseEvent, ReactNode } from 'react'
import styles from './Input.module.scss'

// `prefix` exists on every HTML element (an RDFa string attribute); we repurpose it as an adornment.
export interface InputProps extends Omit<ComponentProps<'input'>, 'prefix'> {
  /** Visual adornment before the value, e.g. "$" or an icon. Hidden from screen readers. */
  prefix?: ReactNode
  /** Visual adornment after the value, e.g. "USD". Hidden from screen readers. */
  suffix?: ReactNode
}

/** Clicking anywhere in the box (e.g. on the "$") puts the cursor in the field. */
function focusInput(event: MouseEvent<HTMLDivElement>) {
  const input = event.currentTarget.querySelector('input')
  if (input && event.target !== input) {
    event.preventDefault() // keep focus from jumping to the wrapper first
    input.focus()
  }
}

/**
 * Bare text field with optional adornments. It has no label of its own: give it one with
 * `aria-label` or an external <label htmlFor>, or use the TextField molecule.
 *
 * Adornments are aria-hidden on purpose: "$ 1200 USD" read aloud adds noise, so the meaning
 * ("Amount in US dollars") belongs in the label or hint.
 */
export function Input({ prefix, suffix, className, ...rest }: InputProps) {
  return (
    <div className={[styles.control, className].filter(Boolean).join(' ')} onMouseDown={focusInput}>
      {prefix != null && (
        <span className={styles.adornment} aria-hidden="true">
          {prefix}
        </span>
      )}
      <input className={styles.input} {...rest} />
      {suffix != null && (
        <span className={styles.adornment} aria-hidden="true">
          {suffix}
        </span>
      )}
    </div>
  )
}
