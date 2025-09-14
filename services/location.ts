import * as Location from 'expo-location';
import { apiService } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationAddress {
  street?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  formattedAddress?: string;
}

class LocationService {
  private static instance: LocationService;
  private currentLocation: Location.LocationObject | null = null;
  private watchLocationSubscription: Location.LocationSubscription | null = null;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 10,
      });

      this.currentLocation = location;
      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async reverseGeocode(coordinates: LocationCoordinates): Promise<LocationAddress | null> {
    try {
      // Try backend geocoding service first
      try {
        const response = await apiService.post<LocationAddress>('/location/reverse-geocode', {
          coordinates
        }, false);

        if (response.success && response.data) {
          return response.data;
        }
      } catch (backendError) {
        console.warn('Backend geocoding failed, falling back to Expo:', backendError);
      }

      // Fallback to Expo Location
      const results = await Location.reverseGeocodeAsync(coordinates);
      
      if (results && results.length > 0) {
        const result = results[0];
        const formattedAddress = [
          result.name,
          result.street,
          result.city,
          result.region
        ].filter(Boolean).join(', ');

        return {
          street: result.street || undefined,
          city: result.city || undefined,
          region: result.region || undefined,
          postalCode: result.postalCode || undefined,
          country: result.country || undefined,
          formattedAddress: formattedAddress || 'Unknown location'
        };
      }
      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  async forwardGeocode(address: string): Promise<LocationCoordinates | null> {
    try {
      // Try backend geocoding service first
      try {
        const response = await apiService.post<LocationCoordinates>('/location/forward-geocode', {
          address
        }, false);

        if (response.success && response.data) {
          return response.data;
        }
      } catch (backendError) {
        console.warn('Backend forward geocoding failed, falling back to Expo:', backendError);
      }

      // Fallback to Expo Location
      const results = await Location.geocodeAsync(address);
      
      if (results && results.length > 0) {
        return {
          latitude: results[0].latitude,
          longitude: results[0].longitude
        };
      }
      return null;
    } catch (error) {
      console.error('Error forward geocoding:', error);
      return null;
    }
  }

  calculateDistance(coord1: LocationCoordinates, coord2: LocationCoordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(coord2.latitude - coord1.latitude);
    const dLon = this.deg2rad(coord2.longitude - coord1.longitude);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(coord1.latitude)) * Math.cos(this.deg2rad(coord2.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  async startLocationTracking(
    callback: (location: Location.LocationObject) => void,
    options?: {
      accuracy?: Location.Accuracy;
      timeInterval?: number;
      distanceInterval?: number;
    }
  ): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      this.watchLocationSubscription = await Location.watchPositionAsync(
        {
          accuracy: options?.accuracy || Location.Accuracy.High,
          timeInterval: options?.timeInterval || 5000,
          distanceInterval: options?.distanceInterval || 10,
        },
        (location) => {
          this.currentLocation = location;
          callback(location);
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
      throw error;
    }
  }

  stopLocationTracking(): void {
    if (this.watchLocationSubscription) {
      this.watchLocationSubscription.remove();
      this.watchLocationSubscription = null;
    }
  }

  getCachedLocation(): Location.LocationObject | null {
    return this.currentLocation;
  }

  // Update user location on backend
  async updateLocationOnBackend(location: LocationCoordinates): Promise<void> {
    try {
      const response = await apiService.put('/users/location', {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date().toISOString()
      });

      if (!response.success) {
        console.warn('Failed to update location on backend:', response.message);
      }
    } catch (error) {
      console.error('Error updating location on backend:', error);
      // Don't throw error to avoid breaking location tracking
    }
  }

  // Get user's saved locations from backend
  async getSavedLocations(): Promise<Array<{ id: string; name: string; address: string; coordinates: LocationCoordinates }>> {
    try {
      const response = await apiService.get<Array<{ id: string; name: string; address: string; coordinates: LocationCoordinates }>>('/users/saved-locations');
      
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error getting saved locations:', error);
      return [];
    }
  }

  // Save a location to backend
  async saveLocation(name: string, address: string, coordinates: LocationCoordinates): Promise<void> {
    try {
      const response = await apiService.post('/users/saved-locations', {
        name,
        address,
        coordinates
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to save location');
      }
    } catch (error: any) {
      console.error('Error saving location:', error);
      throw new Error(error.message || 'Failed to save location. Please try again.');
    }
  }

  // Delete saved location
  async deleteSavedLocation(locationId: string): Promise<void> {
    try {
      const response = await apiService.delete(`/users/saved-locations/${locationId}`);

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete location');
      }
    } catch (error: any) {
      console.error('Error deleting saved location:', error);
      throw new Error(error.message || 'Failed to delete location. Please try again.');
    }
  }

  // Mock data for testing purposes
  getMockDriversNearby(userLocation: LocationCoordinates, radius: number = 5): Array<{
    id: string;
    name: string;
    vehicleType: string;
    rating: number;
    eta: number;
    location: LocationCoordinates;
    distance: number;
  }> {
    const mockDrivers = [
      {
        id: '1',
        name: 'Raj Kumar',
        vehicleType: 'bike',
        rating: 4.8,
        eta: 3,
        location: {
          latitude: userLocation.latitude + 0.005,
          longitude: userLocation.longitude + 0.003,
        }
      },
      {
        id: '2',
        name: 'Suresh Singh',
        vehicleType: 'auto',
        rating: 4.6,
        eta: 5,
        location: {
          latitude: userLocation.latitude - 0.003,
          longitude: userLocation.longitude + 0.007,
        }
      },
      {
        id: '3',
        name: 'Prakash Sharma',
        vehicleType: 'bike',
        rating: 4.9,
        eta: 2,
        location: {
          latitude: userLocation.latitude + 0.002,
          longitude: userLocation.longitude - 0.004,
        }
      }
    ];

    return mockDrivers
      .map(driver => ({
        ...driver,
        distance: this.calculateDistance(userLocation, driver.location)
      }))
      .filter(driver => driver.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }
}

export default LocationService;