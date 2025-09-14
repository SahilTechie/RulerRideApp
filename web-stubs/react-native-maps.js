// Web stub for react-native-maps
import React from 'react';
import { View, Text } from 'react-native';

// Mock MapView component for web
export const MapView = React.forwardRef(({ children, style, initialRegion, showsUserLocation, showsMyLocationButton, provider, ...props }, ref) => {
  return (
    <View 
      ref={ref}
      style={[
        { 
          backgroundColor: '#E5E7EB', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: 200,
          borderRadius: 8,
        }, 
        style
      ]}
      {...props}
    >
      <View style={{ alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#9CA3AF', fontSize: 16, marginBottom: 8 }}>
          🗺️ Interactive Map
        </Text>
        <Text style={{ color: '#6B7280', fontSize: 14, textAlign: 'center' }}>
          Map view available on mobile app
        </Text>
        {initialRegion && (
          <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 8 }}>
            Lat: {initialRegion.latitude?.toFixed(4)}, Lng: {initialRegion.longitude?.toFixed(4)}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
});

// Mock Marker component for web
export const Marker = ({ children, coordinate, title, description, ...props }) => {
  return (
    <View style={{ position: 'absolute', top: 10, left: 10 }}>
      <View style={{ 
        backgroundColor: '#DC2626', 
        width: 20, 
        height: 20, 
        borderRadius: 10,
        borderWidth: 2,
        borderColor: 'white',
      }} />
      {title && (
        <Text style={{ fontSize: 10, color: '#374151', marginTop: 2 }}>
          {title}
        </Text>
      )}
      {children}
    </View>
  );
};

// Mock Polyline component for web
export const Polyline = ({ coordinates, strokeColor, strokeWidth, ...props }) => {
  return (
    <View style={{
      position: 'absolute',
      top: 30,
      left: 30,
      width: 100,
      height: 2,
      backgroundColor: strokeColor || '#DC2626',
    }} />
  );
};

// Mock provider constants
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = 'default';

// Default export
const MapViewComponent = MapView;
export default MapViewComponent;