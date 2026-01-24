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
      /** Контент, который будет отображаться под anchor */
      readonly bottomView: React.ReactNode
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
      readonly bottomView: React.ReactNode
    }
)

export type ContextMenuParamsInternal = Omit<
  ContextMenuParams,
  'anchor' | 'layoutMode'
> & {
  readonly rect: MeasureRect
} & (
    | {
        readonly layoutMode: 'anchor'
      }
    | {
        readonly layoutMode: 'capture'
        readonly preview: string
        readonly topView: React.ReactNode
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
    ...(layoutMode === 'anchor'
      ? { layoutMode }
      : {
          layoutMode,
          preview: await getPreview(),
          topView: params.topView,
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
    // isImportantContentInViewport: boolean
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
  // ------------------------ Satge 1 ------------------------------------
  // const translucent = IS_IOS || (params?.translucent ?? false)
  const paddingTop = params?.forceTopInset ?? contextMenuDimensions.appTopInset
  const paddingBottom = params?.forceBottomInset ?? contextMenuDimensions.appBottomInset

  const viewportWidth = contextMenuDimensions.viewportWidth
  const viewportHeight = contextMenuDimensions.viewportHeight

  const contentYPlatform = IS_IOS ? -paddingTop : 0
  const rectYPlatform = IS_IOS ? 0 : paddingTop
  // const platformY = -paddingTop
  let scrollEnabled = true

  const firstStageConteinerStyle: ViewStyle = {
    // Для первого измерения НЕ используем absolute, чтобы контент измерился корректно
    // Скрываем пока не измерим
    opacity: 0,
    maxWidth: SCREEN_WIDTH,
  }
  const firstStageTopViewStyle: ViewStyle = {
    // Для первого измерения НЕ используем absolute, чтобы контент измерился корректно
    // Скрываем пока не измерим
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
  // ------------------------ Satge 2 ------------------------------------
  const isCapture = params.layoutMode === 'capture'
  const rect = params.rect

  // Высота важного контента (меню + кнопка)
  const importantContentHeight = childrenRect.height + gap + rect.height
  // Если контент и кнопка помещается во viewport
  // const isImportantContentInViewport = viewportHeight > importantContentHeight
  // const layoutMode = params.layoutMode ?? 'anchor'
  const hasTopView = !!topViewRect
  let vGravity: 'top' | 'bottom' = 'top'
  let hGravity: 'start' | 'end' = 'start'
  let scrollY = 0
  const rectY = rect.y + contentYPlatform
  const rectX = rect.x
  const topViewHeight = topViewRect?.height ?? 0

  console.log(`🫢 children rect`, {
    params,
    childrenRect: childrenRect,
    layoutMode: params.layoutMode,
    // preview: params.layoutMode === 'capture' ? params.preview : undefined,
  })

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
      // Заполняется ниже
    },
    topViewPin: false,
    topViewStyle:
      isCapture && topViewRect
        ? {
            position: 'absolute',
            width: topViewRect.width,
            maxWidth: topViewRect.width,
            height: topViewRect.height,
            maxHeight: topViewRect.height,
            start: topViewRect.x,
            top: paddingTop + rectY - topViewRect.height - gap,
            // Будет меняться ниже
            // start - при вычислений start контейнера меню, на основе hGravity
            // top - после вычислений ghostViewStyle
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

  // Определяем hGravity
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

  // Вычисления зависящие от vGravity
  if (vGravity === 'bottom') {
    // vGravity: bottom
    /** marginTop от верха viewport до меню */
    let mt = rectY + rect.height + gap
    // Проверим, хватает ли места для topView
    // Поскольку vGravity Bottom, то mt должен быть больше 0
    if (
      // !isPinTopView &&
      !!topViewHeight &&
      topViewHeight + gap + rect.height + gap > mt
    ) {
      // Если места не хватает, то добавляем topViewHeight
      mt = topViewHeight + gap + rect.height + gap
    } else {
      // <- Anti Scroll ->
      // Если места хватает, то, если topView pinned, то уменьшаем mt,
      // чтобы не было лишнего  отскролла меню от pinned topView
      // (а то получится дыра при скроле)
      if (isPinTopView) {
        mt = topViewHeight + gap + rect.height + gap
      }
    }

    if (isCapture) {
      // Вычисляем scrollY так, чтобы контент был виден полностью,
      // но не уходил верхом за экран
      let scrl = 0

      // Если есть topView, то важно не только меню, но и topView.
      // А соответственно весь набор (topView + rect + childrenRect)
      console.log(`🫢 1`)
      if (hasTopView) {
        console.log(`🫢 2`)
        const viewPackHeight = isPinTopView
          ? childrenRect.height
          : topViewRect.height + gap + importantContentHeight

        // Если контент помещается во viewport, то скроллить не нужно
        if (viewportHeight > viewPackHeight) {
          console.log(`🫢 3`)
          // Но если с учетом mt не помещается, то скролим до низа меню
          if (mt + viewportHeight > viewPackHeight && !isPinTopView) {
            console.log(`🫢 4`)
            // Вычитая высоту topView если оно pinned, чтобы не ускроллится под него
            scrl =
              mt +
              viewPackHeight -
              viewportHeight -
              (isPinTopView ? topViewHeight : 0)
          }
        } else {
          console.log(`🫢 5`)
          // Скролим до верха меню
          scrl = mt - gap - rect.height - gap - topViewRect.height
        }
      } else {
        console.log(`🫢 6`)
        // Если контент помещается во viewport, то скроллить не нужно
        if (viewportHeight > childrenRect.height) {
          console.log(`🫢 7`)
          // Но если с учетом mt не помещается, то скролим до низа меню
          if (viewportHeight + mt > childrenRect.height && !isPinTopView) {
            console.log(`🫢 8`)
            // Вычитая высоту topView если оно pinned, чтобы не ускроллится под него
            scrl =
              mt +
              childrenRect.height -
              viewportHeight -
              (isPinTopView ? topViewHeight : 0)
          }
        } else {
          console.log(`🫢 9`)
          // Скролим до верха меню
          scrl = mt
        }
      }
      console.log(`🫢 10`, scrl)
      scrollY = scrl
    }

    result.containerStyle.marginTop = mt
    if (!isPinTopView) {
      // Здесь меняем для кейса, когда topView не помещается в viewport, но при том оно не pinned
      result.topViewStyle.top =
        paddingTop + mt - topViewHeight - gap - rect.height - gap
    }
  } else {
    // vGravity: top
    const mt = rectY - gap - childrenRect.height
    if (mt < 0) {
      /** Размер части меню, которую видно на экране,
       * когда часть его уехала за экран */
      const restMenuHeight = childrenRect.height + mt

      /** Осттояние от rectY до низа viewport
       * Прежде чем добавлять снизу подскролльный паддинг,
       * нужно сначала забить пространство fillBottomSpace
       */
      const fillBottomSpace = viewportHeight - restMenuHeight
      const scrollPadding = fillBottomSpace

      /** Теперь marginTop можно занулить, заполненный paddingBottom
       * сделает так, что все что съедет вниз,
       * на сколько съедет, на столько и будет скроллиться
       * вручную это считать не нужно
       */
      result.containerStyle.marginTop = 0
      // /** Скроллим на столько, сколько съезжает вниз */
      // scrollY = -mt
      /** Скроллить не надл, т.к. не нужно уводить верх за экран */
      scrollY = 0

      result.paddingBottom = paddingBottom + scrollPadding
    } else {
      result.containerStyle.marginTop = mt
    }
  }

  // Если важный контент помещается во viewport, то скролл включаем
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

  //console.log(`🫢 topViewRect`, topViewRect)

  // Вычисления зависящие от hGravity
  if (params.forceHGravity === 'center') {
    // hGravity: center - центрируем меню относительно anchor, не выходя за границы экрана
    const anchorCenterX = rectX + rect.width / 2
    // Вычисляем позицию меню, чтобы его центр совпадал с центром anchor
    let ms = anchorCenterX - childrenRect.width / 2
    // Ограничиваем, чтобы не выходило за левый край экрана
    ms = Math.max(0, ms)
    // Ограничиваем, чтобы не выходило за правый край экрана
    ms = Math.min(ms, viewportWidth - childrenRect.width)
    result.containerStyle.marginStart = ms
    if (isCapture && topViewRect) {
      // start margin для контейнера topView (также центрируем)
      let tms = anchorCenterX - topViewRect.width / 2
      tms = Math.max(0, tms)
      tms = Math.min(tms, viewportWidth - topViewRect.width)
      result.topViewStyle.marginStart = tms
    }
  } else if (hGravity === 'start') {
    // hGravity: start
    let vx = rectX
    if (params.forceHGravity && params.forceHMargin !== undefined) {
      vx = params.forceHMargin
    }
    // start margin для контейнера меню
    const ms = Math.min(vx, viewportWidth - childrenRect.width)
    result.containerStyle.marginStart = ms
    if (isCapture && topViewRect) {
      // start margin для контейнера topView
      const tms = Math.min(vx, viewportWidth - topViewRect.width)
      result.topViewStyle.marginStart = tms
    }
  } else {
    // hGravity: end
    let vx = rectX
    if (params.forceHGravity && params.forceHMargin !== undefined) {
      const dx =
        params.forceHMargin -
        (contextMenuDimensions.viewportWidth - rectX - rect.width)
      vx = Math.max(-params.forceHMargin, vx + -dx)
    }
    const ms = Math.max(0, vx + rect.width - childrenRect.width)
    result.containerStyle.marginStart = ms
    if (isCapture && topViewRect) {
      // start margin для контейнера topView
      const tms = Math.max(0, vx + rect.width - topViewRect.width)
      result.topViewStyle.marginStart = tms
    }
  }

  result.scrollEnabled = scrollEnabled
  result.topViewPin = isPinTopView
  // Preview будет с position: 'absolute', поэтому на нее не действуют padding'и контейнера
  // Поэтому мы добавляем их отдельно
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
        : 0 /* imposible */,
  }

  //console.log(`🫢 ghostViewStyle`, result.ghostViewStyle)
  //console.log(`🫢 topViewStyle`, result.topViewStyle)

  // ------------------------------------------------------------
  result.debug = {
    vGravity,
    hGravity,
    topSpace,
    bottomSpace,
    // isImportantContentInViewport,
  }
  result.scrollY = scrollY
  //console.log(`🫢 result`, result)
  //console.log(`🫢 debug`, result.debug)
  return result
}
