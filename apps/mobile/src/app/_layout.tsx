import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
} from "@expo-google-fonts/geist";
import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from "@expo-google-fonts/instrument-serif";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { Brand } from "@/constants/theme";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "onboarding",
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Brand.paper },
        }}
      >
        <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
        <Stack.Screen name="login" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="signup" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="auth/google" options={{ animation: "fade" }} />
        <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
        <Stack.Screen
          name="assignments/[id]"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="chat/[userId]"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="reports"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="send-report"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="report-detail"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="explore-map"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="animals"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="adoption"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="adoption-applications"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="community"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="modules/index"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="modules/[id]"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{ animation: "slide_from_right" }}
        />
      </Stack>
    </>
  );
}
