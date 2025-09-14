const express = require('express');
const { body } = require('express-validator');
const RideController = require('../controllers/rideController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Validation middleware
const rideRequestValidation = [
  body('pickupLocation.latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid pickup latitude required'),
  body('pickupLocation.longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid pickup longitude required'),
  body('pickupLocation.address').notEmpty().withMessage('Pickup address required'),
  body('destination.latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid destination latitude required'),
  body('destination.longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid destination longitude required'),
  body('destination.address').notEmpty().withMessage('Destination address required'),
  body('vehicleType').isIn(['auto', 'cab', 'bike']).withMessage('Valid vehicle type required')
];

const statusUpdateValidation = [
  body('status').isIn(['driver_arriving', 'driver_arrived', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Valid status required')
];

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Ride management routes
router.post('/request', rideRequestValidation, RideController.requestRide);
router.put('/:rideId/accept', RideController.acceptRide);
router.put('/:rideId/status', statusUpdateValidation, RideController.updateRideStatus);
router.put('/:rideId/cancel', RideController.cancelRide);

// Ride information routes
router.get('/active', RideController.getActiveRide);
router.get('/history', RideController.getRideHistory);

// Health check for ride service
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Ride service operational',
    features: [
      'Ride Request & Assignment',
      'Real-time Tracking',
      'Status Updates',
      'Cancellation Handling',
      'Ride History'
    ]
  });
});

module.exports = router;