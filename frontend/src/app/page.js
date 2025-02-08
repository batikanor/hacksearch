"use client"
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the Globe component to disable SSR
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

export default function Home() {
  const [message, setMessage] = useState('');
  // Store markers with lat/lng and (when available) a label
  const [markers, setMarkers] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // To indicate which marker is currently hovered
  const [hoveredMarkerKey, setHoveredMarkerKey] = useState('');
  
  // A cache to avoid refetching if we already got a message
  const labelCache = {};

  useEffect(() => {
    async function fetchMessage() {
      try {
        // Use localhost:5000 or backend:5000 depending on environment, this needs to be configured in the docker compose
        console.log(process.env.NEXT_PUBLIC_API_URL);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const response = await fetch(`${apiUrl}/api/hello`);
        const data = await response.json();
        setMessage(data.message);
      } catch (error) {
        console.error('Error fetching message:', error);
      }
    }

    fetchMessage();
  }, []);

  const handleGlobeClick = async (clickEvent) => {
    // Get lat/lng from click event and add a new marker with an empty label
    const lat = clickEvent.lat;
    const lng = clickEvent.lng;
    const newMarker = { lat, lng, label: "" };
    setMarkers([...markers, newMarker]);

    // Send coordinates to backend to store the message (including a random number when first clicked)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/api/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
      });
      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      console.error('Error sending location:', error);
    }
  };

  const handleFullscreen = () => {
    const element = document.getElementById('globe-container');
    if (!document.fullscreenElement) {
      element.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handlePointHover = async (point) => {
    if (!point) {
      setHoveredMarkerKey('');
      return;
    }
    
    const latStr = point.lat.toFixed(4);
    const lngStr = point.lng.toFixed(4);
    const key = `${latStr},${lngStr}`;
    setHoveredMarkerKey(key);
    
    // If we already have a cached label, update the corresponding marker and return immediately.
    if (labelCache[key]) {
      setMarkers(prev =>
        prev.map(marker => {
          const markerKey = `${marker.lat.toFixed(4)},${marker.lng.toFixed(4)}`;
          return markerKey === key ? { ...marker, label: labelCache[key] } : marker;
        })
      );
      return;
    }
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/api/location/${latStr}/${lngStr}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      labelCache[key] = data.message;
      setMarkers(prev =>
        prev.map(marker => {
          const markerKey = `${marker.lat.toFixed(4)},${marker.lng.toFixed(4)}`;
          return markerKey === key ? { ...marker, label: data.message } : marker;
        })
      );
    } catch (error) {
      console.error('Error fetching location message:', error);
      setMarkers(prev =>
        prev.map(marker => {
          const markerKey = `${marker.lat.toFixed(4)},${marker.lng.toFixed(4)}`;
          return markerKey === key ? { ...marker, label: 'Error loading message' } : marker;
        })
      );
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h1>Welcome to My Homepage</h1>
      <p>{message || "Loading..."}</p>
      <div 
        id="globe-container" 
        className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'w-full aspect-square max-w-3xl'}`}
      >
        <button
          onClick={handleFullscreen}
          className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg backdrop-blur-sm transition-all"
        >
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
        <Globe
          width={isFullscreen ? window.innerWidth : 800}
          height={isFullscreen ? window.innerHeight : 800}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
          globeTileEngineUrl={(x, y, z) =>
            `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
          }
          onGlobeClick={handleGlobeClick}
          pointsData={markers}
          pointAltitude={0.01}
          pointColor={() => 'rgba(255, 0, 0, 0.65)'}
          pointRadius={point => {
            // Increase the marker size when it is being hovered so that hover is easier
            const key = `${point.lat.toFixed(4)},${point.lng.toFixed(4)}`;
            return key === hoveredMarkerKey ? 1.5 : 0.5;
          }}
          onPointHover={handlePointHover}
          pointLabel={point => point.label || ""}
        />
      </div>
    </div>
  );
}