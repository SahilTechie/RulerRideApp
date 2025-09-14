import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LocationService, { LocationCoordinates } from './location';
import { apiService } from './api';
import { API_CONFIG } from './api';

export interface RideRequest {
  id?: string;
  userId: string;
  userPhone: string;
  pickup: {
    address: string;
    coordinates: LocationCoordinates;
  };
  destination: {
    address: string;
    coordinates: LocationCoordinates;
  };
  vehicleType: 'bike' | 'auto';
  estimatedFare: {
    min: number;
    max: number;
  };
  distance: number;
  status: 'searching_driver' | 'driver_assigned' | 'driver_arriving' | 'ride_started' | 'ride_completed' | 'cancelled';
  timestamp: string;
  driverId?: string;
  driverDetails?: DriverDetails;
  actualFare?: number;
  paymentMethod?: 'cash' | 'upi' | 'wallet' | 'razorpay';
  rideStartTime?: string;
  rideEndTime?: string;
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded';
  razorpayOrderId?: string;
}

export interface DriverDetails {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  vehicleType: 'bike' | 'auto';
  rating: number;
  profileImage?: string;
  currentLocation: LocationCoordinates;
  eta: number;
}

export interface RideUpdate {
  rideId: string;
  status: RideRequest['status'];
  driverLocation?: LocationCoordinates;
  estimatedArrival?: number;
  message?: string;
}

class RideBookingService {
  private static instance: RideBookingService;
  private socket: Socket | null = null;
  private currentRide: RideRequest | null = null;
  private locationService: LocationService;

  constructor() {
    this.locationService = LocationService.getInstance();
  }

  static getInstance(): RideBookingService {
    if (!RideBookingService.instance) {
      RideBookingService.instance = new RideBookingService();
    }
    return RideBookingService.instance;
  }

