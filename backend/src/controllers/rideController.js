const Ride = require('../models/Ride');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');
const socketService = require('../services/socketService');

class RideController {
  // Request a new ride
  static requestRide = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { pickupLocation, destination, vehicleType, scheduledTime } = req.body;
    const riderId = req.user.id;

    // Check if user has any active rides
    const activeRide = await Ride.findOne({
      riderId,
      status: { $in: ['pending', 'accepted', 'driver_arriving', 'in_progress'] }
    });

    if (activeRide) {
      throw new AppError('You already have an active ride', 400, 'ACTIVE_RIDE_EXISTS');
    }

    // Calculate estimated fare and distance
    const estimatedDistance = calculateDistance(pickupLocation, destination);
    const estimatedFare = calculateFare(estimatedDistance, vehicleType);
    const estimatedDuration = Math.ceil(estimatedDistance * 2); // 2 minutes per km average

    // Create new ride request
    const ride = new Ride({
      riderId,
      pickupLocation: {
        type: 'Point',
        coordinates: [pickupLocation.longitude, pickupLocation.latitude],
        address: pickupLocation.address,
        name: pickupLocation.name
      },
      destination: {
        type: 'Point', 
        coordinates: [destination.longitude, destination.latitude],
        address: destination.address,
        name: destination.name
      },
      vehicleType,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : new Date(),
      estimatedFare,
      estimatedDistance,
      estimatedDuration,
      status: 'pending'
    });

    await ride.save();

    // Start driver search process
    const searchResult = await findNearbyDrivers(ride);
    
    // Emit ride request to nearby drivers
    socketService.emitToDrivers(searchResult.driverIds, 'new_ride_request', {
      rideId: ride._id,
      pickupLocation: ride.pickupLocation,
      destination: ride.destination,
      estimatedFare: ride.estimatedFare,
      estimatedDistance: ride.estimatedDistance,
      vehicleType: ride.vehicleType
    });

    // Set timeout for ride request (30 seconds)
    setTimeout(async () => {
      const updatedRide = await Ride.findById(ride._id);
      if (updatedRide && updatedRide.status === 'pending') {
        await Ride.findByIdAndUpdate(ride._id, { 
          status: 'cancelled',
          cancellationReason: 'No drivers available'
        });
        
        socketService.emitToUser(riderId, 'ride_cancelled', {
          rideId: ride._id,
          reason: 'No drivers available in your area'
        });
      }
    }, 30000);

