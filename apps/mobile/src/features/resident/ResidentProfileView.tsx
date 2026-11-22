import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { useCallback, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ArrowUpRightIcon,
  CalendarIcon,
  ChartIcon,
  CheckIcon,
  LockIcon,
  MailIcon,
  MapPinIcon,
  PawIcon,
  PencilIcon,
  PhoneIcon,
} from "@/components/icons";
import { UserAvatar } from "@/components/user-avatar";
import { Brand, FontFamily } from "@/constants/theme";

import { useResidentProfileViewModel } from "./useResidentProfileViewModel";

/** Profile tab for the resident shell, mirroring the rescuer profile layout. */
export function ResidentProfileView() {
  const router = useRouter();
  const { user, stats, barangayName, loading, error, reload, signOut } =
    useResidentProfileViewModel();

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.pageHead}>
            <View>
              <Text style={styles.eyebrow}>Profile</Text>
              <Text style={styles.pageTitle}>Your account</Text>
            </View>
            <View style={styles.rolePill}>
              <PawIcon size={13} color={Brand.moss} />
              <Text style={styles.rolePillText}>Resident</Text>
            </View>
          </View>

          <LinearGradient
            colors={["#0B2E1C", "#165B37"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroOrb} />
            <View style={styles.heroTop}>
              <UserAvatar
                uri={user?.profilePhotoUrl}
                size={58}
                backgroundColor={Brand.sage}
                iconColor={Brand.forest}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/edit-profile" as Href)}
                style={({ pressed }) => [
                  styles.editButton,
                  pressed && styles.pressed,
                ]}
              >
                <PencilIcon size={13} color={Brand.sage} />
                <Text style={styles.editText}>Edit profile</Text>
              </Pressable>
            </View>

            <Text style={styles.name}>
              {user ? user.fullName : "FuRescue resident"}
            </Text>
            <View style={styles.heroMetaRow}>
              <Text style={styles.heroRole}>Community member</Text>
              {user?.emailVerifiedAt ? (
                <>
                  <View style={styles.metaDot} />
                  <CheckIcon size={11} color={Brand.sage} />
                  <Text style={styles.verified}>Verified</Text>
                </>
              ) : null}
            </View>

            <View style={styles.heroEmailRow}>
              <MailIcon size={13} color="rgba(255,255,255,0.55)" />
              <Text style={styles.heroEmail} numberOfLines={1}>
                {user?.email ?? "—"}
              </Text>
            </View>
          </LinearGradient>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open my reports"
            onPress={() => router.push("/reports" as Href)}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <LinearGradient
              colors={["#E7F4EB", "#D6EBDD"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.reportBanner}
            >
              <View style={styles.reportHead}>
                <View style={styles.reportBadge}>
                  <ChartIcon size={14} color={Brand.moss} />
                </View>
                <View style={styles.reportTitleBlock}>
                  <Text style={styles.reportEyebrow}>Community record</Text>
                  <Text style={styles.reportTitle}>Your rescue activity</Text>
                </View>
                <ArrowUpRightIcon size={16} color={Brand.moss} />
              </View>

              <View style={styles.reportStats}>
                <ReportStat
                  value={loading ? "—" : `${stats.reportsSubmitted}`}
                  label="Reports"
                />
                <View style={styles.reportDivider} />
                <ReportStat
                  value={loading ? "—" : `${stats.applications}`}
                  label="Applications"
                />
                <View style={styles.reportDivider} />
                <ReportStat
                  value={loading ? "—" : `${stats.approved}`}
                  label="Approved"
                />
              </View>

              <View style={styles.reportCta}>
                <Text style={styles.reportCtaText}>Open my reports</Text>
                <Text style={styles.reportCtaHint}>
                  Status, updates, rescue outcomes
                </Text>
              </View>
            </LinearGradient>
          </Pressable>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Current activity</Text>
            <Text style={styles.sectionMeta}>{loading ? "Loading" : "Live"}</Text>
          </View>

          <View style={styles.statsRow}>
            <StatCard
              label="Reports"
              value={loading ? undefined : stats.reportsSubmitted}
            />
            <StatCard
              label="Applications"
              value={loading ? undefined : stats.applications}
            />
            <StatCard
              label="Interviews"
              value={loading ? undefined : stats.interviewsScheduled}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account details</Text>
            <Text style={styles.sectionMeta}>Private</Text>
          </View>

          <View style={styles.accountCard}>
            <AccountRow
              icon={<MailIcon size={15} color={Brand.moss} />}
              label="Email"
              value={user?.email ?? "—"}
              hint="Managed by FuRescue"
              locked
            />
            <View style={styles.accountRule} />
            <AccountRow
              icon={<PhoneIcon size={15} color={Brand.moss} />}
              label="Phone"
              value={user?.phoneNumber ?? "Not set"}
            />
            <View style={styles.accountRule} />
            <AccountRow
              icon={<MapPinIcon size={15} color={Brand.moss} />}
              label="Barangay"
              value={barangayName ?? "Not set"}
            />
            <View style={styles.accountRule} />
            <AccountRow
              icon={<CalendarIcon size={15} color={Brand.moss} />}
              label="Member since"
              value={user ? formatMemberSince(user.createdAt) : "—"}
            />
          </View>

          <View style={styles.links}>
            <ProfileLink
              label="My reports"
              hint="Every rescue report you have submitted"
              icon={<MapPinIcon size={17} color={Brand.clay} />}
              onPress={() => router.push("/reports" as Href)}
            />
            <ProfileLink
              label="My applications"
              hint="Adoption requests and their progress"
              icon={<PawIcon size={17} color={Brand.clay} />}
              onPress={() => router.push("/adoption-applications" as Href)}
            />
          </View>

          <Pressable
            onPress={() => void handleSignOut()}
            accessibilityRole="button"
            style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
          >
            <Text style={styles.signOutText}>Sign out</Text>
            <View style={styles.signOutIcon}>
              <ArrowUpRightIcon size={15} color={Brand.ink} />
            </View>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ReportStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.reportStat}>
      <Text style={styles.reportStatValue}>{value}</Text>
      <Text style={styles.reportStatLabel}>{label}</Text>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value?: number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value ?? "—"}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function AccountRow({
  icon,
  label,
  value,
  hint,
  locked,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  locked?: boolean;
}) {
  return (
    <View style={styles.accountRow}>
      <View style={styles.accountIcon}>{icon}</View>
      <View style={styles.accountBody}>
        <Text style={styles.accountLabel}>{label}</Text>
        <Text style={styles.accountValue} numberOfLines={1}>
          {value}
        </Text>
        {hint ? <Text style={styles.accountHint}>{hint}</Text> : null}
      </View>
      {locked ? <LockIcon size={13} color={Brand.ink55} /> : null}
    </View>
  );
}

