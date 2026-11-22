import { useHomeViewModel } from "@/features/auth/useHomeViewModel";
import { CommunityFeedView } from "@/features/community/CommunityFeedView";
import { RescuerHomeView } from "@/features/rescuer/RescuerHomeView";

/** Resident landing tab (Feed); rescuers keep their Today dashboard. */
export default function HomeScreen() {
  const { user } = useHomeViewModel();

  return user?.role === "rescuer" ? (
    <RescuerHomeView />
  ) : (
    <CommunityFeedView showBack={false} />
  );
}
