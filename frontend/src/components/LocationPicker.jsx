import React, { useState, useEffect, useRef } from 'react';
import './LocationPicker.css';

export default function LocationPicker({ onSend, onClose }) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLiveSharing, setIsLiveSharing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const watchIdRef = useRef(null);

  useEffect(() => {
    getCurrentLocation();
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const getCurrentLocation = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        setCurrentLocation(location);
        setLoading(false);
      },
      (error) => {
        setError('Unable to retrieve your location');
        setLoading(false);
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  const startLiveSharing = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      return;
    }

    setIsLiveSharing(true);
    
    // Send initial location immediately
    const location = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      accuracy: currentLocation.accuracy,
      isLive: true,
      timestamp: new Date().toISOString()
    };
    onSend(location);
    
    // Then start watching for updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const updatedLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          isLive: true,
          timestamp: new Date().toISOString()
        };
        setCurrentLocation(updatedLocation);
        
        // Send location update
        onSend(updatedLocation);
      },
      (error) => {
        console.error('Location tracking error:', error);
        setError('Location tracking error');
        stopLiveSharing();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const stopLiveSharing = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLiveSharing(false);
    onClose();
  };

  const sendCurrentLocation = () => {
    if (currentLocation) {
      onSend({ ...currentLocation, isLive: false });
      onClose();
    }
  };

  return (
    <div className="location-picker-overlay" onClick={onClose}>
      <div className="location-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="location-picker-header">
          <h3>📍 Share Location</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="location-picker-body">
          {loading && (
            <div className="location-loading">
              <div className="spinner"></div>
              <p>Getting your location...</p>
            </div>
          )}

          {error && (
            <div className="location-error">
              <p>{error}</p>
              <button onClick={getCurrentLocation}>Try Again</button>
            </div>
          )}

          {currentLocation && !loading && (
            <>
              <div className="location-preview">
                <div className="location-icon">📍</div>
                <div className="location-details">
                  <p className="location-coords">
                    {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                  </p>
                  <p className="location-accuracy">
                    Accuracy: {Math.round(currentLocation.accuracy)}m
                  </p>
                </div>
              </div>

              <div className="location-map-preview">
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${currentLocation.longitude-0.01},${currentLocation.latitude-0.01},${currentLocation.longitude+0.01},${currentLocation.latitude+0.01}&layer=mapnik&marker=${currentLocation.latitude},${currentLocation.longitude}`}
                  title="Location Preview"
                />
              </div>

              {isLiveSharing && (
                <div className="live-sharing-indicator">
                  <div className="pulse-dot"></div>
                  <span>Live location sharing active</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="location-picker-actions">
          {!isLiveSharing ? (
            <>
              <button 
                className="btn-current-location"
                onClick={sendCurrentLocation}
                disabled={!currentLocation || loading}
              >
                📍 Send Current Location
              </button>
              <button 
                className="btn-live-location"
                onClick={startLiveSharing}
                disabled={!currentLocation || loading}
              >
                🔴 Start Live Sharing
              </button>
            </>
          ) : (
            <>
              <div className="live-sharing-info">
                <p>Live location is being shared</p>
                <p className="info-note">Your location will update automatically as you move</p>
              </div>
              <button 
                className="btn-stop-sharing"
                onClick={stopLiveSharing}
              >
                ⏹ Stop Live Sharing
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
