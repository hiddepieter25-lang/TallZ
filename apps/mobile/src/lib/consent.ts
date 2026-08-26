import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "tallz-consent";

export type ConsentState = "all" | "essential";

/**
 * Same two-state consent model as the web app, backed by AsyncStorage instead
 * of localStorage. `null` means the user hasn't chosen yet — and until they
 * do, nothing is tracked. Outbound links to retailers always work regardless;
 * consent only gates whether we log the interaction.
 */
export async function getConsent(): Promise<ConsentState | null> {
  const v = await AsyncStorage.getItem(KEY);
  return v === "all" || v === "essential" ? v : null;
}

export async function setConsent(state: ConsentState): Promise<void> {
  await AsyncStorage.setItem(KEY, state);
}

export async function hasAnalyticsConsent(): Promise<boolean> {
  return (await getConsent()) === "all";
}
