import { AdminPageSkeleton } from "@/components/admin/page-skeleton";

export default function Loading() {
  return <AdminPageSkeleton stats={0} variant="table" rows={8} filters={false} label="Loading notifications" />;
}
