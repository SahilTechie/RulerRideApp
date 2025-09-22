module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo'
    ],
    plugins: [
      // React Native Worklets plugin (for Reanimated 3+)
      'react-native-worklets/plugin',
    ],
  };
};