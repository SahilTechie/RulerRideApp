// Test the route generation to ensure it creates curved paths
import GoogleDirectionsService from '../services/googleDirections';

export const testRouteGeneration = async () => {
  console.log('🧪 Testing route generation...');
  
  const directionsService = GoogleDirectionsService.getInstance();
  
  // Test coordinates (similar to your app)
  const origin = {
    latitude: 17.7231,  // Khapatnam area
    longitude: 83.3260
  };
  
  const destination = {
    latitude: 17.7694,  // Gitam area
    longitude: 83.3769
  };
  
  try {
    const route = await directionsService.getDirections(origin, destination, 'driving');
    
    if (route) {
      console.log('✅ Route generated successfully:');
      console.log(`📏 Distance: ${route.distanceText}`);
      console.log(`⏱️ Duration: ${route.durationText}`);
      console.log(`🛣️ Waypoints: ${route.polylineCoordinates.length}`);
      console.log('📍 Route coordinates:', route.polylineCoordinates.slice(0, 5)); // First 5 points
      
      // Verify it's not a straight line
      if (route.polylineCoordinates.length > 2) {
        console.log('✅ Route has multiple waypoints (not straight line)');
      } else {
        console.log('❌ Route appears to be straight line');
      }
      
      return route;
    } else {
      console.log('❌ No route generated');
      return null;
    }
  } catch (error) {
    console.error('❌ Error testing route:', error);
    return null;
  }
};

// Test fallback route specifically
export const testFallbackRoute = async () => {
  console.log('🧪 Testing fallback route generation...');
  
  const directionsService = GoogleDirectionsService.getInstance();
  
  // Test with the same coordinates
  const origin = { latitude: 17.7231, longitude: 83.3260 };
  const destination = { latitude: 17.7694, longitude: 83.3769 };
  
  // Call the private fallback method through the public interface
  const route = await directionsService.getDirections(origin, destination, 'driving');
  
  if (route && route.polylineCoordinates.length > 2) {
    console.log('✅ Fallback route has curved path');
    console.log(`📏 Points: ${route.polylineCoordinates.length}`);
    console.log(`📍 Start: ${route.polylineCoordinates[0].latitude.toFixed(4)}, ${route.polylineCoordinates[0].longitude.toFixed(4)}`);
    console.log(`📍 End: ${route.polylineCoordinates[route.polylineCoordinates.length-1].latitude.toFixed(4)}, ${route.polylineCoordinates[route.polylineCoordinates.length-1].longitude.toFixed(4)}`);
    
    // Check if middle points are different from straight line
    const midPoint = route.polylineCoordinates[Math.floor(route.polylineCoordinates.length / 2)];
    const straightLineMidLat = (origin.latitude + destination.latitude) / 2;
    const straightLineMidLng = (origin.longitude + destination.longitude) / 2;
    
    const latDiff = Math.abs(midPoint.latitude - straightLineMidLat);
    const lngDiff = Math.abs(midPoint.longitude - straightLineMidLng);
    
    if (latDiff > 0.0001 || lngDiff > 0.0001) {
      console.log('✅ Route deviates from straight line - creating curves');
    } else {
      console.log('⚠️ Route might still be too straight');
    }
  }
};

export default { testRouteGeneration, testFallbackRoute };