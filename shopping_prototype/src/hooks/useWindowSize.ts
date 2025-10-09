import { useState, useEffect } from 'react';
import { WindowSize, BreakpointSize } from '../types';

// Breakpoint values
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
  wide: 1440,
};

// Determine breakpoint based on width
const getBreakpoint = (width: number): BreakpointSize => {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  if (width < BREAKPOINTS.desktop) return 'desktop';
  return 'wide';
};

// Get initial window size
const getWindowSize = (): WindowSize => {
  if (typeof window === 'undefined') {
    return {
      width: 0,
      height: 0,
      breakpoint: 'desktop',
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  return {
    width,
    height,
    breakpoint: getBreakpoint(width),
  };
};

export const useWindowSize = (): WindowSize => {
  const [windowSize, setWindowSize] = useState<WindowSize>(getWindowSize);

  useEffect(() => {
    // Update window size
    const handleResize = () => {
      const newSize = getWindowSize();
      setWindowSize(newSize);
    };

    // Throttle resize events for performance
    let timeoutId: NodeJS.Timeout;
    const throttledResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', throttledResize);

    // Set initial size
    handleResize();

    return () => {
      window.removeEventListener('resize', throttledResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return windowSize;
};