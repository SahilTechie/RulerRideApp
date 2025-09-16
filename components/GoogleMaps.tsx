import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, Text } from 'react-native';
import { Loader } from '@googlemaps/js-api-loader';
import MapPlaceholder from './MapPlaceholder';

// TypeScript declarations for Google Maps
declare global {
  interface Window {
    google: any;
    gm_authFailure?: () => void;
  }
}

// Conditional import for native maps
const MapView = Platform.OS !== 'web' ? require('react-native-maps').default : null;
const Marker = Platform.OS !== 'web' ? require('react-native-maps').Marker : null;
const PROVIDER_GOOGLE = Platform.OS !== 'web' ? require('react-native-maps').PROVIDER_GOOGLE : null;

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface MapMarker {
  coordinate: Coordinate;
  title: string;
  description?: string;
  color?: string;
}

interface GoogleMapsProps {
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  markers?: MapMarker[];
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  style?: any;
  onMapReady?: () => void;
  onMarkerPress?: (marker: MapMarker) => void;
}

// Google Maps API Key from environment variables
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyC-demo-key-replace-with-your-actual-key';

// Debug logging
console.log('🔍 GoogleMaps Debug Info:');
console.log('- API Key loaded:', GOOGLE_MAPS_API_KEY ? 'Yes' : 'No');
console.log('- API Key length:', GOOGLE_MAPS_API_KEY?.length);
console.log('- Platform:', Platform.OS);
console.log('- Environment EXPO_PUBLIC_GOOGLE_MAPS_API_KEY:', process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);

const GoogleMaps: React.FC<GoogleMapsProps> = ({
  initialRegion,
  markers = [],
  showsUserLocation = true,
  showsMyLocationButton = true,
  style,
  onMapReady,
  onMarkerPress,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Add global error handler for Google Maps
      window.gm_authFailure = () => {
        console.error('❌ Google Maps authentication failed');
        setError('BILLING_REQUIRED');
        setIsLoading(false);
      };
      
      initializeWebMap();
    } else {
      setIsLoading(false);
      onMapReady?.();
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && map && markers.length > 0) {
      updateWebMarkers();
    }
  }, [markers, map]);

  const initializeWebMap = async () => {
    if (!mapRef.current) return;

    try {
      console.log('🗺️ Initializing Google Maps...');
      console.log('- API Key being used:', GOOGLE_MAPS_API_KEY);
      
      if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'AIzaSyC-demo-key-replace-with-your-actual-key') {
        throw new Error('Invalid or missing Google Maps API key');
      }

      const loader = new Loader({
        apiKey: GOOGLE_MAPS_API_KEY,
        version: 'weekly',
        libraries: ['places'],
      });

      console.log('📥 Loading Google Maps API...');
      const google = await loader.load();
      console.log('✅ Google Maps API loaded successfully');
      
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: {
          lat: initialRegion.latitude,
          lng: initialRegion.longitude,
        },
        zoom: 15,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      console.log('🗺️ Map instance created successfully');
      setMap(mapInstance);
      setIsLoading(false);
      onMapReady?.();

      // Add user location if available
      if (showsUserLocation && navigator.geolocation) {
        console.log('📍 Getting user location...');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('✅ User location obtained:', position.coords);
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            new google.maps.Marker({
              position: userLocation,
              map: mapInstance,
              title: 'Your Location',
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
                    <circle cx="12" cy="12" r="3" fill="white"/>
                  </svg>
                `),
                scaledSize: new google.maps.Size(24, 24),
                anchor: new google.maps.Point(12, 12),
              },
            });
          },
          (error) => {
            console.warn('⚠️ Geolocation error:', error);
          }
        );
      }
    } catch (err: any) {
      console.error('❌ Error loading Google Maps:', err);
      console.error('- Error message:', err.message);
      console.error('- Error details:', err);
      
      let errorMessage = 'Failed to load Google Maps.';
      
      if (err.message.includes('API key') || err.message.includes('ApiNotActivatedMapError')) {
        errorMessage = 'Google Maps API key is invalid or APIs are not enabled. Please check your API key and enable required APIs in Google Cloud Console.';
      } else if (err.message.includes('RefererNotAllowedMapError')) {
        errorMessage = 'This domain is not authorized for this API key. Please add localhost:8081 to your API key restrictions.';
      } else if (err.message.includes('QuotaExceededError')) {
        errorMessage = 'Google Maps API quota exceeded. Please check your billing in Google Cloud Console.';
      } else if (err.message.includes('BillingNotEnabledMapError')) {
        errorMessage = 'BILLING_REQUIRED';
      } else {
        errorMessage = `Google Maps error: ${err.message}`;
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const updateWebMarkers = () => {
    if (!map || !window.google) return;

    markers.forEach((marker, index) => {
      const googleMarker = new window.google.maps.Marker({
        position: {
          lat: marker.coordinate.latitude,
          lng: marker.coordinate.longitude,
        },
        map: map,
        title: marker.title,
        icon: {
          url: marker.color === 'green' 
            ? 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 2C10.48 2 6 6.48 6 12C6 20 16 30 16 30C16 30 26 20 26 12C26 6.48 21.52 2 16 2Z" fill="#16A34A"/>
                  <circle cx="16" cy="12" r="4" fill="white"/>
                </svg>
              `)
            : 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 2C10.48 2 6 6.48 6 12C6 20 16 30 16 30C16 30 26 20 26 12C26 6.48 21.52 2 16 2Z" fill="#DC2626"/>
                  <circle cx="16" cy="12" r="4" fill="white"/>
                </svg>
              `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 30),
        },
      });

      if (marker.description) {
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 4px 0; font-size: 14px; color: #374151;">${marker.title}</h3>
              <p style="margin: 0; font-size: 12px; color: #64748B;">${marker.description}</p>
            </div>
          `,
        });

        googleMarker.addListener('click', () => {
          infoWindow.open(map, googleMarker);
          onMarkerPress?.(marker);
        });
      }
    });
  };

  // Native platform rendering
  if (Platform.OS !== 'web') {
    if (!MapView) {
      return (
        <View style={[styles.container, style]}>
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Map not available</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.container, style]}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          showsUserLocation={showsUserLocation}
          showsMyLocationButton={showsMyLocationButton}
          onMapReady={onMapReady}
        >
          {markers.map((marker, index) => (
            <Marker
              key={index}
              coordinate={marker.coordinate}
              title={marker.title}
              description={marker.description}
              onPress={() => onMarkerPress?.(marker)}
              pinColor={marker.color}
            />
          ))}
        </MapView>
      </View>
    );
  }

  // Web platform rendering
  return (
    <View style={[styles.container, style]}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>Loading Google Maps...</Text>
        </View>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          {error === 'BILLING_REQUIRED' ? (
            <MapPlaceholder />
          ) : (
            <>
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.errorSubtext}>
                Please configure your Google Maps API key in the GoogleMaps component
              </Text>
            </>
          )}
        </View>
      )}
      
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 12,
          display: isLoading || error ? 'none' : 'block',
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default GoogleMaps;