import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PawMark, Wordmark } from "@/components/brand";
import { Brand, FontFamily } from "@/constants/theme";
import { useOnboardingViewModel } from "@/features/auth/useOnboardingViewModel";

const heroPuppy = require("@/assets/images/onboarding/hero-puppy.jpg");
const heroCat = require("@/assets/images/onboarding/hero-cat.jpg");

type Slide = {
  key: string;
  step: string;
  title: string;
  accent: string;
  body: string;
  visual: "report" | "dispatch" | "adopt";
};

const SLIDES: Slide[] = [
  {
    key: "home",
    step: "Animal rescue & adoption",
    title: "Every animal deserves",
    accent: "a way home.",
    body: "A volunteer-run network caring for Mati City's street animals — one rescue, one foster, one family at a time.",
    visual: "report",
  },
  {
    key: "report",
    step: "Report · Dispatch · Rescue",
    title: "Report what you see.",
    accent: "We'll take it.",
    body: "Send a photo and a pin. We verify, dispatch a rescuer, and keep you updated until the animal is safe.",
    visual: "dispatch",
  },
  {
    key: "adopt",
    step: "Adopt · Learn · Stay connected",
    title: "Meet your next",
    accent: "family member.",
    body: "Browse rescues, apply to adopt, message the team, and learn how to care for them for life.",
    visual: "adopt",
  },
];

const TIMELINE = [
  { label: "Report submitted", time: "7:42 AM" },
  { label: "Verified by the City Vet", time: "7:58 AM" },
  { label: "Rescuer on the way", time: "8:06 AM" },
];

