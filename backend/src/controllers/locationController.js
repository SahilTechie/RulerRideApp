const axios = require('axios');

// You can use Google Geocoding API, OpenStreetMap Nominatim, or any other geocoding service
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
const USE_GOOGLE_MAPS = GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY.length > 20;

/**
 * Reverse geocoding - convert coordinates to address
 */
exports.reverseGeocode = async (req, res) => {
  try {
    const { coordinates } = req.body;
    
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const { latitude, longitude } = coordinates;

    let addressData = null;

    if (USE_GOOGLE_MAPS) {
      // Use Google Geocoding API
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
        );

        if (response.data.status === 'OK' && response.data.results.length > 0) {
          const result = response.data.results[0];
          const components = result.address_components;
          
          addressData = {
            formattedAddress: result.formatted_address,
            street: getAddressComponent(components, 'route'),
            city: getAddressComponent(components, 'locality') || 
                  getAddressComponent(components, 'administrative_area_level_2'),
            region: getAddressComponent(components, 'administrative_area_level_1'),
            postalCode: getAddressComponent(components, 'postal_code'),
            country: getAddressComponent(components, 'country')
          };
        }
      } catch (error) {
        console.error('Google Geocoding API error:', error.message);
      }
    }

    // Fallback to OpenStreetMap Nominatim (free alternative)
    if (!addressData) {
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'RulerRide-App/1.0'
            }
          }
        );

        if (response.data && response.data.display_name) {
          const addr = response.data.address || {};
          
          addressData = {
            formattedAddress: response.data.display_name,
            street: addr.road || addr.pedestrian || addr.footway,
            city: addr.city || addr.town || addr.village || addr.municipality,
            region: addr.state || addr.region,
            postalCode: addr.postcode,
            country: addr.country
          };
        }
      } catch (error) {
        console.error('Nominatim geocoding error:', error.message);
      }
    }

    // Final fallback - return coordinates as address
    if (!addressData) {
      addressData = {
        formattedAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        street: null,
        city: 'Unknown',
        region: null,
        postalCode: null,
        country: 'Unknown'
      };
    }

    res.json({
      success: true,
      data: addressData
    });

  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reverse geocode coordinates',
      error: error.message
    });
  }
};

/**
 * Forward geocoding - convert address to coordinates
 */
exports.geocode = async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }

    let coordinates = null;

    if (USE_GOOGLE_MAPS) {
      // Use Google Geocoding API
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
        );

        if (response.data.status === 'OK' && response.data.results.length > 0) {
          const location = response.data.results[0].geometry.location;
          coordinates = {
            latitude: location.lat,
            longitude: location.lng
          };
        }
      } catch (error) {
        console.error('Google Geocoding API error:', error.message);
      }
    }

    // Fallback to OpenStreetMap Nominatim
    if (!coordinates) {
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
          {
            headers: {
              'User-Agent': 'RulerRide-App/1.0'
            }
          }
        );

        if (response.data && response.data.length > 0) {
          const result = response.data[0];
          coordinates = {
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon)
          };
        }
      } catch (error) {
        console.error('Nominatim geocoding error:', error.message);
      }
    }

    if (!coordinates) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.json({
      success: true,
      data: coordinates
    });

  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to geocode address',
      error: error.message
    });
  }
};

/**
 * Calculate distance between two points
 */
exports.calculateDistance = async (req, res) => {
  try {
    const { from, to } = req.body;
    
    if (!from || !to || !from.latitude || !from.longitude || !to.latitude || !to.longitude) {
      return res.status(400).json({
        success: false,
        message: 'From and to coordinates are required'
      });
    }

    const distance = calculateHaversineDistance(from, to);

    res.json({
      success: true,
      data: {
        distance: distance, // in kilometers
        distanceText: `${distance.toFixed(2)} km`,
        duration: estimateDuration(distance) // estimated duration in minutes
      }
    });

  } catch (error) {
    console.error('Distance calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate distance',
      error: error.message
    });
  }
};

// Helper function to extract address components from Google Maps response
function getAddressComponent(components, type) {
  const component = components.find(comp => comp.types.includes(type));
  return component ? component.long_name : null;
}

// Helper function to calculate distance using Haversine formula
function calculateHaversineDistance(from, to) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper function to convert degrees to radians
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Helper function to estimate duration based on distance
function estimateDuration(distance) {
  // Assume average speed of 30 km/h in urban areas
  const averageSpeed = 30;
  return Math.round((distance / averageSpeed) * 60); // in minutes
}