# react-native-context-popup

TypeScript-only, Fabric-ready context menu / popup for React Native. Renders a menu around an anchor element (a button or a tile), or clones the anchor as a "preview" (iOS-style long-press menu) and floats a `bottomView` / `topView` around it.

- No native modules of its own — uses [`react-native-view-shot`](https://github.com/gre/react-native-view-shot) for the preview snapshot and [`@react-native-community/blur`](https://github.com/Kureev/react-native-blur) for the iOS blur backdrop.
- Imperative API — `contextPopup.show({...})` / `contextPopup.hide()`.
- Two layout modes: `'anchor'` (menu next to the original element) and `'capture'` (preview + menu, screenshot-based).
- Configurable backdrop: blur, solid color, or a custom React node.

## Install

```sh
yarn add react-native-context-popup react-native-view-shot @react-native-community/blur
```

`@d11/react-native-fast-image` is used as an optional dependency on Android for sharper preview rendering. If it's not installed the library falls back to `<Image>`.

## Setup

Mount the provider once near the root, above any screen that may show the popup. Pass top / bottom safe-area insets so the menu lays out correctly:

```tsx
import { ContextMenuProvider } from 'react-native-context-popup'

export const App = () => (
  <SafeAreaProvider>
    <NavigationContainer>{/* ... */}</NavigationContainer>
    <ContextMenuProvider
      zIndex={1000}
      appTopInset={topInset}
      appBottomInset={bottomInset}
    />
  </SafeAreaProvider>
)
```

## Usage

### `layoutMode: 'anchor'` — menu next to a button

```tsx
import { useRef } from 'react'
import { Pressable, View } from 'react-native'
import { contextPopup } from 'react-native-context-popup'

const ref = useRef<View>(null)

<Pressable
  ref={ref}
  onPress={() => {
    contextPopup.show({
      layoutMode: 'anchor',
      anchor: ref,
      bottomView: <YourMenu onPick={(id) => contextPopup.hide()} />,
    })
  }}
>
  ...
</Pressable>
```

### `layoutMode: 'capture'` — iOS-style preview + menu

The library snapshots the anchor with `react-native-view-shot` and renders that bitmap as a floating "ghost" while the menu is open.

```tsx
contextPopup.show({
  layoutMode: 'capture',
  anchor: thumbRef,
  theme: 'dark',
  background: 'rgba(0, 0, 0, 0.30)',
  captureScale: 105 / 80, // grow 80×80 thumb to ~105×105
  bottomView: <YourMenu />,
})
```

#### `captureScale`

`number`, default `1`. Multiplier applied to the captured preview around the anchor's center.

- The `bottomView` (and `topView`, if set) is positioned relative to the **scaled** preview, so spacing stays correct.
- The bitmap captured by `view-shot` is at the original anchor resolution and is stretched to the scaled box. For a small bump like `1.3×` this is visually fine; for very large factors consider that the preview will look soft.

#### `background`

Controls the backdrop behind the preview:

| Value                              | Result                                                                |
| ---------------------------------- | --------------------------------------------------------------------- |
| `undefined` _(default for capture)_ | `'blur'` — `BlurView` on iOS, `rgba(0,0,0,0.8)`/`rgba(255,255,255,0.8)` fallback on Android (depends on `theme`) |
| `'blur'`                           | Same as above, explicit                                               |
| `string` (e.g. `'rgba(0,0,0,0.3)'`) | Solid color overlay                                                  |
| `React.ReactNode`                  | Your own backdrop view (rendered behind the preview)                  |

For `layoutMode: 'anchor'` the default is `'transparent'`.

## `ContextMenuParams` reference

Common props (both modes):

| Prop               | Type                                           | Description                                                            |
| ------------------ | ---------------------------------------------- | ---------------------------------------------------------------------- |
| `anchor`           | `RefObject<View \| null>` or `MeasureRect`     | Element (or rect) the menu attaches to. `capture` mode requires a ref. |
| `theme`            | `'light' \| 'dark'`                            | Affects the blur fallback color. Default `'light'`.                    |
| `background`       | `'blur' \| string \| ReactNode \| undefined`   | See table above.                                                       |
| `gap`              | `number`                                       | Gap between anchor / preview and the menu. Default `4`.                |
| `zIndex`           | `number`                                       | Override the provider's `zIndex`.                                      |
| `topShift`         | `number`                                       | Add a vertical offset (use when the anchor is inside a `BottomSheet`). |
| `forceHGravity`    | `'start' \| 'end' \| 'center'`                 | Pin horizontal alignment.                                              |
| `forceHMargin`     | `number`                                       | Override horizontal margin (decouple from anchor x).                   |
| `forceTopInset`    | `number`                                       | Override top inset for this call.                                      |
| `forceBottomInset` | `number`                                       | Override bottom inset for this call.                                   |
| `autoHideTimeout`  | `number`                                       | Auto-dismiss after N ms. `0` / unset disables.                         |
| `useModal`         | `boolean`                                      | Default `true`. When `false`, renders as an absolute view inside the provider — avoids `Modal`'s layout recalculations. Intended for `'anchor'` mode. |
| `onHide`           | `() => void`                                   | Called when the menu starts to close.                                  |
| `topView`          | `ReactNode`                                    | Rendered above the anchor / preview.                                   |
| `bottomView`       | `ReactNode`                                    | Rendered below the anchor / preview.                                   |

`capture`-only props:

| Prop           | Type     | Description                                                |
| -------------- | -------- | ---------------------------------------------------------- |
| `captureScale` | `number` | Scale multiplier for the preview around its center. Default `1`. |

## API

```ts
import { contextPopup } from 'react-native-context-popup'

contextPopup.show(params: ContextMenuParams): Promise<void>
contextPopup.hide(): Promise<void>
```

`hide()` resolves after the dismiss animation completes.

## License

MIT
