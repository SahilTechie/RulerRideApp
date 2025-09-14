import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from './api';
import { LocationCoordinates } from './location';

export interface SocketEvents {
  // Connection events
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;
  
  // Authentication events
  authenticated: (data: { userId: string }) => void;
  authentication_error: (error: string) => void;
  
  // Ride events
  ride_update: (data: {
    rideId: string;
    status: string;
    message?: string;
    estimatedArrival?: number;
  }) => void;
  
  driver_assigned: (data: {
    rideId: string;
    driver: {
      id: string;
      name: string;
      phone: string;
      vehicleNumber: string;
      vehicleType: string;
      rating: number;
      currentLocation: LocationCoordinates;
      eta: number;
      profileImage?: string;
    };
  }) => void;
  
  driver_location_update: (data: {
    rideId: string;
    driverId: string;
    location: LocationCoordinates;
    heading?: number;
    speed?: number;
  }) => void;
  
  ride_cancelled: (data: {
    rideId: string;
    cancelledBy: 'user' | 'driver' | 'system';
    reason: string;
    refundAmount?: number;
  }) => void;
  
  // Payment events
  payment_update: (data: {
    rideId: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    paymentId?: string;
    amount?: number;
    message?: string;
  }) => void;
  
  // Emergency events
  emergency_alert: (data: {
    alertId: string;
    userId: string;
    location: LocationCoordinates;
    timestamp: string;
    message?: string;
  }) => void;
  
  // Notification events
  notification: (data: {
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    data?: any;
  }) => void;
  
  // System events
  system_message: (data: {
    type: 'maintenance' | 'update' | 'announcement';
    message: string;
    priority: 'low' | 'medium' | 'high';
  }) => void;
}

