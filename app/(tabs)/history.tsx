import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const rideHistory: any[] = []; // Empty array for new user

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#DC2626', '#EF4444']} style={styles.header}>
        <Text style={styles.headerTitle}>Ride History</Text>
        <Text style={styles.headerSubtitle}>सवारी का इतिहास</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Total Rides</Text>
            <Text style={styles.statLabelHindi}>कुल सवारी</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>₹0</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
            <Text style={styles.statLabelHindi}>कुल खर्च</Text>
          </View>
        </View>

        {rideHistory.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Recent Rides / हाल की सवारी</Text>
            {rideHistory.map((ride) => (
              <View key={ride.id} style={styles.rideCard}>
                {/* Existing ride card content */}
              </View>
            ))}
            <TouchableOpacity style={styles.viewMoreButton}>
              <Text style={styles.viewMoreText}>View All Rides / सभी सवारी देखें</Text>
              <Ionicons name="arrow-forward" size={16} color="#DC2626" />
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateIcon}>
              <Ionicons name="car-outline" size={64} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyStateTitle}>No Rides Yet</Text>
            <Text style={styles.emptyStateTitleHindi}>अभी तक कोई सवारी नहीं</Text>
            <Text style={styles.emptyStateSubtitle}>
              Book your first ride to see your history here
            </Text>
            <Text style={styles.emptyStateSubtitleHindi}>
              अपना इतिहास यहाँ देखने के लिए अपनी पहली सवारी बुक करें
            </Text>
            <TouchableOpacity style={styles.bookFirstRideButton}>
              <Text style={styles.bookFirstRideText}>Book Your First Ride</Text>
              <Text style={styles.bookFirstRideTextHindi}>अपनी पहली सवारी बुक करें</Text>
            </TouchableOpacity>
          </View>
        )}

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
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  statLabel: {
    fontSize: 14,
    color: '#374151',
    marginTop: 4,
  },
  statLabelHindi: {
    fontSize: 12,
    color: '#64748B',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  rideCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rideInfo: {
    flex: 1,
    gap: 4,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  destinationDot: {
    backgroundColor: '#DC2626',
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: '#E5E7EB',
    marginLeft: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  locationTextHindi: {
    fontSize: 12,
    color: '#64748B',
  },
  fareContainer: {
    alignItems: 'flex-end',
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16A34A',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completedBadge: {
    backgroundColor: '#DCFCE7',
  },
  cancelledBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  completedText: {
    color: '#16A34A',
  },
  cancelledText: {
    color: '#DC2626',
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  rideDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#64748B',
  },
  driverText: {
    fontSize: 12,
    color: '#64748B',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  emptyStateTitleHindi: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 16,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 4,
  },
  emptyStateSubtitleHindi: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  bookFirstRideButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookFirstRideText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  bookFirstRideTextHindi: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginVertical: 20,
  },
  viewMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
});