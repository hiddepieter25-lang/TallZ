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
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { genericAuthMessage } from "@/lib/auth-errors";
import { useAuth } from "@/lib/auth";
import { colors, radius, space, type, MIN_TAP } from "@/lib/theme";

/**
 * Where a password-recovery link lands.
 *
 * By the time this renders, the deep-link handler in `_layout.tsx` has already
 * turned the link into a real session — that session is what authorises the
 * update below. The screen is therefore reachable while signed in, which is why
 * `useProtectedRoute` exempts it.
 */
export default function ResetPassword() {
  const { linkError } = useLocalSearchParams<{ linkError?: string }>();
  const { session } = useAuth();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const save = async () => {
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setPending(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (updateError) {
      setError(genericAuthMessage(updateError.message));
      return;
    }
    // The recovery session is a real session, so they are already logged in.
    router.replace("/");
  };

  // Either the link was expired/reused, or this screen was opened directly.
  // Both leave nothing to update, and both are fixed the same way.
  if (linkError || !session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.inner}>
          <Text style={styles.eyebrow}>Account</Text>
          <Text style={styles.title}>link expired</Text>
          <Text style={styles.body}>
            {linkError
              ? "That reset link is no longer valid — they can only be used once, and they expire."
              : "Open this screen from the link in your email, so we know which account to change."}
          </Text>
          <Link href="/forgot-password" style={styles.link}>
            Send a new link
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
          <Text style={styles.title}>new password</Text>

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="New password"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoComplete="new-password"
            secureTextEntry
            style={styles.input}
          />
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Repeat new password"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoComplete="new-password"
            secureTextEntry
            style={styles.input}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            onPress={save}
            disabled={pending || !password || !confirm}
            style={({ pressed }) => [
              styles.button,
              (pending || !password || !confirm) && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            {pending ? (
              <ActivityIndicator color={colors.onAccent} />
            ) : (
              <Text style={styles.buttonText}>Save password</Text>
            )}
          </Pressable>
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
  link: { ...type.small, color: colors.foreground, textDecorationLine: "underline" },
});
