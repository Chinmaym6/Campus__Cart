import React, { useState } from 'react';
import './LocationMessage.css';

export default function LocationMessage({ location, isOwn, onStopSharing }) {
  const [showMap, setShowMap] = useState(false);

  const openInMaps = () => {
    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  };

  const openInOpenStreetMap = () => {
    const url = `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}&zoom=15`;
    window.open(url, '_blank');
  };

  return (
    <div className={`location-message ${isOwn ? 'own' : 'other'}`}>
      <div className="location-message-header">
        <span className="location-icon">📍</span>
        <span className="location-title">
          {location.isLive ? '🔴 Live Location' : 'Location'}
        </span>
      </div>

      <div className="location-message-coords">
        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
      </div>

      {location.accuracy && (
        <div className="location-message-accuracy">
          Accuracy: ~{Math.round(location.accuracy)}m
        </div>
      )}

      <div className="location-message-preview" onClick={() => setShowMap(!showMap)}>
        <img 
          src={`https://static-maps.yandex.ru/1.x/?ll=${location.longitude},${location.latitude}&size=400,200&z=14&l=map&pt=${location.longitude},${location.latitude},pm2rdm`}
          alt="Location preview"
          onError={(e) => {
            e.target.src = `https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude-0.005},${location.latitude-0.005},${location.longitude+0.005},${location.latitude+0.005}&layer=mapnik&marker=${location.latitude},${location.longitude}`;
          }}
        />
        <div className="location-message-overlay">
          <span>Tap to {showMap ? 'hide' : 'view'} map</span>
        </div>
      </div>

      {showMap && (
        <div className="location-message-map">
          <iframe
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude-0.01},${location.latitude-0.01},${location.longitude+0.01},${location.latitude+0.01}&layer=mapnik&marker=${location.latitude},${location.longitude}`}
            style={{ width: '100%', height: '250px', border: 'none', borderRadius: '8px' }}
            title="Location Map"
          />
        </div>
      )}

      <div className="location-message-actions">
        {location.isLive && isOwn && onStopSharing && (
          <button onClick={onStopSharing} className="location-stop-btn">
            ⏹ Stop Sharing Live Location
          </button>
        )}
        <button onClick={openInMaps} className="location-action-btn">
          Open in Google Maps
        </button>
        <button onClick={openInOpenStreetMap} className="location-action-btn">
          Open in OpenStreetMap
        </button>
      </div>
    </div>
  );
}
