import { useLocalSearchParams } from "expo-router";

import { ReportDetailView } from "@/features/reports/ReportDetailView";

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <ReportDetailView id={id} />;
}
