
import React, { useState } from 'react';
import MetricsOverview from './MetricsOverview';
import WeightTracker from './WeightTracker';
import MuscleTracker from './MuscleTracker';
import NutritionLog from './NutritionLog';
import WorkoutLog from './WorkoutLog';
import PremiumFeature from './PremiumFeature';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTier } from '@/contexts/TierContext';

const Dashboard = () => {
  const { isPro } = useTier();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold gradient-text mb-4 font-mono">
          Your Fitness <span className="text-cyan-400">Analytics</span>
        </h1>
        <p className="text-slate-400 text-lg font-mono">
          Track • Analyze • Optimize • Achieve
        </p>
        <div className="mt-4 w-32 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto rounded-full"></div>
      </div>

      <div className="mb-8">
        {isPro ? (
          <MetricsOverview />
        ) : (
          <PremiumFeature
            feature="Advanced Metrics Overview"
            description="Get detailed insights into your fitness progress with advanced analytics and trend visualization."
          >
            <MetricsOverview />
          </PremiumFeature>
        )}
      </div>

      <Tabs defaultValue="weight" className="mt-8">
        <TabsList className="grid w-full grid-cols-4 glass border border-white/10 p-1 bg-slate-900/50">
          <TabsTrigger 
            value="weight" 
            className="font-mono data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300 data-[state=active]:neon-glow-blue transition-all duration-300"
          >
            Weight
          </TabsTrigger>
          <TabsTrigger 
            value="muscle"
            className="font-mono data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 data-[state=active]:neon-glow-purple transition-all duration-300"
          >
            Muscle
          </TabsTrigger>
          <TabsTrigger 
            value="nutrition"
            className="font-mono data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300 data-[state=active]:neon-glow-green transition-all duration-300"
          >
            Nutrition
          </TabsTrigger>
          <TabsTrigger 
            value="workouts"
            className="font-mono data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:neon-glow-cyan transition-all duration-300"
          >
            Workouts
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="weight" className="mt-6">
          <WeightTracker />
        </TabsContent>
        
        <TabsContent value="muscle" className="mt-6">
          {isPro ? (
            <MuscleTracker />
          ) : (
            <PremiumFeature
              feature="Muscle Measurement Tracking"
              description="Track detailed body measurements including chest, biceps, waist, and thighs with progress analytics."
            >
              <MuscleTracker />
            </PremiumFeature>
          )}
        </TabsContent>
        
        <TabsContent value="nutrition" className="mt-6">
          <NutritionLog />
        </TabsContent>
        
        <TabsContent value="workouts" className="mt-6">
          {isPro ? (
            <WorkoutLog />
          ) : (
            <PremiumFeature
              feature="Advanced Workout Logging"
              description="Log detailed workout sessions with exercise selection, sets, reps, and weight tracking."
            >
              <WorkoutLog />
            </PremiumFeature>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