    res.status(201).json({
      success: true,
      message: 'Ride requested successfully',
      data: {
        rideId: ride._id,
        estimatedFare: ride.estimatedFare,
        estimatedDuration: ride.estimatedDuration,
        searchingDrivers: searchResult.count,
        status: ride.status
      }
    });
  });

  // Driver accepts a ride
  static acceptRide = asyncHandler(async (req, res) => {
    const { rideId } = req.params;
    const driverId = req.user.id;

    // Verify driver eligibility
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'driver') {
      throw new AppError('Invalid driver', 403, 'INVALID_DRIVER');
    }

    if (driver.driverProfile.status !== 'online') {
      throw new AppError('Driver must be online to accept rides', 400, 'DRIVER_NOT_ONLINE');
    }

    // Check if driver has active ride
    const activeRide = await Ride.findOne({
      driverId,
      status: { $in: ['accepted', 'driver_arriving', 'in_progress'] }
    });

    if (activeRide) {
      throw new AppError('Driver already has an active ride', 400, 'DRIVER_BUSY');
    }

    // Find and update the ride
    const ride = await Ride.findOneAndUpdate(
      { _id: rideId, status: 'pending' },
      { 
        driverId,
        status: 'accepted',
        acceptedAt: new Date()
      },
      { new: true }
    ).populate('riderId', 'name phone');

    if (!ride) {
      throw new AppError('Ride not found or already assigned', 404, 'RIDE_NOT_AVAILABLE');
    }

    // Update driver status
    await User.findByIdAndUpdate(driverId, {
      'driverProfile.status': 'busy',
      'driverProfile.currentRideId': ride._id
    });

    // Notify rider about driver assignment
    socketService.emitToUser(ride.riderId._id, 'driver_assigned', {
      rideId: ride._id,
      driver: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        vehicle: driver.driverProfile.vehicle,
        location: driver.driverProfile.currentLocation,
        rating: driver.driverProfile.rating
      },
      estimatedArrival: calculateDriverArrivalTime(driver.driverProfile.currentLocation, ride.pickupLocation)
    });

    // Notify other drivers that ride is taken
    socketService.emitToDrivers([], 'ride_taken', { rideId: ride._id });

    res.status(200).json({
      success: true,
      message: 'Ride accepted successfully',
      data: {
        rideId: ride._id,
        rider: {
          name: ride.riderId.name,
          phone: ride.riderId.phone
        },
        pickupLocation: ride.pickupLocation,
        destination: ride.destination,
        estimatedFare: ride.estimatedFare
      }
    });
  });

  // Update ride status (driver arriving, started, completed)
  static updateRideStatus = asyncHandler(async (req, res) => {
    const { rideId } = req.params;
    const { status, location } = req.body;
    const userId = req.user.id;

    const ride = await Ride.findById(rideId)
      .populate('riderId', 'name phone')
      .populate('driverId', 'name phone');

    if (!ride) {
      throw new AppError('Ride not found', 404, 'RIDE_NOT_FOUND');
    }

    // Verify user has permission to update this ride
    if (ride.driverId._id.toString() !== userId && ride.riderId._id.toString() !== userId) {
      throw new AppError('Unauthorized to update this ride', 403, 'UNAUTHORIZED');
    }

    const allowedTransitions = {
      'accepted': ['driver_arriving', 'cancelled'],
      'driver_arriving': ['driver_arrived', 'cancelled'],
      'driver_arrived': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
    };

    if (!allowedTransitions[ride.status]?.includes(status)) {
      throw new AppError(`Cannot change status from ${ride.status} to ${status}`, 400, 'INVALID_STATUS_TRANSITION');
    }

    // Update ride status
    const updateData = { status };
    
    if (status === 'driver_arriving') {
      updateData.driverArrivingAt = new Date();
    } else if (status === 'driver_arrived') {
      updateData.driverArrivedAt = new Date();
    } else if (status === 'in_progress') {
      updateData.startedAt = new Date();
    } else if (status === 'completed') {
      updateData.completedAt = new Date();
      updateData.actualDistance = location ? calculateDistance(ride.pickupLocation, location) : ride.estimatedDistance;
      updateData.actualFare = calculateFare(updateData.actualDistance, ride.vehicleType);
    }

    if (location) {
      updateData.currentLocation = {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      };
    }

    const updatedRide = await Ride.findByIdAndUpdate(rideId, updateData, { new: true });

    // Update driver status when ride completes
    if (status === 'completed') {
      await User.findByIdAndUpdate(ride.driverId._id, {
        'driverProfile.status': 'online',
        'driverProfile.currentRideId': null,
        $inc: { 'driverProfile.totalRides': 1 }
      });
    }

    // Emit status update to both rider and driver
    const statusData = {
      rideId: ride._id,
      status,
      location: location || null,
      timestamp: new Date()
    };

    socketService.emitToUser(ride.riderId._id, 'ride_status_update', statusData);
    if (ride.driverId) {
      socketService.emitToUser(ride.driverId._id, 'ride_status_update', statusData);
    }

    res.status(200).json({
      success: true,
      message: `Ride status updated to ${status}`,
      data: {
        rideId: updatedRide._id,
        status: updatedRide.status,
        location: updatedRide.currentLocation
      }
    });
  });

  // Cancel a ride
  static cancelRide = asyncHandler(async (req, res) => {
    const { rideId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const ride = await Ride.findById(rideId)
      .populate('riderId', 'name phone')
      .populate('driverId', 'name phone');

    if (!ride) {
      throw new AppError('Ride not found', 404, 'RIDE_NOT_FOUND');
    }

    // Check permissions
    const isRider = ride.riderId._id.toString() === userId;
    const isDriver = ride.driverId && ride.driverId._id.toString() === userId;

    if (!isRider && !isDriver) {
      throw new AppError('Unauthorized to cancel this ride', 403, 'UNAUTHORIZED');
    }

    // Check if ride can be cancelled
    if (['completed', 'cancelled'].includes(ride.status)) {
      throw new AppError('Cannot cancel completed or already cancelled ride', 400, 'INVALID_CANCELLATION');
    }

    // Calculate cancellation charges
    let cancellationCharge = 0;
    if (ride.status === 'in_progress') {
      throw new AppError('Cannot cancel ride in progress', 400, 'RIDE_IN_PROGRESS');
    } else if (ride.status === 'driver_arrived') {
      cancellationCharge = ride.estimatedFare * 0.1; // 10% cancellation charge
    }

    // Update ride status
    const updateData = {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: reason,
      cancelledBy: userId,
      cancellationCharge
    };

    await Ride.findByIdAndUpdate(rideId, updateData);

    // Update driver status if assigned
    if (ride.driverId) {
      await User.findByIdAndUpdate(ride.driverId._id, {
        'driverProfile.status': 'online',
        'driverProfile.currentRideId': null
      });
    }

    // Notify both parties
    const cancellationData = {
      rideId: ride._id,
      cancelledBy: isRider ? 'rider' : 'driver',
      reason,
      cancellationCharge
    };

    socketService.emitToUser(ride.riderId._id, 'ride_cancelled', cancellationData);
    if (ride.driverId) {
      socketService.emitToUser(ride.driverId._id, 'ride_cancelled', cancellationData);
    }

    res.status(200).json({
      success: true,
      message: 'Ride cancelled successfully',
      data: {
        rideId: ride._id,
        cancellationCharge,
        reason
      }
    });
  });

  // Get ride history
  static getRideHistory = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    const query = {
      $or: [{ riderId: userId }, { driverId: userId }]
    };

    if (status) {
      query.status = status;
    }

    const rides = await Ride.find(query)
      .populate('riderId', 'name phone')
      .populate('driverId', 'name phone driverProfile.vehicle')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ride.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        rides,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRides: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  });

  // Get active ride
  static getActiveRide = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const ride = await Ride.findOne({
      $or: [{ riderId: userId }, { driverId: userId }],
      status: { $in: ['pending', 'accepted', 'driver_arriving', 'driver_arrived', 'in_progress'] }
    })
    .populate('riderId', 'name phone')
    .populate('driverId', 'name phone driverProfile.vehicle driverProfile.currentLocation');

    if (!ride) {
      return res.status(200).json({
        success: true,
        data: { activeRide: null }
      });
    }

    res.status(200).json({
      success: true,
      data: { activeRide: ride }
    });
  });
}

