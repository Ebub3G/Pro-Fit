
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dumbbell } from 'lucide-react';

const WorkoutLog = () => {
  const [workout, setWorkout] = useState({
    exercise: '',
    sets: '',
    reps: '',
    weight: '',
    duration: ''
  });

  const [workoutHistory, setWorkoutHistory] = useState([
    {
      date: '2024-06-13',
      exercises: [
        { name: 'Bench Press', sets: 3, reps: 12, weight: 80 },
        { name: 'Squats', sets: 4, reps: 10, weight: 100 },
        { name: 'Deadlift', sets: 3, reps: 8, weight: 120 }
      ],
      duration: 75
    },
    {
      date: '2024-06-11',
      exercises: [
        { name: 'Pull-ups', sets: 3, reps: 8, weight: 0 },
        { name: 'Rows', sets: 3, reps: 12, weight: 60 },
        { name: 'Bicep Curls', sets: 3, reps: 15, weight: 15 }
      ],
      duration: 60
    }
  ]);

  const [currentSession, setCurrentSession] = useState({
    exercises: [],
    startTime: null
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
      
      setCurrentSession(prev => ({
        ...prev,
        exercises: [...prev.exercises, newExercise]
      }));
      
      setWorkout({ exercise: '', sets: '', reps: '', weight: '', duration: '' });
    }
  };

  const finishWorkout = () => {
    if (currentSession.exercises.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const newWorkout = {
        date: today,
        exercises: currentSession.exercises,
        duration: parseInt(workout.duration) || 60
      };
      
      setWorkoutHistory([newWorkout, ...workoutHistory]);
      setCurrentSession({ exercises: [], startTime: null });
    }
  };

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
              <Select value={workout.exercise} onValueChange={(value) => setWorkout(prev => ({ ...prev, exercise: value }))}>
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
                />
              </div>
            </div>
            
            <Button onClick={addExercise} className="w-full">
              Add Exercise
            </Button>
          </div>

          {currentSession.exercises.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold">Current Session</h4>
              <div className="space-y-2">
                {currentSession.exercises.map((exercise, index) => (
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
                />
              </div>
              
              <Button onClick={finishWorkout} className="w-full" variant="default">
                Finish Workout
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workout History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {workoutHistory.map((session, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkoutLog;
