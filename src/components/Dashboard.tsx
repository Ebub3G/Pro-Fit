
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Your Fitness Journey</h1>
        <p className="text-muted-foreground">Track your progress and achieve your goals</p>
      </div>

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

      <Tabs defaultValue="weight" className="mt-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="weight">Weight</TabsTrigger>
          <TabsTrigger value="muscle">Muscle</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="workouts">Workouts</TabsTrigger>
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
