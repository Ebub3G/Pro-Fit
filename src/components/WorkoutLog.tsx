import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dumbbell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext'; // New Import
import { supabase } from '@/integrations/supabase/client'; // New Import
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // New Import

const WorkoutLog = () => {
  const { user } = useAuth(); // Get current user
  const [workout, setWorkout] = useState({
    exercise: '',
    sets: '',
    reps: '',
    weight: '',
    duration: ''
  });

  const [currentSessionExercises, setCurrentSessionExercises] = useState([]); // Renamed for clarity
  const queryClient = useQueryClient(); // Initialize query client

  // Function to fetch workout history from Supabase
  const fetchWorkoutHistory = async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('user_workout_logs')
      .select('id, date, duration, exercises')
      .eq('user_id', user.id)
      .order('date', { ascending: false }); // Order by date descending

    if (error) {
      console.error('Error fetching workout history:', error);
      return [];
    }
    return data;
  };

  // React Query hook for fetching data
  const { data: workoutHistory = [], isLoading, isError } = useQuery({
    queryKey: ['workoutHistory', user?.id], // Query key includes user ID
    queryFn: fetchWorkoutHistory,
    enabled: !!user, // Only run query if user is logged in
  });

  // Mutation for adding a new workout session
  const addWorkoutMutation = useMutation({
    mutationFn: async (newWorkoutSession: { date: string, duration: number, exercises: any[] }) => {
      if (!user) throw new Error('User not authenticated.');
      const { data, error } = await supabase
        .from('user_workout_logs')
        .insert({
          user_id: user.id,
          date: newWorkoutSession.date,
          duration: newWorkoutSession.duration,
          exercises: newWorkoutSession.exercises // Supabase automatically handles JSONB for array of objects
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutHistory', user?.id] }); // Invalidate and refetch
      setCurrentSessionExercises([]); // Clear current session
      setWorkout({ exercise: '', sets: '', reps: '', weight: '', duration: '' }); // Clear inputs
    },
    onError: (error) => {
      console.error('Error finishing workout:', error);
      // Add a toast notification here
    },
  });

  const exerciseTypes = [
    'Bench Press', 'Squats', 'Deadlift', 'Pull-ups', 'Push-ups',
    'Rows', 'Bicep Curls', 'Tricep Dips', 'Shoulder Press', 'Lunges'
  ];

  const addExercise = () => {
    if (workout.exercise && workout.sets && workout.reps) {
      const newExercise = {
        name: workout.exercise,
        sets: parseInt(workout.sets),
        reps: parseInt(workout.reps),
        weight: parseFloat(workout.weight) || 0
      };

      setCurrentSessionExercises(prev => [...prev, newExercise]);

      setWorkout(prev => ({ ...prev, exercise: '', sets: '', reps: '', weight: '' })); // Clear exercise-specific inputs
    }
  };

  const finishWorkout = () => {
    if (currentSessionExercises.length > 0 && workout.duration && user) {
      const today = new Date().toISOString().split('T')[0];
      addWorkoutMutation.mutate({
        date: today,
        exercises: currentSessionExercises,
        duration: parseInt(workout.duration)
      });
    } else if (!user) {
        console.warn("User not authenticated to finish workout.");
        // You might want to show a toast or redirect to login
    } else {
        console.warn("Please add exercises and specify duration to finish workout.");
        // Show a toast for missing fields
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-muted-foreground">Loading workout data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-destructive">Error loading workout data.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Current Workout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exercise">Exercise</Label>
              <Select
                value={workout.exercise}
                onValueChange={(value) => setWorkout(prev => ({ ...prev, exercise: value }))}
                disabled={addWorkoutMutation.isPending || !user} // Disable if saving or no user
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exercise" />
                </SelectTrigger>
                <SelectContent>
                  {exerciseTypes.map((exercise) => (
                    <SelectItem key={exercise} value={exercise}>
                      {exercise}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sets">Sets</Label>
                <Input
                  id="sets"
                  type="number"
                  placeholder="3"
                  value={workout.sets}
                  onChange={(e) => setWorkout(prev => ({ ...prev, sets: e.target.value }))}
                  disabled={addWorkoutMutation.isPending || !user}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reps">Reps</Label>
                <Input
                  id="reps"
                  type="number"
                  placeholder="12"
                  value={workout.reps}
                  onChange={(e) => setWorkout(prev => ({ ...prev, reps: e.target.value }))}
                  disabled={addWorkoutMutation.isPending || !user}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.5"
                  placeholder="80"
                  value={workout.weight}
                  onChange={(e) => setWorkout(prev => ({ ...prev, weight: e.target.value }))}
                  disabled={addWorkoutMutation.isPending || !user}
                />
              </div>
            </div>

            <Button
              onClick={addExercise}
              className="w-full"
              disabled={addWorkoutMutation.isPending || !user || !workout.exercise || !workout.sets || !workout.reps}
            >
              Add Exercise
            </Button>
          </div>

          {currentSessionExercises.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold">Current Session</h4>
              <div className="space-y-2">
                {currentSessionExercises.map((exercise, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">{exercise.name}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline">{exercise.sets} sets</Badge>
                      <Badge variant="outline">{exercise.reps} reps</Badge>
                      {exercise.weight > 0 && <Badge variant="outline">{exercise.weight} kg</Badge>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Session Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="60"
                  value={workout.duration}
                  onChange={(e) => setWorkout(prev => ({ ...prev, duration: e.target.value }))}
                  disabled={addWorkoutMutation.isPending || !user}
                />
              </div>

              <Button
                onClick={finishWorkout}
                className="w-full"
                variant="default"
                disabled={addWorkoutMutation.isPending || !user || currentSessionExercises.length === 0 || !workout.duration}
              >
                {addWorkoutMutation.isPending ? 'Finishing...' : (
                  'Finish Workout'
                )}
              </Button>
            </div>
          )}
          {!user && (
            <p className="text-sm text-muted-foreground text-center">Please log in to track your workouts.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workout History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {workoutHistory.length > 0 ? (
              workoutHistory.map((session, index) => (
                <div key={session.id || index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">
                      {new Date(session.date).toLocaleDateString()}
                    </span>
                    <Badge variant="secondary">{session.duration} min</Badge>
                  </div>

                  <div className="space-y-2">
                    {session.exercises.map((exercise, exerciseIndex) => (
                      <div key={exerciseIndex} className="flex justify-between items-center text-sm">
                        <span>{exercise.name}</span>
                        <div className="flex gap-1">
                          <span className="text-muted-foreground">
                            {exercise.sets}x{exercise.reps}
                          </span>
                          {exercise.weight > 0 && (
                            <span className="text-muted-foreground">
                              @ {exercise.weight}kg
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm text-center">No workout history found. Log a workout!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkoutLog;
