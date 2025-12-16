import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const IS_IOS = Platform.OS === 'ios'


class ContextMenuDimensions {
  private _appTopInset: number = 0;
  private _appBottomInset: number = 0;

  constructor() {
  }

  get isIOS() {
    return IS_IOS;
  }

  get appTopInset() {
    return this._appTopInset;
  }

  get appBottomInset() {
    return this._appBottomInset;
  }

  get screenWidth() {
    return SCREEN_WIDTH;
  }

  get screenHeight() {
    return SCREEN_HEIGHT;
  }

  setInsets = (paddingTop: number, paddingBottom: number) => {
    this._appTopInset = paddingTop;
    this._appBottomInset = paddingBottom;
  }

  get viewportWidth() {
    return this.screenWidth;
  }

  get viewportHeight() {
    return this.screenHeight - this.appTopInset - this.appBottomInset;
  }
}

export const contextMenuDimensions = new ContextMenuDimensions();
