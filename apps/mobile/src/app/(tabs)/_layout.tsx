import { Tabs } from "expo-router/js-tabs";
import { View } from "react-native";

import { GlassTabBar } from "@/components/glass-tab-bar";
import { InterviewReminderSnackbar } from "@/features/adoptions/InterviewReminderSnackbar";
import { useHomeViewModel } from "@/features/auth/useHomeViewModel";

export default function TabsLayout() {
  const { user } = useHomeViewModel();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: "fade",
          sceneStyle: { backgroundColor: "#f2faf4" },
        }}
        tabBar={(props) => <GlassTabBar {...props} />}
      >
        <Tabs.Screen name="index" options={{ title: "Feed" }} />
        <Tabs.Screen name="report" options={{ title: "Report" }} />
        <Tabs.Screen name="animals-tab" options={{ title: "Animals" }} />
        <Tabs.Screen name="explore" options={{ title: "Explore" }} />
        <Tabs.Screen name="create" options={{ title: "Create" }} />
        <Tabs.Screen name="queue" options={{ title: "Assign" }} />
        <Tabs.Screen name="history" options={{ title: "History" }} />
        <Tabs.Screen name="messages" options={{ title: "Chat" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>

      {user?.role === "community_user" ? (
        <InterviewReminderSnackbar />
      ) : null}
    </View>
  );
}
