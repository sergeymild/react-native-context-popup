import { ContextMenuTestProps } from './ContextMenuTest'

const captureBaseCase: ContextMenuTestProps = {
  mode: 'capture',
  description: 'Capture: базовый случай, topView и bottomView помещаются',
  topViewLines: 3,
  topViewLength: 26,
  menuLines: 8,
  menuLength: 28,
  start: (24),
  top: (120),
  width: (260),
  buttonHeight: 60,
}

const captureStatusBarCase: ContextMenuTestProps = {
  mode: 'capture',
  description: 'Capture: anchor под статус-баром, topView выходит за верх',
  topViewLines: 18,
  topViewLength: 28,
  menuLines: 14,
  menuLength: 30,
  start: (32),
  top: (12),
  width: (240),
  buttonHeight: 96,
}

const captureRightEdgeCase: ContextMenuTestProps = {
  mode: 'capture',
  description: 'Capture: широкий bottomView у правого края (hGravity=end)',
  topViewLines: 4,
  topViewLength: 24,
  menuLines: 12,
  menuLength: 40,
  end: (24),
  top: (180),
  width: (220),
  buttonHeight: 72,
}

const captureBottomOverflowCase: ContextMenuTestProps = {
  mode: 'capture',
  description:
    'Capture: anchor у нижнего края, bottomView выше viewport — включается скролл',
  topViewLines: 2,
  topViewLength: 20,
  menuLines: 34,
  menuLength: 26,
  start: (36),
  bottom: (40),
  width: (240),
  buttonHeight: 64,
}

const capturePinnedTopCase: ContextMenuTestProps = {
  mode: 'capture',
  description:
    'Capture: длинный topView закрепляется и не перекрывает bottomView',
  topViewLines: 28,
  topViewLength: 32,
  menuLines: 38,
  menuLength: 32,
  start: (120),
  top: (220),
  width: (260),
  buttonHeight: 80,
}

const captureNarrowBottomCase: ContextMenuTestProps = {
  mode: 'capture',
  description: 'Capture: без topView, узкий bottomView смещается к anchor',
  topViewLines: 0,
  topViewLength: 0,
  menuLines: 20,
  menuLength: 12,
  end: (32),
  top: (260),
  width: (200),
  buttonHeight: 56,
}

const captureWideTopNarrowCase: ContextMenuTestProps = {
  mode: 'capture',
  description:
    'Capture: широкий topView, узкий bottomView — проверяем расчёт hGravity=start',
  topViewLines: 6,
  topViewLength: 38,
  menuLines: 10,
  menuLength: 12,
  start: (64),
  top: (260),
  width: (240),
  buttonHeight: 72,
}

const captureMaxWidthCase: ContextMenuTestProps = {
  mode: 'capture',
  description: 'Capture: экстремально широкое меню, проверяем maxWidth',
  topViewLines: 6,
  topViewLength: 18,
  menuLines: 10,
  menuLength: 60,
  start: (60),
  top: (360),
  width: (320),
  buttonHeight: 72,
}

const captureLongTopCase: ContextMenuTestProps = {
  mode: 'capture',
  description: 'Capture: topView длиннее bottomView, но помещается без pin',
  topViewLines: 10,
  topViewLength: 36,
  menuLines: 8,
  menuLength: 16,
  end: (48),
  top: (420),
  width: (220),
  buttonHeight: 58,
}

const anchorTopLeftCase: ContextMenuTestProps = {
  mode: 'anchor',
  description:
    'Anchor: кнопка сверху слева, меню уходит вниз (vGravity=bottom)',
  start: (28),
  top: (64),
  width: (220),
  buttonHeight: 64,
  menuLines: 10,
  menuLength: 22,
}

const anchorBottomUpCase: ContextMenuTestProps = {
  mode: 'anchor',
  description: 'Anchor: кнопка у нижнего края, меню открывается вверх',
  start: (28),
  bottom: (48),
  width: (220),
  buttonHeight: 60,
  menuLines: 9,
  menuLength: 24,
}

const anchorRightEdgeCase: ContextMenuTestProps = {
  mode: 'anchor',
  description: 'Anchor: широкий bottomView у правого края (hGravity=end)',
  end: (28),
  top: (90),
  width: (220),
  buttonHeight: 60,
  menuLines: 12,
  menuLength: 40,
}

const anchorScrollCase: ContextMenuTestProps = {
  mode: 'anchor',
  description: 'Anchor: высокий список требует скролла без topView',
  start: (120),
  top: (180),
  width: (240),
  buttonHeight: 64,
  menuLines: 42,
  menuLength: 28,
}