// Helper functions
function calculateDistance(point1, point2) {
  // Haversine formula for calculating distance between two coordinates
  const R = 6371; // Earth's radius in kilometers
  
  const lat1 = point1.coordinates ? point1.coordinates[1] : point1.latitude;
  const lon1 = point1.coordinates ? point1.coordinates[0] : point1.longitude;
  const lat2 = point2.coordinates ? point2.coordinates[1] : point2.latitude;
  const lon2 = point2.coordinates ? point2.coordinates[0] : point2.longitude;
  
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function calculateFare(distance, vehicleType) {
  const baseFares = {
    'auto': { base: 25, perKm: 12 },
    'cab': { base: 40, perKm: 18 },
    'bike': { base: 15, perKm: 8 }
  };
  
  const rates = baseFares[vehicleType] || baseFares['auto'];
  const fare = rates.base + (distance * rates.perKm);
  
  return Math.round(fare);
}

async function findNearbyDrivers(ride) {
  const radius = parseInt(process.env.DEFAULT_RIDE_RADIUS_KM) || 10;
  
  // Find available drivers within radius
  const drivers = await User.find({
    role: 'driver',
    'driverProfile.status': 'online',
    'driverProfile.vehicleType': ride.vehicleType,
    'driverProfile.currentLocation': {
      $near: {
        $geometry: ride.pickupLocation,
        $maxDistance: radius * 1000 // Convert km to meters
      }
    }
  }).limit(20);

  return {
    driverIds: drivers.map(d => d._id),
    count: drivers.length
  };
}

function calculateDriverArrivalTime(driverLocation, pickupLocation) {
  const distance = calculateDistance(driverLocation, pickupLocation);
  // Assume 30 km/h average speed in city
  const timeInMinutes = Math.ceil(distance * 2);
  return timeInMinutes;
}

module.exports = RideController;