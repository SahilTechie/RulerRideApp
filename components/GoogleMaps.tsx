import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

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

const GoogleMaps: React.FC<GoogleMapsProps> = ({
  initialRegion,
  markers = [],
  showsUserLocation = true,
  showsMyLocationButton = true,
  style,
  onMapReady,
  onMarkerPress,
}) => {
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
});

export default GoogleMaps;