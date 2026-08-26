import { Tabs } from "expo-router";
import { colors, fonts } from "@/lib/theme";

/**
 * Four tabs mirroring what the website's nav offered: the shop window, search,
 * the swipe feed, and the account.
 *
 * Text-only, no icons. `@expo/vector-icons` was tried and dropped: its font
 * assets wouldn't resolve on the web target from this monorepo layout, and an
 * icon set is a lot of dependency for a system that is deliberately austere —
 * uppercase tracked labels are the house style (see DESIGN.md).
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
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
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen name="explore" options={{ title: "Explore" }} />
      <Tabs.Screen name="account" options={{ title: "Account" }} />
    </Tabs>
  );
}
