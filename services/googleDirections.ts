interface Coordinate {
  latitude: number;
  longitude: number;
}

interface RouteStep {
  distance: {
    text: string;
    value: number; // in meters
  };
  duration: {
    text: string;
    value: number; // in seconds
  };
  start_location: {
    lat: number;
    lng: number;
  };
  end_location: {
    lat: number;
    lng: number;
  };
  polyline: {
    points: string;
  };
  instructions: string;
}

interface Route {
  legs: Array<{
    distance: {
      text: string;
      value: number;
    };
    duration: {
      text: string;
      value: number;
    };
    steps: RouteStep[];
    start_address: string;
    end_address: string;
    start_location: {
      lat: number;
      lng: number;
    };
    end_location: {
      lat: number;
      lng: number;
    };
  }>;
  overview_polyline: {
    points: string;
  };
  summary: string;
}

interface DirectionsResponse {
  routes: Route[];
  status: string;
}

class GoogleDirectionsService {
  private static instance: GoogleDirectionsService;
  private apiKey: string = '';
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): GoogleDirectionsService {
    if (!GoogleDirectionsService.instance) {
      GoogleDirectionsService.instance = new GoogleDirectionsService();
    }
    return GoogleDirectionsService.instance;
  }

  async initialize(apiKey: string): Promise<void> {
    if (this.isInitialized) return;
    
    this.apiKey = apiKey;
    this.isInitialized = true;
    console.log('Google Directions Service initialized');
  }

  // Decode Google polyline format to coordinates
  private decodePolyline(encoded: string): Coordinate[] {
    const coordinates: Coordinate[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let byte = 0;
      let shift = 0;
      let result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += deltaLng;

      coordinates.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return coordinates;
  }

  async getDirections(
    origin: Coordinate,
    destination: Coordinate,
    mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
  ): Promise<{
    polylineCoordinates: Coordinate[];
    distance: number; // in km
    duration: number; // in minutes
    distanceText: string;
    durationText: string;
  } | null> {
    try {
      console.log('🛣️ Getting directions from:', origin, 'to:', destination);
      
      if (!this.apiKey) {
        console.log('🔄 No API key, using enhanced fallback route calculation');
        return this.getFallbackRoute(origin, destination);
      }

      const baseUrl = 'https://maps.googleapis.com/maps/api/directions/json';
      const params = new URLSearchParams({
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        mode: mode,
        key: this.apiKey,
      });

      const response = await fetch(`${baseUrl}?${params}`);
      const data: DirectionsResponse = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];

        // Decode the overview polyline to get route coordinates
        const polylineCoordinates = this.decodePolyline(route.overview_polyline.points);

        return {
          polylineCoordinates,
          distance: leg.distance.value / 1000, // Convert to km
          duration: leg.duration.value / 60, // Convert to minutes
          distanceText: leg.distance.text,
          durationText: leg.duration.text,
        };
      } else {
        console.warn('Directions API failed:', data.status);
        return this.getFallbackRoute(origin, destination);
      }
    } catch (error) {
      console.error('Error getting directions:', error);
      return this.getFallbackRoute(origin, destination);
    }
  }

  // Fallback to realistic curved route if API fails
  private getFallbackRoute(
    origin: Coordinate,
    destination: Coordinate
  ): {
    polylineCoordinates: Coordinate[];
    distance: number;
    duration: number;
    distanceText: string;
    durationText: string;
  } {
    console.log('🛤️ Creating road-like route with waypoints');
    
    // Calculate straight-line distance
    const R = 6371; // Earth's radius in km
    const dLat = (destination.latitude - origin.latitude) * Math.PI / 180;
    const dLon = (destination.longitude - origin.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(origin.latitude * Math.PI / 180) * Math.cos(destination.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const straightDistance = R * c;

    // Create realistic road-like path with multiple waypoints
    const latDiff = destination.latitude - origin.latitude;
    const lngDiff = destination.longitude - origin.longitude;
    
    // Create waypoints that simulate road patterns
    const numWaypoints = Math.max(3, Math.floor(straightDistance * 2)); // More waypoints for longer distances
    const polylineCoordinates: Coordinate[] = [origin];
    
    for (let i = 1; i < numWaypoints; i++) {
      const progress = i / numWaypoints;
      
      // Base interpolation
      let lat = origin.latitude + latDiff * progress;
      let lng = origin.longitude + lngDiff * progress;
      
      // Add road-like variations (simulate turns and curves)
      const variation = 0.0008; // Reduced variation for more realistic paths
      
      // Create S-curve effect
      const curveIntensity = Math.sin(progress * Math.PI * 2) * variation;
      lat += curveIntensity;
      lng += curveIntensity * 0.7; // Different curve for longitude
      
      // Add slight random variation to simulate real road patterns
      const randomFactor = 0.0003;
      lat += (Math.random() - 0.5) * randomFactor;
      lng += (Math.random() - 0.5) * randomFactor;
      
      polylineCoordinates.push({ latitude: lat, longitude: lng });
    }
    
    polylineCoordinates.push(destination);

    // Estimate realistic driving distance (usually 1.2-1.4x straight line distance)
    const distance = straightDistance * 1.3;

    // Estimate duration (assuming 25 km/h average with traffic)
    const duration = (distance / 25) * 60; // in minutes

    console.log(`✅ Generated route with ${polylineCoordinates.length} waypoints, distance: ${distance.toFixed(1)}km`);
    
    return {
      polylineCoordinates,
      distance,
      duration,
      distanceText: `${distance.toFixed(1)} km`,
      durationText: `${Math.round(duration)} min`,
    };
  }

  // Get multiple route options
  async getRouteAlternatives(
    origin: Coordinate,
    destination: Coordinate,
    mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
  ): Promise<Array<{
    polylineCoordinates: Coordinate[];
    distance: number;
    duration: number;
    distanceText: string;
    durationText: string;
    summary: string;
  }>> {
    try {
      if (!this.apiKey) {
        const fallback = this.getFallbackRoute(origin, destination);
        return [{
          ...fallback,
          summary: 'Direct route'
        }];
      }

      const baseUrl = 'https://maps.googleapis.com/maps/api/directions/json';
      const params = new URLSearchParams({
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        mode: mode,
        alternatives: 'true',
        key: this.apiKey,
      });

      const response = await fetch(`${baseUrl}?${params}`);
      const data: DirectionsResponse = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        return data.routes.map(route => {
          const leg = route.legs[0];
          const polylineCoordinates = this.decodePolyline(route.overview_polyline.points);

          return {
            polylineCoordinates,
            distance: leg.distance.value / 1000,
            duration: leg.duration.value / 60,
            distanceText: leg.distance.text,
            durationText: leg.duration.text,
            summary: route.summary || 'Route via roads',
          };
        });
      } else {
        const fallback = this.getFallbackRoute(origin, destination);
        return [{
          ...fallback,
          summary: 'Direct route'
        }];
      }
    } catch (error) {
      console.error('Error getting route alternatives:', error);
      const fallback = this.getFallbackRoute(origin, destination);
      return [{
        ...fallback,
        summary: 'Direct route'
      }];
    }
  }
}

export default GoogleDirectionsService;