
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Scale, TrendingUp, User, Sun, Moon, Zap, Brain } from 'lucide-react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DailyTasks from '@/components/DailyTasks';
import ProfileCompletionGuide from '@/components/ProfileCompletionGuide';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('height_cm, age, gender, activity_level, current_weight, target_weight, fitness_goal')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        handleError(error, "Could not fetch profile information.");
      }
      return data;
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      handleError(error, "Failed to sign out.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Completion Guide */}
      <ProfileCompletionGuide profile={profile} isLoading={isLoadingProfile} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/ai-plans" className="block">
              <Button className="w-full justify-start bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Brain className="h-4 w-4 mr-2" />
                Generate AI Plans
              </Button>
            </Link>
            <Link to="/profile" className="block">
              <Button variant="outline" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                Update Profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <DailyTasks />

        {/* Weight Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weight Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Coming Soon: Visualize your weight progress over time.</p>
          </CardContent>
        </Card>

        {/* Muscle Measurements */}
        <Card>
          <CardHeader>
            <CardTitle>Muscle Measurements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Track your muscle growth and body composition changes.</p>
          </CardContent>
        </Card>

        {/* Nutrition Log */}
        <Card>
          <CardHeader>
            <CardTitle>Nutrition Log</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Log your daily meals and track your calorie intake.</p>
          </CardContent>
        </Card>

        {/* Fitness Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Fitness Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Set and track your fitness goals to stay motivated.</p>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="h-4 w-4 mr-2" /> : <Sun className="h-4 w-4 mr-2" />}
              Toggle Theme
            </Button>
            <Button variant="destructive" className="w-full justify-start" onClick={handleSignOut}>
              <User className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
