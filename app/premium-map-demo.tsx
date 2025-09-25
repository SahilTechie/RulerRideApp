import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import PremiumGoogleMaps from '../components/PremiumGoogleMaps';

// Define marker interface for type safety
interface MapMarker {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  description: string;
  type: 'pickup' | 'destination' | 'user' | 'driver';
  color: 'red' | 'green' | 'blue' | 'orange';
}

// Sample locations around India for demo
const DEMO_LOCATIONS = {
  visakhapatnam: {
    latitude: 17.6868,
    longitude: 83.2185,
    name: 'Visakhapatnam',
    address: 'R976+JG4, Visakhapatnam',
  },
  hyderabad: {
    latitude: 17.3850,
    longitude: 78.4867,
    name: 'Hyderabad',
    address: 'Hyderabad, Telangana',
  },
  bangalore: {
    latitude: 12.9716,
    longitude: 77.5946,
    name: 'Bangalore',
    address: 'Bangalore, Karnataka',
  },
  mumbai: {
    latitude: 19.0760,
    longitude: 72.8777,
    name: 'Mumbai',
    address: 'Mumbai, Maharashtra',
  },
};

interface VehicleOption {
  type: 'bike' | 'auto';
  name: string;
  nameHindi: string;
  icon: string;
  fare: string;
  time: string;
  selected?: boolean;
}

const VEHICLE_OPTIONS: VehicleOption[] = [
  {
    type: 'bike',
    name: 'Bike',
    nameHindi: 'बाइक',
    icon: 'bicycle',
    fare: '₹81-99',
    time: '5-8 min',
    selected: true,
  },
  {
    type: 'auto',
    name: 'Auto',
    nameHindi: 'ऑटो',
    icon: 'car',
    fare: '₹126-154',
    time: '7-12 min',
    selected: false,
  },
];

