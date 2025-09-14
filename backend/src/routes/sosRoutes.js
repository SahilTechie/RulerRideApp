const express = require('express');
const { body } = require('express-validator');
const SOSController = require('../controllers/sosController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Validation middleware
const triggerAlertValidation = [
  body('alertType').isIn(['emergency', 'safety_concern', 'breakdown', 'medical', 'harassment', 'accident'])
    .withMessage('Valid alert type required'),
  body('location.latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('location.longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Valid severity level required'),
  body('rideId').optional().isMongoId().withMessage('Valid ride ID required')
];

const updateStatusValidation = [
  body('status').isIn(['active', 'responded', 'resolved', 'false_alarm', 'escalated'])
    .withMessage('Valid status required')
];

const emergencyContactValidation = [
  body('name').notEmpty().withMessage('Contact name is required'),
  body('phone').matches(/^\+91[0-9]{10}$/).withMessage('Valid Indian phone number required'),
  body('relationship').notEmpty().withMessage('Relationship is required'),
  body('isNotificationEnabled').optional().isBoolean().withMessage('Notification preference must be boolean')
];

// Apply authentication middleware to all routes
router.use(authMiddleware);

// SOS Alert routes
router.post('/alert', triggerAlertValidation, SOSController.triggerAlert);
router.put('/alert/:alertId/status', updateStatusValidation, SOSController.updateAlertStatus);
router.get('/alert/:alertId', SOSController.getAlertDetails);
router.get('/alerts/history', SOSController.getAlertHistory);

// Emergency contacts management
router.get('/contacts', SOSController.getEmergencyContacts);
router.post('/contacts', emergencyContactValidation, SOSController.addEmergencyContact);
router.put('/contacts/:contactId', SOSController.updateEmergencyContact);
router.delete('/contacts/:contactId', SOSController.removeEmergencyContact);

// Health check for SOS service
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'SOS service operational',
    features: [
      'Emergency Alert System',
      'Real-time Notifications',
      'Emergency Contacts Management',
      'Auto-escalation',
      'Emergency Services Integration'
    ],
    emergencyNumbers: {
      police: process.env.EMERGENCY_POLICE || '100',
      ambulance: process.env.EMERGENCY_AMBULANCE || '108',
      fire: process.env.EMERGENCY_FIRE || '101'
    }
  });
});

module.exports = router;