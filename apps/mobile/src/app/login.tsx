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
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { genericAuthMessage } from "@/lib/auth-errors";
import { t } from "@/lib/i18n";
import { colors, radius, space, type, MIN_TAP } from "@/lib/theme";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const signIn = async () => {
    setPending(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setError(genericAuthMessage(signInError.message));
    // On success the auth listener in AuthProvider redirects; nothing to do here.
    setPending(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.inner}>
          <Text style={styles.eyebrow}>{t("auth.accountEyebrow")}</Text>
          <Text style={styles.title}>{t("auth.loginTitle")}</Text>

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
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={t("auth.password")}
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            secureTextEntry
            style={styles.input}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            onPress={signIn}
            disabled={pending || !email || !password}
            style={({ pressed }) => [
              styles.button,
              (pending || !email || !password) && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            {pending ? (
              <ActivityIndicator color={colors.onAccent} />
            ) : (
              <Text style={styles.buttonText}>{t("auth.login")}</Text>
            )}
          </Pressable>

          <Link href="/forgot-password" style={[styles.link, styles.forgot]}>
            {t("auth.forgot")}
          </Link>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("auth.noAccount")}</Text>
            <Link href="/signup" style={styles.link}>
              {t("auth.signup")}
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
  title: { ...type.hero, color: colors.foreground, marginBottom: space.lg },
  input: {
    ...type.body,
    height: 52,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    borderColor: colors.foreground,
    borderRadius: radius.pill,
    color: colors.foreground,
  },
  error: { ...type.small, color: colors.danger },
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
  forgot: { textAlign: "center", marginTop: space.md },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: space.lg },
  footerText: { ...type.small, color: colors.muted },
  link: { ...type.small, color: colors.foreground, textDecorationLine: "underline" },
});
