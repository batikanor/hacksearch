"use client"
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the Globe component to disable SSR
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

export default function Home() {
  const [message, setMessage] = useState('');
  const [markers, setMarkers] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredMarkerKey, setHoveredMarkerKey] = useState('');
  const [hoveredNumbers, setHoveredNumbers] = useState(null);
  const labelCache = {};

  useEffect(() => {
    async function fetchMessage() {
      try {
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
    const lat = clickEvent.lat;
    const lng = clickEvent.lng;
    const newMarker = { lat, lng };
    setMarkers([...markers, newMarker]);
  
    try {
      const response = await fetch('/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
      });
      const data = await response.json();
      // Store the numbers in cache
      const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      labelCache[key] = data.numbers;
      console.log('Random numbers for location:', data.numbers);
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
      setHoveredNumbers(null);
      return;
    }

    const latStr = point.lat.toFixed(4);
    const lngStr = point.lng.toFixed(4);
    const key = `${latStr},${lngStr}`;
    setHoveredMarkerKey(key);

    // Get location name using OpenStreetMap Nominatim API
    try {
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latStr}&lon=${lngStr}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'YourApp/1.0' // Required by Nominatim ToS
          }
        }
      );
      const locationData = await nominatimResponse.json();
      
      // Get the numbers from cache or fetch them
      let numbers = labelCache[key];
      if (!numbers) {
        const response = await fetch('/api/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: parseFloat(latStr), lng: parseFloat(lngStr) })
        });
        const data = await response.json();
        numbers = data.numbers;
        labelCache[key] = numbers;
      }

      // Combine location info with numbers
      setHoveredNumbers({
        coordinates: `${latStr}°, ${lngStr}°`,
        location: locationData.display_name,
        numbers: numbers
      });
    } catch (error) {
      console.error('Error fetching location data:', error);
      setHoveredNumbers({
        coordinates: `${latStr}°, ${lngStr}°`,
        location: 'Location name unavailable',
        numbers: labelCache[key] || ['Error loading numbers']
      });
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
            const key = `${point.lat.toFixed(4)},${point.lng.toFixed(4)}`;
            return key === hoveredMarkerKey ? 1.5 : 0.5;
          }}
          onPointHover={handlePointHover}
        />
        {hoveredNumbers && (
          <div className="absolute bottom-10 right-10 bg-white text-black p-4 border border-gray-400 rounded max-w-md max-h-60 overflow-y-auto">
            <div className="font-bold mb-2">{hoveredNumbers.coordinates}</div>
            <div className="text-sm text-gray-600 mb-3">{hoveredNumbers.location}</div>
            <div className="border-t pt-2">
              {Array.isArray(hoveredNumbers.numbers) && hoveredNumbers.numbers.map((num, idx) => (
                <div key={idx} className="text-sm">{num}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