function ProfileLink({
  label,
  hint,
  icon,
  onPress,
}: {
  label: string;
  hint: string;
  icon: ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
    >
      <View style={styles.linkIcon}>{icon}</View>
      <View style={styles.linkText}>
        <Text style={styles.linkLabel}>{label}</Text>
        <Text style={styles.linkHint}>{hint}</Text>
      </View>
      <ArrowUpRightIcon size={14} color={Brand.ink55} />
    </Pressable>
  );
}

function formatMemberSince(iso: string): string {
  const date = new Date(iso);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${months[date.getMonth()] ?? ""} ${date.getFullYear()}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.paper2 },
  flex: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 140,
  },
  pageHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  eyebrow: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: Brand.clay,
  },
  pageTitle: {
    marginTop: 4,
    fontFamily: FontFamily.display,
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: -0.8,
    color: Brand.ink,
  },
  rolePill: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(31,122,77,0.22)",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  rolePillText: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: Brand.moss,
  },
  hero: {
    marginTop: 16,
    borderRadius: 26,
    padding: 20,
    overflow: "hidden",
  },
  heroOrb: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    right: -54,
    top: -72,
    backgroundColor: "rgba(124,199,154,0.14)",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editButton: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(185,220,196,0.28)",
    backgroundColor: "rgba(185,220,196,0.10)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  editText: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: Brand.sage,
  },
  name: {
    marginTop: 16,
    fontFamily: FontFamily.display,
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: -0.7,
    color: Brand.paper,
  },
  heroMetaRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroRole: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Brand.sage,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  verified: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.62)",
  },
  heroEmailRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  heroEmail: {
    flex: 1,
    fontFamily: FontFamily.sans,
    fontSize: 12,
    color: "rgba(255,255,255,0.62)",
  },
  reportBanner: {
    marginTop: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(31,122,77,0.18)",
    padding: 17,
  },
  reportHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reportBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  reportTitleBlock: { flex: 1 },
  reportEyebrow: {
    fontFamily: FontFamily.medium,
    fontSize: 8.5,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: Brand.moss,
  },
  reportTitle: {
    marginTop: 1,
    fontFamily: FontFamily.display,
    fontSize: 20,
    lineHeight: 22,
    color: Brand.ink,
  },
  reportStats: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  reportStat: { flex: 1 },
  reportStatValue: {
    fontFamily: FontFamily.display,
    fontSize: 27,
    lineHeight: 29,
    color: Brand.forest,
  },
  reportStatLabel: {
    marginTop: 2,
    fontFamily: FontFamily.medium,
    fontSize: 8.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  reportDivider: {
    width: 1,
    height: 30,
    marginHorizontal: 12,
    backgroundColor: "rgba(16,36,26,0.12)",
  },
  reportCta: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(16,36,26,0.10)",
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10,
  },
  reportCtaText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11.5,
    color: Brand.moss,
  },
  reportCtaHint: {
    flexShrink: 1,
    fontFamily: FontFamily.sans,
    fontSize: 9.5,
    color: Brand.ink55,
    textAlign: "right",
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Brand.ink,
  },
  sectionMeta: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    paddingVertical: 13,
    paddingHorizontal: 12,
  },
  statValue: {
    fontFamily: FontFamily.display,
    fontSize: 27,
    lineHeight: 29,
    color: Brand.ink,
  },
  statLabel: {
    marginTop: 2,
    fontFamily: FontFamily.medium,
    fontSize: 9,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  error: {
    marginTop: 12,
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: "#B4462F",
  },
  accountCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    paddingHorizontal: 15,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
  },
  accountIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31,122,77,0.08)",
  },
  accountBody: { flex: 1 },
  accountLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 8.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  accountValue: {
    marginTop: 2,
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Brand.ink,
  },
  accountHint: {
    marginTop: 1,
    fontFamily: FontFamily.sans,
    fontSize: 10,
    color: Brand.ink55,
  },
  accountRule: {
    height: 1,
    marginLeft: 44,
    backgroundColor: Brand.line,
  },
  links: {
    marginTop: 22,
    gap: 10,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  linkIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31,122,77,0.10)",
  },
  linkText: { flex: 1 },
  linkLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 13.5,
    color: Brand.ink,
  },
  linkHint: {
    marginTop: 3,
    fontFamily: FontFamily.sans,
    fontSize: 11.5,
    color: Brand.ink55,
  },
  signOut: {
    marginTop: 16,
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    paddingLeft: 20,
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pressed: { opacity: 0.65 },
  signOutText: {
    fontFamily: FontFamily.medium,
    fontSize: 13.5,
    color: Brand.ink,
  },
  signOutIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.paper2,
  },
});
