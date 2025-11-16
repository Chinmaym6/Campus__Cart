import axios from 'axios';

/**
 * Reverse geocode coordinates to get location text
 * Uses Nominatim (OpenStreetMap) API - free and no API key required
 */
export async function reverseGeocode(latitude, longitude) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat: latitude,
        lon: longitude,
        format: 'json',
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'CampusCart/1.0'
      }
    });

    if (response.data && response.data.display_name) {
      return response.data.display_name;
    }
    
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error.message);
    return null;
  }
}
