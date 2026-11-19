import { AdminPageSkeleton } from "@/components/admin/page-skeleton";

export default function Loading() {
  return <AdminPageSkeleton stats={0} variant="split" filters={false} label="Loading conversations" />;
}
