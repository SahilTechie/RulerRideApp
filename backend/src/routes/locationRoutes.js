const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

// Reverse geocoding - convert coordinates to address
router.post('/reverse-geocode', locationController.reverseGeocode);

// Forward geocoding - convert address to coordinates
router.post('/geocode', locationController.geocode);

// Calculate distance between two points
router.post('/calculate-distance', locationController.calculateDistance);

module.exports = router;