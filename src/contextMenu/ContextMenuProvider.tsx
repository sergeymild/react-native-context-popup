import { BlurView } from "@react-native-community/blur";
import React, {
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  GestureResponderEvent,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import {
  ContextMenuParamsInternal,
  matchContextMenuLayout,
  MeasuredData,
} from "./contextMenu";
import { contextMenuDimensions } from "./helpers/Dimensions";
import { eventEmitter } from "./utils/eventEmitter";
import { measureInWindowSync } from "./utils/view.utils";

const CLEAR_PARAMS_TIMEOUT = 300;
const DEFAULT_GAP = 4;
const DEFAULT_ANCHOR_BACKGROUND_COLOR = "transparent";
const DEFAULT_CAPTURE_BACKGROUND_COLOR = "blur";

interface ContextMunuEmitterEvents {
  readonly renderContextMenu: ContextMenuParamsInternal;
  readonly hideContextMenu: undefined;
}

export const _contextMenuEmitter = eventEmitter<ContextMunuEmitterEvents>();

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
    const childrenContainerRef = useRef<View>(null);
    const topViewContainerRef = useRef<View>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
      contextMenuDimensions.setInsets(props.appTopInset, props.appBottomInset);
    }, [props.appTopInset, props.appBottomInset]);

    useEffect(() => {
      const emitterShowCleaner = _contextMenuEmitter.on(
        "renderContextMenu",
        (p) => {
          closeTimerRef.current && clearTimeout(closeTimerRef.current);
          setMeasuredData(undefined);
          setParams(p);
          setIsVisible(true);
        }
      );
      const emitterHideCleaner = _contextMenuEmitter.on(
        "hideContextMenu",
        () => close(),
      );
      return () => {
        closeTimerRef.current && clearTimeout(closeTimerRef.current);
        emitterShowCleaner();
        emitterHideCleaner();
      };
    }, []);

    const close = () => {
      console.log(`🫢 close`);
      closeTimerRef.current && clearTimeout(closeTimerRef.current);
      setIsVisible(false);
      closeTimerRef.current = setTimeout(() => {
        setParams(undefined);
        setMeasuredData(undefined);
      }, CLEAR_PARAMS_TIMEOUT);
    };

    const zIndex = params?.zIndex ?? props.zIndex ?? 1000;

    const layout = matchContextMenuLayout(
      params,
      measuredData,
      params?.gap ?? DEFAULT_GAP
    );

    useLayoutEffect(() => {
      if (!childrenContainerRef.current) return;
      // Нет данных для отрисовки
      if (!params) return;

      // Данные уже измерены
      if (measuredData) {
        // Нужен скролл
        if (layout.final && layout.scrollY > 0) {
          console.log(`🫢 scroll to ${layout.scrollY}`, layout.final);
          requestAnimationFrame(() => {
            scrollViewRef.current?.scrollTo({
              y: layout.scrollY,
              animated: layout.animatedScroll,
            });
          });
        }
      } else {
        // Измеряем контент
        const menuRect = measureInWindowSync(childrenContainerRef);
        const topViewRect = measureInWindowSync(topViewContainerRef);
        if (menuRect) {
          setMeasuredData({ childrenContainerRect: menuRect, topViewRect });
        }
      }
    }, [params, measuredData, layout]);

    if (layout.final) {
      console.log(`🫢 layout.final`, layout.final);
    }

    const _topMenu = !!params &&
      params.layoutMode === "capture" &&
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

    return (
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        presentationStyle="overFullScreen"
        onRequestClose={close}>
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
          onPress={close}>
          {/* Background type Blur */}
          {typeof background === "string" && background === "blur" && (
            <BlurView
              style={styles.background}
              blurAmount={20}
              blurType={params?.theme ?? "light"}
              reducedTransparencyFallbackColor="transparent"
            />
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
              // Для первого измерения используем absolute, чтобы контент измерился корректно
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
                <View
                  ref={childrenContainerRef}
                  style={layout.containerStyle}
                  collapsable={false}
                  onStartShouldSetResponder={BLOCK_BUBBLING_RESPONDER}
                  children={params.bottomView}
                />
              </>
            )}
            {layout.final &&
            params?.layoutMode === "capture" &&
            !!params.preview ? (
              <View
                style={layout.ghostViewStyle}
                onStartShouldSetResponder={BLOCK_BUBBLING_RESPONDER}>
                <Image
                  style={styles.preview}
                  source={{ uri: `data:image/png;base64,${params.preview}` }}
                />
              </View>
            ) : null}
          </ScrollView>
          {!!layout.topViewPin && topView}
        </TouchableOpacity>
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
