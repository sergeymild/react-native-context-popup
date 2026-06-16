import { BlurView } from "@react-native-community/blur";
import React, {
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { GestureResponderEvent, ImageStyle } from "react-native";
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let FastImage: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  FastImage = require("@d11/react-native-fast-image").default;
} catch { /* optional dependency */ }

const PreviewImage = Platform.OS === "android" && FastImage
  ? ({ style, uri }: { style: ImageStyle; uri: string }) => (
      <FastImage
        style={style}
        source={{ uri }}
        resizeMode={FastImage.resizeMode.stretch}
      />
    )
  : ({ style, uri }: { style: ImageStyle; uri: string }) => (
      <Image
        style={style}
        source={{ uri }}
      />
    );

import type { ContextMenuParamsInternal, MeasuredData } from "./contextMenu";
import { matchContextMenuLayout } from "./contextMenu";
import { contextMenuDimensions } from "./helpers/Dimensions";
import { eventEmitter } from "./utils/eventEmitter";
import { measureInWindowSync } from "./utils/view.utils";

const CLEAR_PARAMS_TIMEOUT = 300;
const DEFAULT_GAP = 4;
const DEFAULT_ANCHOR_BACKGROUND_COLOR = "transparent";
const DEFAULT_CAPTURE_BACKGROUND_COLOR = "blur";

type ContextMunuEmitterEvents = {
  readonly renderContextMenu: ContextMenuParamsInternal;
  readonly hideContextMenu: (() => void) | undefined;
}

export const _contextMenuEmitter = eventEmitter<ContextMunuEmitterEvents>();
const _handledEvents = new WeakSet<ContextMenuParamsInternal>();

const BLOCK_BUBBLING_RESPONDER = (_event: GestureResponderEvent) => true;

interface ContextMenuProviderProps {
  readonly zIndex: number;

  readonly appTopInset: number;
  readonly appBottomInset: number;
}

