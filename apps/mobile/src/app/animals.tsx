import { useRouter } from "expo-router";

import { PlaceholderScreen } from "@/components/placeholder-screen";
import { PawIcon } from "@/components/icons";

export default function AnimalsScreen() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      eyebrow="Animals"
      title="Every animal, one place."
      body="Browse rescued animals, follow their recovery, and see the care each one is receiving from the network."
      tint="#6B4FC2"
      icon={<PawIcon size={22} color="#6B4FC2" />}
      onBack={() => router.back()}
    />
  );
}
