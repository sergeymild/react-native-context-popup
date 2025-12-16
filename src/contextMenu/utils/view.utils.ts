import { RefObject } from 'react'
import { NativeMethods, LayoutRectangle, View } from 'react-native'

// -------------------------

type AsyncMeasureResult =
  | (LayoutRectangle & { pageX: number; pageY: number })
  | undefined

export const asyncMeasure = async (
  viewRef: RefObject<{ measure: NativeMethods['measure'] }>,
) =>
  new Promise<AsyncMeasureResult>((resolve) => {
    if (!viewRef.current) return resolve(undefined)
    viewRef.current.measure((x, y, width, height, pageX, pageY) =>
      resolve({ x, y, width, height, pageX, pageY }),
    )
  })

// -------------------------

export type MeasureRect = {
  x: number
  y: number
  width: number
  height: number
}

/** For new arch onl */
export function measureSync<T extends View>(
  ref: React.RefObject<T | null>,
): MeasureRect | undefined {
  if (!ref.current) return undefined
  const result: MeasureRect = { x: 0, y: 0, width: 0, height: 0 }
  ref.current.measure((x, y, width, height) => {
    result.x = x
    result.y = y
    result.width = width
    result.height = height
  })
  return result
}

export function measureInWindowSync<T extends View>(
  ref: React.RefObject<T | null>,
): MeasureRect | undefined {
  if (!ref.current) return undefined
  const result: MeasureRect = { x: 0, y: 0, width: 0, height: 0 }
  ref.current.measureInWindow((x, y, width, height) => {
    result.x = x
    result.y = y
    result.width = width
    result.height = height
  })
  return result
}

// -------------------------
