import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface MapMarker {
  coordinate: Coordinate;
  title: string;
  description?: string;
  color?: 'red' | 'green' | 'blue' | 'orange';
  type?: 'pickup' | 'destination' | 'user' | 'driver';
  vehicleType?: 'bike' | 'auto';
  vehicleId?: string;
}

interface PremiumGoogleMapsProps {
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
  onLocationPress?: (coordinate: Coordinate) => void;
  autoDetectLocation?: boolean;
  mapStyle?: 'standard' | 'dark' | 'retro' | 'satellite';
  polylineCoordinates?: Coordinate[];
  routeDistance?: number;
  routeDuration?: number;
  routeDistanceText?: string;
  routeDurationText?: string;
  showDistanceOverlay?: boolean;
}

// Custom map styles for clean UI
const MAP_STYLES: Record<string, any[]> = {
  standard: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#666666' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#c9e7ff' }],
    },
    {
      featureType: 'landscape',
      elementType: 'geometry',
      stylers: [{ color: '#f0f4f0' }],
    },
    {
      featureType: 'transit',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    }
  ],
  dark: [
    {
      elementType: 'geometry',
      stylers: [{ color: '#212121' }],
    },
    {
      elementType: 'labels.icon',
      stylers: [{ visibility: 'off' }],
    },
    {
      elementType: 'labels.text.fill',
      stylers: [{ color: '#757575' }],
    },
    {
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#212121' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#2c2c2c' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#000019' }],
    },
  ]
};

const PremiumGoogleMaps: React.FC<PremiumGoogleMapsProps> = ({
  initialRegion,
  markers = [],
  showsUserLocation = true,
  showsMyLocationButton = true,
  style,
  onMapReady,
  onMarkerPress,
  onLocationPress,
  autoDetectLocation = false,
  mapStyle = 'standard',
  polylineCoordinates = [],
  routeDistance,
  routeDuration,
  routeDistanceText,
  routeDurationText,
  showDistanceOverlay = true,
}) => {
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);

  useEffect(() => {
    if (autoDetectLocation) {
      getCurrentLocation();
    }
  }, [autoDetectLocation]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userCoord = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(userCoord);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  // Mobile-only implementation
  return (
    <View style={[styles.container, style]}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={showsMyLocationButton}
        onMapReady={onMapReady}
        mapType="standard"
        customMapStyle={MAP_STYLES[mapStyle] || MAP_STYLES.standard}
        onPress={(event: any) => {
          const { latitude, longitude } = event.nativeEvent.coordinate;
          onLocationPress?.({ latitude, longitude });
        }}
      >
        {markers.map((marker, index) => (
          <Marker
            key={index}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            onPress={() => onMarkerPress?.(marker)}
            pinColor={marker.vehicleType ? undefined : marker.color}
          >
            {marker.vehicleType && (
              <View style={styles.customMarker}>
                <Image
                  source={
                    marker.vehicleType === 'bike'
                      ? require('../assets/images/man.png')
                      : require('../assets/images/rickshaw.png')
                  }
                  style={styles.vehicleMarkerImage}
                />
              </View>
            )}
          </Marker>
        ))}
        
        {/* Route polyline - simple white line with border */}
        {polylineCoordinates.length >= 2 && (
          <>
            {/* Border for visibility */}
            <Polyline
              coordinates={polylineCoordinates}
              strokeWidth={5}
              strokeColor="rgba(0, 0, 0, 0.3)"
              lineDashPattern={[0]}
            />
            {/* Main white route line */}
            <Polyline
              coordinates={polylineCoordinates}
              strokeWidth={3}
              strokeColor="#FFFFFF"
              lineDashPattern={[0]}
            />
          </>
        )}
      </MapView>

      {/* Simple distance display */}
      {showDistanceOverlay && (routeDistance || routeDistanceText) && polylineCoordinates.length >= 2 && (
        <View style={styles.distanceOverlay}>
          <Text style={styles.distanceText}>
            {routeDistanceText || `${routeDistance?.toFixed(1)} km`}
          </Text>
        </View>
      )}

      {showsMyLocationButton && (
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={getCurrentLocation}
        >
          <Text style={styles.locationButtonText}>📍</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  distanceOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  locationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationButtonText: {
    fontSize: 20,
  },
  customMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#404040',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  vehicleMarkerImage: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
});

export default PremiumGoogleMaps;