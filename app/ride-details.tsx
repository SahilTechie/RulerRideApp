import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function RideDetailsScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [emergencyContacts] = useState(['+91 98765 43210', '+91 87654 32109']);
  
  // Mock ride data for demo
  const mockRide = {
    id: 'ride_demo_123',
    status: 'ongoing',
    pickup: 'Your Current Location',
    destination: 'Destination Address',
    vehicleType: 'bike',
    fare: 85,
    distance: '5.2 km',
    estimatedTime: '12 mins',
    driver: {
      name: 'Raj Kumar',
      phone: '+91 87654 32109',
      rating: 4.8,
      vehicleNumber: 'DL 12 AB 1234',
      eta: 5
    }
  };

  // Simulate loading
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  const sosAlert = () => {
    Alert.alert(
      'Emergency SOS',
      'This will send your location and ride details to emergency contacts and authorities.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: () => Alert.alert('SOS Sent', 'Emergency alert sent to authorities and emergency contacts'),
        },
      ]
    );
  };

  const cancelRide = () => {
    Alert.alert(
      'Cancel Ride?',
      'Are you sure you want to cancel this ride? Cancellation charges may apply.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  const callDriver = () => {
    Alert.alert('Calling Driver', `Calling ${mockRide.driver.name}...`);
  };

  const shareRide = () => {
    Alert.alert('Ride Shared', 'Ride details sent to emergency contacts for safety tracking.');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>Loading ride details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#DC2626', '#EF4444']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ride Details</Text>
          <TouchableOpacity style={styles.headerSosButton} onPress={sosAlert}>
            <Text style={styles.headerSosText}>SOS</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Map Placeholder */}
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map" size={60} color="#9CA3AF" />
            <Text style={styles.mapText}>Live Tracking Map</Text>
            <View style={styles.routeIndicator}>
              <View style={styles.pickupDot} />
              <View style={styles.routeLine} />
              <View style={styles.destinationDot} />
            </View>
          </View>
        </View>

        {/* Driver Info */}
        <View style={styles.driverCard}>
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Ionicons name="person" size={32} color="#DC2626" />
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{mockRide.driver.name}</Text>
              <View style={styles.driverMeta}>
                <Ionicons name="star" size={16} color="#FFA500" />
                <Text style={styles.driverRating}>{mockRide.driver.rating}</Text>
                <Text style={styles.vehicleNumber}>{mockRide.driver.vehicleNumber}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.callButton} onPress={callDriver}>
            <Ionicons name="call" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Trip Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Trip Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Ongoing</Text>
            </View>
          </View>
          <Text style={styles.etaText}>Driver arriving in {mockRide.driver.eta} minutes</Text>
        </View>

        {/* Trip Details */}
        <View style={styles.tripCard}>
          <Text style={styles.tripTitle}>Trip Details</Text>
          
          <View style={styles.locationContainer}>
            <View style={styles.locationItem}>
              <View style={styles.locationDot} />
              <Text style={styles.locationText}>{mockRide.pickup}</Text>
            </View>
            <View style={styles.locationLine} />
            <View style={styles.locationItem}>
              <View style={[styles.locationDot, styles.destinationDot]} />
              <Text style={styles.locationText}>{mockRide.destination}</Text>
            </View>
          </View>

          <View style={styles.tripMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="car" size={20} color="#64748B" />
              <Text style={styles.metaText}>{mockRide.vehicleType.charAt(0).toUpperCase() + mockRide.vehicleType.slice(1)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="location" size={20} color="#64748B" />
              <Text style={styles.metaText}>{mockRide.distance}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time" size={20} color="#64748B" />
              <Text style={styles.metaText}>{mockRide.estimatedTime}</Text>
            </View>
          </View>
        </View>

        {/* Fare Details */}
        <View style={styles.fareCard}>
          <Text style={styles.fareTitle}>Fare Details</Text>
          <View style={styles.fareBreakdown}>
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>Base Fare</Text>
              <Text style={styles.fareValue}>₹60</Text>
            </View>
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>Distance Charge</Text>
              <Text style={styles.fareValue}>₹25</Text>
            </View>
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>Total</Text>
              <Text style={styles.fareTotal}>₹{mockRide.fare}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={shareRide}>
            <Ionicons name="share-social" size={24} color="#64748B" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.actionSosButton]} onPress={sosAlert}>
            <Ionicons name="warning" size={24} color="white" />
            <Text style={[styles.actionText, styles.sosText]}>SOS</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={cancelRide}>
            <Ionicons name="close-circle" size={24} color="#DC2626" />
            <Text style={[styles.actionText, styles.cancelText]}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Ride Info */}
        <View style={styles.rideInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>From:</Text>
            <Text style={styles.infoValue}>{mockRide.pickup}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>To:</Text>
            <Text style={styles.infoValue}>{mockRide.destination}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Distance:</Text>
            <Text style={styles.infoValue}>{mockRide.distance}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fare:</Text>
            <Text style={styles.infoValue}>₹{mockRide.fare}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ride ID:</Text>
            <Text style={[styles.infoValue, styles.rideId]}>{mockRide.id.slice(-8)}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  sosButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerSosButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerSosText: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 8,
  },
  routeIndicator: {
    position: 'absolute',
    left: 30,
    top: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#16A34A',
  },
  routeLine: {
    width: 80,
    height: 3,
    backgroundColor: '#DC2626',
    marginHorizontal: 8,
  },
  destinationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DC2626',
  },
  driverCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  driverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverRating: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 4,
    marginRight: 12,
  },
  vehicleNumber: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  callButton: {
    backgroundColor: '#059669',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  etaText: {
    fontSize: 14,
    color: '#64748B',
  },
  tripCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tripTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#059669',
    marginRight: 12,
  },
  locationLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginLeft: 5,
    marginVertical: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  tripMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  fareCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fareTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  fareBreakdown: {
    gap: 12,
  },
  fareItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  fareValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  fareTotal: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  sosText: {
    color: 'white',
  },
  actionSosButton: {
    backgroundColor: '#EAB308',
  },
  cancelText: {
    color: '#DC2626',
  },
    cancelButton: {
      backgroundColor: '#FEF2F2',
    },
    rideInfo: {
      backgroundColor: 'white',
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    infoLabel: {
      fontSize: 14,
      color: '#64748B',
      fontWeight: '500',
    },
    infoValue: {
      fontSize: 14,
      color: '#374151',
      fontWeight: '600',
    },
    rideId: {
      fontFamily: 'monospace',
      backgroundColor: '#F3F4F6',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
  });
 