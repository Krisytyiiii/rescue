import type { ReactNode } from "react";

import {
  ChatIcon,
  CheckIcon,
  HomeIcon,
  MapPinIcon,
  PawIcon,
  PersonIcon,
  PlusCircleIcon,
} from "@/components/icons";

export interface TabItem {
  /** Route name inside `(tabs)`. */
  name: string;
  label: string;
  Icon: (props: { size?: number; color?: string }) => ReactNode;
}

/**
 * Resident shell: browse, report, and learn.
 * Order here is the order rendered by the tab bar.
 */
export const RESIDENT_TABS: readonly TabItem[] = [
  { name: "index", label: "Feed", Icon: HomeIcon },
  { name: "report", label: "Report", Icon: PlusCircleIcon },
  { name: "animals-tab", label: "Animals", Icon: PawIcon },
  { name: "messages", label: "Chat", Icon: ChatIcon },
  { name: "profile", label: "Profile", Icon: PersonIcon },
];

/**
 * Rescuer shell: focused on the current shift and field work.
 * Explore/Create are resident-only, so they are absent here.
 */
export const RESCUER_TABS: readonly TabItem[] = [
  { name: "index", label: "Today", Icon: HomeIcon },
  { name: "queue", label: "Assign", Icon: MapPinIcon },
  { name: "history", label: "History", Icon: CheckIcon },
  { name: "messages", label: "Chat", Icon: ChatIcon },
  { name: "profile", label: "Profile", Icon: PersonIcon },
];

/** Chooses the shell for the signed-in account. */
export function tabItemsForRole(role: string | null | undefined): readonly TabItem[] {
  return role === "rescuer" ? RESCUER_TABS : RESIDENT_TABS;
}
