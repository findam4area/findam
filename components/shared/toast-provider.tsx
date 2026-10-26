'use client';

import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';

/**
 * Toast Provider with responsive positioning
 * Requirements: 3.1, 3.7, 4.2, 4.7
 * 
 * - Mobile (< 768px): Bottom positioning for better reachability
 * - Desktop (>= 768px): Top-right positioning for less intrusion
 */
export function ToastProvider() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if we're on mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on mount
    checkMobile();

    // Listen for resize
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <Toaster 
      position={isMobile ? 'bottom-center' : 'top-right'} 
      richColors 
      expand={false}
      toastOptions={{
        classNames: {
          toast: 'md:max-w-md max-w-[calc(100vw-2rem)]',
          title: 'text-sm font-medium',
          description: 'text-xs',
        },
      }}
    />
  );
}
