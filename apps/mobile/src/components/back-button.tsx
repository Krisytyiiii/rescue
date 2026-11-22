import { Pressable, StyleSheet } from "react-native";

import { ChevronLeftIcon } from "@/components/icons";
import { Brand } from "@/constants/theme";

/**
 * One back affordance for every pushed screen, resident or rescuer: a bordered
 * paper circle holding a single chevron.
 */
export function BackButton({
  onPress,
  label = "Go back",
  iconSize = 18,
}: {
  onPress: () => void;
  label?: string;
  iconSize?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <ChevronLeftIcon size={iconSize} color={Brand.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.6,
  },
});
