import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from "react-native";

interface SkeletonProps {
  width?: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Pulsing placeholder used while a screen is fetching. Keeps loading states
 * shaped like the real content instead of showing a line of text.
 */
export function Skeleton({
  width = "100%",
  height,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-240, 480],
  });

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.block, { width, height, borderRadius }, style]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.shimmer, { transform: [{ translateX }] }]}
      >
        <LinearGradient
          colors={[
            "rgba(255,255,255,0)",
            "rgba(255,255,255,0.7)",
            "rgba(255,255,255,0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    overflow: "hidden",
    backgroundColor: "rgba(16,36,26,0.09)",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 240,
  },
});
