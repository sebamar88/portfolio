import type { HTMLAttributes } from 'react'
import styles from './Badge.module.scss'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'accent' | 'success' | 'danger'
  /** Small leading dot, e.g. for "Live". Decorative: hidden from screen readers. */
  dot?: boolean
}

export function Badge({ tone = 'neutral', dot = false, className, children, ...rest }: BadgeProps) {
  const classes = [styles.badge, styles[tone], className].filter(Boolean).join(' ')
  return (
    <span className={classes} {...rest}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  )
}
