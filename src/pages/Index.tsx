
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import Navbar from '../components/Navbar';
import LoadingAnimation from '../components/LoadingAnimation';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user, loading } = useAuth();
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (!animationComplete) {
        setShowAnimation(true);
      }
    }
  }, [user, loading, navigate, animationComplete]);

  const handleAnimationComplete = () => {
    setShowAnimation(false);
    setAnimationComplete(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <>
      {showAnimation && (
        <LoadingAnimation onComplete={handleAnimationComplete} />
      )}
      
      {animationComplete && (
        <div className="min-h-screen bg-background">
          <Navbar />
          <Dashboard />
        </div>
      )}
    </>
  );
};

export default Index;
