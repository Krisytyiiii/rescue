import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BellIcon, CloseIcon } from "@/components/icons";
import { Brand, FontFamily } from "@/constants/theme";
import { interviewTime } from "@/domain/interview-reminders";

import { animalName, formatDateTime, INTERVIEW_VENUE } from "./presentation";
import { useInterviewReminderViewModel } from "./useInterviewReminderViewModel";

/**
 * Resident snackbar for upcoming adoption interviews. Appears ten minutes
 * before the scheduled interview and repeats every five minutes until the
 * application's status changes.
 */
export function InterviewReminderSnackbar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { reminder, visible, dismiss } = useInterviewReminderViewModel();

  if (!reminder || !visible) return null;

  const time = interviewTime(reminder);
  const due = time !== null && Date.now() >= time;
  const when = reminder.interviewSchedule
    ? formatDateTime(reminder.interviewSchedule)
    : "a scheduled time";

  const message = due
    ? `${animalName(reminder.animal)} · the interview was scheduled for ${when}. Venue: ${INTERVIEW_VENUE}.`
    : `${animalName(reminder.animal)} · interview at ${when}. Venue: ${INTERVIEW_VENUE}.`;

  const openApplication = () => {
    dismiss();
    router.push("/adoption-applications" as Href);
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.layer, { top: insets.top + 20 }]}
    >
      <View style={styles.snack}>
        <View style={styles.iconWrap}>
          <BellIcon size={16} color={Brand.sage} />
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>
            {due ? "Interview is due" : "Interview reminder"}
          </Text>
          <Text style={styles.message} numberOfLines={3}>
            {message}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={openApplication}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <Text style={styles.action}>View application</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss interview reminder"
          hitSlop={10}
          onPress={dismiss}
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}
        >
          <CloseIcon size={14} color="rgba(255,255,255,0.65)" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 22,
    alignItems: "center",
  },
  snack: {
    width: "100%",
    maxWidth: 560,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    borderRadius: 18,
    backgroundColor: Brand.forest,
    paddingVertical: 13,
    paddingHorizontal: 14,
    shadowColor: "#0B2E1C",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(185,220,196,0.14)",
  },
  body: {
    flex: 1,
  },
  title: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Brand.paper,
  },
  message: {
    marginTop: 3,
    fontFamily: FontFamily.sans,
    fontSize: 11.5,
    lineHeight: 17,
    color: "rgba(255,255,255,0.72)",
  },
  action: {
    marginTop: 7,
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Brand.sage,
  },
  close: {
    padding: 2,
  },
  pressed: {
    opacity: 0.65,
  },
});
