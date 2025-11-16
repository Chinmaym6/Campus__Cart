import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationSelector = ({ onLocationChange, initialLat = 40.7128, initialLng = -74.0060 }) => {
  const [position, setPosition] = useState([initialLat, initialLng]);
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);

  useEffect(() => {
    onLocationChange(lat, lng);
  }, [lat, lng, onLocationChange]);

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setLat(latitude);
          setLng(longitude);
          setPosition([latitude, longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to retrieve your location. Please select manually on the map.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setLat(lat);
        setLng(lng);
        setPosition([lat, lng]);
      },
    });
    return null;
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      padding: '20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      marginBottom: '20px'
    }}>
      <h3 style={{ color: '#fff', marginBottom: '15px', fontSize: '1.2em' }}>Select Item Location</h3>

      <button
        onClick={handleCurrentLocation}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          border: 'none',
          padding: '12px 20px',
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '1em',
          marginBottom: '15px',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
        }}
        onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
      >
        Use My Current Location
      </button>

      <div style={{
        height: '300px',
        borderRadius: '15px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        marginBottom: '15px'
      }}>
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={position} draggable={true} eventHandlers={{
            dragend: (e) => {
              const { lat, lng } = e.target.getLatLng();
              setLat(lat);
              setLng(lng);
              setPosition([lat, lng]);
            }
          }} />
          <MapClickHandler />
        </MapContainer>
      </div>

      <div style={{
        color: '#fff',
        fontSize: '0.9em',
        background: 'rgba(0, 0, 0, 0.2)',
        padding: '10px',
        borderRadius: '10px',
        textAlign: 'center'
      }}>
        Selected: Lat {lat.toFixed(6)}, Lng {lng.toFixed(6)}
      </div>
    </div>
  );
};

export default LocationSelector;