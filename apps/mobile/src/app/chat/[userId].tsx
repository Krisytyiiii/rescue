import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState, type ElementRef } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChevronLeftIcon, PawIcon, PersonIcon, SendIcon } from "@/components/icons";
import { Brand, FontFamily } from "@/constants/theme";
import type { ChatMessage } from "@/domain/messaging";
import { useChatViewModel } from "@/features/messages/useChatViewModel";

function timeLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function ChatScreen() {
  const router = useRouter();
  const { userId, name, role } = useLocalSearchParams<{
    userId: string;
    name?: string;
    role?: string;
  }>();
  const { contactName, messages, loading, ready, error, loadError, send, deleteMessage } =
    useChatViewModel(userId, name);
  const [body, setBody] = useState("");
  const [selected, setSelected] = useState<ChatMessage | null>(null);
  const scrollRef = useRef<ElementRef<typeof ScrollView>>(null);

  const isAdmin = role === "admin";

  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd(), 80);
    return () => clearTimeout(timer);
  }, [messages.length]);

  const submit = () => {
    const text = body.trim();
    if (!text) return;
    setBody("");
    send(text);
  };

  const canSend = body.trim().length > 0;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to messages"
              hitSlop={10}
              onPress={() => router.back()}
              style={({ pressed }) => [styles.back, pressed && styles.pressed]}
            >
              <ChevronLeftIcon size={20} color={Brand.ink} />
            </Pressable>

            <View style={styles.headerAvatar}>
              <Text style={styles.headerInitial}>
                {contactName.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.headerBody}>
              <Text style={styles.headerName} numberOfLines={1}>
                {contactName}
              </Text>
              <Text style={styles.headerMeta}>Direct message</Text>
            </View>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.thread}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {!ready && messages.length === 0 ? (
              <View style={styles.center}>
                {loading || !loadError ? (
                  <ActivityIndicator size="small" color={Brand.forest} />
                ) : (
                  <Text style={styles.loadError}>{loadError}</Text>
                )}
              </View>
            ) : messages.length === 0 ? (
              <View style={styles.intro}>
                <View style={styles.introAvatar}>
                  <Text style={styles.introInitial}>
                    {contactName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.introTitle}>{contactName}</Text>
                <Text style={styles.introBody}>
                  Say hello. Messages update as they reply.
                </Text>
              </View>
            ) : (
              messages.map((message) => (
                <Bubble
                  key={message.id}
                  message={message}
                  onLongPress={
                    message.isDeleted || message.status === "sending"
                      ? undefined
                      : () => setSelected(message)
                  }
                />
              ))
            )}
          </ScrollView>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.composer}>
            {contactName ? (
              <View style={styles.recipientBar}>
                <View style={styles.recipientAvatar}>
                  <Text style={styles.recipientInitial}>
                    {contactName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.recipientBody}>
                  <Text style={styles.recipientName} numberOfLines={1}>
                    {contactName}
                  </Text>
                </View>
                {isAdmin ? (
                  <PawIcon size={15} color="rgba(255,255,255,0.45)" />
                ) : (
                  <PersonIcon size={15} color="rgba(255,255,255,0.45)" />
                )}
              </View>
            ) : null}

            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Message"
              placeholderTextColor="rgba(255,255,255,0.40)"
              multiline
              style={styles.input}
            />

            <View style={styles.composerFooter}>
              <View style={styles.toPill}>
                <PersonIcon size={13} color="#C6E87B" />
                <Text style={styles.toText} numberOfLines={1}>
                  {contactName}
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send message"
                disabled={!canSend}
                onPress={() => void submit()}
                style={({ pressed }) => [
                  styles.sendButton,
                  !canSend && styles.sendDisabled,
                  pressed && canSend && styles.pressed,
                ]}
              >
                <SendIcon size={18} color={Brand.forest} />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setSelected(null)}>
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={styles.sheet}
          >
            <Text style={styles.sheetTitle}>Delete message</Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                const id = selected?.id;
                setSelected(null);
                if (id) void deleteMessage(id, "me");
              }}
              style={({ pressed }) => [
                styles.sheetOption,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.sheetOptionText}>Delete for me</Text>
            </Pressable>

            {selected?.mine ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  const id = selected?.id;
                  setSelected(null);
                  if (id) void deleteMessage(id, "everyone");
                }}
                style={({ pressed }) => [
                  styles.sheetOption,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.sheetOptionText, styles.sheetDestructive]}>
                  Delete for everyone
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={() => setSelected(null)}
              style={({ pressed }) => [
                styles.sheetCancel,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function Bubble({
  message,
  onLongPress,
}: {
  message: ChatMessage;
  onLongPress?: () => void;
}) {
  return (
    <View
      style={[styles.bubbleRow, message.mine && styles.bubbleRowMine]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Message options"
        delayLongPress={350}
        onLongPress={onLongPress}
        style={[styles.bubble, message.mine && styles.bubbleMine]}
      >
        <Text
          style={[
            styles.bubbleText,
            message.isDeleted && styles.bubbleDeleted,
            message.mine && styles.bubbleTextMine,
          ]}
        >
          {message.isDeleted ? "This message was deleted" : message.body}
        </Text>
        <Text
          style={[styles.bubbleTime, message.mine && styles.bubbleTimeMine]}
        >
          {message.status === "sending" ? "Sending…" : timeLabel(message.sentAt)}
        </Text>
      </Pressable>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Brand.line,
  },
  back: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31,122,77,0.12)",
  },
  headerInitial: {
    fontFamily: FontFamily.display,
    fontSize: 17,
    color: Brand.forest,
  },
  headerBody: {
    flex: 1,
  },
  headerName: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: Brand.ink,
  },
  headerMeta: {
    marginTop: 1,
    fontFamily: FontFamily.sans,
    fontSize: 11,
    color: Brand.ink55,
  },
  thread: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 8,
  },
  center: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadError: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Brand.ink55,
  },
  intro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 6,
  },
  introAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31,122,77,0.12)",
    marginBottom: 6,
  },
  introInitial: {
    fontFamily: FontFamily.display,
    fontSize: 28,
    color: Brand.forest,
  },
  introTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: Brand.ink,
  },
  introBody: {
    maxWidth: 240,
    textAlign: "center",
    fontFamily: FontFamily.sans,
    fontSize: 12.5,
    lineHeight: 19,
    color: Brand.ink55,
  },
  bubbleRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  bubbleRowMine: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: Brand.paper,
    borderWidth: 1,
    borderColor: Brand.line,
  },
  bubbleMine: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 6,
    backgroundColor: "#1F7A4D",
    borderColor: "#1F7A4D",
  },
  bubbleText: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
    color: Brand.ink,
  },
  bubbleTextMine: {
    color: "#F4FBF5",
  },
  bubbleDeleted: {
    fontStyle: "italic",
    opacity: 0.7,
  },
  bubbleTime: {
    marginTop: 4,
    alignSelf: "flex-end",
    fontFamily: FontFamily.sans,
    fontSize: 9.5,
    color: Brand.ink55,
  },
  bubbleTimeMine: {
    color: "rgba(244,251,245,0.65)",
  },
  error: {
    paddingHorizontal: 18,
    paddingBottom: 8,
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: "#B4462F",
  },
  composer: {
    marginHorizontal: 14,
    marginBottom: 6,
    padding: 14,
    borderRadius: 26,
    backgroundColor: "#141815",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    shadowColor: "#0B100D",
    shadowOpacity: 0.28,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  recipientBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  recipientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(198,232,123,0.14)",
    borderWidth: 1,
    borderColor: "rgba(198,232,123,0.22)",
  },
  recipientInitial: {
    fontFamily: FontFamily.display,
    fontSize: 17,
    color: "#C6E87B",
  },
  recipientBody: {
    flex: 1,
  },
  recipientName: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: "#F2F5EF",
  },
  input: {
    marginTop: 14,
    minHeight: 44,
    maxHeight: 130,
    padding: 0,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    lineHeight: 21,
    color: "#F2F5EF",
    textAlignVertical: "top",
  },
  composerFooter: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: 150,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  toText: {
    flexShrink: 1,
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: "#DDE6D9",
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginLeft: "auto",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F5EF",
  },
  sendDisabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.7,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(8, 20, 14, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  sheet: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    backgroundColor: Brand.paper,
    padding: 16,
    gap: 6,
  },
  sheetTitle: {
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 10,
    fontFamily: FontFamily.semibold,
    fontSize: 16,
    color: Brand.ink,
  },
  sheetOption: {
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 14,
    justifyContent: "center",
    backgroundColor: Brand.paper2,
  },
  sheetOptionText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Brand.ink,
  },
  sheetDestructive: {
    color: "#B4462F",
  },
  sheetCancel: {
    marginTop: 4,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetCancelText: {
    fontFamily: FontFamily.medium,
    fontSize: 13.5,
    color: Brand.ink55,
  },
});
