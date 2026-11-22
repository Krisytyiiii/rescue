import { useRouter } from "expo-router";

import { PlaceholderScreen } from "@/components/placeholder-screen";
import { HomeIcon } from "@/components/icons";

export default function AdoptionScreen() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      eyebrow="Adoption"
      title="A home after rescue."
      body="Meet animals ready for adoption, read their stories, and start the application to bring one home."
      tint="#C4791B"
      icon={<HomeIcon size={22} color="#C4791B" />}
      onBack={() => router.back()}
    />
  );
}
