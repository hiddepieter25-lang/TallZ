import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
} from "@expo-google-fonts/archivo";
import { AuthProvider, useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

/**
 * Sends signed-out users to the login screen and signed-in users away from it.
 * Waits for `ready` so a returning user with a stored session isn't bounced
 * out during the moment before that session has been read from SecureStore.
 */
function useProtectedRoute() {
  const { session, ready } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;

    const inAuthScreens = segments[0] === "login" || segments[0] === "signup";

    if (!session && !inAuthScreens) {
      router.replace("/login");
    } else if (session && inAuthScreens) {
      router.replace("/");
    }
  }, [session, ready, segments, router]);
}

function RootNavigator() {
  useProtectedRoute();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
  });

  // Rendering before the fonts resolve shows a system-font flash, then a
  // relayout. Holding the render is the cheaper trade.
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
