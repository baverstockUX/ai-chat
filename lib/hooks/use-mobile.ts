'use client';

import { useEffect, useState } from 'react';

/**
 * Mobile detection hook
 * Detects if viewport is below mobile breakpoint (768px - Tailwind md)
 * Updates on window resize
 *
 * Usage:
 * const isMobile = useMobile();
 * if (isMobile) { // render mobile UI }
 */
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // Tailwind md breakpoint
    };

    // Initial check
    checkMobile();

    // Listen for resize events
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
