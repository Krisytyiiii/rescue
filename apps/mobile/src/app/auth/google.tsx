import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PawMark } from "@/components/brand";
import { Brand, FontFamily } from "@/constants/theme";
import { useGoogleCallbackViewModel } from "@/features/auth/useGoogleCallbackViewModel";

/** Landing route for the `mobile://auth/google` OAuth redirect. */
export default function GoogleCallbackScreen() {
  useGoogleCallbackViewModel();

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.content} edges={["top", "bottom"]}>
        <PawMark size={56} />
        <ActivityIndicator color={Brand.ink} style={styles.spinner} />
        <Text style={styles.title}>Finishing sign-in…</Text>
        <Text style={styles.body}>
          Hang tight while we take you back to FuRescue.
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.paper,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  spinner: {
    marginTop: 12,
  },
  title: {
    fontFamily: FontFamily.display,
    fontSize: 24,
    color: Brand.ink,
    textAlign: "center",
  },
  body: {
    fontFamily: FontFamily.sans,
    fontSize: 15,
    lineHeight: 22,
    color: Brand.ink55,
    textAlign: "center",
  },
});
