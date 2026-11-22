import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { BackButton } from "@/components/back-button";
import { Brand, FontFamily } from "@/constants/theme";

/** Shared top bar for rescuer screens (Queue, History). */
export function RescuerScreenHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  /** Omit when the screen is a tab destination instead of a pushed stack. */
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      {onBack ? <BackButton onPress={onBack} /> : <View style={styles.back} />}

      <View style={styles.titles}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  titles: {
    flex: 1,
  },
  title: {
    fontFamily: FontFamily.display,
    fontSize: 24,
    lineHeight: 26,
    letterSpacing: -0.5,
    color: Brand.ink,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  right: {
    minWidth: 38,
    alignItems: "flex-end",
  },
});