const anchorNarrowCase: ContextMenuTestProps = {
  mode: 'anchor',
  description: 'Anchor: узкое содержимое выравнивается по start',
  start: (48),
  top: (320),
  width: (180),
  buttonHeight: 52,
  menuLines: 6,
  menuLength: 12,
}

const anchorCenterWideCase: ContextMenuTestProps = {
  mode: 'anchor',
  description:
    'Anchor: кнопка по центру и меню шире anchor — проверяем выбор hGravity',
  start: (100),
  top: (420),
  width: (280),
  buttonHeight: 80,
  menuLines: 14,
  menuLength: 34,
}

const anchorBottomRightOverflowCase: ContextMenuTestProps = {
  mode: 'anchor',
  description: 'Anchor: правый нижний угол, меню открывается вверх и влево',
  end: (32),
  bottom: (60),
  width: (220),
  buttonHeight: 66,
  menuLines: 24,
  menuLength: 30,
}

const anchorCrowdedTopCase: ContextMenuTestProps = {
  mode: 'anchor',
  description:
    'Anchor: недостаточно места сверху и снизу — меню уходит вверх с компенсирующим паддингом',
  start: (140),
  top: (360),
  width: (220),
  buttonHeight: 64,
  menuLines: 32,
  menuLength: 26,
}

const bigButtonSizeTopCase: ContextMenuTestProps = {
  mode: 'anchor',
  description:
    'Anchor: недостаточно места сверху и снизу — меню уходит вверх с компенсирующим паддингом',
  start: (140),
  top: (60),
  width: (220),
  buttonHeight: 764,
  menuLines: 32,
  menuLength: 26,
}

const bigButtonSizeBottomCase: ContextMenuTestProps = {
  mode: 'anchor',
  description:
    'Anchor: недостаточно места сверху и снизу — меню уходит вверх с компенсирующим паддингом',
  start: (140),
  top: (460),
  width: (220),
  buttonHeight: 764,
  menuLines: 32,
  menuLength: 26,
}

const longMenuBottomCase: ContextMenuTestProps = {
  mode: 'capture',
  description: 'Capture: Длинное меню, кнопка внизу (Anti Scroll)',
  topViewLines: 5,
  topViewLength: 10,
  start: (140),
  top: (460),
  width: (220),
  buttonHeight: 64,
  menuLines: 43,
  menuLength: 26,
}

const longMenuTopCase: ContextMenuTestProps = {
  mode: 'capture',
  description: 'Capture: Длинное меню, кнопка внизу (Anti Scroll)',
  topViewLines: 15,
  topViewLength: 10,
  start: (10),
  top: (160),
  width: (220),
  buttonHeight: 64,
  menuLines: 43,
  menuLength: 26,
}

const forceGravityCase: ContextMenuTestProps = {
  mode: 'capture',
  description: 'Capture: forceGravityCase',
  topViewLines: 15,
  topViewLength: 10,
  start: (80),
  forceHGravity: 'end',
  top: (160),
  width: (280),
  buttonHeight: 64,
  menuLines: 43,
  menuLength: 206,
}

const overflowBtnToLeftCase: ContextMenuTestProps = {
  mode: 'capture',
  description: 'Capture: overflowBtnToLeftCase',
  topViewLines: 15,
  topViewLength: 10,
  // start: (-180),
  // forceHGravity: 'end',
  // start: (280),
  // forceHGravity: 'start',
  top: (160),
  width: (280),
  buttonHeight: 64,
  menuLines: 13,
  menuLength: 30,
  // menuLength: 60,
}

export const CONTEXT_MENU_TEST_CASES: ContextMenuTestProps[][] = [
  [overflowBtnToLeftCase],
  [forceGravityCase],
  [longMenuBottomCase, longMenuTopCase],
  [bigButtonSizeTopCase],
  [bigButtonSizeBottomCase],
  [captureBaseCase, captureWideTopNarrowCase],
  [captureStatusBarCase, captureRightEdgeCase],
  [captureBottomOverflowCase, capturePinnedTopCase],
  [captureNarrowBottomCase, captureMaxWidthCase],
  [captureLongTopCase, anchorTopLeftCase],
  [anchorRightEdgeCase, anchorCrowdedTopCase],
  [anchorBottomUpCase, anchorScrollCase],
  [anchorNarrowCase, anchorCenterWideCase],
  [anchorBottomRightOverflowCase],
]
