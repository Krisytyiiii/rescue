import { AdminPageSkeleton } from "@/components/admin/page-skeleton";

export default function Loading() {
  return <AdminPageSkeleton stats={4} variant="grid" cards={6} label="Loading e-learning modules" />;
}
