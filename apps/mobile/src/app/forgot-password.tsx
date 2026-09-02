import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link } from "expo-router";
import * as Linking from "expo-linking";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { t } from "@/lib/i18n";
import { colors, radius, space, type, MIN_TAP } from "@/lib/theme";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  const requestReset = async () => {
    setPending(true);
    // createURL resolves to tallz://reset-password in a real build, and to the
    // Expo Go / localhost equivalent while developing — so the same code works
    // in both without a hardcoded scheme.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Linking.createURL("/reset-password"),
    });
    // Reported as sent whether or not the address has an account. Saying
    // "no such user" would let anyone check which emails are registered.
    setSent(true);
    setPending(false);
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.inner}>
          <Text style={styles.eyebrow}>{t("auth.sentEyebrow")}</Text>
          <Text style={styles.title}>{t("auth.sentTitle")}</Text>
          <Text style={styles.body}>{t("auth.sentBody", { email })}</Text>
          <Link href="/login" style={styles.link}>
            {t("auth.backToLogin")}
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.inner}>
          <Text style={styles.eyebrow}>{t("auth.accountEyebrow")}</Text>
          <Text style={styles.title}>{t("auth.resetTitle")}</Text>
          <Text style={styles.body}>{t("auth.resetBody")}</Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t("auth.email")}
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            style={styles.input}
          />

          <Pressable
            onPress={requestReset}
            disabled={pending || !email}
            style={({ pressed }) => [
              styles.button,
              (pending || !email) && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            {pending ? (
              <ActivityIndicator color={colors.onAccent} />
            ) : (
              <Text style={styles.buttonText}>{t("auth.sendLink")}</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("auth.remembered")}</Text>
            <Link href="/login" style={styles.link}>
              {t("auth.login")}
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: space.xl, gap: space.md },
  eyebrow: { ...type.label, color: colors.muted },
  title: { ...type.hero, color: colors.foreground },
  body: { ...type.small, color: colors.muted, marginBottom: space.md },
  input: {
    ...type.body,
    height: 52,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    borderColor: colors.foreground,
    borderRadius: radius.pill,
    color: colors.foreground,
  },
  button: {
    minHeight: MIN_TAP,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginTop: space.sm,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonPressed: { opacity: 0.8 },
  buttonText: { ...type.label, color: colors.onAccent },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: space.lg },
  footerText: { ...type.small, color: colors.muted },
  link: { ...type.small, color: colors.foreground, textDecorationLine: "underline" },
});
