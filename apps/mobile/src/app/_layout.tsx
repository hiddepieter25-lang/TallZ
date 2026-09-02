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
import { CatalogProvider } from "@/lib/catalog";
import { PhoneFrame } from "@/components/PhoneFrame";
import { supabase } from "@/lib/supabase";
import { isRecovery, parseAuthLink } from "@/lib/deep-links";
import { colors } from "@/lib/theme";

/** Screens reachable without a session. */
const AUTH_SCREENS = ["login", "signup", "forgot-password"];

/**
 * Sends signed-out users to the introduction and signed-in users into the app.
 * Waits for `ready` so a returning user with a stored session isn't bounced
 * out during the moment before that session has been read from SecureStore.
 */
function useProtectedRoute() {
  const { session, ready } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const settledInitialRoute = useRef(false);

  useEffect(() => {
    if (!ready) return;

    // The root route "/" has no segments at all, unlike every other screen.
    const route = segments[0];
    const atIntroduction = route === undefined;

    // A returning user shouldn't open onto the introduction — they have read it.
    // Once only: after this, "/" is somewhere you go on purpose, which is
    // exactly what tapping the logo does, so repeating this would trap them.
    if (!settledInitialRoute.current) {
      settledInitialRoute.current = true;
      if (session && atIntroduction) {
        router.replace("/search");
        return;
      }
    }

    // Two screens belong to neither state. The introduction is the shop window
    // for a visitor without an account and the logo's destination for one with
    // it; reset-password runs on the short-lived session a recovery link
    // creates, so "signed in users don't belong on auth screens" would slam
    // the door on the way in.
    if (atIntroduction || route === "reset-password") return;

    const inAuthScreens = AUTH_SCREENS.includes(route);

    if (!session && !inAuthScreens) {
      // Not to /login: someone arriving without an account should meet the
      // introduction first and decide, rather than face a password box.
      router.replace("/");
    } else if (session && inAuthScreens) {
      router.replace("/search");
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
      <PhoneFrame>
        <AuthProvider>
          <CatalogProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </CatalogProvider>
        </AuthProvider>
      </PhoneFrame>
    </SafeAreaProvider>
  );
}
