import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import LocationService from '../../services/location';
import RideBookingService from '../../services/booking';

// Conditional import for maps (only on native platforms)
const MapView = Platform.OS !== 'web' ? require('react-native-maps').default : null;
const Marker = Platform.OS !== 'web' ? require('react-native-maps').Marker : null;
const PROVIDER_GOOGLE = Platform.OS !== 'web' ? require('react-native-maps').PROVIDER_GOOGLE : null;

const vehicleTypes = [
  { id: 'bike', name: 'Bike', nameHindi: 'बाइक', icon: 'bicycle', baseFare: 50, perKm: 8, time: '5-8 min' },
  { id: 'auto', name: 'Auto', nameHindi: 'ऑटो', icon: 'car', baseFare: 80, perKm: 12, time: '7-12 min' },
];

// Mock fare calculation based on distance
const calculateFare = (distance: number, vehicleType: string) => {
  const vehicle = vehicleTypes.find(v => v.id === vehicleType);
  if (!vehicle) return { min: 50, max: 80 };
  
  const fare = vehicle.baseFare + (distance * vehicle.perKm);
  return { 
    min: Math.round(fare * 0.9), 
    max: Math.round(fare * 1.1) 
  };
};

export default function HomeScreen() {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('bike');
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [estimatedDistance, setEstimatedDistance] = useState(5); // km
  const [userProfile, setUserProfile] = useState<any>(null);
  const [socket, setSocket] = useState<any>(null);
  const [locationServiceInstance] = useState(() => LocationService.getInstance());
  const router = useRouter();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Get user profile
      const profile = await AsyncStorage.getItem('userProfile');
      if (profile) {
        setUserProfile(JSON.parse(profile));
      }

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        getCurrentLocation();
      } else {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to book rides and get accurate pickup locations.',
          [{ text: 'OK' }]
        );
      }

      // Initialize socket connection for real-time updates
      const socketConnection = io('ws://localhost:3001'); // Will be replaced with actual backend
      setSocket(socketConnection);

      socketConnection.on('connect', () => {
        console.log('Connected to ride booking server');
      });

    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(location);
      
      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      if (reverseGeocode[0]) {
        const address = `${reverseGeocode[0].name || ''} ${reverseGeocode[0].street || ''}, ${reverseGeocode[0].city || ''}`;
        setPickup(address.trim());
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Unable to get your current location. Please enter pickup address manually.');
    }
  };

  const bookRide = async () => {
    if (!pickup || !destination) {
      Alert.alert('Missing Information', 'Please enter both pickup and destination locations.');
      return;
    }

    if (!locationPermission) {
      Alert.alert('Location Required', 'Location access is required to book a ride.');
      return;
    }

    try {
      // Get user profile
      const profile = userProfile || { uid: 'demo_user', phoneNumber: '+91 98765 43210' };
      
      // Get coordinates for pickup and destination
      let pickupCoords = currentLocation?.coords;
      let destinationCoords;

      if (!pickupCoords) {
        Alert.alert('Location Error', 'Unable to get your current location.');
        return;
      }

      // For demo purposes, we'll simulate destination coordinates
      // In a real app, you'd use Google Places API or geocoding
      destinationCoords = {
        latitude: pickupCoords.latitude + 0.01,
        longitude: pickupCoords.longitude + 0.01,
      };

      // Calculate distance and fare
      const distance = locationServiceInstance.calculateDistance(
        { latitude: pickupCoords.latitude, longitude: pickupCoords.longitude },
        destinationCoords
      );
      
      const fareEstimate = calculateFare(distance, selectedVehicle);

      const rideData = {
        userId: profile.uid,
        userPhone: profile.phoneNumber,
        pickup: {
          address: pickup,
          coordinates: {
            latitude: pickupCoords.latitude,
            longitude: pickupCoords.longitude,
          },
        },
        destination: {
          address: destination,
          coordinates: destinationCoords,
        },
        vehicleType: selectedVehicle as 'bike' | 'auto',
        estimatedFare: fareEstimate,
        distance: distance,
      };

      // Initialize booking service if not already done
      if (!socket) {
        const bookingService = RideBookingService.getInstance();
        await bookingService.initializeSocket();
        setSocket(bookingService);
      }

      // Request the ride
      const rideRequest = await RideBookingService.getInstance().requestRide(rideData);
      
      Alert.alert(
        'Ride Booked!',
        'Searching for nearby drivers. You will be redirected to track your ride.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/ride-details'),
          },
        ]
      );

    } catch (error) {
      console.error('Error booking ride:', error);
      Alert.alert('Booking Error', 'Unable to book ride. Please try again.');
    }
  };

  const fareEstimate = calculateFare(estimatedDistance, selectedVehicle);
  const greeting = new Date().getHours() < 12 ? 'Good Morning!' : new Date().getHours() < 18 ? 'Good Afternoon!' : 'Good Evening!';

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#DC2626', '#EF4444']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.greetingHindi}>
              {greeting.includes('Morning') ? 'सुप्रभात!' : greeting.includes('Afternoon') ? 'नमस्कार!' : 'शुभ संध्या!'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.profileIcon}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="person" size={24} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Live Map View */}
        <View style={styles.mapContainer}>
          {isLoadingLocation ? (
            <View style={styles.mapPlaceholder}>
              <ActivityIndicator size="large" color="#DC2626" />
              <Text style={styles.mapText}>Getting your location...</Text>
            </View>
          ) : currentLocation && MapView && Platform.OS !== 'web' ? (
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation={true}
              showsMyLocationButton={true}
            >
              <Marker
                coordinate={{
                  latitude: currentLocation.coords.latitude,
                  longitude: currentLocation.coords.longitude,
                }}
                title="Your Location"
                description="Current pickup location"
              />
            </MapView>
          ) : (
            <View style={styles.mapPlaceholder}>
              <Ionicons name="location-outline" size={60} color="#9CA3AF" />
              <Text style={styles.mapText}>
                {Platform.OS === 'web' ? 'Map view available on mobile' : 'Location access required'}
              </Text>
              {Platform.OS !== 'web' && (
                <TouchableOpacity 
                  style={styles.enableLocationBtn}
                  onPress={getCurrentLocation}
                >
                  <Text style={styles.enableLocationText}>Enable Location</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Location Inputs */}
        <View style={styles.locationContainer}>
          <View style={styles.inputGroup}>
            <View style={styles.locationDot} />
            <TextInput
              style={styles.locationInput}
              placeholder="Pickup location / पिकअप स्थान"
              value={pickup}
              onChangeText={setPickup}
            />
            <TouchableOpacity onPress={getCurrentLocation}>
              <Ionicons name="locate" size={20} color="#DC2626" />
            </TouchableOpacity>
          </View>

          <View style={styles.locationLine} />

          <View style={styles.inputGroup}>
            <View style={[styles.locationDot, styles.destinationDot]} />
            <TextInput
              style={styles.locationInput}
              placeholder="Where to? / कहाँ जाना है?"
              value={destination}
              onChangeText={setDestination}
            />
            <Ionicons name="search" size={20} color="#64748B" />
          </View>
        </View>

        {/* Vehicle Selection */}
        <View style={styles.vehicleSection}>
          <Text style={styles.sectionTitle}>Choose Vehicle / वाहन चुनें</Text>
          <View style={styles.vehicleContainer}>
            {vehicleTypes.map((vehicle) => {
              const vehicleFare = calculateFare(estimatedDistance, vehicle.id);
              return (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[
                    styles.vehicleCard,
                    selectedVehicle === vehicle.id && styles.selectedVehicle,
                  ]}
                  onPress={() => setSelectedVehicle(vehicle.id)}
                >
                  <Ionicons
                    name={vehicle.icon as any}
                    size={32}
                    color={selectedVehicle === vehicle.id ? '#DC2626' : '#64748B'}
                  />
                  <Text style={[
                    styles.vehicleName,
                    selectedVehicle === vehicle.id && styles.selectedVehicleText,
                  ]}>
                    {vehicle.name}
                  </Text>
                  <Text style={styles.vehicleNameHindi}>{vehicle.nameHindi}</Text>
                  <Text style={[
                    styles.vehicleFare,
                    selectedVehicle === vehicle.id && styles.selectedVehicleText,
                  ]}>
                    ₹{vehicleFare.min}-{vehicleFare.max}
                  </Text>
                  <Text style={styles.vehicleTime}>{vehicle.time}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Fare Estimate */}
        <View style={styles.fareContainer}>
          <View style={styles.fareHeader}>
            <Text style={styles.fareTitle}>Estimated Fare / अनुमानित किराया</Text>
            <Text style={styles.distanceText}>{estimatedDistance} km</Text>
          </View>
          <Text style={styles.fareAmount}>₹{fareEstimate.min} - ₹{fareEstimate.max}</Text>
          <Text style={styles.fareNote}>*Final fare may vary based on actual distance and time</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionBtn}>
            <Ionicons name="home" size={20} color="#DC2626" />
            <Text style={styles.quickActionText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn}>
            <Ionicons name="business" size={20} color="#DC2626" />
            <Text style={styles.quickActionText}>Work</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn}>
            <Ionicons name="medical" size={20} color="#DC2626" />
            <Text style={styles.quickActionText}>Hospital</Text>
          </TouchableOpacity>
        </View>

        {/* Book Ride Button */}
        <TouchableOpacity 
          style={[styles.bookButton, (!pickup || !destination) && styles.disabledButton]} 
          onPress={bookRide}
          disabled={!pickup || !destination}
        >
          <Text style={styles.bookButtonText}>Book Ride / सवारी बुक करें</Text>
          <Ionicons name="arrow-forward" size={24} color="white" />
        </TouchableOpacity>

        {/* Safety Note */}
        <View style={styles.safetyNote}>
          <Ionicons name="shield-checkmark" size={16} color="#16A34A" />
          <Text style={styles.safetyText}>
            All rides are tracked with GPS for your safety / सभी सवारी आपकी सुरक्षा के लिए GPS द्वारा ट्रैक की जाती हैं
          </Text>
        </View>
      </ScrollView>
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
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mapContainer: {
    marginVertical: 20,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 8,
  },
  enableLocationBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  enableLocationText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  locationContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#16A34A',
    marginRight: 16,
  },
  destinationDot: {
    backgroundColor: '#DC2626',
  },
  locationLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginLeft: 6,
    marginVertical: 4,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    paddingVertical: 8,
  },
  vehicleSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  vehicleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  vehicleCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedVehicle: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
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
  },
  fareContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fareTitle: {
    fontSize: 16,
    color: '#64748B',
  },
  distanceText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
  },
  fareAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16A34A',
    textAlign: 'center',
  },
  fareNote: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  quickActionBtn: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    color: '#374151',
    marginTop: 4,
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    gap: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  safetyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  safetyText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
    lineHeight: 16,
  },
});