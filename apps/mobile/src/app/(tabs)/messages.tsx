import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatIcon, PawIcon } from "@/components/icons";
import { Brand, FontFamily } from "@/constants/theme";
import { useMessagesViewModel } from "@/features/messages/useMessagesViewModel";

export default function MessagesScreen() {
  const router = useRouter();
  const { contacts, loading, error, reload } = useMessagesViewModel();

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Messages</Text>
          </View>

          {loading ? (
            <View style={styles.skeletonList}>
              <View style={styles.skeletonRow} />
              <View style={styles.skeletonRow} />
              <View style={styles.skeletonRow} />
            </View>
          ) : contacts.length === 0 ? (
            <View style={styles.emptyCard}>
              <PawIcon size={20} color={Brand.ink55} />
              <Text style={styles.emptyTitle}>No contacts yet</Text>
              <Text style={styles.emptyBody}>
                Your dispatcher and the reporters of your assigned reports will
                appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.peopleList}>
              {contacts.map((contact) => (
                <Pressable
                  key={contact.userId}
                  accessibilityRole="button"
                  accessibilityLabel={`Chat with ${contact.fullName}`}
                  onPress={() =>
                    router.push({
                      pathname: "/chat/[userId]",
                      params: {
                        userId: contact.userId,
                        name: contact.fullName,
                        role: contact.role,
                        reports: contact.reportCodes.join(", "),
                      },
                    })
                  }
                  style={({ pressed }) => [
                    styles.contact,
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.avatar,
                      contact.role === "admin" && styles.avatarAdmin,
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {contact.fullName.charAt(0)}
                    </Text>
                  </View>

                  <View style={styles.contactBody}>
                    <Text style={styles.contactName} numberOfLines={1}>
                      {contact.fullName}
                    </Text>
                    <Text style={styles.contactMeta} numberOfLines={1}>
                      {contact.role === "admin" ? "Dispatcher" : "Reporter"} ·{" "}
                      {contact.reportCodes.join(", ")}
                    </Text>
                  </View>

                  <View style={styles.chatBadge}>
                    <ChatIcon size={17} color={Brand.forest} />
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.paper2,
  },
  flex: {
    flex: 1,
  },
  content: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 140,
  },
  header: {
    alignItems: "flex-start",
  },
  headerTitle: {
    fontFamily: FontFamily.display,
    fontSize: 38,
    lineHeight: 40,
    letterSpacing: -1,
    color: Brand.ink,
  },
  peopleList: {
    marginTop: 22,
    gap: 8,
  },
  contact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(96,124,255,0.14)",
  },
  avatarAdmin: {
    backgroundColor: "rgba(31,122,77,0.12)",
  },
  avatarText: {
    fontFamily: FontFamily.display,
    fontSize: 19,
    color: Brand.forest,
  },
  contactBody: {
    flex: 1,
  },
  contactName: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Brand.ink,
  },
  contactMeta: {
    marginTop: 3,
    fontFamily: FontFamily.sans,
    fontSize: 11.5,
    color: Brand.ink55,
  },
  chatBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31,122,77,0.08)",
  },
  error: {
    marginTop: 14,
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: "#B4462F",
  },
  emptyCard: {
    marginTop: 22,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 20,
    gap: 6,
  },
  emptyTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Brand.ink,
  },
  emptyBody: {
    fontFamily: FontFamily.sans,
    fontSize: 12.5,
    lineHeight: 19,
    color: Brand.ink55,
  },
  skeletonList: {
    marginTop: 22,
    gap: 8,
  },
  skeletonRow: {
    height: 70,
    borderRadius: 18,
    backgroundColor: "rgba(16,36,26,0.05)",
  },
  pressed: {
    opacity: 0.7,
  },
});
