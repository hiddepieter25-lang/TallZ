const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

/**
 * Expo's docs say monorepos have been auto-detected since SDK 52, so this file
 * shouldn't be needed — but it is. Without it Metro refuses to resolve *assets*
 * that live in the workspace root's node_modules: `@expo/vector-icons` failed
 * on `vendor/react-native-vector-icons/Fonts/Fontisto.ttf` even though the file
 * is present on disk, because the root wasn't in `watchFolders`.
 *
 * (Expo's own documented snippet references an undefined `projectRoot`
 * variable — corrected here to `__dirname`.)
 */
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the whole monorepo so files outside apps/mobile are resolvable.
config.watchFolders = [monorepoRoot];

// Resolve from the app first, then fall back to the hoisted root packages.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = config;
