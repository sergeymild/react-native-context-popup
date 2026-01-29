import type { RefObject } from 'react'
import type { ViewStyle } from 'react-native'
import { Dimensions, Platform } from 'react-native'
import { captureRef } from 'react-native-view-shot'

import { _contextMenuEmitter } from './ContextMenuProvider'
import { contextMenuDimensions } from './helpers/Dimensions'
import { measureInWindowSync } from './utils/view.utils'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_IOS = Platform.OS === 'ios'

export type MeasureRect = {
  x: number
  y: number
  width: number
  height: number
}

export interface MeasuredData {
  readonly childrenContainerRect: MeasureRect
  readonly topViewRect: MeasureRect | undefined
}

export type ContextMenuAnchor = MeasureRect | RefObject<any>

export type ContextMenuParams = {
  /** Тип фона контекстного меню
   *  - 'blur' - используется BlurView для размытия фона
   *  - React.ReactNode - используется любое View в качестве фона
   *  - string - фоновый цвет
   *  - undefined - используется DEFAULT_BACKGROUND_COLOR для отображения фона
   * @default undefined
   */
  readonly background?: React.ReactNode | 'blur' | string | undefined
  /** Текущая тема приложения (light, dark)
   * @default 'light'
   */
  readonly theme?: 'light' | 'dark'
  /** Отступ контента от anchor
   * @default 4
   */
  readonly gap?: number
  /** Значение z-index для контекстного меню.
   * По умолчанию берется значение  переданное в props ContextMenuProvider
   * @default 1000 */
  readonly zIndex?: number
  /** Верхний отступ для контекстного меню
   * Для случая, когда anchor находится внутри BottomSheet
   * Нужно передать y BottomSheet
   */
  readonly topShift?: number
  /** Принудительно задать горизонтальное выравнивание */
  readonly forceHGravity?: 'start' | 'end' | 'center'
  /** Принудительно задать горизонтальный отступ
   * Меню не будет привязываться к положению кнопки
   */
  readonly forceHMargin?: number
  /** Переопределить верхний отступ
   * @default Берется тот, что задан через <ContextMenuProvider> props
   */
  readonly forceTopInset?: number
  /** Переопределить нижний отступ
   * @default Берется тот, что задан через <ContextMenuProvider> props
   */
  readonly forceBottomInset?: number
  /** Таймаут автоматического скрытия меню в миллисекундах.
   * Если не указан или 0, меню не скрывается автоматически.
   * Таймер очищается при ручном закрытии меню.
   */
  readonly autoHideTimeout?: number
  /** Колбэк, вызываемый при скрытии меню */
  readonly onHide?: () => void
} & (
  | {
      /** Элемент, относительно которого будет отображаться контекстное меню
       *  - если передан RefObject, то будет использован метод measureInWindowSync для измерения размеров элемента
       *  - если передан MeasureRect, то будет использован этот размер
       */
      readonly anchor: ContextMenuAnchor
      /** Режим отображения контекстного меню
       *  - 'anchor' - отображение bottomView около anchor */
      readonly layoutMode: 'anchor'
      /** Контент, который будет отображаться над anchor */
      readonly topView?: React.ReactNode | undefined
      /** Контент, который будет отображаться под anchor */
      readonly bottomView?: React.ReactNode | undefined
    }
  | {
      /** RefObject элемента, относительно которого будет отображаться контекстное меню
       *  будет использован метод measureInWindowSync для измерения размеров элемента
       *  будет использован метод capture для клонирования отображения anchor
       */
      readonly anchor: RefObject<any>
      /** Клонирование отображения anchor и отображение topView и bottomView вокруг него */
      readonly layoutMode: 'capture'
      /** Контент, который будет отображаться над anchor */
      readonly topView?: React.ReactNode | undefined
      /** Контент, который будет отображаться под anchor */
      readonly bottomView?: React.ReactNode | undefined
    }
)

export type ContextMenuParamsInternal = Omit<
  ContextMenuParams,
  'anchor' | 'layoutMode'
> & {
  readonly rect: MeasureRect
  readonly topView?: React.ReactNode
  readonly onHide?: () => void
} & (
    | {
        readonly layoutMode: 'anchor'
      }
    | {
        readonly layoutMode: 'capture'
        readonly preview: string
      }
  )

// type ItemPressed = { id: string; type: 'top' | 'bottom' }

export const contextPopup = {
  show: showContextMenu,
  hide: hideContextMenu,
}

function hideContextMenu() {
  _contextMenuEmitter.emit('hideContextMenu', undefined)
}

