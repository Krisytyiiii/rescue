import { useLocalSearchParams } from "expo-router";

import { ModuleDetailView } from "@/features/learning/ModuleDetailView";

export default function ModuleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const moduleId = Number(id);

  if (!Number.isInteger(moduleId)) return null;

  return <ModuleDetailView id={moduleId} />;
}
