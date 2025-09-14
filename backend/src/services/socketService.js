const JWTService = require('../utils/jwtService');

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socketId
    this.activeRides = new Map(); // rideId -> { riderId, driverId, rideData }
    this.driverLocations = new Map(); // driverId -> { latitude, longitude, timestamp }
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`📡 New socket connection: ${socket.id}`);

      // Handle user authentication
      socket.on('authenticate', async (data) => {
        try {
          await this.authenticateUser(socket, data);
        } catch (error) {
          console.error('Socket authentication error:', error);
          socket.emit('auth_error', { message: 'Authentication failed' });
        }
      });

      // Handle driver location updates
      socket.on('driver_location_update', (data) => {
        this.handleDriverLocationUpdate(socket, data);
      });

      // Handle ride status updates
      socket.on('ride_status_update', (data) => {
        this.handleRideStatusUpdate(socket, data);
      });

      // Handle join ride room
      socket.on('join_ride', (data) => {
        this.handleJoinRide(socket, data);
      });

      // Handle leave ride room
      socket.on('leave_ride', (data) => {
        this.handleLeaveRide(socket, data);
      });

      // Handle driver going online/offline
      socket.on('driver_status', (data) => {
        this.handleDriverStatus(socket, data);
      });

      // Handle ride requests from riders
      socket.on('request_ride', (data) => {
        this.handleRideRequest(socket, data);
      });

      // Handle driver response to ride request
      socket.on('driver_response', (data) => {
        this.handleDriverResponse(socket, data);
      });

      // Handle SOS alerts
      socket.on('sos_alert', (data) => {
        this.handleSOSAlert(socket, data);
      });

      // Handle chat messages
      socket.on('ride_message', (data) => {
        this.handleRideMessage(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Send connection success
      socket.emit('connection_success', {
        message: 'Connected to RulerRide real-time service',
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    });
  }

  async authenticateUser(socket, data) {
    const { token } = data;
    
    if (!token) {
      throw new Error('No token provided');
    }

    try {
      const decoded = JWTService.verifyToken(token);
      
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      // Store user info in socket
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      socket.authenticated = true;

      // Store connection
      this.connectedUsers.set(decoded.userId, socket.id);

      // Join user to their personal room
      socket.join(`user_${decoded.userId}`);

      // If driver, join drivers room
      if (decoded.role === 'driver') {
        socket.join('drivers');
      }

      console.log(`✅ User authenticated: ${decoded.userId} (${decoded.role})`);
      
      socket.emit('authenticated', {
        userId: decoded.userId,
        role: decoded.role,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  handleDriverLocationUpdate(socket, data) {
    if (!socket.authenticated || socket.userRole !== 'driver') {
      socket.emit('error', { message: 'Unauthorized or not a driver' });
      return;
    }

    const { latitude, longitude } = data;
    
    if (!latitude || !longitude) {
      socket.emit('error', { message: 'Invalid location data' });
      return;
    }

    // Update driver location
    this.driverLocations.set(socket.userId, {
      latitude,
      longitude,
      timestamp: new Date(),
      socketId: socket.id
    });

    // Broadcast location to riders in active rides
    this.broadcastDriverLocation(socket.userId, { latitude, longitude });

    console.log(`📍 Driver ${socket.userId} location updated: ${latitude}, ${longitude}`);
  }

  broadcastDriverLocation(driverId, location) {
    // Find active rides for this driver
    for (const [rideId, rideData] of this.activeRides.entries()) {
      if (rideData.driverId === driverId) {
        // Send location update to rider
        this.io.to(`user_${rideData.riderId}`).emit('driver_location', {
          rideId,
          driverId,
          location,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  handleRideStatusUpdate(socket, data) {
    if (!socket.authenticated) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    const { rideId, status, additionalData } = data;

    // Broadcast status update to all parties involved in the ride
    const rideData = this.activeRides.get(rideId);
    if (rideData) {
      const updateData = {
        rideId,
        status,
        timestamp: new Date().toISOString(),
        ...additionalData
      };

      // Send to rider
      this.io.to(`user_${rideData.riderId}`).emit('ride_status_update', updateData);
      
      // Send to driver
      if (rideData.driverId) {
        this.io.to(`user_${rideData.driverId}`).emit('ride_status_update', updateData);
      }

      console.log(`🚗 Ride ${rideId} status updated: ${status}`);
    }
  }

  handleJoinRide(socket, data) {
    if (!socket.authenticated) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    const { rideId } = data;
    
    // Join ride-specific room
    socket.join(`ride_${rideId}`);
    
    console.log(`🚗 User ${socket.userId} joined ride ${rideId}`);
    
    socket.emit('joined_ride', { rideId, timestamp: new Date().toISOString() });
  }

  handleLeaveRide(socket, data) {
    const { rideId } = data;
    
    // Leave ride-specific room
    socket.leave(`ride_${rideId}`);
    
    console.log(`🚗 User ${socket.userId} left ride ${rideId}`);
    
    socket.emit('left_ride', { rideId, timestamp: new Date().toISOString() });
  }

  handleDriverStatus(socket, data) {
    if (!socket.authenticated || socket.userRole !== 'driver') {
      socket.emit('error', { message: 'Unauthorized or not a driver' });
      return;
    }

    const { isOnline } = data;

    if (isOnline) {
      socket.join('available_drivers');
      console.log(`🚗 Driver ${socket.userId} is now online`);
    } else {
      socket.leave('available_drivers');
      this.driverLocations.delete(socket.userId);
      console.log(`🚗 Driver ${socket.userId} is now offline`);
    }

    socket.emit('status_updated', { isOnline, timestamp: new Date().toISOString() });
  }

  handleRideRequest(socket, data) {
    if (!socket.authenticated || socket.userRole !== 'rider') {
      socket.emit('error', { message: 'Unauthorized or not a rider' });
      return;
    }

    const { rideData } = data;

    // Store ride request
    this.activeRides.set(rideData.rideId, {
      riderId: socket.userId,
      driverId: null,
      rideData,
      status: 'searching_driver',
      requestedAt: new Date()
    });

    // Broadcast to available drivers
    socket.to('available_drivers').emit('new_ride_request', {
      rideId: rideData.rideId,
      pickup: rideData.pickup,
      destination: rideData.destination,
      vehicleType: rideData.vehicleType,
      fare: rideData.fareDetails,
      timestamp: new Date().toISOString()
    });

    console.log(`🚗 New ride request: ${rideData.rideId} from rider ${socket.userId}`);

    // Auto-assign driver after 30 seconds if no response (for demo)
    setTimeout(() => {
      this.autoAssignDriver(rideData.rideId);
    }, 30000);
  }

  handleDriverResponse(socket, data) {
    if (!socket.authenticated || socket.userRole !== 'driver') {
      socket.emit('error', { message: 'Unauthorized or not a driver' });
      return;
    }

    const { rideId, response } = data; // response: 'accept' or 'reject'

    const rideData = this.activeRides.get(rideId);
    if (!rideData || rideData.driverId) {
      socket.emit('error', { message: 'Ride not available' });
      return;
    }

    if (response === 'accept') {
      // Assign driver to ride
      rideData.driverId = socket.userId;
      rideData.status = 'driver_assigned';
      rideData.assignedAt = new Date();

      // Notify rider
      this.io.to(`user_${rideData.riderId}`).emit('driver_assigned', {
        rideId,
        driverId: socket.userId,
        driverLocation: this.driverLocations.get(socket.userId),
        timestamp: new Date().toISOString()
      });

      // Notify driver
      socket.emit('ride_assigned', {
        rideId,
        rideData: rideData.rideData,
        timestamp: new Date().toISOString()
      });

      console.log(`🚗 Driver ${socket.userId} assigned to ride ${rideId}`);
    }
  }

  handleSOSAlert(socket, data) {
    if (!socket.authenticated) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    const { alertData } = data;

    // Broadcast SOS alert to admin users and emergency services
    this.io.emit('sos_alert', {
      alertId: alertData.alertId,
      userId: socket.userId,
      location: alertData.location,
      alertType: alertData.alertType,
      severity: alertData.severity,
      timestamp: new Date().toISOString()
    });

    console.log(`🚨 SOS Alert: ${alertData.alertId} from user ${socket.userId}`);

    socket.emit('sos_alert_sent', {
      alertId: alertData.alertId,
      timestamp: new Date().toISOString()
    });
  }

  handleRideMessage(socket, data) {
    if (!socket.authenticated) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    const { rideId, message } = data;

    // Broadcast message to ride room
    socket.to(`ride_${rideId}`).emit('ride_message', {
      rideId,
      senderId: socket.userId,
      senderRole: socket.userRole,
      message,
      timestamp: new Date().toISOString()
    });

    console.log(`💬 Message in ride ${rideId} from ${socket.userId}: ${message}`);
  }

  autoAssignDriver(rideId) {
    const rideData = this.activeRides.get(rideId);
    if (!rideData || rideData.driverId) {
      return; // Already assigned or not found
    }

    // Get available drivers (mock auto-assignment)
    const availableDrivers = Array.from(this.driverLocations.keys());
    
    if (availableDrivers.length > 0) {
      // Assign first available driver (in real app, would use distance/rating algorithm)
      const selectedDriverId = availableDrivers[0];
      
      rideData.driverId = selectedDriverId;
      rideData.status = 'driver_assigned';
      rideData.assignedAt = new Date();

      // Notify rider
      this.io.to(`user_${rideData.riderId}`).emit('driver_assigned', {
        rideId,
        driverId: selectedDriverId,
        driverLocation: this.driverLocations.get(selectedDriverId),
        autoAssigned: true,
        timestamp: new Date().toISOString()
      });

      // Notify driver
      this.io.to(`user_${selectedDriverId}`).emit('ride_assigned', {
        rideId,
        rideData: rideData.rideData,
        autoAssigned: true,
        timestamp: new Date().toISOString()
      });

      console.log(`🚗 Auto-assigned driver ${selectedDriverId} to ride ${rideId}`);
    } else {
      // No drivers available
      this.io.to(`user_${rideData.riderId}`).emit('no_drivers_available', {
        rideId,
        timestamp: new Date().toISOString()
      });

      // Remove from active rides
      this.activeRides.delete(rideId);
    }
  }

  handleDisconnect(socket) {
    console.log(`📡 Socket disconnected: ${socket.id}`);

    if (socket.authenticated && socket.userId) {
      // Remove from connected users
      this.connectedUsers.delete(socket.userId);
      
      // If driver, remove location data
      if (socket.userRole === 'driver') {
        this.driverLocations.delete(socket.userId);
      }

      console.log(`👋 User ${socket.userId} disconnected`);
    }
  }

  // Public methods for external use
  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  getActiveRides() {
    return Array.from(this.activeRides.entries());
  }

  getDriverLocations() {
    return Array.from(this.driverLocations.entries());
  }

  sendToUser(userId, event, data) {
    this.io.to(`user_${userId}`).emit(event, data);
  }

  emitToUser(userId, event, data) {
    this.io.to(`user_${userId}`).emit(event, data);
  }

  broadcastToDrivers(event, data) {
    this.io.to('drivers').emit(event, data);
  }

  emitToDrivers(driverIds, event, data) {
    driverIds.forEach(driverId => {
      this.io.to(`user_${driverId}`).emit(event, data);
    });
  }
}

// Initialize socket handler
let socketHandlerInstance = null;

const initializeSocket = (io) => {
  socketHandlerInstance = new SocketHandler(io);
  return socketHandlerInstance;
};

// Export both the initializer and the instance getter
module.exports = initializeSocket;
module.exports.getInstance = () => socketHandlerInstance;
module.exports.emitToUser = (userId, event, data) => {
  if (socketHandlerInstance) {
    socketHandlerInstance.emitToUser(userId, event, data);
  }
};
module.exports.emitToDrivers = (driverIds, event, data) => {
  if (socketHandlerInstance) {
    socketHandlerInstance.emitToDrivers(driverIds, event, data);
  }
};