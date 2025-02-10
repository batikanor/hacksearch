"use client"
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import useWindowDimensions from './hooks/useWindowDimensions';

// Dynamically import the Globe component to disable SSR
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

export default function Home() {
  const [message, setMessage] = useState('');
  const [markers, setMarkers] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [hoveredMarkerKey, setHoveredMarkerKey] = useState('');
  const [hoveredNumbers, setHoveredNumbers] = useState(null);
  const labelCache = {};
  const dimensions = useWindowDimensions();

  useEffect(() => {
    // Initial fullscreen setup
    const element = document.getElementById('globe-container');
    // if (element) {
    //   element.requestFullscreen().catch(err => {
    //     console.error(`Error attempting to enable fullscreen: ${err.message}`);
    //   });
    // }

    // Add keyboard listener for 'S' key
    const handleKeyPress = (event) => {
      if (event.key.toLowerCase() === 's') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
          setIsFullscreen(false);
        } else {
          element.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
          });
          setIsFullscreen(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    // // Fetch initial message
    // async function fetchMessage() {
    //   try {
    //     const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    //     const response = await fetch(`${apiUrl}/api/hello`);
    //     const data = await response.json();
    //     setMessage(data.message);
    //   } catch (error) {
    //     console.error('Error fetching message:', error);
    //   }
    // }
    // fetchMessage();

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
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
      const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      labelCache[key] = data.hackathons;
      console.log('Hackathons for location:', data.hackathons);
    } catch (error) {
      console.error('Error sending location:', error);
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

    try {
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latStr}&lon=${lngStr}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'YourApp/1.0'
          }
        }
      );
      const locationData = await nominatimResponse.json();
      
      // Check if location is in Zurich
      const isZurich = locationData.address?.city?.toLowerCase() === 'zürich' || 
                       locationData.address?.city?.toLowerCase() === 'zurich';

      if (isZurich) {
        // Hardcoded SwissHacks data for Zurich
        setHoveredNumbers({
          coordinates: `${latStr}°, ${lngStr}°`,
          location: locationData.display_name,
          hackathons: [{
            name: "SwissHacks 2025",
            date: "April 11-13, 2025",
            location: "Zurich, Switzerland",
            description: "SwissHacks 2025 marks the next milestone in Switzerland's premier government-backed hackathon. A 48-hour immersive experience where diverse talent join forces with industry-leading companies to tackle pressing challenges in the financial sector. Join us for innovation, networking, and the chance to win exciting prizes!"
          }]
        });
        return;
      }

      let hackathons = labelCache[key];
      if (!hackathons) {
        const response = await fetch('/api/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: parseFloat(latStr), lng: parseFloat(lngStr) })
        });
        const data = await response.json();
        hackathons = data.hackathons;
        labelCache[key] = hackathons;
      }

      setHoveredNumbers({
        coordinates: `${latStr}°, ${lngStr}°`,
        location: locationData.display_name,
        hackathons: hackathons
      });
    } catch (error) {
      console.error('Error fetching location data:', error);
      setHoveredNumbers({
        coordinates: `${latStr}°, ${lngStr}°`,
        location: 'Location name unavailable',
        hackathons: labelCache[key] || []
      });
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* <h1>Welcome to My Homepage</h1> */}
      {/* <p>{message || "Loading..."}</p> */}
      <div 
        id="globe-container" 
        className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'w-full aspect-square max-w-3xl'}`}
      >
        <div className="absolute top-4 right-4 z-10 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-white">
          Press 'S' to toggle fullscreen
        </div>
        <Globe
          width={isFullscreen ? dimensions.width : 800}
          height={isFullscreen ? dimensions.height : 800}
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
            return key === hoveredMarkerKey ? 0.5 : 0.09;
          }}
          onPointHover={handlePointHover}
        />
        {hoveredNumbers && (
          <div className="absolute bottom-10 right-10 bg-white/90 backdrop-blur-sm text-black p-6 border border-gray-400 rounded-lg max-w-md max-h-[70vh] overflow-y-auto shadow-xl">
            <div className="font-bold text-lg mb-2">{hoveredNumbers.coordinates}</div>
            <div className="text-sm text-gray-600 mb-4">{hoveredNumbers.location}</div>
            <div className="space-y-4">
              {Array.isArray(hoveredNumbers.hackathons) && hoveredNumbers.hackathons.map((hackathon, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-400 transition-colors">
                  <div className="font-semibold text-lg text-blue-600 mb-2">
                    {hackathon.name}
                  </div>
                  <div className="space-y-2">
                    {hackathon.date && (
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {hackathon.date}
                      </div>
                    )}
                    {hackathon.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {hackathon.location}
                      </div>
                    )}
                    <div className="text-sm text-gray-700 mt-2">
                      {hackathon.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