const IMPACT = [
  { value: "1,284", label: "Animals rescued" },
  { value: "916", label: "Found families" },
  { value: "46", label: "Foster homes" },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const { checkingSession } = useOnboardingViewModel(() =>
    router.replace("/"),
  );

  const short = height < 760;
  const displaySize = height < 700 ? 33 : short ? 36 : 42;
  const isLast = index === SLIDES.length - 1;

  const finish = () => router.replace("/login");

  const next = () => {
    if (isLast) {
      finish();
      return;
    }
    listRef.current?.scrollToOffset({
      offset: (index + 1) * width,
      animated: true,
    });
    setIndex((current) => Math.min(current + 1, SLIDES.length - 1));
  };

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(Math.max(0, Math.min(page, SLIDES.length - 1)));
  };

  if (checkingSession) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.glow} />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={[styles.topBar, short && styles.topBarShort]}>
          <View style={styles.brand}>
            <PawMark size={34} />
            <Wordmark size={19} />
          </View>
          <Pressable
            onPress={finish}
            hitSlop={12}
            style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(item) => item.key}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          renderItem={({ item }) => (
            <View style={{ width }}>
              <View style={[styles.slide, short && styles.slideShort]}>
                <View style={styles.eyebrow}>
                  <View style={styles.liveDot} />
                  <Text style={styles.label} numberOfLines={1}>
                    {item.step}
                  </Text>
                </View>

                <Text
                  maxFontSizeMultiplier={1.1}
                  style={[
                    styles.title,
                    {
                      fontSize: displaySize,
                      lineHeight: displaySize * 0.96,
                    },
                    short && styles.titleShort,
                  ]}
                >
                  {item.title}
                  {"\n"}
                  <Text style={styles.titleAccent}>{item.accent}</Text>
                </Text>

                <Text
                  style={[styles.body, short && styles.bodyShort]}
                  numberOfLines={3}
                >
                  {item.body}
                </Text>

                {item.visual === "report" && (
                  <View style={styles.photoStage}>
                    <View style={styles.photoFrame}>
                      <Image
                        source={heroPuppy}
                        style={styles.photo}
                        contentFit="cover"
                        transition={250}
                        accessibilityLabel="A rescued puppy on its first walk"
                      />
                      <View style={styles.captionRow}>
                        <Text style={styles.caption}>Dahican · 7:42 AM</Text>
                        <Text style={styles.caption}>First walk</Text>
                      </View>
                    </View>

                    <View style={[styles.homesBadge, short && styles.homesBadgeShort]}>
                      <Text
                        style={[
                          styles.homesValue,
                          short && styles.homesValueShort,
                        ]}
                      >
                        916
                      </Text>
                      <Text style={styles.homesLabel}>Homes{"\n"}found</Text>
                    </View>
                  </View>
                )}

                {item.visual === "dispatch" && (
                  <View style={styles.dispatchWrap}>
                    <View style={styles.mockCard}>
                      <View>
                        <View style={styles.mockHeader}>
                          <Text style={styles.monoLabel}>RPT-2026-00042</Text>
                          <View style={styles.chip}>
                            <View style={styles.chipDot} />
                            <Text style={styles.chipText}>In progress</Text>
                          </View>
                        </View>
                        <Text style={[styles.mockTitle, short && styles.mockTitleShort]}>
                          Injured stray near Dahican beach
                        </Text>
                        <Text style={styles.mockMeta}>
                          Dog · High urgency · Dahican
                        </Text>
                      </View>

                      {!short && (
                        <View style={styles.timeline}>
                          {TIMELINE.map((entry, position) => (
                            <View key={entry.label} style={styles.timelineRow}>
                              <View style={styles.timelineRail}>
                                <View
                                  style={[
                                    styles.timelineDot,
                                    position === TIMELINE.length - 1 &&
                                      styles.timelineDotActive,
                                  ]}
                                />
                                {position < TIMELINE.length - 1 && (
                                  <View style={styles.timelineLine} />
                                )}
                              </View>
                              <Text style={styles.timelineLabel}>
                                {entry.label}
                              </Text>
                              <Text style={styles.timelineTime}>
                                {entry.time}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>

                    <View style={styles.steps}>
                      {["Report", "Dispatch", "Rescue"].map((step, position) => (
                        <View key={step} style={styles.stepItem}>
                          <Text style={styles.stepIndex}>0{position + 1}</Text>
                          <Text style={styles.stepLabel}>{step}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {item.visual === "adopt" && (
                  <View style={styles.adoptWrap}>
                    <View style={styles.adoptFrame}>
                      <Image
                        source={heroCat}
                        style={styles.adoptPhoto}
                        contentFit="cover"
                        transition={250}
                        accessibilityLabel="A rescue cat waiting for a home"
                      />
                      <View style={styles.adoptBadge}>
                        <View style={styles.liveDotLight} />
                        <Text style={styles.adoptBadgeText}>
                          Ready for adoption
                        </Text>
                      </View>
                    </View>

                    <View style={styles.impact}>
                      {IMPACT.map((stat, position) => (
                        <View
                          key={stat.label}
                          style={[
                            styles.impactItem,
                            position > 0 && styles.impactItemBorder,
                          ]}
                        >
                          <Text style={styles.impactValue}>{stat.value}</Text>
                          <Text style={styles.impactLabel}>{stat.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        />

        <View style={[styles.footer, short && styles.footerShort]}>
          <View style={styles.dots}>
            {SLIDES.map((slide, position) => (
              <View
                key={slide.key}
                style={[styles.dot, position === index && styles.dotActive]}
              />
            ))}
          </View>

          <Pressable
            onPress={next}
            style={({ pressed }) => [
              styles.cta,
              short && styles.ctaShort,
              pressed && styles.ctaPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={isLast ? "Get started" : "Continue"}
          >
            <Text style={styles.ctaText}>
              {isLast ? "Get started" : "Continue"}
            </Text>
            <View style={styles.ctaIcon}>
              <Text style={styles.ctaArrow}>↗</Text>
            </View>
          </Pressable>

          <Text style={styles.footerNote}>City of Mati · Davao Oriental</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.paper,
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: -120,
    right: -110,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(31, 122, 77, 0.06)",
  },
  safe: {
    flex: 1,
  },
  topBar: {
    height: 64,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBarShort: {
    height: 54,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  skip: {
    paddingVertical: 6,
  },
  skipText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Brand.ink55,
    letterSpacing: 0.1,
  },
  pressed: {
    opacity: 0.55,
  },
  slide: {
    flex: 1,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
    overflow: "hidden",
  },
  slideShort: {
    paddingTop: 4,
    paddingBottom: 14,
  },
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Brand.clay,
  },
  label: {
    flexShrink: 1,
    fontFamily: FontFamily.medium,
    fontSize: 10,
    letterSpacing: 1.35,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  title: {
    marginTop: 16,
    fontFamily: FontFamily.display,
    letterSpacing: -1.5,
    color: Brand.ink,
  },
  titleShort: {
    marginTop: 10,
    letterSpacing: -1.1,
  },
  titleAccent: {
    fontFamily: FontFamily.displayItalic,
    color: Brand.clay,
  },
  body: {
    marginTop: 14,
    maxWidth: 460,
    fontFamily: FontFamily.sans,
    fontSize: 15,
    lineHeight: 23,
    color: Brand.ink70,
  },
  bodyShort: {
    marginTop: 8,
    fontSize: 13.5,
    lineHeight: 20,
  },

  /* Slide 1 — framed rescue photo with the homes badge */
  photoStage: {
    flex: 1,
    minHeight: 0,
    marginTop: 18,
    justifyContent: "flex-end",
  },
  photoFrame: {
    alignSelf: "flex-end",
    width: "64%",
    maxWidth: 280,
    height: "100%",
    maxHeight: 440,
    padding: 7,
    paddingBottom: 0,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: Brand.line,
    transform: [{ rotate: "-2.2deg" }],
    shadowColor: "#10241a",
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
    elevation: 8,
  },
  photo: {
    flex: 1,
    width: "100%",
    backgroundColor: Brand.sand,
  },
  captionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingVertical: 9,
  },
  caption: {
    fontFamily: FontFamily.medium,
    fontSize: 8.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  homesBadge: {
    position: "absolute",
    left: 0,
    bottom: 28,
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: Brand.clay,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-7deg" }],
    shadowColor: Brand.clay,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 7,
  },
  homesBadgeShort: {
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  homesValue: {
    fontFamily: FontFamily.display,
    fontSize: 29,
    lineHeight: 31,
    color: Brand.paper,
  },
  homesValueShort: {
    fontSize: 24,
    lineHeight: 26,
  },
  homesLabel: {
    marginTop: 1,
    fontFamily: FontFamily.medium,
    fontSize: 7.5,
    lineHeight: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(255, 255, 255, 0.82)",
    textAlign: "center",
  },

  /* Slide 2 — report / dispatch mock card */
  dispatchWrap: {
    flex: 1,
    minHeight: 0,
    marginTop: 18,
    justifyContent: "space-between",
  },
  mockCard: {
    flex: 1,
    maxHeight: 330,
    backgroundColor: Brand.paper,
    borderWidth: 1,
    borderColor: Brand.line,
    padding: 18,
    justifyContent: "space-between",
    shadowColor: "#10241a",
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 16 },
    elevation: 6,
  },
  mockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  monoLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Brand.sand,
  },
  chipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Brand.clay,
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    letterSpacing: 0.2,
    color: Brand.moss,
  },
  mockTitle: {
    marginTop: 12,
    fontFamily: FontFamily.display,
    fontSize: 23,
    lineHeight: 25,
    letterSpacing: -0.5,
    color: Brand.ink,
  },
  mockTitleShort: {
    marginTop: 8,
    fontSize: 20,
    lineHeight: 22,
  },
  mockMeta: {
    marginTop: 5,
    fontFamily: FontFamily.sans,
    fontSize: 12,
    color: Brand.ink55,
  },
  timeline: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Brand.line,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  timelineRail: {
    width: 14,
    alignItems: "center",
    alignSelf: "stretch",
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
    backgroundColor: Brand.sage,
  },
  timelineDotActive: {
    backgroundColor: Brand.clay,
  },
  timelineLine: {
    flex: 1,
    width: 1,
    marginVertical: 3,
    backgroundColor: Brand.line,
  },
  timelineLabel: {
    flex: 1,
    paddingLeft: 7,
    paddingBottom: 10,
    fontFamily: FontFamily.sans,
    fontSize: 12.5,
    lineHeight: 17,
    color: Brand.ink,
  },
  timelineTime: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 0.6,
    color: Brand.ink55,
    paddingTop: 2,
  },
  steps: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: Brand.line,
    marginTop: 16,
    paddingTop: 12,
  },
  stepItem: {
    flex: 1,
  },
  stepIndex: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    letterSpacing: 1.1,
    color: Brand.clay,
  },
  stepLabel: {
    marginTop: 3,
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: Brand.ink,
  },

  /* Slide 3 — adoption photo + impact numbers */
  adoptWrap: {
    flex: 1,
    minHeight: 0,
    marginTop: 18,
    justifyContent: "space-between",
  },
  adoptFrame: {
    flex: 1,
    maxHeight: 340,
    padding: 7,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: Brand.line,
    shadowColor: "#10241a",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 7,
  },
  adoptPhoto: {
    flex: 1,
    width: "100%",
    backgroundColor: Brand.sand,
  },
  adoptBadge: {
    position: "absolute",
    left: 18,
    bottom: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(15, 58, 36, 0.92)",
  },
  liveDotLight: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Brand.claySoft,
  },
  adoptBadgeText: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 0.85,
    textTransform: "uppercase",
    color: Brand.paper,
  },
  impact: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: Brand.line,
    marginTop: 16,
    paddingTop: 13,
  },
  impactItem: {
    flex: 1,
  },
  impactItemBorder: {
    borderLeftWidth: 1,
    borderLeftColor: Brand.line,
    paddingLeft: 14,
  },
  impactValue: {
    fontFamily: FontFamily.display,
    fontSize: 24,
    lineHeight: 26,
    letterSpacing: -0.4,
    color: Brand.ink,
  },
  impactLabel: {
    marginTop: 4,
    fontFamily: FontFamily.medium,
    fontSize: 8,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: Brand.ink55,
  },

  /* Footer */
  footer: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 8,
  },
  footerShort: {
    paddingTop: 6,
    paddingBottom: 4,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  dot: {
    width: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(16, 36, 26, 0.16)",
  },
  dotActive: {
    width: 28,
    backgroundColor: Brand.moss,
  },
  cta: {
    height: 56,
    borderRadius: 999,
    paddingLeft: 22,
    paddingRight: 8,
    backgroundColor: Brand.ink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ctaShort: {
    height: 50,
  },
  ctaPressed: {
    backgroundColor: Brand.moss,
  },
  ctaText: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: Brand.paper,
    letterSpacing: 0.1,
  },
  ctaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.paper10,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaArrow: {
    fontSize: 17,
    color: Brand.paper,
    marginTop: -1,
  },
  footerNote: {
    marginTop: 10,
    textAlign: "center",
    fontFamily: FontFamily.medium,
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
});
