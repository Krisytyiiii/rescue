import { GlassView } from "expo-glass-effect";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { useEffect, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { Brand, FontFamily } from "@/constants/theme";
import { useTabsViewModel } from "@/features/navigation/useTabsViewModel";

const WEB_BLUR =
  Platform.OS === "web"
    ? ({
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      } as ViewStyle)
    : null;

/**
 * Floating frosted "glass" tab bar. Uses the platform liquid-glass view on
 * iOS and a translucent surface with a soft shadow everywhere else.
 */
export function GlassTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  const { items, ready } = useTabsViewModel();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const routesByName = new Map(
    state.routes.map((route) => [route.name, route]),
  );
  const focusedKey = state.routes[state.index]?.key;

  if (!ready || keyboardVisible) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.host,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      <View style={styles.shadow}>
        <GlassView
          {...(Platform.OS === "ios"
            ? {
                glassEffectStyle: "regular" as const,
                tintColor: "rgba(255, 255, 255, 0.55)",
              }
            : {})}
          style={[styles.bar, WEB_BLUR]}
        >
          {items.map((item) => {
            const route = routesByName.get(item.name);
            if (!route) return null;

            const focused = route.key === focusedKey;
            const { options } = descriptors[route.key];
            const label =
              typeof options.tabBarLabel === "string"
                ? options.tabBarLabel
                : item.label;

            const onPress = () => {
              const event = emitter.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigateToTab(route.key);
              }
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                accessibilityLabel={label}
                onPress={onPress}
                onLongPress={() =>
                  emitter.emit({ type: "tabLongPress", target: route.key })
                }
                style={({ pressed }) => [
                  styles.item,
                  focused && styles.itemActive,
                  pressed && styles.itemPressed,
                ]}
              >
                <item.Icon
                  size={22}
                  color={focused ? Brand.clay : Brand.ink55}
                />
                <Text style={[styles.label, focused && styles.labelActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </GlassView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    backgroundColor: "transparent",
  },
  shadow: {
    borderRadius: 999,
    shadowColor: "#10241a",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  bar: {
    height: 72,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.65)",
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    overflow: "hidden",
  },
  item: {
    flex: 1,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  itemActive: {
    backgroundColor: "rgba(31, 122, 77, 0.12)",
  },
  itemPressed: {
    opacity: 0.65,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    letterSpacing: 0.1,
    color: Brand.ink55,
  },
  labelActive: {
    color: Brand.clay,
  },
});
