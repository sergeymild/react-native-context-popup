import React, { memo, useLayoutEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { measureSync } from "../utils/view.utils";
import { ContextMenuTest, ContextMenuTestProps } from "./ContextMenuTest";

const SINGLE_CASE = false;

interface Props {
  readonly cases: ContextMenuTestProps[][];
}

export const TestMenuView: React.FC<Props> = memo(({ cases }) => {
  const [height, setHeight] = useState<number | undefined>();

  const containerRef = useRef<View>(null);

  useLayoutEffect(() => {
    const rect = measureSync(containerRef);
    if (!rect) return;
    setHeight(rect.height);
  }, []);

  const pageStyle: StyleProp<ViewStyle> = [
    styles.page,
    { height, minHeight: height, maxHeight: height },
  ];

  return (
    <View ref={containerRef} collapsable={false} style={styles.base}>
      {SINGLE_CASE && (
        <ContextMenuTest
          style={styles.test}
          {...{
            mode: "capture",
            description:
              "Capture: длинный topView закрепляется и не перекрывает bottomView",
            topViewLines: 28,
            topViewLength: 32,
            menuLines: 38,
            menuLength: 32,
            start: 120,
            top: 220,
            width: 260,
            buttonHeight: 80,
          }}
        />
      )}
      {!SINGLE_CASE && (
        <ScrollView
          pagingEnabled
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={styles.pages}
          showsVerticalScrollIndicator={false}>
          {!!height && (
            <>
              {cases.map((page, pageIndex) => (
                <View key={`page-${pageIndex}`} style={pageStyle}>
                  {page.map((props, testIndex) => (
                    <ContextMenuTest
                      key={`test-${pageIndex}-${testIndex}`}
                      style={styles.test}
                      {...props}
                    />
                  ))}
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
});
TestMenuView.displayName = "TestMenuView";

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
  pages: {},
  page: {
    padding: 8,
    justifyContent: "space-between",

    outlineWidth: 3,
    outlineColor: "red",
    outlineStyle: "dashed",
  },
  row: {
    flexDirection: "row",
  },
  test: {
    padding: 8,
    width: "50%",
  },
});
