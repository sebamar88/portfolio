import type { HTMLAttributes } from 'react'
import styles from './Text.module.scss'

export type TextElement = 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
export type TextSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
export type TextTone = 'default' | 'muted' | 'accent' | 'success' | 'danger'
export type TextWeight = 'regular' | 'medium' | 'bold'

export interface TextProps extends HTMLAttributes<HTMLElement> {
  /** Semantic element: what assistive tech and document outline see. Default `p`. */
  as?: TextElement
  /** Visual size, independent of `as`. Defaults to a size that matches the element. */
  size?: TextSize
  tone?: TextTone
  weight?: TextWeight
}

const defaultSize: Record<TextElement, TextSize> = {
  h1: '3xl',
  h2: '2xl',
  h3: 'xl',
  h4: 'lg',
  h5: 'md',
  h6: 'md',
  p: 'md',
  span: 'md',
}

const isHeading = (as: TextElement) => as.startsWith('h')

/**
 * Typography atom. `as` picks the semantics (p, span, h1–h6); `size` picks the looks.
 * Keeping them separate means a heading level is chosen for document structure,
 * never because "h4 looked the right size".
 */
export function Text({ as: Tag = 'p', size, tone = 'default', weight, className, ...rest }: TextProps) {
  const classes = [
    styles.text,
    styles[`size-${size ?? defaultSize[Tag]}`],
    styles[`tone-${tone}`],
    styles[`weight-${weight ?? (isHeading(Tag) ? 'bold' : 'regular')}`],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <Tag className={classes} {...rest} />
}
