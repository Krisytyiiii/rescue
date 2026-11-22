import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { Brand, FontFamily } from "@/constants/theme";

/** The square paw tile used for the app icon, splash and web favicon. */
export function PawMark({ size = 36 }: { size?: number }) {
  return (
    <Image
      source={require("@/assets/images/favicon.png")}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessibilityLabel="FuRescue paw mark"
    />
  );
}

/** "Fu" in Geist + "Rescue" in Instrument Serif italic, as on the website. */
export function Wordmark({
  size = 20,
  color = Brand.ink,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <View style={styles.wordmark} accessibilityRole="text" accessibilityLabel="FuRescue">
      <Text
        style={[
          styles.fu,
          { fontSize: size, letterSpacing: size * -0.055, color },
        ]}
      >
        Fu
      </Text>
      <Text
        style={[
          styles.rescue,
          { fontSize: size * 1.21, color },
        ]}
      >
        Rescue
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wordmark: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 1,
  },
  fu: {
    fontFamily: FontFamily.semibold,
    lineHeight: undefined,
  },
  rescue: {
    fontFamily: FontFamily.displayItalic,
  },
});
