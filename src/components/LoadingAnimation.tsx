
import React, { useEffect, useState } from 'react';

const LoadingAnimation = ({ onComplete }: { onComplete: () => void }) => {
  const [isVisible, setIsVisible] = useState(true);

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
      <div className="relative">
        <img 
          src="/lovable-uploads/b5825acb-ffc5-42fd-9975-4a72ab343932.png" 
          alt="JACO Logo"
          className={`w-64 h-64 object-contain transition-all duration-1000 ${
            isVisible ? 'scale-100 rotate-0' : 'scale-110 rotate-12'
          }`}
        />
        <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

export default LoadingAnimation;
