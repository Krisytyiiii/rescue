import { useFocusEffect, useRouter, type Href } from "expo-router";
import { useCallback, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ArrowUpRightIcon,
  CheckIcon,
  MapPinIcon,
} from "@/components/icons";
import { Brand, FontFamily } from "@/constants/theme";

import { useRescuerProfileViewModel } from "./useRescuerProfileViewModel";

/** Profile tab for the rescuer shell: account, workload, field shortcuts. */
export function RescuerProfileView() {
  const router = useRouter();
  const { user, profile, loading, error, reload, signOut } =
    useRescuerProfileViewModel();

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "F";

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.eyebrow}>Profile</Text>

          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.name}>
              {user ? user.fullName : "FuRescue account"}
            </Text>
            <Text style={styles.role}>Rescuer volunteer</Text>

            <View style={styles.rule} />

            <InfoRow label="Email" value={user?.email ?? "—"} />
            <InfoRow label="Phone" value={user?.phoneNumber ?? "Not set"} />
            <InfoRow
              label="Status"
              value={user?.accountStatus ? titleCase(user.accountStatus) : "—"}
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Workload</Text>
            <Text style={styles.sectionMeta}>
              {loading ? "Loading" : "Live"}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <StatCard label="Assigned" value={profile?.stats.assigned} />
            <StatCard label="In progress" value={profile?.stats.inProgress} />
            <StatCard label="Done today" value={profile?.stats.completedToday} />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.lifetime}>
            {profile
              ? `${profile.lifetimeRescues} lifetime rescue${
                  profile.lifetimeRescues === 1 ? "" : "s"
                } completed`
              : "Lifetime totals unavailable right now."}
          </Text>

          <View style={styles.links}>
            <ProfileLink
              label="Assign"
              hint="Reports assigned to you"
              icon={<MapPinIcon size={17} color={Brand.clay} />}
              onPress={() => router.navigate("/queue" as Href)}
            />
            <ProfileLink
              label="Rescue history"
              hint="Completed and failed operations"
              icon={<CheckIcon size={17} color={Brand.clay} />}
              onPress={() => router.navigate("/history" as Href)}
            />
          </View>

          <Pressable
            onPress={handleSignOut}
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
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

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
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
  card: {
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 22,
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.forest,
  },
  avatarText: {
    fontFamily: FontFamily.display,
    fontSize: 26,
    color: Brand.paper,
  },
  name: {
    marginTop: 14,
    fontFamily: FontFamily.display,
    fontSize: 28,
    letterSpacing: -0.6,
    color: Brand.ink,
    textAlign: "center",
  },
  role: {
    marginTop: 4,
    fontFamily: FontFamily.medium,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: Brand.clay,
  },
  rule: {
    height: 1,
    alignSelf: "stretch",
    backgroundColor: Brand.line,
    marginVertical: 18,
  },
  infoRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 9,
  },
  infoLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  infoValue: {
    flexShrink: 1,
    fontFamily: FontFamily.sans,
    fontSize: 13,
    color: Brand.ink,
  },
  sectionHeader: {
    marginTop: 26,
    marginBottom: 12,
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
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  statValue: {
    fontFamily: FontFamily.display,
    fontSize: 28,
    lineHeight: 30,
    color: Brand.ink,
  },
  statLabel: {
    marginTop: 3,
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
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
  lifetime: {
    marginTop: 12,
    fontFamily: FontFamily.sans,
    fontSize: 12.5,
    color: Brand.ink55,
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
