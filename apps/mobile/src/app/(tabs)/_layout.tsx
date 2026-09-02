import { Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Tabs, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { t } from "@/lib/i18n";
import { colors, fonts, space, MIN_TAP } from "@/lib/theme";

/**
 * Three tabs: search, the swipe feed, and the account.
 *
 * Home is deliberately not among them. It is the introduction — what the app
 * is and why to make an account — so it belongs to the first visit, not to a
 * permanent slot in the bar. Once signed in you reach it only by tapping the
 * logo above, which is the whole reason that logo is there.
 *
 * Text-only labels, no icons. `@expo/vector-icons` was tried and dropped: its
 * font assets wouldn't resolve on the web target from this monorepo layout, and
 * an icon set is a lot of dependency for a system that is deliberately austere —
 * uppercase tracked labels are the house style (see DESIGN.md).
 */
/**
 * Room for the logo, measured from the bottom of the status bar. The header's
 * `height` is its *total* height — react-navigation renders a spacer of
 * headerStatusBarHeight inside it — so a fixed number would leave a phone with
 * a notch roughly 47pt short and clip the logo. Adding the inset keeps the
 * visible area the same on every device.
 */
const HEADER_CONTENT_HEIGHT = 76;

export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerShadowVisible: false,
        // Taller than the default 44pt (iOS) / 56pt (Android): the logo is the
        // only thing in here, so the header is sized to it rather than the
        // other way round.
        headerStyle: {
          backgroundColor: colors.background,
          height: insets.top + HEADER_CONTENT_HEIGHT,
        },
        // The whole header is the logo and nothing else — no title text, no
        // buttons. It is a way back to the introduction, not a toolbar.
        headerTitle: () => (
          <Pressable
            onPress={() => router.push("/")}
            hitSlop={space.md}
            style={styles.logoTap}
            accessibilityRole="button"
            accessibilityLabel={t("header.logo")}
          >
            <Image
              source={require("../../../assets/tallz-logo.png")}
              style={styles.logo}
              contentFit="contain"
            />
          </Pressable>
        ),
        tabBarActiveTintColor: colors.foreground,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.line,
          height: 64,
          paddingTop: 10,
          paddingBottom: 10,
        },
        tabBarIcon: () => null,
        tabBarLabelStyle: {
          fontFamily: fonts.semibold,
          fontSize: 11,
          letterSpacing: 0.8,
          textTransform: "uppercase",
        },
      }}
    >
      <Tabs.Screen name="search" options={{ title: t("tabs.search") }} />
      <Tabs.Screen name="explore" options={{ title: t("tabs.explore") }} />
      <Tabs.Screen name="account" options={{ title: t("tabs.account") }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Height is the tap target; the logo itself is smaller and centred in it.
  logoTap: { minHeight: MIN_TAP, justifyContent: "center", paddingHorizontal: space.md },
  // tallz-logo.png is 641x315, so 2.03:1. The box has to match that ratio or
  // contentFit="contain" shrinks the logo to whichever side runs out first —
  // an 82x24 box rendered it at 49pt wide, roughly half its intended size.
  logo: { width: 122, height: 60 },
});
