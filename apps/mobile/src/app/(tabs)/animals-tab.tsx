import { ResidentAdoptionsView } from "@/features/adoptions/ResidentAdoptionsView";
import { AnimalsView } from "@/features/animals/AnimalsView";
import { useHomeViewModel } from "@/features/auth/useHomeViewModel";

/** Animals tab: residents see adoptable listings, rescuers keep animal records. */
export default function AnimalsTabScreen() {
  const { user } = useHomeViewModel();

  return user?.role === "rescuer" ? (
    <AnimalsView showBack={false} />
  ) : (
    <ResidentAdoptionsView />
  );
}
