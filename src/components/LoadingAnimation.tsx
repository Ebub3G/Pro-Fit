
import React, { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const LoadingAnimation = ({ onComplete }: { onComplete: () => void }) => {
  const [isVisible, setIsVisible] = useState(true);
  const { theme } = useTheme();

  const lightModeLogo = '/lovable-uploads/e344e12a-7f95-4c86-b24b-e889231e227d.png';
  const darkModeLogo = '/lovable-uploads/8d9ea07f-2119-433f-afb4-b99a8e5e1308.png';

  const logoSrc = theme === 'dark' ? darkModeLogo : lightModeLogo;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Wait for fade out
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-primary transition-opacity duration-500 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className="relative w-4/5 max-w-lg">
        <img 
          src={logoSrc} 
          alt="FitTracker.AI Logo"
          className="w-full h-auto object-contain animate-loading-zoom"
        />
      </div>
    </div>
  );
};

export default LoadingAnimation;