type SocketEventName = keyof SocketEvents;
type SocketEventCallback<T extends SocketEventName> = SocketEvents[T];

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private isConnecting: boolean = false;
  private connectionAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start with 1 second
  private maxReconnectDelay: number = 30000; // Max 30 seconds

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  // Initialize and connect to Socket.IO server
  async connect(): Promise<void> {
    if (this.socket?.connected || this.isConnecting) {
      console.log('🔌 Socket already connected or connecting');
      return;
    }

    try {
      this.isConnecting = true;
      const token = await AsyncStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('🔌 Connecting to Socket.IO server...');

      this.socket = io(API_CONFIG.SOCKET_URL, {
        transports: ['websocket', 'polling'],
        auth: {
          token: token
        },
        timeout: 10000,
        forceNew: false,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: this.maxReconnectDelay
      });

      this.setupEventListeners();
      
      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.socket!.on('connect', () => {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.connectionAttempts = 0;
          this.reconnectDelay = 1000; // Reset delay
          console.log('✅ Connected to Socket.IO server');
          resolve();
        });

        this.socket!.on('connect_error', (error) => {
          clearTimeout(timeout);
          this.isConnecting = false;
          console.error('❌ Socket connection failed:', error);
          reject(error);
        });
      });

    } catch (error) {
      this.isConnecting = false;
      console.error('❌ Failed to connect to Socket.IO server:', error);
      throw error;
    }
  }

  // Disconnect from server
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting from Socket.IO server');
      this.socket.disconnect();
      this.socket = null;
      this.eventListeners.clear();
    }
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Setup internal event listeners
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected');
      this.emitToListeners('connect');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      this.emitToListeners('disconnect', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error);
      this.connectionAttempts++;
      
      if (this.connectionAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached');
        this.emitToListeners('connect_error', error);
      } else {
        // Exponential backoff
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      }
    });

    this.socket.on('authenticated', (data) => {
      console.log('✅ Socket authenticated:', data);
      this.emitToListeners('authenticated', data);
    });

    this.socket.on('authentication_error', (error) => {
      console.error('❌ Socket authentication failed:', error);
      this.emitToListeners('authentication_error', error);
    });

    // Ride events
    this.socket.on('ride_update', (data) => {
      console.log('📡 Ride update:', data);
      this.emitToListeners('ride_update', data);
    });

    this.socket.on('driver_assigned', (data) => {
      console.log('🚗 Driver assigned:', data);
      this.emitToListeners('driver_assigned', data);
    });

    this.socket.on('driver_location_update', (data) => {
      this.emitToListeners('driver_location_update', data);
    });

    this.socket.on('ride_cancelled', (data) => {
      console.log('❌ Ride cancelled:', data);
      this.emitToListeners('ride_cancelled', data);
    });

    // Payment events
    this.socket.on('payment_update', (data) => {
      console.log('💳 Payment update:', data);
      this.emitToListeners('payment_update', data);
    });

    // Emergency events
    this.socket.on('emergency_alert', (data) => {
      console.log('🚨 Emergency alert:', data);
      this.emitToListeners('emergency_alert', data);
    });

    // Notification events
    this.socket.on('notification', (data) => {
      console.log('🔔 Notification:', data);
      this.emitToListeners('notification', data);
    });

    // System events
    this.socket.on('system_message', (data) => {
      console.log('📢 System message:', data);
      this.emitToListeners('system_message', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('🔌 Socket error:', error);
    });
  }

  // Add event listener
  on<T extends SocketEventName>(event: T, callback: SocketEventCallback<T>): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  // Remove event listener
  off<T extends SocketEventName>(event: T, callback?: SocketEventCallback<T>): void {
    if (!this.eventListeners.has(event)) return;

    const listeners = this.eventListeners.get(event)!;
    if (callback) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else {
      this.eventListeners.set(event, []);
    }
  }

  // Emit event to listeners
  private emitToListeners<T extends SocketEventName>(event: T, ...args: any[]): void {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event)!;
      listeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Send data to server
  emitToServer(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`🔌 Cannot emit ${event}: Socket not connected`);
    }
  }

  // Join a room
  joinRoom(roomName: string): void {
    this.emitToServer('join_room', { room: roomName });
    console.log(`🏠 Joined room: ${roomName}`);
  }

  // Leave a room
  leaveRoom(roomName: string): void {
    this.emitToServer('leave_room', { room: roomName });
    console.log(`🏠 Left room: ${roomName}`);
  }

  // Join ride room for real-time updates
  joinRide(rideId: string): void {
    this.emitToServer('join_ride', { rideId });
    console.log(`🚗 Joined ride room: ${rideId}`);
  }

  // Leave ride room
  leaveRide(rideId: string): void {
    this.emitToServer('leave_ride', { rideId });
    console.log(`🚗 Left ride room: ${rideId}`);
  }

  // Update user location
  updateLocation(location: LocationCoordinates, rideId?: string): void {
    this.emitToServer('location_update', {
      location,
      rideId,
      timestamp: new Date().toISOString()
    });
  }

  // Send emergency alert
  sendEmergencyAlert(location: LocationCoordinates, message?: string): void {
    this.emitToServer('emergency_alert', {
      location,
      message,
      timestamp: new Date().toISOString()
    });
    console.log('🚨 Emergency alert sent');
  }

  // Send heartbeat to keep connection alive
  sendHeartbeat(): void {
    if (this.socket?.connected) {
      this.emitToServer('heartbeat', { timestamp: Date.now() });
    }
  }

  // Reconnect manually
  async reconnect(): Promise<void> {
    if (this.socket) {
      this.socket.disconnect();
    }
    await this.connect();
  }

  // Get connection status info
  getConnectionInfo(): {
    connected: boolean;
    connectionAttempts: number;
    maxAttempts: number;
    nextRetryDelay: number;
  } {
    return {
      connected: this.isConnected(),
      connectionAttempts: this.connectionAttempts,
      maxAttempts: this.maxReconnectAttempts,
      nextRetryDelay: this.reconnectDelay
    };
  }

  // Start heartbeat to keep connection alive
  startHeartbeat(interval: number = 30000): void {
    setInterval(() => {
      this.sendHeartbeat();
    }, interval);
  }
}

// Export singleton instance
export const socketService = SocketService.getInstance();
export default socketService;