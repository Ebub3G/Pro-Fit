
import React, { useState } from 'react';
import MetricsOverview from './MetricsOverview';
import WeightTracker from './WeightTracker';
import MuscleTracker from './MuscleTracker';
import NutritionLog from './NutritionLog';
import WorkoutLog from './WorkoutLog';
import GoalTracker from './GoalTracker';
import RecommendationEngine from './RecommendationEngine';
import PremiumFeature from './PremiumFeature';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTier } from '@/contexts/TierContext';

const Dashboard = () => {
  const { isPro } = useTier();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">
          Your Fitness <span className="text-primary">Analytics</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Track • Analyze • Optimize • Achieve
        </p>
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

      <Tabs defaultValue="goals" className="mt-8">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="weight">Weight</TabsTrigger>
          <TabsTrigger value="muscle">Muscle</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="workouts">Workouts</TabsTrigger>
          <TabsTrigger value="recommendations">AI Coach</TabsTrigger>
        </TabsList>
        
        <TabsContent value="goals" className="mt-6">
          <GoalTracker />
        </TabsContent>
        
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

        <TabsContent value="recommendations" className="mt-6">
          <RecommendationEngine />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