  async initializeSocket(): Promise<void> {
    try {
      // Connect to backend Socket.IO server
      this.socket = io(API_CONFIG.SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
        auth: {
          token: await AsyncStorage.getItem('auth_token')
        }
      });

      this.socket.on('connect', () => {
        console.log('🔌 Connected to ride booking server');
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Disconnected from ride booking server');
      });

      this.socket.on('connect_error', (error) => {
        console.error('🔌 Socket connection error:', error);
      });

      this.socket.on('ride_update', (update: RideUpdate) => {
        console.log('📡 Ride update received:', update);
        this.handleRideUpdate(update);
      });

      this.socket.on('driver_assigned', (driverDetails: DriverDetails) => {
        console.log('🚗 Driver assigned:', driverDetails);
        this.handleDriverAssigned(driverDetails);
      });

      this.socket.on('driver_location_update', (data: { rideId: string; location: LocationCoordinates }) => {
        console.log('📍 Driver location update:', data);
        this.handleDriverLocationUpdate(data);
      });

      this.socket.on('payment_update', (data: { rideId: string; status: string; paymentId?: string }) => {
        console.log('💳 Payment update:', data);
        this.handlePaymentUpdate(data);
      });

    } catch (error) {
      console.error('Error initializing socket:', error);
    }
  }

  async requestRide(rideData: Omit<RideRequest, 'id' | 'timestamp' | 'status'>): Promise<RideRequest> {
    try {
      console.log('🚗 Requesting ride:', rideData);

      const response = await apiService.post<RideRequest>('/rides/request', rideData);

      if (response.success && response.data) {
        this.currentRide = response.data;
        
        // Store ride request locally
        await AsyncStorage.setItem('currentRide', JSON.stringify(response.data));
        
        // Join ride room for real-time updates
        if (this.socket && this.socket.connected) {
          this.socket.emit('join_ride', { rideId: response.data.id });
        }

        console.log('✅ Ride requested successfully:', response.data.id);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to request ride');
      }
    } catch (error: any) {
      console.error('Error requesting ride:', error);
      throw new Error(error.message || 'Failed to request ride. Please try again.');
    }
  }

  async cancelRide(rideId: string, reason?: string): Promise<void> {
    try {
      console.log(`❌ Cancelling ride: ${rideId}`);

      const response = await apiService.delete(`/rides/${rideId}/cancel`, true);

      if (response.success) {
        if (this.currentRide && this.currentRide.id === rideId) {
          this.currentRide.status = 'cancelled';
          await AsyncStorage.setItem('currentRide', JSON.stringify(this.currentRide));
          
          // Leave ride room
          if (this.socket && this.socket.connected) {
            this.socket.emit('leave_ride', { rideId });
          }
          
          this.currentRide = null;
          await AsyncStorage.removeItem('currentRide');
        }

        console.log('✅ Ride cancelled successfully');
      } else {
        throw new Error(response.message || 'Failed to cancel ride');
      }
    } catch (error: any) {
      console.error('Error cancelling ride:', error);
      throw new Error(error.message || 'Failed to cancel ride. Please try again.');
    }
  }

  async getCurrentRide(): Promise<RideRequest | null> {
    try {
      if (this.currentRide) {
        return this.currentRide;
      }

      // Try to get current ride from backend
      const response = await apiService.get<RideRequest>('/rides/current');
      if (response.success && response.data) {
        this.currentRide = response.data;
        await AsyncStorage.setItem('currentRide', JSON.stringify(response.data));
        return response.data;
      }

      // Fallback to local storage
      const storedRide = await AsyncStorage.getItem('currentRide');
      if (storedRide) {
        this.currentRide = JSON.parse(storedRide);
        return this.currentRide;
      }

      return null;
    } catch (error) {
      console.error('Error getting current ride:', error);
      
      // Fallback to local storage on error
      try {
        const storedRide = await AsyncStorage.getItem('currentRide');
        if (storedRide) {
          this.currentRide = JSON.parse(storedRide);
          return this.currentRide;
        }
      } catch (localError) {
        console.error('Error reading local ride data:', localError);
      }
      
      return null;
    }
  }

  async getRideHistory(userId: string): Promise<RideRequest[]> {
    try {
      console.log(`📋 Getting ride history for user: ${userId}`);

      const response = await apiService.get<RideRequest[]>(`/rides/user/${userId}`);
      
      if (response.success && response.data) {
        // Cache history locally
        await AsyncStorage.setItem(`rideHistory_${userId}`, JSON.stringify(response.data));
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get ride history');
      }
    } catch (error: any) {
      console.error('Error getting ride history:', error);
      
      // Fallback to local storage
      try {
        const history = await AsyncStorage.getItem(`rideHistory_${userId}`);
        return history ? JSON.parse(history) : [];
      } catch (localError) {
        console.error('Error reading local history:', localError);
        return [];
      }
    }
  }

  async completeRide(rideId: string, rating: number, tip?: number): Promise<void> {
    try {
      console.log(`✅ Completing ride: ${rideId}`);

      const response = await apiService.put(`/rides/${rideId}/complete`, {
        rating,
        tip: tip || 0
      });

      if (response.success) {
        if (this.currentRide && this.currentRide.id === rideId) {
          this.currentRide.status = 'ride_completed';
          this.currentRide.rideEndTime = new Date().toISOString();
          
          // Leave ride room
          if (this.socket && this.socket.connected) {
            this.socket.emit('leave_ride', { rideId });
          }
          
          this.currentRide = null;
          await AsyncStorage.removeItem('currentRide');
        }

        console.log('✅ Ride completed successfully');
      } else {
        throw new Error(response.message || 'Failed to complete ride');
      }
    } catch (error: any) {
      console.error('Error completing ride:', error);
      throw new Error(error.message || 'Failed to complete ride. Please try again.');
    }
  }

  private handleRideUpdate(update: RideUpdate): void {
    if (this.currentRide && this.currentRide.id === update.rideId) {
      this.currentRide.status = update.status;
      AsyncStorage.setItem('currentRide', JSON.stringify(this.currentRide));
      console.log(`📡 Ride ${update.rideId} status updated to: ${update.status}`);
    }
  }

  private handleDriverAssigned(driverDetails: DriverDetails): void {
    if (this.currentRide) {
      this.currentRide.status = 'driver_assigned';
      this.currentRide.driverId = driverDetails.id;
      this.currentRide.driverDetails = driverDetails;
      AsyncStorage.setItem('currentRide', JSON.stringify(this.currentRide));
      console.log(`🚗 Driver ${driverDetails.name} assigned to ride ${this.currentRide.id}`);
    }
  }

  private handleDriverLocationUpdate(data: { rideId: string; location: LocationCoordinates }): void {
    if (this.currentRide && this.currentRide.id === data.rideId && this.currentRide.driverDetails) {
      this.currentRide.driverDetails.currentLocation = data.location;
      AsyncStorage.setItem('currentRide', JSON.stringify(this.currentRide));
      console.log(`📍 Driver location updated for ride ${data.rideId}`);
    }
  }

  private handlePaymentUpdate(data: { rideId: string; status: string; paymentId?: string }): void {
    if (this.currentRide && this.currentRide.id === data.rideId) {
      this.currentRide.paymentStatus = data.status as any;
      if (data.paymentId) {
        this.currentRide.razorpayOrderId = data.paymentId;
      }
      AsyncStorage.setItem('currentRide', JSON.stringify(this.currentRide));
      console.log(`💳 Payment status updated for ride ${data.rideId}: ${data.status}`);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 Disconnected from ride booking server');
    }
  }

  // Reconnect socket if needed
  async reconnectSocket(): Promise<void> {
    if (!this.socket || !this.socket.connected) {
      console.log('🔄 Reconnecting to ride booking server...');
      await this.initializeSocket();
    }
  }

  // Get available drivers nearby
  async getNearbyDrivers(
    location: LocationCoordinates, 
    vehicleType: 'bike' | 'auto',
    radius: number = 5
  ): Promise<DriverDetails[]> {
    try {
      console.log(`� Finding nearby ${vehicleType} drivers`);

      const response = await apiService.post<DriverDetails[]>('/rides/nearby-drivers', {
        location,
        vehicleType,
        radius
      }, false);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get nearby drivers');
      }
    } catch (error: any) {
      console.error('Error getting nearby drivers:', error);
      
      // Fallback to mock data for demo (with proper type conversion)
      const mockDrivers = this.locationService.getMockDriversNearby(location, radius);
      return mockDrivers.map(driver => ({
        id: driver.id,
        name: driver.name,
        phone: '+91 98765 43210', // Mock phone
        vehicleNumber: `UP 12 AB ${Math.floor(Math.random() * 9999)}`, // Mock vehicle number
        vehicleType: driver.vehicleType as 'bike' | 'auto',
        rating: driver.rating,
        currentLocation: driver.location,
        eta: driver.eta,
        profileImage: undefined
      }));
    }
  }

  // Track ride in real-time
  async startRideTracking(rideId: string): Promise<void> {
    try {
      if (this.socket && this.socket.connected) {
        this.socket.emit('start_tracking', { rideId });
        console.log(`📡 Started tracking ride: ${rideId}`);
      }
    } catch (error) {
      console.error('Error starting ride tracking:', error);
    }
  }

  // Stop ride tracking
  async stopRideTracking(rideId: string): Promise<void> {
    try {
      if (this.socket && this.socket.connected) {
        this.socket.emit('stop_tracking', { rideId });
        console.log(`� Stopped tracking ride: ${rideId}`);
      }
    } catch (error) {
      console.error('Error stopping ride tracking:', error);
    }
  }

  // Update user location during ride
  async updateUserLocation(rideId: string, location: LocationCoordinates): Promise<void> {
    try {
      if (this.socket && this.socket.connected) {
        this.socket.emit('user_location_update', { rideId, location });
      }
    } catch (error) {
      console.error('Error updating user location:', error);
    }
  }

  // Get ride details by ID
  async getRideDetails(rideId: string): Promise<RideRequest | null> {
    try {
      console.log(`📋 Getting ride details: ${rideId}`);

      const response = await apiService.get<RideRequest>(`/rides/${rideId}`);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Ride not found');
      }
    } catch (error: any) {
      console.error('Error getting ride details:', error);
      return null;
    }
  }
}

export default RideBookingService;