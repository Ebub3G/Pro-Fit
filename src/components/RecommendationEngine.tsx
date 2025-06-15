
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Target, TrendingUp, Utensils, Dumbbell } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { useRecommendations } from '@/hooks/useRecommendations';

const RecommendationEngine = () => {
  const {
    recommendations,
    isLoading,
    autoRefresh,
    setAutoRefresh,
    refreshRecommendations
  } = useRecommendations();

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
              onClick={() => refreshRecommendations()}
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
