import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import MapView from '../components/MapView';

export default function MapTestScreen() {
  const handleLocationDetected = (coordinates: any, address: string) => {
    console.log('📍 Location detected in test:', coordinates, address);
  };

  const handleMapClick = (lat: number, lng: number, address?: string) => {
    console.log('🗺️ Map clicked in test:', { lat, lng, address });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Map Component Test</Text>
      
      {/* Test Map 1: Basic Map */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Map</Text>
        <MapView
          height={250}
          center={[17.6868, 83.2185]}
          zoom={15}
          onMapClick={handleMapClick}
        />
      </View>

      {/* Test Map 2: Map with Location Detection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Map with Auto Location</Text>
        <MapView
          height={250}
          autoDetectLocation={true}
          showUserLocation={true}
          onLocationDetected={handleLocationDetected}
          onMapClick={handleMapClick}
          markers={[
            {
              position: [17.6868, 83.2185],
              title: 'Pickup Location',
              popup: 'Your ride pickup point',
              color: 'green'
            },
            {
              position: [17.6878, 83.2195],
              title: 'Destination',
              popup: 'Your destination',
              color: 'red'
            }
          ]}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#666',
  },
});