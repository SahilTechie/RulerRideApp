const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure for web compatibility
config.resolver.platforms = ['ios', 'android', 'web'];
config.resolver.resolverMainFields = ['browser', 'main'];

// Safer custom resolver
config.resolver.resolveRequest = (context, moduleName, platform) => {
  try {
    // Block problematic modules on web
    if (platform === 'web' && (
      moduleName === 'react-native-maps' ||
      moduleName.startsWith('react-native-maps/')
    )) {
      return {
        filePath: require.resolve('./web-stubs/react-native-maps.js'),
        type: 'sourceFile',
      };
    }
    
    // Default resolution
    return context.resolveRequest(context, moduleName, platform);
  } catch (error) {
    // Fallback to default resolution
    return context.resolveRequest(context, moduleName, platform);
  }
};

module.exports = config;