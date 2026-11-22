import { useRouter } from "expo-router";

import { PlaceholderScreen } from "@/components/placeholder-screen";
import { CompassIcon } from "@/components/icons";
import { Brand } from "@/constants/theme";

export default function ExploreMapScreen() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      eyebrow="Explore map"
      title="Rescues around you."
      body="A live map of verified reports, nearby rescues, and animals that still need help across Mati City."
      tint={Brand.clay}
      icon={<CompassIcon size={22} color={Brand.clay} />}
      onBack={() => router.back()}
    />
  );
}