export const ContextMenuProvider: React.FC<ContextMenuProviderProps> = memo(
  (props) => {
    const [params, setParams] = useState<ContextMenuParamsInternal | undefined>(
      undefined
    );
    const [measuredData, setMeasuredData] = useState<MeasuredData | undefined>(
      undefined
    );
    const [isVisible, setIsVisible] = useState(false);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
      undefined
    );
    const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
      undefined
    );
    const childrenContainerRef = useRef<View>(null);
    const topViewContainerRef = useRef<View>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const onHideRef = useRef<(() => void) | undefined>(undefined);
    const onDismissRef = useRef<(() => void) | undefined>(undefined);

    useEffect(() => {
      contextMenuDimensions.setInsets(props.appTopInset, props.appBottomInset);
    }, [props.appTopInset, props.appBottomInset]);

    useEffect(() => {
      const emitterShowCleaner = _contextMenuEmitter.on(
        "renderContextMenu",
        (p) => {
          if (_handledEvents.has(p)) return;
          _handledEvents.add(p);
          if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
          if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
          setMeasuredData(undefined);
          setParams(p);
          setIsVisible(true);
          onHideRef.current = p.onHide;

          // Устанавливаем таймер автоскрытия если передан
          if (p.autoHideTimeout && p.autoHideTimeout > 0) {
            autoHideTimerRef.current = setTimeout(() => {
              close();
            }, p.autoHideTimeout);
          }
        }
      );
      const emitterHideCleaner = _contextMenuEmitter.on(
        "hideContextMenu",
        (onDone) => close(onDone),
      );
      return () => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
        emitterShowCleaner();
        emitterHideCleaner();
      };
    }, []);

    const close = (onDone?: () => void) => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      setIsVisible(false);
      onHideRef.current?.();
      onHideRef.current = undefined;
      // When not using Modal there is no dismiss animation, resolve immediately.
      if (params?.useModal === false) {
        onDone?.();
      } else {
        onDismissRef.current = onDone;
      }
      closeTimerRef.current = setTimeout(() => {
        setParams(undefined);
        setMeasuredData(undefined);
        // Android does not fire onDismiss on Modal, so resolve the Promise here.
        if (Platform.OS === "android") {
          onDismissRef.current?.();
          onDismissRef.current = undefined;
        }
      }, CLEAR_PARAMS_TIMEOUT);
    };

    const handleModalDismiss = () => {
      onDismissRef.current?.();
      onDismissRef.current = undefined;
    };

    const zIndex = params?.zIndex ?? props.zIndex ?? 1000;

    const layout = matchContextMenuLayout(
      params,
      measuredData,
      params?.gap ?? DEFAULT_GAP
    );

    useLayoutEffect(() => {
      if (!params) return;
      if (!childrenContainerRef.current && !topViewContainerRef.current) return;

      if (measuredData) {
        if (layout.final && layout.scrollY > 0) {
          const rafId = requestAnimationFrame(() => {
            scrollViewRef.current?.scrollTo({
              y: layout.scrollY,
              animated: layout.animatedScroll,
            });
          });
          return () => cancelAnimationFrame(rafId);
        }
      } else {
        // In RN New Architecture (Fabric), useLayoutEffect fires before the
        // native layout pass completes for newly-created Modal views, so
        // measureInWindowSync returns zeros. Defer by one frame to let Fabric
        // finish layout before measuring.
        const rafId = requestAnimationFrame(() => {
          const menuRect = measureInWindowSync(childrenContainerRef);
          const topViewRect = measureInWindowSync(topViewContainerRef);
          if (menuRect || topViewRect) {
            setMeasuredData({
              childrenContainerRect: menuRect ?? { x: 0, y: 0, width: 0, height: 0 },
              topViewRect,
            });
          }
        });
        return () => cancelAnimationFrame(rafId);
      }
    // layout intentionally excluded: it creates a new object every render and
    // would cancel the RAF before it fires. layout.final/scrollY are read
    // inside the callback where they are always current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params, measuredData]);

    const _topMenu = !!params &&
      !!params.topView && (
        <View
          ref={topViewContainerRef}
          style={layout.topViewStyle}
          collapsable={false}
          onStartShouldSetResponder={BLOCK_BUBBLING_RESPONDER}
          children={params.topView}
        />
      );
    const topView = !!_topMenu && (
      <>
        {!layout.final && (
          <View style={styles.measureContainer}>{_topMenu}</View>
        )}
        {layout.final && _topMenu}
      </>
    );

    const background =
      params?.background ??
      (params?.layoutMode === "capture"
        ? DEFAULT_CAPTURE_BACKGROUND_COLOR
        : DEFAULT_ANCHOR_BACKGROUND_COLOR);

    const overlayContent = (
      <TouchableOpacity
        style={{
          ...styles.base,
          zIndex,
          backgroundColor:
            typeof background === "string" && background !== "blur"
              ? background
              : undefined,
        }}
        activeOpacity={1}
        onPress={() => close()}>
        {/* Background type Blur */}
        {typeof background === "string" && background === "blur" && (
          Platform.OS === "android" ? (
            <View
              style={[
                styles.background,
                {
                  backgroundColor:
                    (params?.theme ?? "light") === "dark"
                      ? "rgba(0,0,0,0.8)"
                      : "rgba(255,255,255,0.8)",
                },
              ]}
            />
          ) : (
            <BlurView
              style={styles.background}
              blurAmount={20}
              blurType={params?.theme ?? "light"}
              reducedTransparencyFallbackColor="transparent"
            />
          )
        )}
        {/* Background type View */}
        {typeof background !== "string" && (
          <View style={styles.background} children={background} />
        )}

        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          scrollEnabled={layout.scrollEnabled}
          contentContainerStyle={{
            // Use absolute position on first render so content is measured correctly
            ...(layout.final
              ? {
                  position: "relative",
                }
              : {
                  position: "absolute",
                  width: contextMenuDimensions.screenWidth,
                  alignItems: "flex-start",
                }),
            paddingTop: layout.paddingTop,
            paddingBottom: layout.paddingBottom,
          }}>
          {!!params && (
            <>
              {!layout.topViewPin && topView}
              {!!params.bottomView && (
                <View
                  ref={childrenContainerRef}
                  style={layout.containerStyle}
                  collapsable={false}
                  onStartShouldSetResponder={BLOCK_BUBBLING_RESPONDER}
                  children={params.bottomView}
                />
              )}
            </>
          )}
          {layout.final &&
          params?.layoutMode === "capture" &&
          !!params.preview ? (
            <View
              style={layout.ghostViewStyle}
              onStartShouldSetResponder={BLOCK_BUBBLING_RESPONDER}>
              <PreviewImage
                style={styles.preview}
                uri={params.preview}
              />
            </View>
          ) : null}
        </ScrollView>
        {!!layout.topViewPin && topView}
      </TouchableOpacity>
    );

    if (params?.useModal === false) {
      // Render as a plain absolute View to avoid Modal-induced layout recalculations
      if (!isVisible) return null;
      return overlayContent;
    }

    return (
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        presentationStyle="overFullScreen"
        onRequestClose={() => close()}
        onDismiss={handleModalDismiss}>
        {overlayContent}
      </Modal>
    );
  }
);
ContextMenuProvider.displayName = "ContextMenuProvider";

const styles = StyleSheet.create({
  base: {
    position: "absolute",
    top: 0,
    start: 0,
    end: 0,
    bottom: 0,
  },
  background: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  measureContainer: {
    position: "absolute",
  },
});
