import { useMemo } from 'react'
import { pixelTextDataUrl, type PixelImageOptions } from '../game/ui/pixelTextImage'

interface Props extends PixelImageOptions {
  text: string
  className?: string
}

/** Bitmap-font text for the DOM. See game/ui/pixelTextImage.ts for the why. */
export function PixelText({ text, scale, color, shadowColor, className }: Props) {
  const src = useMemo(
    () => pixelTextDataUrl(text, { scale, color, shadowColor }),
    [text, scale, color, shadowColor],
  )
  return (
    <img
      className={className ? `pixel-text ${className}` : 'pixel-text'}
      src={src}
      alt={text}
      draggable={false}
    />
  )
}
