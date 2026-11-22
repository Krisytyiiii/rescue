import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Brand, FontFamily } from "@/constants/theme";

interface ConfirmOverlayProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * In-app confirmation overlay for field actions. Replaces the native Alert so
 * the consequence is readable and matches the rest of the rescuer UI.
 */
export function ConfirmOverlay({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  pending = false,
  onCancel,
  onConfirm,
}: ConfirmOverlayProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={styles.card}
        >
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Confirm action</Text>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={pending}
              onPress={onCancel}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
                pending && styles.disabled,
              ]}
            >
              <Text style={styles.secondaryText}>{cancelLabel}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={pending}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.confirmButton,
                destructive && styles.confirmButtonDestructive,
                pressed && styles.pressed,
                pending && styles.disabled,
              ]}
            >
              <Text style={styles.confirmText}>
                {pending ? "Saving…" : confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8, 20, 14, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 26,
    backgroundColor: Brand.paper,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    shadowColor: "#08120D",
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  badge: {
    alignSelf: "flex-start",
    height: 24,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: Brand.sand,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontFamily: FontFamily.semibold,
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: Brand.moss,
  },
  title: {
    marginTop: 12,
    fontFamily: FontFamily.semibold,
    fontSize: 20,
    letterSpacing: -0.3,
    color: Brand.ink,
  },
  message: {
    marginTop: 7,
    fontFamily: FontFamily.sans,
    fontSize: 13,
    lineHeight: 20,
    color: Brand.ink70,
  },
  actions: {
    marginTop: 20,
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Brand.ink70,
  },
  confirmButton: {
    flex: 1.3,
    height: 48,
    borderRadius: 999,
    backgroundColor: Brand.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonDestructive: {
    backgroundColor: "#B4462F",
  },
  confirmText: {
    fontFamily: FontFamily.medium,
    fontSize: 13.5,
    color: Brand.paper,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
