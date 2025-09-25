import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';

// Define interfaces
interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  height?: number | string;
  width?: number | string;
  markers?: Array<{
    position: [number, number];
    popup?: string;
    title?: string;
    color?: 'red' | 'green' | 'blue' | 'orange';
  }>;
  style?: any;
  showUserLocation?: boolean;
  onMapClick?: (lat: number, lng: number, address?: string) => void;
  onLocationDetected?: (coordinates: any, address: string) => void;
  autoDetectLocation?: boolean;
  className?: string;
}

// MapView component with actual map tiles
const MapView: React.FC<MapViewProps> = ({
  center = [17.6868, 83.2185],
  zoom = 15,
  height = 200,
  width = '100%',
  style,
  showUserLocation = false,
  autoDetectLocation = false,
  onLocationDetected,
  onMapClick,
  markers = [],
}) => {
  const [location, setLocation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState(center);

  useEffect(() => {
    if (autoDetectLocation) {
      getCurrentLocation();
    }
  }, [autoDetectLocation]);

  const getCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      
      const newCenter: [number, number] = [
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      ];
      setMapCenter(newCenter);
      
      if (onLocationDetected) {
        onLocationDetected(
          {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          },
          'Current Location'
        );
      }
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create HTML for the map with OpenStreetMap tiles
  const createMapHTML = () => {
    const currentLat = location ? location.coords.latitude : mapCenter[0];
    const currentLng = location ? location.coords.longitude : mapCenter[1];
    
    // Prepare markers data
    const allMarkers = [
      ...(location && showUserLocation ? [{
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        title: 'Your Location',
        color: 'blue',
        icon: '📍'
      }] : []),
      ...markers.map(marker => ({
        lat: marker.position[0],
        lng: marker.position[1],
        title: marker.title || marker.popup || 'Marker',
        color: marker.color || 'red',
        icon: marker.color === 'green' ? '🟢' : marker.color === 'blue' ? '🔵' : '🔴'
      }))
    ];

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Map</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { 
            width: 100%; 
            height: 100vh; 
            border-radius: 12px;
          }
          .custom-marker {
            background: none;
            border: none;
          }
          .location-button {
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 1000;
            background: white;
            border: 2px solid #ccc;
            border-radius: 6px;
            padding: 8px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .location-button:hover {
            background: #f0f0f0;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <button class="location-button" onclick="getCurrentLocation()" title="Get Current Location">
          📍
        </button>
        
        <script>
          // Initialize map
          var map = L.map('map').setView([${currentLat}, ${currentLng}], ${zoom});
          
          // Add OpenStreetMap tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors | RulerRide',
            maxZoom: 19,
            minZoom: 3
          }).addTo(map);

          // Custom marker icons
          var createCustomIcon = function(color, icon) {
            return L.divIcon({
              html: '<div style="background-color: ' + getColorCode(color) + '; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); transform: rotate(-45deg); display: flex; align-items: center; justify-content: center;"><div style="transform: rotate(45deg); font-size: 16px;">' + icon + '</div></div>',
              className: 'custom-marker',
              iconSize: [30, 30],
              iconAnchor: [15, 30],
              popupAnchor: [0, -30]
            });
          };

          var getColorCode = function(color) {
            var colors = {
              red: '#DC2626',
              green: '#16A34A', 
              blue: '#2563EB',
              orange: '#EA580C'
            };
            return colors[color] || colors.red;
          };

          // Add markers
          var markers = ${JSON.stringify(allMarkers)};
          markers.forEach(function(markerData) {
            var marker = L.marker([markerData.lat, markerData.lng], {
              icon: createCustomIcon(markerData.color, markerData.icon)
            }).addTo(map);
            
            marker.bindPopup('<b>' + markerData.title + '</b>');
          });

          // Handle map clicks
          map.on('click', function(e) {
            var lat = e.latlng.lat;
            var lng = e.latlng.lng;
            
            // Send message to React Native
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapClick',
                lat: lat,
                lng: lng
              }));
            }
          });

          // Get current location function
          function getCurrentLocation() {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(function(position) {
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;
                
                map.setView([lat, lng], ${zoom});
                
                // Send location to React Native
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'locationDetected',
                    lat: lat,
                    lng: lng,
                    accuracy: position.coords.accuracy
                  }));
                }
              }, function(error) {
                console.error('Geolocation error:', error);
              });
            }
          }

          // Auto-get location if enabled
          ${autoDetectLocation ? 'getCurrentLocation();' : ''}
        </script>
      </body>
      </html>
    `;
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'mapClick' && onMapClick) {
        onMapClick(data.lat, data.lng, 'Selected Location');
      } else if (data.type === 'locationDetected') {
        const newLocation = {
          coords: {
            latitude: data.lat,
            longitude: data.lng,
            accuracy: data.accuracy || 100
          },
          timestamp: Date.now()
        };
        setLocation(newLocation);
        
        if (onLocationDetected) {
          onLocationDetected(
            { latitude: data.lat, longitude: data.lng },
            'Current Location'
          );
        }
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // Mobile-only implementation using WebView
  return (
    <View style={[styles.container, style, { height, width }]}>
      <WebView
        source={{ html: createMapHTML() }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        geolocationEnabled={true}
        onMessage={handleWebViewMessage}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        mixedContentMode="always"
        scalesPageToFit={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>🗺️ Loading Map...</Text>
          </View>
        )}
      />
      
      {/* Location button overlay for mobile */}
      <TouchableOpacity 
        style={styles.locationButtonOverlay}
        onPress={getCurrentLocation}
      >
        <Text style={styles.locationButtonText}>📍</Text>
      </TouchableOpacity>
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Getting location...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  locationButtonOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  locationButtonText: {
    fontSize: 16,
  },
});

// Ensure proper export
export default MapView;