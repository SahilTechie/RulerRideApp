import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView from '../components/MapView';
import PremiumGoogleMaps from '../components/PremiumGoogleMaps';

export default function MapDemo() {
  const [showPremiumMaps, setShowPremiumMaps] = useState(false);

  const visakhapatnamMarkers = [
    {
      position: [17.6868, 83.2185] as [number, number],
      title: 'RK Beach',
      popup: 'Popular beach destination in Visakhapatnam',
      color: 'blue' as const,
    },
    {
      position: [17.7231, 83.3007] as [number, number],
      title: 'Kailasagiri',
      popup: 'Hill station with scenic views',
      color: 'green' as const,
    },
    {
      position: [17.6599, 83.2489] as [number, number],
      title: 'Submarine Museum',
      popup: 'INS Kurusura - Historic submarine museum',
      color: 'orange' as const,
    },
  ];

  const premiumMarkers = [
    {
      coordinate: {
        latitude: 17.6868,
        longitude: 83.2185,
      },
      title: 'RK Beach',
      description: 'Popular beach destination in Visakhapatnam',
      type: 'pickup' as const,
      color: 'green' as const,
    },
    {
      coordinate: {
        latitude: 17.7231,
        longitude: 83.3007,
      },
      title: 'Kailasagiri',
      description: 'Hill station with scenic views',
      type: 'destination' as const,
      color: 'red' as const,
    },
    {
      coordinate: {
        latitude: 17.6599,
        longitude: 83.2489,
      },
      title: 'Submarine Museum',
      description: 'INS Kurusura - Historic submarine museum',
      type: 'driver' as const,
      color: 'orange' as const,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Map Comparison Demo</Text>
        <Text style={styles.subtitle}>
          {showPremiumMaps ? 'Premium Google Maps' : 'Leaflet + OpenStreetMap'}
        </Text>
        
        {/* Toggle Button */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, !showPremiumMaps && styles.activeToggle]}
            onPress={() => setShowPremiumMaps(false)}
          >
            <Text style={[styles.toggleText, !showPremiumMaps && styles.activeToggleText]}>
              OpenStreetMap
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, showPremiumMaps && styles.activeToggle]}
            onPress={() => setShowPremiumMaps(true)}
          >
            <Text style={[styles.toggleText, showPremiumMaps && styles.activeToggleText]}>
              Google Maps
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {!showPremiumMaps ? (
        <>
          {/* OpenStreetMap - Default Map */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Default Map (Visakhapatnam)</Text>
            <Text style={styles.sectionDescription}>
              Centered at Visakhapatnam, India with default pickup marker
            </Text>
            <View style={styles.mapWrapper}>
              <MapView />
            </View>
          </View>

          {/* OpenStreetMap - Map with Multiple Markers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Multiple Markers</Text>
            <Text style={styles.sectionDescription}>
              Tourist attractions in Visakhapatnam with different colored markers
            </Text>
            <View style={styles.mapWrapper}>
              <MapView
                center={[17.6868, 83.2185]}
                zoom={12}
                height={250}
                markers={visakhapatnamMarkers}
              />
            </View>
          </View>

          {/* OpenStreetMap - Small Map */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Compact Map</Text>
            <Text style={styles.sectionDescription}>
              Smaller map perfect for ride booking cards
            </Text>
            <View style={styles.mapWrapper}>
              <MapView
                center={[17.6868, 83.2185]}
                zoom={14}
                height={150}
                markers={[
                  {
                    position: [17.6868, 83.2185],
                    title: 'Pickup Location',
                    popup: 'Your ride will start here',
                    color: 'red',
                  }
                ]}
              />
            </View>
          </View>
        </>
      ) : (
        <>
          {/* Premium Google Maps - Default Map */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Premium Google Maps (Visakhapatnam)</Text>
            <Text style={styles.sectionDescription}>
              High-quality Google Maps with satellite imagery and street data
            </Text>
            <View style={styles.mapWrapper}>
              <PremiumGoogleMaps
                initialRegion={{
                  latitude: 17.6868,
                  longitude: 83.2185,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
                style={{ height: 200 }}
                onMarkerPress={(marker) => {
                  Alert.alert(marker.title, marker.description || 'Map marker');
                }}
              />
            </View>
          </View>

          {/* Premium Google Maps - Multiple Markers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Multiple Premium Markers</Text>
            <Text style={styles.sectionDescription}>
              Tourist attractions with custom premium markers and info windows
            </Text>
            <View style={styles.mapWrapper}>
              <PremiumGoogleMaps
                initialRegion={{
                  latitude: 17.6868,
                  longitude: 83.2185,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                markers={premiumMarkers}
                showsUserLocation={false}
                showsMyLocationButton={true}
                style={{ height: 250 }}
                onMarkerPress={(marker) => {
                  Alert.alert(marker.title, marker.description || 'Premium map marker');
                }}
              />
            </View>
          </View>

          {/* Premium Google Maps - Dark Theme */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dark Theme Map</Text>
            <Text style={styles.sectionDescription}>
              Premium Google Maps with dark theme styling
            </Text>
            <View style={styles.mapWrapper}>
              <PremiumGoogleMaps
                initialRegion={{
                  latitude: 17.6868,
                  longitude: 83.2185,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
                markers={[premiumMarkers[0]]}
                mapStyle="dark"
                showsUserLocation={true}
                showsMyLocationButton={true}
                style={{ height: 200 }}
              />
            </View>
          </View>
        </>
      )}

      <View style={styles.info}>
        <Text style={styles.infoTitle}>
          ✨ {showPremiumMaps ? 'Premium Google Maps' : 'OpenStreetMap'} Features
        </Text>
        {!showPremiumMaps ? (
          <>
            <Text style={styles.infoText}>• No API key required</Text>
            <Text style={styles.infoText}>• No billing needed</Text>
            <Text style={styles.infoText}>• OpenStreetMap data</Text>
            <Text style={styles.infoText}>• Custom colored markers</Text>
            <Text style={styles.infoText}>• Responsive design</Text>
            <Text style={styles.infoText}>• Click-to-zoom</Text>
            <Text style={styles.infoText}>• Popup information</Text>
            <Text style={styles.infoText}>• Works offline-friendly</Text>
          </>
        ) : (
          <>
            <Text style={styles.infoText}>• High-quality satellite imagery</Text>
            <Text style={styles.infoText}>• Real-time traffic data</Text>
            <Text style={styles.infoText}>• Street View integration</Text>
            <Text style={styles.infoText}>• Premium custom markers</Text>
            <Text style={styles.infoText}>• Interactive info windows</Text>
            <Text style={styles.infoText}>• Multiple map themes</Text>
            <Text style={styles.infoText}>• Precise location services</Text>
            <Text style={styles.infoText}>• Professional map styling</Text>
          </>
        )}
        
        {showPremiumMaps && (
          <View style={styles.apiKeyNote}>
            <Ionicons name="information-circle" size={16} color="#2563EB" />
            <Text style={styles.apiKeyNoteText}>
              Requires Google Maps API key with proper billing setup
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
    backgroundColor: '#DC2626',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  section: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  mapWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  info: {
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#16A34A',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    paddingLeft: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    padding: 4,
    marginTop: 16,
  },
  toggleBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: 'white',
  },
  toggleText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  activeToggleText: {
    color: '#DC2626',
    fontWeight: 'bold',
  },
  apiKeyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  apiKeyNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#2563EB',
    lineHeight: 16,
  },
});