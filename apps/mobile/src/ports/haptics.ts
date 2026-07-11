import * as Haptics from "expo-haptics";

// Celebratory buzz when an edit is recorded / a point is reached (fire-and-forget).
export function hapticSuccess(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

// Light tick when flipping a selection control (segmented option, route toggle).
export function hapticSelect(): void {
  Haptics.selectionAsync().catch(() => {});
}
