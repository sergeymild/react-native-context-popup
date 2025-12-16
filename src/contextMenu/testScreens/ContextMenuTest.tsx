import React, { memo, useRef } from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

import { ContextMenuParams, showContextMenu } from "../contextMenu";

export type ContextMenuTestProps = {
  style?: StyleProp<ViewStyle>;

  start?: number;
  end?: number;
  top?: number;
  bottom?: number;
  width: ViewStyle["width"];
  buttonHeight: number;
  description: string;

  menuLines: number;
  menuLength: number;

  forceHGravity?: "start" | "end";
  gap?: number;
  background?: ContextMenuParams["background"];

  topShift?: number;
} & (
  | { mode: "anchor" }
  | { mode: "capture"; topViewLines: number; topViewLength: number }
);

export const ContextMenuTest: React.FC<ContextMenuTestProps> = memo(
  ({
    style,
    start,
    end,
    top,
    bottom,
    width,
    buttonHeight,
    menuLines,
    menuLength,
    gap,
    background,
    topShift,
    description,
    forceHGravity,
    ...props
  }) => {
    const topViewLines = props.mode === "capture" ? props.topViewLines : 0;
    const topViewLength = props.mode === "capture" ? props.topViewLength : 0;

    const buttonRef = useRef<View>(null);

    return (
      <View
        style={[
          styles.base,
          style,
          {
            position: "absolute",
            width,
            start,
            top,
            end,
            bottom,
          },
        ]}>
        <TouchableOpacity
          ref={buttonRef}
          style={[
            styles.button,
            {
              flex: 1,
              height: buttonHeight,
            },
          ]}
          onPress={async () => {
            showContextMenu({
              theme: "light",
              anchor: buttonRef,
              layoutMode: props.mode,
              topShift,
              gap,
              background,
              forceHGravity,
              topView: !!topViewLines && (
                <View
                  style={{
                    backgroundColor: "gray",
                    borderRadius: 12,
                    padding: 12,
                  }}>
                  {Array.from({ length: topViewLines }).map((_, index) => (
                    <Text
                      key={index}
                      children={Array.from({ length: topViewLength }).map(() =>
                        String.fromCharCode(Math.floor(Math.random() * 26) + 97)
                      )}
                    />
                  ))}
                </View>
              ),
              bottomView: (
                <View
                  style={{
                    backgroundColor: "#66B3FF",
                    borderRadius: 12,
                    padding: 12,
                    marginHorizontal: 16,
                  }}>
                  {Array.from({ length: menuLines }).map((_, index) => (
                    <Text
                      style={{
                        borderTopWidth: 1,
                        borderTopColor: index > 0 ? "#808080" : "transparent",
                      }}
                      key={index}
                      children={Array.from({ length: menuLength }).map(() =>
                        String.fromCharCode(Math.floor(Math.random() * 26) + 97)
                      )}
                    />
                  ))}
                </View>
              ),
            });
          }}>
          <Text style={styles.buttonText} children="button" />
        </TouchableOpacity>
        <Text style={styles.descriptionText} children={description} />
      </View>
    );
  }
);
ContextMenuTest.displayName = "ContextMenuTest";

const styles = StyleSheet.create({
  base: {
    outlineWidth: 2,
    outlineColor: "orange",
    outlineStyle: "dashed",
  },
  button: {
    padding: 12,
    backgroundColor: "#793FF3",
    borderRadius: 12,
    marginHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    color: "white",
  },
  descriptionText: {
    fontSize: 14,
    color: "gray",
  },
});