export default function MapDemoScreen() {
  const router = useRouter();
  const [currentLocation, setCurrentLocation] = useState(DEMO_LOCATIONS.visakhapatnam);
  const [destination, setDestination] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<'bike' | 'auto'>('bike');
  const [mapRegion, setMapRegion] = useState({
    latitude: DEMO_LOCATIONS.visakhapatnam.latitude,
    longitude: DEMO_LOCATIONS.visakhapatnam.longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [markers, setMarkers] = useState<MapMarker[]>([
    {
      coordinate: {
        latitude: DEMO_LOCATIONS.visakhapatnam.latitude,
        longitude: DEMO_LOCATIONS.visakhapatnam.longitude,
      },
      title: 'Current Location',
      description: DEMO_LOCATIONS.visakhapatnam.address,
      type: 'user',
      color: 'blue',
    }
  ]);

  const getCurrentLocation = async () => {
    setIsLocationLoading(true);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Location access is required');
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const userLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          name: 'Your Location',
          address: 'Current GPS Location',
        };

        setCurrentLocation(userLocation);
        setMapRegion({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });

        setMarkers([{
          coordinate: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
          title: 'Your Current Location',
          description: 'GPS detected location',
          type: 'user',
          color: 'blue',
        }]);
      } else {
        // For web, use browser geolocation
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const userLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                name: 'Your Location',
                address: 'Current GPS Location',
              };

              setCurrentLocation(userLocation);
              setMapRegion({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              });

              setMarkers([{
                coordinate: {
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                },
                title: 'Your Current Location',
                description: 'GPS detected location',
                type: 'user',
                color: 'blue',
              }]);
            },
            (error) => {
              console.error('Geolocation error:', error);
              Alert.alert('Location Error', 'Unable to get your current location');
            }
          );
        }
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to get location');
    } finally {
      setIsLocationLoading(false);
    }
  };

  const switchToLocation = (location: typeof DEMO_LOCATIONS.visakhapatnam) => {
    setCurrentLocation(location);
    setMapRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });

    setMarkers([{
      coordinate: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      title: location.name,
      description: location.address,
      type: 'pickup',
      color: 'green',
    }]);
  };

  const handleMapPress = (coordinate: { latitude: number; longitude: number }) => {
    const newMarker: MapMarker = {
      coordinate,
      title: 'Selected Location',
      description: `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
      type: 'destination',
      color: 'red',
    };

    // Add destination marker while keeping pickup marker
    setMarkers(prev => [
      ...prev.filter(marker => marker.type !== 'destination'),
      newMarker
    ]);

    setDestination(`${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`);
  };

  const addSampleDestination = () => {
    const destCoordinate = {
      latitude: currentLocation.latitude + 0.01,
      longitude: currentLocation.longitude + 0.01,
    };

    const destinationMarker: MapMarker = {
      coordinate: destCoordinate,
      title: 'Sample Destination',
      description: 'Where you want to go',
      type: 'destination',
      color: 'red',
    };

    setMarkers(prev => [
      ...prev.filter(marker => marker.type !== 'destination'),
      destinationMarker
    ]);

    setDestination('Sample destination location');
  };

  const clearDestination = () => {
    setMarkers(prev => prev.filter(marker => marker.type !== 'destination'));
    setDestination('');
  };

  const bookRide = () => {
    if (!destination) {
      Alert.alert('Missing Destination', 'Please select a destination on the map');
      return;
    }

    Alert.alert(
      'Ride Booked! 🚗',
      `Vehicle: ${selectedVehicle === 'bike' ? 'Bike' : 'Auto'}\nFrom: ${currentLocation.name}\nTo: ${destination}`,
      [
        { text: 'Track Ride', onPress: () => router.push('/ride-details') },
        { text: 'OK' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with greeting */}
      <LinearGradient
        colors={['#DC2626', '#B91C1C']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good Evening!</Text>
            <Text style={styles.greetingHindi}>शुभ संध्या!</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Premium Google Maps - Main Feature */}
      <View style={styles.mapContainer}>
        <PremiumGoogleMaps
          initialRegion={mapRegion}
          markers={markers}
          showsUserLocation={true}
          showsMyLocationButton={true}
          autoDetectLocation={false}
          mapStyle="standard"
          onLocationPress={handleMapPress}
          onMarkerPress={(marker) => {
            Alert.alert(marker.title, marker.description || 'Map marker');
          }}
          style={styles.map}
        />

        {/* Location info overlay */}
        <View style={styles.locationOverlay}>
          <View style={styles.locationInfo}>
            <View style={styles.locationDot} />
            <Text style={styles.locationText}>{currentLocation.address}</Text>
            <TouchableOpacity onPress={getCurrentLocation} disabled={isLocationLoading}>
              <Ionicons 
                name={isLocationLoading ? "hourglass" : "locate"} 
                size={20} 
                color="#DC2626" 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Bottom section with vehicle selection and booking */}
      <View style={styles.bottomSection}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Quick location switches */}
          <View style={styles.quickLocations}>
            <Text style={styles.sectionTitle}>Quick Locations</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Object.entries(DEMO_LOCATIONS).map(([key, location]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.quickLocationBtn,
                    currentLocation.name === location.name && styles.activeLocationBtn
                  ]}
                  onPress={() => switchToLocation(location)}
                >
                  <Text style={[
                    styles.quickLocationText,
                    currentLocation.name === location.name && styles.activeLocationText
                  ]}>
                    {location.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Destination input */}
          <View style={styles.destinationSection}>
            <Text style={styles.sectionTitle}>Where to? / कहाँ जाना है?</Text>
            <View style={styles.destinationInput}>
              <Ionicons name="location" size={20} color="#DC2626" />
              <Text style={styles.destinationText}>
                {destination || 'Tap on map to select destination'}
              </Text>
              {destination && (
                <TouchableOpacity onPress={clearDestination}>
                  <Ionicons name="close-circle" size={20} color="#64748B" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.sampleDestBtn} onPress={addSampleDestination}>
              <Text style={styles.sampleDestText}>Add Sample Destination</Text>
            </TouchableOpacity>
          </View>

          {/* Vehicle selection */}
          <View style={styles.vehicleSection}>
            <Text style={styles.sectionTitle}>Choose Vehicle / वाहन चुनें</Text>
            <View style={styles.vehicleOptions}>
              {VEHICLE_OPTIONS.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.type}
                  style={[
                    styles.vehicleCard,
                    selectedVehicle === vehicle.type && styles.selectedVehicleCard
                  ]}
                  onPress={() => setSelectedVehicle(vehicle.type)}
                >
                  <Ionicons
                    name={vehicle.icon as any}
                    size={28}
                    color={selectedVehicle === vehicle.type ? '#DC2626' : '#64748B'}
                  />
                  <Text style={[
                    styles.vehicleName,
                    selectedVehicle === vehicle.type && styles.selectedVehicleText
                  ]}>
                    {vehicle.name}
                  </Text>
                  <Text style={styles.vehicleNameHindi}>{vehicle.nameHindi}</Text>
                  <Text style={[
                    styles.vehicleFare,
                    selectedVehicle === vehicle.type && styles.selectedVehicleText
                  ]}>
                    {vehicle.fare}
                  </Text>
                  <Text style={styles.vehicleTime}>{vehicle.time}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Book ride button */}
          <TouchableOpacity
            style={[styles.bookButton, !destination && styles.disabledButton]}
            onPress={bookRide}
            disabled={!destination}
          >
            <Text style={styles.bookButtonText}>Book Ride / सवारी बुक करें</Text>
            <Ionicons name="arrow-forward" size={24} color="white" />
          </TouchableOpacity>

          {/* Features info */}
          <View style={styles.featuresInfo}>
            <Text style={styles.featuresTitle}>🗺️ Premium Google Maps Features:</Text>
            <Text style={styles.featureItem}>✅ High-quality satellite imagery</Text>
            <Text style={styles.featureItem}>✅ Real-time traffic information</Text>
            <Text style={styles.featureItem}>✅ Precise location markers</Text>
            <Text style={styles.featureItem}>✅ Custom map styling</Text>
            <Text style={styles.featureItem}>✅ Interactive map controls</Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  greetingHindi: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  mapContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  map: {
    flex: 1,
  },
  locationOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
  },
  locationInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#16A34A',
    marginRight: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  bottomSection: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    maxHeight: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  quickLocations: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  quickLocationBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  activeLocationBtn: {
    backgroundColor: '#DC2626',
  },
  quickLocationText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  activeLocationText: {
    color: 'white',
  },
  destinationSection: {
    marginBottom: 24,
  },
  destinationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  destinationText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  sampleDestBtn: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  sampleDestText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
  },
  vehicleSection: {
    marginBottom: 24,
  },
  vehicleOptions: {
    flexDirection: 'row',
    gap: 16,
  },
  vehicleCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedVehicleCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
  },
  vehicleNameHindi: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  selectedVehicleText: {
    color: '#DC2626',
  },
  vehicleFare: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16A34A',
  },
  vehicleTime: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  bookButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  featuresInfo: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 12,
  },
  featureItem: {
    fontSize: 14,
    color: '#16A34A',
    marginBottom: 4,
    lineHeight: 20,
  },
});