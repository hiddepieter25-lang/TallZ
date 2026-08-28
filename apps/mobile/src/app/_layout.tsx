import { useEffect, useRef } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
} from "@expo-google-fonts/archivo";
import { AuthProvider, useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { isRecovery, parseAuthLink } from "@/lib/deep-links";
import { colors } from "@/lib/theme";

/** Screens reachable without a session. */
const AUTH_SCREENS = ["login", "signup", "forgot-password"];

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

    const route = segments[0];

    // reset-password is the one screen that belongs to neither state: it runs
    // on the short-lived session the recovery link creates, so redirecting a
    // "logged in" user away from it would slam the door on the way in.
    if (route === "reset-password") return;

    const inAuthScreens = AUTH_SCREENS.includes(route as string);

    if (!session && !inAuthScreens) {
      router.replace("/login");
    } else if (session && inAuthScreens) {
      router.replace("/");
    }
  }, [session, ready, segments, router]);
}

/**
 * Turns the links Supabase mails out into a session.
 *
 * Signup confirmation and password recovery both come back into the app as a
 * `tallz://` URL carrying either a PKCE code or a token pair. Supabase's client
 * runs with `detectSessionInUrl: false` (required on native — there is no
 * browser URL), so nothing picks these up unless it is done here.
 */
function useAuthDeepLinks() {
  const url = Linking.useURL();
  const router = useRouter();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!url || handled.current === url) return;
    const link = parseAuthLink(url);
    if (!link) return;

    // Cold start delivers the same URL again on the next render; without this
    // the code would be redeemed twice and the second attempt would fail.
    handled.current = url;

    if (link.kind === "error") {
      router.replace({ pathname: "/reset-password", params: { linkError: link.message } });
      return;
    }

    const recovery = isRecovery(link);

    (async () => {
      const { error } =
        link.kind === "code"
          ? await supabase.auth.exchangeCodeForSession(link.code)
          : await supabase.auth.setSession({
              access_token: link.accessToken,
              refresh_token: link.refreshToken,
            });

      if (error) {
        router.replace({ pathname: "/reset-password", params: { linkError: error.message } });
        return;
      }

      // A recovery link has to land on the new-password screen. A confirmation
      // link just needed the session — useProtectedRoute takes it from here.
      if (recovery) router.replace("/reset-password");
    })();
  }, [url, router]);
}

function RootNavigator() {
  useProtectedRoute();
  useAuthDeepLinks();

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
