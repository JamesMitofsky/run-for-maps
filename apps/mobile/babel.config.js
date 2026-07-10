module.exports = function (api) {
  api.cache(true);
  return {
    // Uniwind needs no Babel preset (it works via the Metro transform), so this
    // is plain Expo — plus the Reanimated 4 worklets plugin, which must be last.
    presets: ["babel-preset-expo"],
    plugins: ["react-native-worklets/plugin"],
  };
};
