const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure for web compatibility
config.resolver.platforms = ['ios', 'android', 'web'];

// Block react-native-maps entirely on web
config.resolver.resolverMainFields = ['browser', 'main'];

// Custom resolver to handle problematic modules
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Block react-native-maps and related modules on web
  if (platform === 'web' && (
    moduleName === 'react-native-maps' ||
    moduleName.includes('react-native-maps') ||
    moduleName.includes('codegenNativeCommands')
  )) {
    // Return a dummy module
    return {
      filePath: require.resolve('./web-stubs/react-native-maps.js'),
      type: 'sourceFile',
    };
  }
  
  // Default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;