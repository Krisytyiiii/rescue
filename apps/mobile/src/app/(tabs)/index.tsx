import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PawMark, Wordmark } from "@/components/brand";
import { Brand, FontFamily } from "@/constants/theme";
import { useHomeViewModel } from "@/features/auth/useHomeViewModel";
import { RescuerHomeView } from "@/features/rescuer/RescuerHomeView";

const UPCOMING = [
  { index: "01", title: "Report an animal", note: "Photo, pin, and urgency" },
  { index: "02", title: "Adopt a rescue", note: "Meet animals ready for a home" },
  { index: "03", title: "Learn with us", note: "Care guides from the City Vet" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useHomeViewModel();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  if (user?.role === "rescuer") {
    return <RescuerHomeView />;
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <PawMark size={34} />
            <Wordmark size={19} />
          </View>
          <Pressable
            onPress={() => router.replace("/onboarding")}
            hitSlop={12}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.link}>About</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>
            {user ? `Resident home · ${user.firstName}` : "Resident home"}
          </Text>
          <Text style={styles.title}>
            Welcome{"\n"}
            <Text style={styles.titleAccent}>home.</Text>
          </Text>
          <Text style={styles.body}>
            This is the start of the resident app. The onboarding flow is ready;
            these screens come next.
          </Text>

          <View style={styles.list}>
            {UPCOMING.map((item) => (
              <View key={item.index} style={styles.row}>
                <Text style={styles.index}>{item.index}</Text>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowNote}>{item.note}</Text>
                </View>
                <Text style={styles.rowState}>Soon</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={handleSignOut}
            accessibilityRole="button"
            style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
          >
            <Text style={styles.signOutText}>Sign out</Text>
            <Text style={styles.signOutArrow}>→</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.paper,
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
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  link: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Brand.ink55,
  },
  pressed: {
    opacity: 0.55,
  },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 132,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    letterSpacing: 1.45,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  title: {
    marginTop: 14,
    fontFamily: FontFamily.display,
    fontSize: 52,
    lineHeight: 48,
    letterSpacing: -1.8,
    color: Brand.ink,
  },
  titleAccent: {
    fontFamily: FontFamily.displayItalic,
    color: Brand.clay,
  },
  body: {
    marginTop: 16,
    maxWidth: 420,
    fontFamily: FontFamily.sans,
    fontSize: 15.5,
    lineHeight: 25,
    color: Brand.ink70,
  },
  list: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: Brand.line,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Brand.line,
  },
  index: {
    width: 22,
    fontFamily: FontFamily.medium,
    fontSize: 10,
    letterSpacing: 1.1,
    color: Brand.clay,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: Brand.ink,
  },
  rowNote: {
    marginTop: 3,
    fontFamily: FontFamily.sans,
    fontSize: 12.5,
    color: Brand.ink55,
  },
  rowState: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  signOut: {
    marginTop: 24,
    height: 50,
    borderRadius: 999,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: Brand.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  signOutText: {
    fontFamily: FontFamily.medium,
    fontSize: 13.5,
    color: Brand.ink,
  },
  signOutArrow: {
    fontSize: 15,
    color: Brand.ink55,
  },
});
