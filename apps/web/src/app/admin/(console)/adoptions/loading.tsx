import { AdminPageSkeleton } from "@/components/admin/page-skeleton";

export default function Loading() {
  return <AdminPageSkeleton stats={4} variant="split" label="Loading adoptions" />;
}
