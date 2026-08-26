import { createContext, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthValue {
  session: Session | null;
  /** False until the stored session has been read — screens must wait for this
   *  before redirecting, or a signed-in user gets bounced to login on launch. */
  ready: boolean;
}

const AuthContext = createContext<AuthValue>({ session: null, ready: false });

export function useAuth() {
  return useContext(AuthContext);
}

// Supabase's own React Native guidance: only refresh tokens while the app is
// in the foreground. Left running in the background it burns battery and can
// fire refreshes the OS then suspends mid-flight.
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    void supabase.auth.startAutoRefresh();
  } else {
    void supabase.auth.stopAutoRefresh();
  }
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ session, ready }}>{children}</AuthContext.Provider>;
}
