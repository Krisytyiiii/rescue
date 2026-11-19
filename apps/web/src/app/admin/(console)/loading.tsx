import { AdminPageSkeleton } from "@/components/admin/page-skeleton";

export default function Loading() {
  return <AdminPageSkeleton stats={4} variant="dashboard" filters={false} label="Loading dashboard" />;
}
