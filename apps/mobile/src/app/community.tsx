import { useRouter } from "expo-router";

import { PlaceholderScreen } from "@/components/placeholder-screen";
import { ChatIcon } from "@/components/icons";

export default function CommunityScreen() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      eyebrow="Community feed"
      title="The city, looking out."
      body="Stories, updates, and rescues shared by volunteers, fosters, and the residents who make them possible."
      tint="#3D7E9A"
      icon={<ChatIcon size={22} color="#3D7E9A" />}
      onBack={() => router.back()}
    />
  );
}
