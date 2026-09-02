import { Platform, StyleSheet, View } from "react-native";

/**
 * Constrains the web preview to a phone-sized window.
 *
 * `expo start --web` fills the browser, so the layout being reviewed is one no
 * user will ever see — three-column grids look sparse, text lines run long, and
 * anything anchored to the bottom sits far from a thumb. This makes the preview
 * the shape of the thing being built.
 *
 * Native returns children untouched: on a real device the phone already is the
 * frame. It costs one View on web and nothing at all on iOS or Android.
 *
 * 390 x 844 is the iPhone 14/15/16 logical size — the middle of the range, and
 * what the design in DESIGN.md was drawn against.
 */
const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== "web") return <>{children}</>;

  return (
    <View style={styles.backdrop}>
      <View style={styles.phone}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    // A definite height, not flex alone: nothing above this on web has one, so
    // `height: "100%"` on the phone resolved against nothing and collapsed the
    // frame to 2px. Measured, not assumed — the first attempt did exactly that.
    minHeight: PHONE_HEIGHT + 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8E8E8",
  },
  phone: {
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,
    overflow: "hidden",
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    // A visible edge, so it reads as a device rather than a narrow page.
    borderWidth: 1,
    borderColor: "#D0D0D0",
  },
});
