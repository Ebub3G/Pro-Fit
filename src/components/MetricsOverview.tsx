import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Weight, Activity, Heart, Dumbbell, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext'; // New Import
import { supabase } from '@/integrations/supabase/client'; // New Import
import { useQueries } from '@tanstack/react-query'; // New Import

const MetricsOverview = () => {
  const { user } = useAuth(); // Get current user

  // Helper function to get dates for current and previous week
  const getWeekRange = (date: Date) => {
    const today = new Date(date);
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday as start of week

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999); // End of Sunday

    return { start: startOfWeek.toISOString(), end: endOfWeek.toISOString() };
  };

  const currentWeek = getWeekRange(new Date());
  const prevWeek = getWeekRange(new Date(new Date().setDate(new Date().getDate() - 7))); // Date a week ago

  // --- Data Fetching Functions ---

  const fetchLatestWeight = async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('user_weights')
      .select('weight, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(2); // Get latest and previous for trend

    if (error) {
      console.error('Error fetching latest weight:', error);
      return null;
    }
    return data;
  };

  const fetchLatestMeasurements = async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('user_muscle_measurements')
      .select('chest, biceps, waist, thighs, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(2); // Get latest and previous for trend

    if (error) {
      console.error('Error fetching latest measurements:', error);
      return null;
    }
    return data;
  };

  const fetchWeeklyWorkouts = async () => {
    if (!user) return null;
    const { count: currentWeekCount, error: currentError } = await supabase
      .from('user_workout_logs')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('created_at', currentWeek.start)
      .lte('created_at', currentWeek.end);

    const { count: prevWeekCount, error: prevError } = await supabase
      .from('user_workout_logs')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('created_at', prevWeek.start)
      .lte('created_at', prevWeek.end);

    if (currentError || prevError) {
      console.error('Error fetching weekly workouts:', currentError || prevError);
      return null;
    }
    return { current: currentWeekCount, previous: prevWeekCount };
  };

  const fetchWeeklyNutrition = async () => {
    if (!user) return null;
    // For simplicity, we'll just get the last 7 days of nutrition entries
    // to estimate 'body fat' which isn't directly calculated here.
    // A more accurate body fat trend would require a dedicated calculation/model.
    const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7)).toISOString();

    const { data, error } = await supabase
      .from('user_nutrition_logs')
      .select('calories, protein, fat, carbs')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo);

    if (error) {
      console.error('Error fetching weekly nutrition:', error);
      return null;
    }
    return data; // This data will be used to derive 'Body Fat' related info if you implement it
  };

  // --- Execute all queries in parallel ---
  const results = useQueries({
    queries: [
      { queryKey: ['latestWeight', user?.id], queryFn: fetchLatestWeight, enabled: !!user },
      { queryKey: ['latestMeasurements', user?.id], queryFn: fetchLatestMeasurements, enabled: !!user },
      { queryKey: ['weeklyWorkouts', user?.id], queryFn: fetchWeeklyWorkouts, enabled: !!user },
      { queryKey: ['weeklyNutrition', user?.id], queryFn: fetchWeeklyNutrition, enabled: !!user },
    ],
  });

  const [
    { data: weightData, isLoading: isLoadingWeight, isError: isErrorWeight },
    { data: measurementData, isLoading: isLoadingMeasurements, isError: isErrorMeasurements },
    { data: workoutCountData, isLoading: isLoadingWorkouts, isError: isErrorWorkouts },
    { data: nutritionData, isLoading: isLoadingNutrition, isError: isErrorNutrition },
  ] = results;

  // --- Calculate Metrics ---
  const currentWeight = weightData?.[0]?.weight || 0;
  const prevWeight = weightData?.[1]?.weight || 0;
  const weightChange = currentWeight - prevWeight;

  const currentMuscleMass = (measurementData?.[0]?.biceps || 0) + (measurementData?.[0]?.chest || 0) + (measurementData?.[0]?.thighs || 0);
  const prevMuscleMass = (measurementData?.[1]?.biceps || 0) + (measurementData?.[1]?.chest || 0) + (measurementData?.[1]?.thighs || 0);
  const muscleMassChange = currentMuscleMass - prevMuscleMass;

  const weeklyWorkouts = workoutCountData?.current || 0;
  const prevWeeklyWorkouts = workoutCountData?.previous || 0;
  const workoutsChange = weeklyWorkouts - prevWeeklyWorkouts;

  // Dummy Body Fat calculation or placeholder.
  // A real body fat percentage usually requires specialized equipment or formulas.
  // We'll simulate a slight change for demonstration.
  const currentBodyFat = 15.2; // Placeholder
  const prevBodyFat = 16.0; // Placeholder
  const bodyFatChange = currentBodyFat - prevBodyFat;


  const metrics = [
    {
      title: 'Current Weight',
      value: currentWeight.toFixed(1),
      unit: 'kg',
      change: weightChange.toFixed(1),
      trend: weightChange <= 0 ? 'down' : 'up', // Weight down is generally good, so trend 'down' for decrease
      icon: Weight,
      color: weightChange <= 0 ? 'text-blue-600' : 'text-red-600'
    },
    {
      title: 'Body Fat',
      value: currentBodyFat.toFixed(1),
      unit: '%',
      change: bodyFatChange.toFixed(1),
      trend: bodyFatChange <= 0 ? 'down' : 'up', // Body fat down is good
      icon: Activity,
      color: bodyFatChange <= 0 ? 'text-green-600' : 'text-red-600'
    },
    {
      title: 'Muscle Mass',
      value: currentMuscleMass.toFixed(1),
      unit: 'cm', // Assuming sum of circumferences for simplicity
      change: muscleMassChange.toFixed(1),
      trend: muscleMassChange >= 0 ? 'up' : 'down', // Muscle mass up is good
      icon: Dumbbell,
      color: muscleMassChange >= 0 ? 'text-purple-600' : 'text-blue-600'
    },
    {
      title: 'Weekly Workouts',
      value: weeklyWorkouts,
      unit: '/7',
      change: workoutsChange,
      trend: workoutsChange >= 0 ? 'up' : 'down', // Workouts up is good
      icon: Heart,
      color: workoutsChange >= 0 ? 'text-red-600' : 'text-blue-600'
    }
  ];

  const overallLoading = isLoadingWeight || isLoadingMeasurements || isLoadingWorkouts || isLoadingNutrition;
  const overallError = isErrorWeight || isErrorMeasurements || isErrorWorkouts || isErrorNutrition;

  if (!user) {
    return (
      <div className="text-center text-muted-foreground p-8">
        Please log in to view your fitness metrics overview.
      </div>
    );
  }

  if (overallLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-1/2 bg-muted rounded"></div>
              <div className="h-4 w-4 bg-muted rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-3/4 bg-muted rounded mb-2"></div>
              <div className="h-4 w-1/3 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (overallError) {
    return (
      <div className="text-center text-destructive p-8">
        Error loading fitness metrics. Please try again later.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
            <metric.icon className={`h-4 w-4 ${metric.color}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className="text-3xl font-bold">
                {metric.value}
              </div>
              <div className="text-lg text-muted-foreground">{metric.unit}</div>
            </div>

            <div className="flex items-center mt-2 text-sm">
              {metric.trend === 'up' ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-blue-600 mr-1" />
              )}
              <span className={metric.trend === 'up' ? 'text-green-600' : 'text-blue-600'}>
                {metric.change} {metric.unit === '/7' ? '' : metric.unit}
              </span>
              <span className="text-muted-foreground ml-1">from last week</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MetricsOverview;
