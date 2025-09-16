import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import MapView from '../components/MapView';

export default function MapDemo() {
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ MapView Demo</Text>
        <Text style={styles.subtitle}>Leaflet + OpenStreetMap Integration</Text>
      </View>

      {/* Default Map */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default Map (Visakhapatnam)</Text>
        <Text style={styles.sectionDescription}>
          Centered at Visakhapatnam, India with default pickup marker
        </Text>
        <View style={styles.mapWrapper}>
          <MapView />
        </View>
      </View>

      {/* Map with Multiple Markers */}
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

      {/* Small Map */}
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

      <View style={styles.info}>
        <Text style={styles.infoTitle}>✨ Features</Text>
        <Text style={styles.infoText}>• No API key required</Text>
        <Text style={styles.infoText}>• No billing needed</Text>
        <Text style={styles.infoText}>• OpenStreetMap data</Text>
        <Text style={styles.infoText}>• Custom colored markers</Text>
        <Text style={styles.infoText}>• Responsive design</Text>
        <Text style={styles.infoText}>• Click-to-zoom</Text>
        <Text style={styles.infoText}>• Popup information</Text>
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
});