import { useFocusEffect, useRouter, type Href } from "expo-router";
import { useCallback } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChevronLeftIcon, PlusCircleIcon } from "@/components/icons";
import { Brand, FontFamily } from "@/constants/theme";

import { ReportHistorySection } from "./ReportHistorySection";
import { useReportHistoryViewModel } from "./useReportHistoryViewModel";

/**
 * Dedicated screen for the resident's report history. Kept separate from the
 * send-report form so following up on cases never competes with reporting.
 */
export function MyReportsView({ showBack = true }: { showBack?: boolean }) {
  const router = useRouter();
  const { reports, loading, error, reload } = useReportHistoryViewModel();

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const subtitle =
    reports.length === 1 ? "1 report" : `${reports.length} reports`;

  const openReportForm = () => router.push("/send-report" as Href);
  const openReport = (id: string) =>
    router.push(`/report-detail?id=${encodeURIComponent(id)}` as Href);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <View style={styles.header}>
          {showBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={({ pressed }) => [styles.back, pressed && styles.pressed]}
            >
              <ChevronLeftIcon size={18} color={Brand.ink} />
            </Pressable>
          ) : null}
          <View style={styles.headerTitles}>
            <Text style={styles.title}>My reports</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send a new report"
            onPress={openReportForm}
            style={({ pressed }) => [
              styles.newReport,
              pressed && styles.pressed,
            ]}
          >
            <PlusCircleIcon size={15} color={Brand.paper} />
            <Text style={styles.newReportText}>New</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.intro}>
            Follow every case you submitted, from verification to rescue.
          </Text>

          {reports.length > 0 ? (
            <Text style={styles.listMeta}>{subtitle}</Text>
          ) : null}

          <ReportHistorySection
            reports={reports}
            loading={loading}
            error={error}
            onRetry={() => void reload()}
            onOpen={openReport}
            showHeading={false}
            defaultExpanded
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.paper2 },
  flex: { flex: 1 },
  header: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitles: { flex: 1 },
  newReport: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: Brand.forest,
  },
  newReportText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: Brand.paper,
  },
  title: {
    marginTop: 2,
    fontFamily: FontFamily.display,
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: -0.8,
    color: Brand.ink,
  },
  content: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 140,
  },
  intro: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    lineHeight: 21,
    color: Brand.ink70,
  },
  listMeta: {
    marginTop: 12,
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  pressed: { opacity: 0.7 },
});
