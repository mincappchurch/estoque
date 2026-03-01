const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
const isCi = process.env.CI === "true" || Boolean(process.env.VERCEL);

module.exports = withNativeWind(config, {
  input: "./global.css",
  // In CI/Vercel keep CSS virtual to avoid SHA-1 lookup issues on generated cache files
  forceWriteFileSystem: !isCi,
});
