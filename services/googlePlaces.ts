import * as Location from 'expo-location';

export interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

class GooglePlacesService {
  private static instance: GooglePlacesService;
  private apiKey: string = '';
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): GooglePlacesService {
    if (!GooglePlacesService.instance) {
      GooglePlacesService.instance = new GooglePlacesService();
    }
    return GooglePlacesService.instance;
  }

  async initialize(apiKey: string): Promise<void> {
    if (this.isInitialized) return;
    
    this.apiKey = apiKey;
    this.isInitialized = true;
    console.log('Mobile Places Service initialized');
  }

  async getPlacePredictions(input: string, location?: { lat: number; lng: number }): Promise<PlacePrediction[]> {
    if (!this.apiKey) {
      throw new Error('Places service not initialized');
    }

    try {
      // Use Google Places API Text Search for mobile
      const baseUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
      const params = new URLSearchParams({
        query: input,
        key: this.apiKey,
      });

      if (location) {
        params.append('location', `${location.lat},${location.lng}`);
        params.append('radius', '50000');
      }

      const response = await fetch(`${baseUrl}?${params}`);
      const data = await response.json();

      if (data.status === 'OK') {
        return data.results.slice(0, 5).map((place: any) => ({
          description: place.formatted_address || place.name,
          place_id: place.place_id,
          structured_formatting: {
            main_text: place.name,
            secondary_text: place.formatted_address || '',
          },
        }));
      }

      return [];
    } catch (error) {
      console.error('Error getting place predictions:', error);
      return [];
    }
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    if (!this.apiKey) {
      throw new Error('Places service not initialized');
    }

    try {
      const baseUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
      const params = new URLSearchParams({
        place_id: placeId,
        fields: 'place_id,name,formatted_address,geometry',
        key: this.apiKey,
      });

      const response = await fetch(`${baseUrl}?${params}`);
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const place = data.result;
        return {
          place_id: place.place_id,
          name: place.name,
          formatted_address: place.formatted_address,
          geometry: {
            location: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
            },
          },
        };
      }

      throw new Error('Place details not found');
    } catch (error) {
      console.error('Error getting place details:', error);
      throw error;
    }
  }

  async geocodeAddress(address: string): Promise<{ lat: number; lng: number; formatted_address: string }> {
    if (!address || address.trim().length === 0) {
      throw new Error('Address is required');
    }

    try {
      // Use Expo Location's geocoding first (more mobile-friendly)
      const geocoded = await Location.geocodeAsync(address);
      
      if (geocoded.length > 0) {
        const { latitude, longitude } = geocoded[0];
        return {
          lat: latitude,
          lng: longitude,
          formatted_address: address, // Use original address as fallback
        };
      }

      // If Expo geocoding fails, try Google Geocoding API as fallback
      if (this.apiKey) {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`
        );
        const data = await response.json();
        
        if (data.status === 'OK' && data.results.length > 0) {
          const result = data.results[0];
          return {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            formatted_address: result.formatted_address,
          };
        }
      }

      throw new Error('Address not found');
    } catch (error) {
      console.error('Error geocoding address:', error);
      
      // Re-throw with more specific error message
      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          throw new Error('Network error - please check your internet connection');
        }
        throw error;
      }
      
      throw new Error('Failed to geocode address');
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      // Use Expo Location's reverse geocoding
      const address = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      
      if (address.length > 0) {
        const addr = address[0];
        const parts = [
          addr.name,
          addr.street,
          addr.city,
          addr.region,
          addr.country
        ].filter(Boolean);
        
        return parts.join(', ');
      }

      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }
}

export default GooglePlacesService;