
import React from 'react';
import Dashboard from '../components/Dashboard';
import Navbar from '../components/Navbar';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      <Dashboard />
    </div>
  );
};

export default Index;
