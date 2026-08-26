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
import { colors, radius, space, type, MIN_TAP } from "@/lib/theme";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  const signUp = async () => {
    setPending(true);
    setError(null);
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError(genericAuthMessage(signUpError.message));
    } else if (!data.session) {
      // Email confirmation is on, so there's no session yet — say so rather
      // than leaving the user on a screen that looks like it did nothing.
      setSent(true);
    }
    setPending(false);
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.inner}>
          <Text style={styles.eyebrow}>Almost there</Text>
          <Text style={styles.title}>check your email</Text>
          <Text style={styles.body}>
            We sent a confirmation link to {email}. Open it, then come back and log in.
          </Text>
          <Link href="/login" style={styles.link}>
            Back to log in
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
          <Text style={styles.eyebrow}>Account</Text>
          <Text style={styles.title}>create account</Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password (min. 8 characters)"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            secureTextEntry
            style={styles.input}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            onPress={signUp}
            disabled={pending || !email || password.length < 8}
            style={({ pressed }) => [
              styles.button,
              (pending || !email || password.length < 8) && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            {pending ? (
              <ActivityIndicator color={colors.onAccent} />
            ) : (
              <Text style={styles.buttonText}>Create account</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/login" style={styles.link}>
              Log in
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
  body: { ...type.body, color: colors.muted },
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
  footer: { flexDirection: "row", justifyContent: "center", marginTop: space.lg },
  footerText: { ...type.small, color: colors.muted },
  link: { ...type.small, color: colors.foreground, textDecorationLine: "underline" },
});
