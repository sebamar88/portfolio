import { useState, type HTMLAttributes } from 'react'
import { getAvatarColorIndex, getInitials } from './avatarUtils'
import styles from './Avatar.module.scss'

const COLOR_COUNT = 6

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  /** Full name: source of the initials, the color and the accessible name. */
  name: string
  src?: string
  size?: 'sm' | 'md' | 'lg'
}

/** Photo when it loads; otherwise colored initials. Never shows a broken-image icon. */
export function Avatar({ name, src, size = 'md', className, ...rest }: AvatarProps) {
  // Track which src failed (not a boolean): a new src is retried automatically, no reset effect needed.
  const [failedSrc, setFailedSrc] = useState<string | undefined>()
  const showImage = Boolean(src) && failedSrc !== src

  if (showImage) {
    const classes = [styles.avatar, styles[size], className].filter(Boolean).join(' ')
    return (
      <span className={classes} {...rest}>
        <img className={styles.image} src={src} alt={name} onError={() => setFailedSrc(src)} />
      </span>
    )
  }

  const color = styles[`color${getAvatarColorIndex(name, COLOR_COUNT) + 1}`]
  const classes = [styles.avatar, styles[size], color, className].filter(Boolean).join(' ')
  return (
    // The wrapper carries the name; the letters are hidden so it reads "Ana López", not "A L".
    <span role="img" aria-label={name} className={classes} {...rest}>
      <span aria-hidden="true">{getInitials(name)}</span>
    </span>
  )
}
