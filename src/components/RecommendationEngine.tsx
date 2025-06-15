
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Target, TrendingUp, Utensils, Dumbbell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from './LoadingSpinner';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface Goal {
  goal_type: string;
  target_weight: number | null;
  current_progress: number;
}

interface WeightEntry {
  weight: number;
  date: string;
}

interface MuscleEntry {
  chest: number | null;
  biceps: number | null;
  waist: number | null;
  thighs: number | null;
}

const RecommendationEngine = () => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchUserData = async () => {
    if (!user) return null;

    try {
      const [goalsResponse, weightsResponse, muscleResponse] = await Promise.all([
        supabase
          .from('user_goals')
          .select('goal_type, target_weight, current_progress')
          .eq('user_id', user.id)
          .eq('is_active', true),
        supabase
          .from('user_weights')
          .select('weight, date')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(10),
        supabase
          .from('user_muscle_measurements')
          .select('chest, biceps, waist, thighs')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(5)
      ]);

      return {
        goals: goalsResponse.data || [],
        weights: weightsResponse.data || [],
        muscle: muscleResponse.data || []
      };
    } catch (error) {
      handleError(error, 'Failed to fetch user data for recommendations');
      return null;
    }
  };

  const { data: userData, isLoading, refetch } = useQuery({
    queryKey: ['user-data-for-recommendations', user?.id],
    queryFn: fetchUserData,
    enabled: !!user,
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30 seconds
  });

  const generateRecommendations = () => {
    if (!userData) return;

    const { goals, weights, muscle } = userData;
    const newRecommendations: string[] = [];

    // Goal-based recommendations
    goals.forEach((goal: Goal) => {
      switch (goal.goal_type) {
        case 'lose_weight':
          newRecommendations.push('💪 Focus on cardio exercises like running, cycling, or swimming');
          newRecommendations.push('🥗 Maintain a caloric deficit with nutritious, whole foods');
          if (weights.length >= 2) {
            const recentTrend = weights[0].weight - weights[1].weight;
            if (recentTrend > 0) {
              newRecommendations.push('📉 Consider adjusting your diet as weight has increased recently');
            }
          }
          break;
        case 'gain_weight':
          newRecommendations.push('🏋️ Incorporate strength training to build muscle mass');
          newRecommendations.push('🍖 Increase protein intake and eat in a caloric surplus');
          break;
        case 'gain_muscle':
          newRecommendations.push('💪 Focus on progressive overload in resistance training');
          newRecommendations.push('🥩 Aim for 1.6-2.2g protein per kg of body weight');
          if (muscle.length > 0) {
            newRecommendations.push('📏 Track muscle measurements to monitor growth progress');
          }
          break;
        case 'maintain_weight':
          newRecommendations.push('⚖️ Balance cardio and strength training for body composition');
          newRecommendations.push('🎯 Focus on consistency in both diet and exercise');
          break;
      }
    });

    // Weight trend analysis
    if (weights.length >= 3) {
      const trend = weights.slice(0, 3).reduce((acc, curr, index) => {
        if (index === 0) return acc;
        return acc + (weights[index - 1].weight - curr.weight);
      }, 0);

      if (Math.abs(trend) < 0.5) {
        newRecommendations.push('📊 Your weight is stable - great for maintaining current habits');
      }
    }

    // General recommendations
    if (newRecommendations.length === 0) {
      newRecommendations.push('🎯 Set a specific fitness goal to get personalized recommendations');
      newRecommendations.push('📊 Log your weight regularly to track progress');
      newRecommendations.push('💧 Stay hydrated and get adequate sleep for recovery');
    }

    // Limit to 5 recommendations for better readability
    setRecommendations(newRecommendations.slice(0, 5));
  };

  useEffect(() => {
    if (userData && autoRefresh) {
      generateRecommendations();
    }
  }, [userData, autoRefresh]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-32">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant="outline"
              size="sm"
            >
              {autoRefresh ? '🔄 Auto' : '⏸️ Manual'}
            </Button>
            <Button
              onClick={() => {
                refetch();
                generateRecommendations();
              }}
              size="sm"
              variant="outline"
            >
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.length > 0 ? (
            recommendations.map((rec, index) => (
              <div
                key={index}
                className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                <p className="text-sm font-medium">{rec}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="flex justify-center gap-2 text-muted-foreground">
                <Target className="h-8 w-8" />
                <TrendingUp className="h-8 w-8" />
                <Utensils className="h-8 w-8" />
                <Dumbbell className="h-8 w-8" />
              </div>
              <div>
                <p className="text-muted-foreground mb-2">
                  Get personalized recommendations based on your goals and progress
                </p>
                <Badge variant="outline">
                  Add goals and track your progress to unlock AI insights
                </Badge>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecommendationEngine;
