import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { PersonIcon } from "@/components/icons";
import { Brand } from "@/constants/theme";

/**
 * A user's profile photo in a circle. Falls back to a generic person icon when
 * the account has not attached a photo.
 */
export function UserAvatar({
  uri,
  size = 44,
  style,
  backgroundColor = "rgba(31,122,77,0.12)",
  iconColor = Brand.forest,
}: {
  uri?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  iconColor?: string;
}) {
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.image} />
      ) : (
        <PersonIcon size={Math.round(size * 0.52)} color={iconColor} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