export async function showContextMenu(params: ContextMenuParams) {
  const { anchor, layoutMode, ...rest } = params

  const rect: MeasureRect | undefined =
    typeof anchor === 'object' && 'current' in anchor
      ? measureInWindowSync(anchor)
      : { ...anchor }

  if (!rect) return

  // Сдвиг для кейсов, когда anchor находится внутри BottomSheet
  if (params.topShift) {
    rect.y += params.topShift
  }

  const getPreview = (): Promise<string> => {
    if (layoutMode !== 'capture') return Promise.resolve('')
    return captureRef(anchor, {
      format: 'png',
      quality: 1,
      result: 'base64',
    })
  }

  const internalParams: ContextMenuParamsInternal = {
    ...rest,
    rect,
    topView: params.topView,
    ...(layoutMode === 'anchor'
      ? { layoutMode }
      : {
          layoutMode,
          preview: await getPreview(),
        }),
  }

  _contextMenuEmitter.emit('renderContextMenu', internalParams)
}

type MatchContextMenuLayoutResult = {
  containerStyle: ViewStyle
  topViewStyle: ViewStyle
  topViewPin: boolean
  paddingTop: number
  paddingBottom: number
  viewport: MeasureRect
  scrollY: number
  animatedScroll: boolean
  scrollEnabled: boolean
  debug?: {
    vGravity: 'top' | 'bottom'
    hGravity: 'start' | 'end'
    topSpace: number
    bottomSpace: number
  }
} & (
  | { final: false }
  | {
      final: true
      rect: MeasureRect
      ghostViewStyle: ViewStyle
    }
)

