import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform, ImageBackground, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import LocationService from '../../services/location';
import RideBookingService from '../../services/booking';
import PremiumGoogleMaps from '../../components/PremiumGoogleMaps';
import ImageSlideshow from '../../components/ImageSlideshow';
import GooglePlacesService from '../../services/googlePlaces';
import GoogleDirectionsService from '../../services/googleDirections';

const vehicleTypes = [
  { id: 'bike', name: 'Bike', nameHindi: 'बाइक', icon: require('../../assets/images/man.png'), iconType: 'image', baseFare: 50, perKm: 8, time: '5-8 min' },
  { id: 'auto', name: 'Auto', nameHindi: 'ऑटो', icon: require('../../assets/images/rickshaw.png'), iconType: 'image', baseFare: 80, perKm: 12, time: '7-12 min' },
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
  const [destinationCoordinates, setDestinationCoordinates] = useState<{latitude: number, longitude: number} | null>(null);
  const [isGeocodingDestination, setIsGeocodingDestination] = useState(false);
  const [routeData, setRouteData] = useState<{
    polylineCoordinates: {latitude: number, longitude: number}[];
    distance: number;
    duration: number;
    distanceText: string;
    durationText: string;
  } | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [nearbyVehicles, setNearbyVehicles] = useState<{
    id: string;
    type: 'bike' | 'auto';
    coordinate: {
      latitude: number;
      longitude: number;
    };
    driverName: string;
    rating: number;
  }[]>([]);
  const router = useRouter();

  useEffect(() => {
    initializeApp();
  }, []);

  // Get real route when destination coordinates change
  useEffect(() => {
    if (currentLocation && destinationCoordinates) {
      getRealRoute();
    } else {
      setRouteData(null);
    }
  }, [currentLocation, destinationCoordinates]);

  // Update nearby vehicles when location changes
  useEffect(() => {
    if (currentLocation) {
      updateNearbyVehicles();
    }
  }, [currentLocation]);

  // Simulate vehicle movement when vehicle type is switched
  useEffect(() => {
    if (currentLocation && nearbyVehicles.length > 0) {
      simulateVehicleMovement();
    }
  }, [selectedVehicle]);

  const getRealRoute = async () => {
    if (!currentLocation || !destinationCoordinates) return;

    setIsLoadingRoute(true);
    try {
      const directionsService = GoogleDirectionsService.getInstance();
      
      const route = await directionsService.getDirections(
        {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        },
        destinationCoordinates,
        'driving'
      );

      if (route) {
        setRouteData(route);
        setEstimatedDistance(route.distance);
        console.log('�️ Real route calculated:', {
          distance: route.distanceText,
          duration: route.durationText,
          points: route.polylineCoordinates.length
        });
      } else {
        // Fallback to straight line calculation
        const distance = locationServiceInstance.calculateDistance(
          { latitude: currentLocation.coords.latitude, longitude: currentLocation.coords.longitude },
          destinationCoordinates
        );
        setEstimatedDistance(distance);
        setRouteData(null);
      }
    } catch (error) {
      console.error('Error getting real route:', error);
      // Fallback to straight line
      const distance = locationServiceInstance.calculateDistance(
        { latitude: currentLocation.coords.latitude, longitude: currentLocation.coords.longitude },
        destinationCoordinates
      );
      setEstimatedDistance(distance);
      setRouteData(null);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const initializeApp = async () => {
    try {
      // Get user profile
      const profile = await AsyncStorage.getItem('userProfile');
      if (profile) {
        setUserProfile(JSON.parse(profile));
      }

      // Initialize Google Places service with API key
      const googleApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (googleApiKey) {
        const placesService = GooglePlacesService.getInstance();
        await placesService.initialize(googleApiKey);
        console.log('✅ Google Places service initialized');
      } else {
        console.error('❌ Google Maps API key not found in environment variables');
      }

      // Request location permissions and get location (mobile-only)
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
      // Use mobile location service
      setIsLoadingLocation(true);
      const result = await locationServiceInstance.getUniversalLocation();
      
      if (result.success) {
        // Create a compatible location object
        const location = {
          coords: {
            latitude: result.coordinates.latitude,
            longitude: result.coordinates.longitude,
            altitude: null,
            accuracy: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        };
        
        setCurrentLocation(location);
        setPickup(result.address);
        console.log('✅ Location detected:', { location: result.coordinates, address: result.address });
      } else {
        console.warn('⚠️ Location detection failed:', result.error);
        Alert.alert('Location Error', result.error || 'Unable to get your current location. Please enter pickup address manually.');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Unable to get your current location. Please enter pickup address manually.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Handle location detection from MapView
  const handleLocationDetected = (coordinates: any, address: string) => {
    console.log('📍 Location detected from map:', { coordinates, address });
    
    // Create a compatible location object
    const location = {
      coords: {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        altitude: null,
        accuracy: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    };
    
    setCurrentLocation(location);
    setPickup(address);
  };

  // Handle map clicks
  const handleMapClick = async (lat: number, lng: number, address?: string) => {
    console.log('🗺️ Map clicked:', { lat, lng, address });
    
    // Create a compatible location object
    const location = {
      coords: {
        latitude: lat,
        longitude: lng,
        altitude: null,
        accuracy: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    };
    
    setCurrentLocation(location);
    
    if (address) {
      setPickup(address);
    } else {
      // Get address for clicked location
      try {
        const clickedAddress = await locationServiceInstance.webReverseGeocode({ latitude: lat, longitude: lng });
        setPickup(clickedAddress);
      } catch (error) {
        console.warn('Failed to get address for clicked location:', error);
        setPickup(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    }
  };

  // Calculate map region to fit both pickup and destination
  const getMapRegion = () => {
    if (!currentLocation) return null;

    const pickupLat = currentLocation.coords.latitude;
    const pickupLng = currentLocation.coords.longitude;

    if (!destinationCoordinates) {
      // Show only pickup location
      return {
        latitude: pickupLat,
        longitude: pickupLng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    // Calculate region to show both pickup and destination
    const destLat = destinationCoordinates.latitude;
    const destLng = destinationCoordinates.longitude;

    const minLat = Math.min(pickupLat, destLat);
    const maxLat = Math.max(pickupLat, destLat);
    const minLng = Math.min(pickupLng, destLng);
    const maxLng = Math.max(pickupLng, destLng);

    const latDelta = Math.max(maxLat - minLat, 0.005) * 1.3; // Add 30% padding
    const lngDelta = Math.max(maxLng - minLng, 0.005) * 1.3; // Add 30% padding

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  };

  // Handle destination input and geocoding
  const handleDestinationChange = async (text: string) => {
    setDestination(text);
    
    if (text.trim().length > 3) {
      setIsGeocodingDestination(true);
      try {
        const placesService = GooglePlacesService.getInstance();
        
        // Check if the service is initialized
        if (!placesService) {
          throw new Error('Places service not available');
        }
        
        const geocoded = await placesService.geocodeAddress(text.trim());
        
        setDestinationCoordinates({
          latitude: geocoded.lat,
          longitude: geocoded.lng
        });
        
        console.log('📍 Destination geocoded:', { address: text, coordinates: geocoded });
      } catch (error) {
        console.warn('⚠️ Failed to geocode destination:', error);
        setDestinationCoordinates(null);
        
        // Show user-friendly error message for common issues
        if (error instanceof Error) {
          if (error.message.includes('Address not found')) {
            // Don't show alert for every failed geocoding attempt, just log it
            console.info('💡 Tip: Try entering a more specific address');
          } else if (error.message.includes('not initialized')) {
            console.error('🔧 Google Places service needs to be initialized');
          }
        }
      } finally {
        setIsGeocodingDestination(false);
      }
    } else {
      setDestinationCoordinates(null);
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
      let destinationCoords = destinationCoordinates;

      if (!pickupCoords) {
        Alert.alert('Location Error', 'Unable to get your current location.');
        return;
      }

      if (!destinationCoords) {
        Alert.alert('Destination Error', 'Please wait for destination location to be found or try entering a more specific address.');
        return;
      }

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

  // Generate nearby vehicles based on current location (both bikes and autos)
  const generateNearbyVehicles = (location: Location.LocationObject) => {
    const vehicles = [];
    const bikeDriverNames = [
      'Raj Kumar', 'Amit Singh', 'Suresh Babu', 'Ravi Sharma', 'Krishna Das',
      'Mohan Lal', 'Ramesh Kumar', 'Vijay Singh', 'Santosh Kumar', 'Prakash Jha'
    ];
    const autoDriverNames = [
      'Abdul Rahman', 'Sunil Yadav', 'Raman Gupta', 'Deepak Kumar', 'Ashok Singh',
      'Mahesh Babu', 'Ganesh Prasad', 'Sanjay Kumar', 'Vinod Singh', 'Rajesh Kumar'
    ];
    
    // Generate 10 bikes
    for (let i = 0; i < 10; i++) {
      // Generate random coordinates within 1-2km radius of current location
      const minRadiusInDegrees = 0.009; // Approximately 1km
      const maxRadiusInDegrees = 0.018; // Approximately 2km
      const randomAngle = Math.random() * 2 * Math.PI;
      const randomRadius = minRadiusInDegrees + (Math.random() * (maxRadiusInDegrees - minRadiusInDegrees));
      
      const lat = location.coords.latitude + (randomRadius * Math.cos(randomAngle));
      const lng = location.coords.longitude + (randomRadius * Math.sin(randomAngle));
      
      vehicles.push({
        id: `bike_${i + 1}`,
        type: 'bike' as const,
        coordinate: {
          latitude: lat,
          longitude: lng,
        },
        driverName: bikeDriverNames[i],
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // Rating between 3.0 and 5.0
      });
    }
    
    // Generate 10 autos
    for (let i = 0; i < 10; i++) {
      // Generate random coordinates within 1-2km radius of current location
      const minRadiusInDegrees = 0.009; // Approximately 1km
      const maxRadiusInDegrees = 0.018; // Approximately 2km
      const randomAngle = Math.random() * 2 * Math.PI;
      const randomRadius = minRadiusInDegrees + (Math.random() * (maxRadiusInDegrees - minRadiusInDegrees));
      
      const lat = location.coords.latitude + (randomRadius * Math.cos(randomAngle));
      const lng = location.coords.longitude + (randomRadius * Math.sin(randomAngle));
      
      vehicles.push({
        id: `auto_${i + 1}`,
        type: 'auto' as const,
        coordinate: {
          latitude: lat,
          longitude: lng,
        },
        driverName: autoDriverNames[i],
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // Rating between 3.0 and 5.0
      });
    }
    
    return vehicles;
  };

  // Update nearby vehicles when location changes
  const updateNearbyVehicles = () => {
    if (currentLocation) {
      const allVehicles = generateNearbyVehicles(currentLocation);
      setNearbyVehicles(allVehicles);
    }
  };

  // Simulate vehicle movement by updating positions of selected vehicle type
  const simulateVehicleMovement = () => {
    if (!currentLocation) return;

    setNearbyVehicles(prevVehicles => {
      return prevVehicles.map(vehicle => {
        // Only move vehicles of the currently selected type
        if (vehicle.type === selectedVehicle) {
          // Generate new random position within 1-2km radius
          const minRadiusInDegrees = 0.009; // Approximately 1km
          const maxRadiusInDegrees = 0.018; // Approximately 2km
          const randomAngle = Math.random() * 2 * Math.PI;
          const randomRadius = minRadiusInDegrees + (Math.random() * (maxRadiusInDegrees - minRadiusInDegrees));
          
          const lat = currentLocation.coords.latitude + (randomRadius * Math.cos(randomAngle));
          const lng = currentLocation.coords.longitude + (randomRadius * Math.sin(randomAngle));
          
          return {
            ...vehicle,
            coordinate: {
              latitude: lat,
              longitude: lng,
            },
          };
        }
        // Keep other vehicle types in their current positions
        return vehicle;
      });
    });
  };

  const fareEstimate = calculateFare(estimatedDistance, selectedVehicle);
  const greeting = new Date().getHours() < 12 ? 'Good Morning!' : new Date().getHours() < 18 ? 'Good Afternoon!' : 'Good Evening!';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header section with slideshow */}
        <ImageSlideshow 
          style={styles.header}
          imageStyle={styles.headerImage}
        >
          <View style={styles.headerOverlay}>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.greeting}>{greeting}</Text>
                <Text style={styles.greetingHindi}>
                  {greeting.includes('Morning') ? 'सुप्रभात!' : greeting.includes('Afternoon') ? 'नमस्कार!' : 'शुभ संध्या!'}
                </Text>
              </View>
            </View>
          </View>
        </ImageSlideshow>

        {/* Premium Google Maps */}
        <View style={styles.mapContainer}>
          {isLoadingLocation ? (
            <View style={styles.mapPlaceholder}>
              <ActivityIndicator size="large" color="#DC2626" />
              <Text style={styles.mapText}>Getting your location...</Text>
            </View>
          ) : currentLocation ? (
            <PremiumGoogleMaps
              initialRegion={getMapRegion()!}
              markers={[
                {
                  coordinate: {
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude,
                  },
                  title: 'Pickup Location',
                  description: pickup || 'Your current location',
                  type: 'pickup',
                  color: 'green',
                },
                // Add destination marker if destination coordinates are available
                ...(destinationCoordinates ? [{
                  coordinate: {
                    latitude: destinationCoordinates.latitude,
                    longitude: destinationCoordinates.longitude,
                  },
                  title: 'Destination',
                  description: destination,
                  type: 'destination' as const,
                  color: 'red' as const,
                }] : []),
                // Add nearby vehicles of selected type only
                ...nearbyVehicles
                  .filter(vehicle => vehicle.type === selectedVehicle)
                  .map(vehicle => ({
                    coordinate: vehicle.coordinate,
                    title: `${vehicle.type === 'bike' ? 'Bike' : 'Auto'} - ${vehicle.driverName}`,
                    description: `Rating: ${vehicle.rating} ⭐`,
                    type: 'driver' as const,
                    color: 'blue' as const,
                    vehicleType: vehicle.type,
                    vehicleId: vehicle.id,
                  }))
              ]}
              polylineCoordinates={routeData?.polylineCoordinates || (destinationCoordinates ? [
                {
                  latitude: currentLocation.coords.latitude,
                  longitude: currentLocation.coords.longitude,
                },
                {
                  latitude: destinationCoordinates.latitude,
                  longitude: destinationCoordinates.longitude,
                }
              ] : [])}
              routeDistance={routeData?.distance || estimatedDistance}
              routeDuration={routeData?.duration}
              routeDistanceText={routeData?.distanceText}
              routeDurationText={routeData?.durationText}
              showDistanceOverlay={true}
              showsUserLocation={true}
              showsMyLocationButton={true}
              autoDetectLocation={true}
              mapStyle="standard"
              onLocationPress={(coordinate) => {
                handleMapClick(coordinate.latitude, coordinate.longitude);
              }}
              style={{ height: 280 }}
            />
          ) : (
            <View style={styles.mapPlaceholder}>
              <Ionicons name="location-outline" size={60} color="#9CA3AF" />
              <Text style={styles.mapText}>Location access required</Text>
              <TouchableOpacity 
                style={styles.enableLocationBtn}
                onPress={getCurrentLocation}
              >
                <Text style={styles.enableLocationText}>Enable Location</Text>
              </TouchableOpacity>
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
              onChangeText={handleDestinationChange}
            />
            {isGeocodingDestination || isLoadingRoute ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <Ionicons name="search" size={20} color="#64748B" />
            )}
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
                  {vehicle.iconType === 'image' ? (
                    <Image
                      source={vehicle.icon}
                      style={[
                        styles.vehicleImage,
                        { tintColor: selectedVehicle === vehicle.id ? '#DC2626' : '#64748B' }
                      ]}
                    />
                  ) : (
                    <Ionicons
                      name={vehicle.icon as any}
                      size={32}
                      color={selectedVehicle === vehicle.id ? '#DC2626' : '#64748B'}
                    />
                  )}
                  <Text style={[
                    styles.vehicleName,
                    selectedVehicle === vehicle.id && styles.selectedVehicleText,
                  ]}>
                    {vehicle.name}
                  </Text>
                  <Text style={styles.vehicleNameHindi}>{vehicle.nameHindi}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Fare Estimate */}
        <View style={styles.fareContainer}>
          <View style={styles.fareHeader}>
            <Text style={styles.fareTitle}>Estimated Fare / अनुमानित किराया</Text>
            <Text style={styles.distanceText}>{estimatedDistance.toFixed(2)} km</Text>
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
    height: 220, // Increased height for better image display
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 15,
  },
  headerImage: {
    // Removed border radius for flat bottom edges
  },
  headerOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Lighter overlay for better image visibility
    paddingTop: 60, // Account for status bar when scrollable
    paddingBottom: 20,
    paddingHorizontal: 20,
    height: '100%',
    justifyContent: 'center',
    // Add subtle gradient effect for 3D depth
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
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
  },
  mapContainer: {
    marginVertical: 20,
    marginHorizontal: 15,
    height: 220,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    height: 250,
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
    marginHorizontal: 20,
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
    marginHorizontal: 20,
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
    padding: 12,
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
  vehicleImage: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
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
    marginHorizontal: 20,
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
    marginHorizontal: 20,
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
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 20,
    marginHorizontal: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  safetyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    marginHorizontal: 20,
    gap: 8,
  },
  safetyText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
    lineHeight: 16,
  },
});