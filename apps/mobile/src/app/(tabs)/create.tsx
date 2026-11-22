import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ArrowUpRightIcon } from "@/components/icons";
import { Brand, FontFamily } from "@/constants/theme";

const OPTIONS = [
  { label: "Report a stray", hint: "Pin the location and add a photo" },
  { label: "Log a field update", hint: "Attach notes to an open rescue" },
  { label: "Request supplies", hint: "Ask the City Vet for kit items" },
];

export default function CreateScreen() {
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.eyebrow}>Create</Text>
          <Text style={styles.title}>
            Start a{"\n"}
            <Text style={styles.titleAccent}>rescue note.</Text>
          </Text>
          <Text style={styles.body}>
            Quick field actions for on-duty rescuers. Everything you submit
            reaches the dispatch team.
          </Text>

          <View style={styles.list}>
            {OPTIONS.map((option) => (
              <Pressable
                key={option.label}
                accessibilityRole="button"
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{option.label}</Text>
                  <Text style={styles.rowHint}>{option.hint}</Text>
                </View>
                <View style={styles.rowIcon}>
                  <ArrowUpRightIcon size={15} color={Brand.clay} />
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.paper2 },
  flex: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 140,
  },
  eyebrow: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: Brand.clay,
  },
  title: {
    marginTop: 12,
    fontFamily: FontFamily.display,
    fontSize: 46,
    lineHeight: 43,
    letterSpacing: -1.4,
    color: Brand.ink,
  },
  titleAccent: {
    fontFamily: FontFamily.displayItalic,
    color: Brand.clay,
  },
  body: {
    marginTop: 14,
    fontFamily: FontFamily.sans,
    fontSize: 14.5,
    lineHeight: 23,
    color: Brand.ink70,
  },
  list: {
    marginTop: 26,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  pressed: { opacity: 0.65 },
  rowText: { flex: 1 },
  rowTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Brand.ink,
  },
  rowHint: {
    marginTop: 3,
    fontFamily: FontFamily.sans,
    fontSize: 12,
    lineHeight: 17,
    color: Brand.ink55,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31,122,77,0.10)",
  },
});
