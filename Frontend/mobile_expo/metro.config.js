const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

const config = getDefaultConfig(__dirname, { isCSSEnabled: true })

// Envelopper la configuration avec NativeWind puis avec Reanimated
module.exports = wrapWithReanimatedMetroConfig(withNativeWind(config, { input: './app/global.css' })); 