
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Brain } from 'lucide-react';
import Navbar from '@/components/Navbar';
import AIPlanGenerator from '@/components/AIPlanGenerator';
import ActivePlans from '@/components/ActivePlans';
import DailyTasks from '@/components/DailyTasks';

const AIPlans = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-2">
              <Brain className="h-8 w-8 text-purple-600" />
              <span>AI Fitness Plans</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Generate personalized workout and nutrition plans powered by AI
            </p>
          </div>
          <Link to="/">
            <Button variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <AIPlanGenerator />
            <ActivePlans />
          </div>
          
          <div>
            <DailyTasks />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPlans;