export function matchContextMenuLayout(
  params: ContextMenuParamsInternal | undefined,
  measuredData: MeasuredData | undefined,
  gap: number,
): MatchContextMenuLayoutResult {
  const paddingTop = params?.forceTopInset ?? contextMenuDimensions.appTopInset
  const paddingBottom = params?.forceBottomInset ?? contextMenuDimensions.appBottomInset

  const viewportWidth = contextMenuDimensions.viewportWidth
  const viewportHeight = contextMenuDimensions.viewportHeight

  const contentYPlatform = IS_IOS ? -paddingTop : 0
  const rectYPlatform = IS_IOS ? 0 : paddingTop
  let scrollEnabled = true

  const firstStageConteinerStyle: ViewStyle = {
    opacity: 0,
    maxWidth: SCREEN_WIDTH,
  }
  const firstStageTopViewStyle: ViewStyle = {
    opacity: 0,
    maxWidth: SCREEN_WIDTH,
  }
  let result: MatchContextMenuLayoutResult = {
    final: false,
    containerStyle: firstStageConteinerStyle,
    topViewStyle: firstStageTopViewStyle,
    topViewPin: false,
    paddingTop,
    paddingBottom,
    scrollY: 0,
    animatedScroll: false,
    scrollEnabled,
    viewport: { x: 0, y: 0, width: viewportWidth, height: viewportHeight },
  }

  if (!measuredData || !params) return result
  const childrenRect = measuredData.childrenContainerRect
  const topViewRect = measuredData.topViewRect
  const isCapture = params.layoutMode === 'capture'
  const rect = params.rect

  const importantContentHeight = childrenRect.height + gap + rect.height
  const hasTopView = !!topViewRect
  let vGravity: 'top' | 'bottom' = 'top'
  let hGravity: 'start' | 'end' = 'start'
  let scrollY = 0
  const rectY = rect.y + contentYPlatform
  const rectX = rect.x
  const topViewHeight = topViewRect?.height ?? 0

  result = {
    paddingTop,
    paddingBottom,
    viewport: { x: 0, y: 0, width: viewportWidth, height: viewportHeight },
    containerStyle: {
      width: childrenRect.width,
      minWidth: childrenRect.width,
      maxWidth: childrenRect.width,
      height: childrenRect.height,
      maxHeight: childrenRect.height,
      minHeight: childrenRect.height,
    },
    scrollY: 0,
    animatedScroll: isCapture,
    scrollEnabled,
    final: true,
    rect: { ...rect, x: rect.x, y: rect.y + rectYPlatform },
    ghostViewStyle: {
      display: 'none',
    },
    topViewPin: false,
    topViewStyle:
      topViewRect
        ? {
            position: 'absolute',
            width: topViewRect.width,
            maxWidth: topViewRect.width,
            height: topViewRect.height,
            maxHeight: topViewRect.height,
            top: paddingTop + rectY - topViewRect.height - gap,
          }
        : {
            display: 'none',
            position: 'absolute',
          },
  }

  const topSpace = rectY - gap
  const bottomSpace = viewportHeight - rectY - rect.height - gap

  if (isCapture) {
    vGravity = 'bottom'
  } else {
    if (bottomSpace > childrenRect.height) {
      vGravity = 'bottom'
    } else if (topSpace > childrenRect.height) {
      vGravity = 'top'
    } else {
      vGravity = topSpace > bottomSpace ? 'top' : 'bottom'
    }
  }

  const startSpace = rectX
  const endSpace = viewportWidth - rectX

  if (params.forceHGravity && params.forceHGravity !== 'center') {
    hGravity = params.forceHGravity
  } else if (!params.forceHGravity) {
    if (endSpace > childrenRect.width) {
      hGravity = 'start'
    } else if (startSpace > childrenRect.width) {
      hGravity = 'end'
    } else {
      hGravity = startSpace > endSpace ? 'end' : 'start'
    }
  }

  const isPinTopView =
    importantContentHeight + gap + topViewHeight > viewportHeight

  if (vGravity === 'bottom') {
    let mt = rectY + rect.height + gap
    if (
      !!topViewHeight &&
      topViewHeight + gap + rect.height + gap > mt
    ) {
      mt = topViewHeight + gap + rect.height + gap
    } else {
      if (isPinTopView) {
        mt = topViewHeight + gap + rect.height + gap
      }
    }

    if (isCapture) {
      let scrl = 0

      if (hasTopView) {
        const viewPackHeight = isPinTopView
          ? childrenRect.height
          : topViewRect.height + gap + importantContentHeight

        if (viewportHeight > viewPackHeight) {
          if (mt + viewportHeight > viewPackHeight && !isPinTopView) {
            scrl =
              mt +
              viewPackHeight -
              viewportHeight -
              (isPinTopView ? topViewHeight : 0)
          }
        } else {
          scrl = mt - gap - rect.height - gap - topViewRect.height
        }
      } else {
        if (viewportHeight > childrenRect.height) {
          if (viewportHeight + mt > childrenRect.height && !isPinTopView) {
            scrl =
              mt +
              childrenRect.height -
              viewportHeight -
              (isPinTopView ? topViewHeight : 0)
          }
        } else {
          scrl = mt
        }
      }
      scrollY = scrl
    }

    result.containerStyle.marginTop = mt
    if (!isPinTopView) {
      result.topViewStyle.top =
        paddingTop + mt - topViewHeight - gap - rect.height - gap
    }
  } else {
    const mt = rectY - gap - childrenRect.height
    if (mt < 0) {
      const restMenuHeight = childrenRect.height + mt
      const fillBottomSpace = viewportHeight - restMenuHeight

      result.containerStyle.marginTop = 0
      scrollY = 0

      result.paddingBottom = paddingBottom + fillBottomSpace

      if (topViewRect && !isPinTopView) {
        result.topViewStyle.top = paddingTop - topViewHeight - gap
      }
    } else {
      result.containerStyle.marginTop = mt

      if (topViewRect && !isPinTopView) {
        result.topViewStyle.top = paddingTop + mt - topViewHeight - gap
      }
    }
  }

  if (importantContentHeight + topViewHeight <= viewportHeight) {
    scrollEnabled = false
  }

  if (isPinTopView) {
    result.topViewStyle.top =
      topViewRect &&
      importantContentHeight + topViewRect.height <= viewportHeight
        ? SCREEN_HEIGHT -
          paddingBottom -
          importantContentHeight -
          gap -
          topViewRect.height
        : paddingTop
  }

  const hMargin = params.forceHMargin ?? 0

  if (params.forceHGravity === 'center') {
    const anchorCenterX = rectX + rect.width / 2
    let ms = anchorCenterX - childrenRect.width / 2
    ms = Math.max(hMargin, ms)
    ms = Math.min(ms, viewportWidth - childrenRect.width - hMargin)
    result.containerStyle.marginStart = ms
    if (topViewRect) {
      let tms = anchorCenterX - topViewRect.width / 2
      tms = Math.max(hMargin, tms)
      tms = Math.min(tms, viewportWidth - topViewRect.width - hMargin)
      result.topViewStyle.marginStart = tms
    }
  } else if (hGravity === 'start') {
    let vx = rectX
    if (params.forceHGravity && params.forceHMargin !== undefined) {
      vx = params.forceHMargin
    }
    const ms = Math.max(hMargin, Math.min(vx, viewportWidth - childrenRect.width - hMargin))
    result.containerStyle.marginStart = ms
    if (topViewRect) {
      const tms = Math.max(hMargin, Math.min(vx, viewportWidth - topViewRect.width - hMargin))
      result.topViewStyle.marginStart = tms
    }
  } else {
    let vx = rectX
    if (params.forceHGravity && params.forceHMargin !== undefined) {
      const dx =
        params.forceHMargin -
        (contextMenuDimensions.viewportWidth - rectX - rect.width)
      vx = Math.max(-params.forceHMargin, vx + -dx)
    }
    const ms = Math.max(hMargin, Math.min(vx + rect.width - childrenRect.width, viewportWidth - childrenRect.width - hMargin))
    result.containerStyle.marginStart = ms
    if (topViewRect) {
      const tms = Math.max(hMargin, Math.min(vx + rect.width - topViewRect.width, viewportWidth - topViewRect.width - hMargin))
      result.topViewStyle.marginStart = tms
    }
  }

  result.scrollEnabled = scrollEnabled
  result.topViewPin = isPinTopView
  result.ghostViewStyle = {
    position: 'absolute',
    width: rect.width,
    height: rect.height,
    start: rect.x,
    top:
      vGravity === 'bottom'
        ? paddingTop +
          Number(result.containerStyle.marginTop) -
          rect.height -
          gap
        : 0,
  }

  result.debug = {
    vGravity,
    hGravity,
    topSpace,
    bottomSpace,
  }
  result.scrollY = scrollY
  return result
}