import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import './MapView.css'; // Import Leaflet CSS
import LocationService, { LocationCoordinates } from '../services/location';

// Fix for default Leaflet marker icons in React using CDN URLs
if (Platform.OS === 'web') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

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
  onLocationDetected?: (coordinates: LocationCoordinates, address: string) => void;
  autoDetectLocation?: boolean;
  className?: string;
}

// Custom marker icons
const createCustomIcon = (color: string) => {
  const colors = {
    red: '#DC2626',
    green: '#16A34A',
    blue: '#2563EB',
    orange: '#EA580C',
  };

  return L.divIcon({
    html: `
      <div style="
        background-color: ${colors[color as keyof typeof colors] || colors.red};
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

// Component to handle map clicks
const MapClickHandler: React.FC<{ 
  onMapClick?: (lat: number, lng: number, address?: string) => void 
}> = ({ onMapClick }) => {
  const locationService = LocationService.getInstance();
  
  useMapEvents({
    click: async (e) => {
      if (onMapClick) {
        const { lat, lng } = e.latlng;
        console.log('🗺️ Map clicked at:', { lat, lng });
        
        // Get address for clicked location
        try {
          const address = await locationService.webReverseGeocode({ latitude: lat, longitude: lng });
          console.log('📍 Address for clicked location:', address);
          onMapClick(lat, lng, address);
        } catch (error) {
          console.warn('Failed to get address for clicked location:', error);
          onMapClick(lat, lng);
        }
      }
    },
  });
  
  return null;
};

const MapView: React.FC<MapViewProps> = ({
  center = [17.6868, 83.2185], // Visakhapatnam, India
  zoom = 13,
  height = 200,
  width = '100%',
  markers = [
    {
      position: [17.6868, 83.2185],
      popup: 'Pickup here',
      title: 'Default Pickup Location',
      color: 'red'
    }
  ],
  style,
  showUserLocation = false,
  onMapClick,
  onLocationDetected,
  autoDetectLocation = false,
  className,
}) => {
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const locationService = LocationService.getInstance();

  // Auto-detect user location when component mounts
  useEffect(() => {
    if (autoDetectLocation && Platform.OS === 'web') {
      detectUserLocation();
    }
  }, [autoDetectLocation]);

  const detectUserLocation = async () => {
    setIsDetectingLocation(true);
    console.log('🔍 Auto-detecting user location...');
    
    try {
      const result = await locationService.getUniversalLocation();
      
      if (result.success) {
        const location: [number, number] = [result.coordinates.latitude, result.coordinates.longitude];
        setCurrentLocation(location);
        setLocationAddress(result.address);
        
        console.log('✅ Location detected:', { location, address: result.address });
        
        // Notify parent component
        if (onLocationDetected) {
          onLocationDetected(result.coordinates, result.address);
        }
      } else {
        console.warn('⚠️ Failed to detect location:', result.error);
      }
    } catch (error) {
      console.error('❌ Error detecting location:', error);
    } finally {
      setIsDetectingLocation(false);
    }
  };
  // Only render on web platform for now
  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.fallbackContainer, style, { height, width }]}>
        <View style={styles.fallbackContent}>
          <View style={styles.fallbackIcon}>
            <span style={{ fontSize: 24 }}>🗺️</span>
          </View>
          <div style={styles.fallbackText}>
            Map view available on web
          </div>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <div style={{ height, width, borderRadius: 12, overflow: 'hidden' }} className={className}>
        <MapContainer
          center={currentLocation || center}
          zoom={zoom}
          style={{ 
            height: '100%', 
            width: '100%',
            borderRadius: 12,
          }}
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | RulerRide'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            minZoom={3}
          />
          
          {/* Handle map clicks */}
          <MapClickHandler onMapClick={onMapClick} />
          
          {/* Show current location marker if detected */}
          {currentLocation && showUserLocation && (
            <Marker 
              position={currentLocation}
              icon={createCustomIcon('blue')}
            >
              <Popup>
                <div style={styles.popupContent}>
                  <div style={styles.popupTitle}>Your Location</div>
                  <div style={styles.popupText}>
                    {isDetectingLocation ? 'Detecting...' : locationAddress}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Render custom markers */}
          {markers.map((marker, index) => (
            <Marker 
              key={index} 
              position={marker.position}
              icon={marker.color ? createCustomIcon(marker.color) : undefined}
            >
              {marker.popup && (
                <Popup>
                  <div style={styles.popupContent}>
                    {marker.title && (
                      <div style={styles.popupTitle}>{marker.title}</div>
                    )}
                    <div style={styles.popupText}>{marker.popup}</div>
                  </div>
                </Popup>
              )}
            </Marker>
          ))}
        </MapContainer>
      </div>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  fallbackContainer: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackContent: {
    alignItems: 'center',
  },
  fallbackIcon: {
    marginBottom: 8,
  },
  fallbackText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  popupContent: {
    padding: 4,
    textAlign: 'center',
  },
  popupTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  popupText: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default MapView;