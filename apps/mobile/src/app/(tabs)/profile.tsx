import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Skeleton } from "@/components/skeleton";
import { Brand } from "@/constants/theme";
import { useHomeViewModel } from "@/features/auth/useHomeViewModel";
import { ResidentProfileView } from "@/features/resident/ResidentProfileView";
import { RescuerProfileView } from "@/features/rescuer/RescuerProfileView";

export default function ProfileScreen() {
  const { user, loading } = useHomeViewModel();

  if (loading && !user) {
    return <ProfileSkeleton />;
  }

  if (user?.role === "rescuer") {
    return <RescuerProfileView />;
  }

  return <ResidentProfileView />;
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
  card: {
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 22,
    alignItems: "center",
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
});
