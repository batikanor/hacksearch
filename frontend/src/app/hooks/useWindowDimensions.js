import { useState, useEffect } from 'react';

function useWindowDimensions() {
  const [dimensions, setDimensions] = useState({
    width: 800,
    height: 800
  });

  useEffect(() => {
    function handleResize() {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return dimensions;
}

export default useWindowDimensions; 