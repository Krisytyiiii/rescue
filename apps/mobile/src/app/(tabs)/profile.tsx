import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ArrowUpRightIcon } from "@/components/icons";
import { Skeleton } from "@/components/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { Brand, FontFamily } from "@/constants/theme";
import { useHomeViewModel } from "@/features/auth/useHomeViewModel";
import { RescuerProfileView } from "@/features/rescuer/RescuerProfileView";

function roleLabel(role: string | undefined) {
  if (role === "rescuer") return "Rescuer volunteer";
  if (role === "admin") return "Administrator";
  return "Community member";
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, loading, signOut } = useHomeViewModel();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  if (user?.role === "rescuer") {
    return <RescuerProfileView />;
  }

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.eyebrow}>Profile</Text>

          <View style={styles.card}>
            <UserAvatar
              uri={user?.profilePhotoUrl}
              size={64}
              backgroundColor={Brand.forest}
              iconColor={Brand.paper}
            />
            <Text style={styles.name}>
              {user ? user.fullName : "FuRescue account"}
            </Text>
            <Text style={styles.role}>{roleLabel(user?.role)}</Text>

            <View style={styles.rule} />

            <InfoRow label="Email" value={user?.email ?? "—"} />
            <InfoRow label="Phone" value={user?.phoneNumber ?? "Not set"} />
            <InfoRow
              label="Status"
              value={user?.accountStatus ? titleCase(user.accountStatus) : "—"}
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

function ProfileSkeleton() {
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Skeleton width={62} height={10} borderRadius={5} />

          <View style={styles.card}>
            <Skeleton width={64} height={64} borderRadius={32} />
            <Skeleton
              width={176}
              height={24}
              borderRadius={10}
              style={styles.skeletonName}
            />
            <Skeleton
              width={92}
              height={9}
              borderRadius={4}
              style={styles.skeletonRole}
            />

            <View style={styles.rule} />

            {[0, 1, 2].map((index) => (
              <View key={index} style={styles.infoRow}>
                <Skeleton width={54} height={9} borderRadius={4} />
                <Skeleton width={116} height={11} borderRadius={5} />
              </View>
            ))}
          </View>

          <View style={styles.signOut}>
            <Skeleton width={78} height={13} borderRadius={6} />
            <Skeleton width={36} height={36} borderRadius={18} />
          </View>
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
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.forest,
  },
  avatarImage: { width: "100%", height: "100%" },
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
  skeletonName: { marginTop: 14 },
  skeletonRole: { marginTop: 8 },
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
