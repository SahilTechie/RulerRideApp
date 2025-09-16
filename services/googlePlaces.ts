import { Loader } from '@googlemaps/js-api-loader';

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
  private placesService: any = null;
  private autocompleteService: any = null;
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

    try {
      const loader = new Loader({
        apiKey: apiKey,
        version: 'weekly',
        libraries: ['places'],
      });

      const google = await loader.load();
      
      // Create a dummy map element for the PlacesService
      const mapDiv = document.createElement('div');
      const map = new google.maps.Map(mapDiv);
      
      this.placesService = new google.maps.places.PlacesService(map);
      this.autocompleteService = new google.maps.places.AutocompleteService();
      this.isInitialized = true;
      
      console.log('Google Places Service initialized');
    } catch (error) {
      console.error('Error initializing Google Places Service:', error);
      throw error;
    }
  }

  async getPlacePredictions(input: string, location?: { lat: number; lng: number }): Promise<PlacePrediction[]> {
    if (!this.autocompleteService) {
      throw new Error('Places service not initialized');
    }

    return new Promise((resolve, reject) => {
      const request: any = {
        input: input,
        types: ['establishment', 'geocode'],
      };

      // Add location bias if provided
      if (location) {
        request.location = new window.google.maps.LatLng(location.lat, location.lng);
        request.radius = 50000; // 50km radius
      }

      this.autocompleteService.getPlacePredictions(request, (predictions: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          resolve(predictions);
        } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(new Error(`Places prediction failed: ${status}`));
        }
      });
    });
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    if (!this.placesService) {
      throw new Error('Places service not initialized');
    }

    return new Promise((resolve, reject) => {
      const request = {
        placeId: placeId,
        fields: ['place_id', 'name', 'formatted_address', 'geometry'],
      };

      this.placesService.getDetails(request, (place: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          resolve({
            place_id: place.place_id,
            name: place.name,
            formatted_address: place.formatted_address,
            geometry: {
              location: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              },
            },
          });
        } else {
          reject(new Error(`Place details failed: ${status}`));
        }
      });
    });
  }

  async geocodeAddress(address: string): Promise<{ lat: number; lng: number; formatted_address: string }> {
    if (!window.google) {
      throw new Error('Google Maps not loaded');
    }

    return new Promise((resolve, reject) => {
      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode({ address: address }, (results: any, status: any) => {
        if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng(),
            formatted_address: results[0].formatted_address,
          });
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    if (!window.google) {
      throw new Error('Google Maps not loaded');
    }

    return new Promise((resolve, reject) => {
      const geocoder = new window.google.maps.Geocoder();
      const latLng = new window.google.maps.LatLng(lat, lng);
      
      geocoder.geocode({ location: latLng }, (results: any, status: any) => {
        if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });
  }
}

export default GooglePlacesService;