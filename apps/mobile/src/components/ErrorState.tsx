import { Pressable, StyleSheet, Text, View } from "react-native";
import { t } from "@/lib/i18n";
import { colors, radius, space, type, MIN_TAP } from "@/lib/theme";

/**
 * What a screen shows when the catalog couldn't be loaded.
 *
 * Every screen used to swallow the failure and render an empty list, so no
 * internet looked identical to no products — the same silent failure shape as
 * the RLS trap, just for the network. A message and a retry are the minimum.
 */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.message}>{message}</Text>
      <Pressable onPress={onRetry} style={styles.button} accessibilityRole="button">
        <Text style={styles.buttonText}>{t("error.retry")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingHorizontal: space.xl, gap: space.lg },
  message: { ...type.body, color: colors.muted, textAlign: "center" },
  button: {
    minHeight: MIN_TAP,
    justifyContent: "center",
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.foreground,
  },
  buttonText: { ...type.label, color: colors.foreground },
});
