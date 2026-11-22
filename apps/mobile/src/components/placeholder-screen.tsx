import { GlassView } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/back-button";
import { Brand, FontFamily } from "@/constants/theme";

const WEB_BLUR =
  Platform.OS === "web"
    ? ({
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      } as ViewStyle)
    : null;

/**
 * Shared shell for destinations that are planned but not built yet. Keeps the
 * same frosted-glass language as the rest of the rescuer app.
 */
export function PlaceholderScreen({
  eyebrow,
  title,
  body,
  icon,
  tint = Brand.clay,
  onBack,
}: {
  eyebrow: string;
  title: string;
  body: string;
  icon: ReactNode;
  tint?: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <View style={styles.header}>
          <BackButton onPress={onBack} />
          <Text style={styles.headerTitle}>{eyebrow}</Text>
          <View style={styles.back} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <GlassView
            {...(Platform.OS === "ios"
              ? {
                  glassEffectStyle: "regular" as const,
                  tintColor: "rgba(255,255,255,0.45)",
                }
              : {})}
            style={[styles.hero, WEB_BLUR]}
          >
            <LinearGradient
              colors={[`${tint}33`, "rgba(255,255,255,0.5)", `${tint}14`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View
              pointerEvents="none"
              style={[styles.orb, { backgroundColor: `${tint}26` }]}
            />

            <View
              style={[
                styles.iconWrap,
                { backgroundColor: `${tint}1A`, borderColor: `${tint}4D` },
              ]}
            >
              {icon}
            </View>

            <Text style={styles.kicker}>Coming soon</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.body}>{body}</Text>
          </GlassView>

          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>While this is being built</Text>
            <Text style={styles.noteBody}>
              Keep using the quick actions on your home screen for field work.
              New places will light up here as soon as they are ready.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.paper2,
  },
  flex: {
    flex: 1,
  },
  header: {
    height: 62,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  content: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 130,
  },
  hero: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    backgroundColor: "rgba(255,255,255,0.55)",
    padding: 22,
    overflow: "hidden",
    shadowColor: "#10231A",
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  orb: {
    position: "absolute",
    top: -70,
    right: -50,
    width: 190,
    height: 150,
    borderRadius: 999,
    opacity: 0.7,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  kicker: {
    marginTop: 22,
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  title: {
    marginTop: 8,
    fontFamily: FontFamily.display,
    fontSize: 38,
    lineHeight: 40,
    letterSpacing: -1.1,
    color: Brand.ink,
  },
  body: {
    marginTop: 12,
    fontFamily: FontFamily.sans,
    fontSize: 14,
    lineHeight: 22,
    color: Brand.ink70,
  },
  noteCard: {
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 18,
  },
  noteTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 13.5,
    color: Brand.ink,
  },
  noteBody: {
    marginTop: 6,
    fontFamily: FontFamily.sans,
    fontSize: 12.5,
    lineHeight: 19,
    color: Brand.ink55,
  },
});
