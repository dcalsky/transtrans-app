const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const config = getSentryExpoConfig(__dirname)
config.resolver.sourceExts.push('sql');
module.exports = withNativeWind(config, { input: './app/global.css' })