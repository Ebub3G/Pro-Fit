import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from './LoadingSpinner';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface Goal {
  id: string;
  goal_type: string;
  target_weight: number | null;
  target_date: string | null;
  current_progress: number;
  is_active: boolean;
  created_at: string;
}

const GoalTracker = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const queryClient = useQueryClient();
  const [newGoal, setNewGoal] = useState({
    goal_type: '',
    target_weight: '',
    target_date: ''
  });
  const [showForm, setShowForm] = useState(false);

  const fetchGoals = async (): Promise<Goal[]> => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Failed to fetch goals');
      return [];
    }
  };

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: fetchGoals,
    enabled: !!user,
  });

  const addGoalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('user_goals')
        .insert({
          user_id: user.id,
          ...goalData
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
      setNewGoal({ goal_type: '', target_weight: '', target_date: '' });
      setShowForm(false);
      toast({
        title: "Goal Added",
        description: "Your fitness goal has been added successfully!",
      });
    },
    onError: (error) => {
      handleError(error, 'Failed to add goal');
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ goalId, progress }: { goalId: string; progress: number }) => {
      const { error } = await supabase
        .from('user_goals')
        .update({ current_progress: progress })
        .eq('id', goalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
      toast({
        title: "Progress Updated",
        description: "Your goal progress has been updated!",
      });
    },
    onError: (error) => {
      handleError(error, 'Failed to update progress');
    },
  });

  const handleAddGoal = () => {
    if (newGoal.goal_type && newGoal.target_weight) {
      addGoalMutation.mutate({
        goal_type: newGoal.goal_type,
        target_weight: parseFloat(newGoal.target_weight),
        target_date: newGoal.target_date || null,
        current_progress: 0,
        is_active: true
      });
    }
  };

  const getGoalTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'lose_weight': 'Lose Weight',
      'gain_weight': 'Gain Weight',
      'gain_muscle': 'Gain Muscle',
      'maintain_weight': 'Maintain Weight'
    };
    return labels[type] || type;
  };

  const calculateProgress = (goal: Goal) => {
    if (!goal.target_weight) return 0;
    return Math.min((goal.current_progress / goal.target_weight) * 100, 100);
  };

  const getGoalDescription = (goalType: string) => {
    switch (goalType) {
      case 'lose_weight':
        return 'Focus on reducing body weight through cardio and diet';
      case 'gain_weight':
        return 'Increase overall body weight through strength training and nutrition';
      case 'gain_muscle':
        return 'Build muscle mass through resistance training and protein intake';
      case 'maintain_weight':
        return 'Maintain current weight while improving body composition';
      default:
        return '';
    }
  };

  const requiresMuscleTracking = (goalType: string) => {
    return goalType === 'gain_muscle';
  };

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
            <Target className="h-5 w-5" />
            Goal Tracker
          </CardTitle>
          <Button
            onClick={() => setShowForm(!showForm)}
            size="sm"
            variant={showForm ? "outline" : "default"}
          >
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? 'Cancel' : 'Add Goal'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="p-4 border rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Goal Type</Label>
                <Select
                  value={newGoal.goal_type}
                  onValueChange={(value) => setNewGoal(prev => ({ ...prev, goal_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select goal type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose_weight">Lose Weight</SelectItem>
                    <SelectItem value="gain_weight">Gain Weight</SelectItem>
                    <SelectItem value="gain_muscle">Gain Muscle</SelectItem>
                    <SelectItem value="maintain_weight">Maintain Weight</SelectItem>
                  </SelectContent>
                </Select>
                {newGoal.goal_type && (
                  <p className="text-xs text-muted-foreground">
                    {getGoalDescription(newGoal.goal_type)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Target Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="70.0"
                  value={newGoal.target_weight}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, target_weight: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Target Date</Label>
                <Input
                  type="date"
                  value={newGoal.target_date}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, target_date: e.target.value }))}
                />
              </div>
            </div>

            {newGoal.goal_type && requiresMuscleTracking(newGoal.goal_type) && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Since you selected "Gain Muscle", you can track detailed muscle measurements in the Muscle Tracker section to monitor your progress more effectively.
                </p>
              </div>
            )}

            <Button
              onClick={handleAddGoal}
              disabled={addGoalMutation.isPending || !newGoal.goal_type || !newGoal.target_weight}
              className="w-full"
            >
              {addGoalMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Adding...
                </>
              ) : (
                'Add Goal'
              )}
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {goals.length > 0 ? (
            goals.map((goal) => (
              <div key={goal.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">{getGoalTypeLabel(goal.goal_type)}</h4>
                    <p className="text-sm text-muted-foreground">
                      Target: {goal.target_weight}kg
                      {goal.target_date && ` by ${new Date(goal.target_date).toLocaleDateString()}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getGoalDescription(goal.goal_type)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={goal.is_active ? "default" : "secondary"}>
                      {goal.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {requiresMuscleTracking(goal.goal_type) && (
                      <Badge variant="outline" className="text-xs">
                        Muscle Tracking Recommended
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{goal.current_progress.toFixed(1)}kg / {goal.target_weight}kg</span>
                  </div>
                  <Progress value={calculateProgress(goal)} className="h-2" />
                </div>

                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Update progress"
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        const progress = parseFloat(input.value);
                        if (progress >= 0) {
                          updateProgressMutation.mutate({ goalId: goal.id, progress });
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updateProgressMutation.isPending}
                    onClick={(e) => {
                      const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement;
                      const progress = parseFloat(input?.value || '0');
                      if (progress >= 0) {
                        updateProgressMutation.mutate({ goalId: goal.id, progress });
                        if (input) input.value = '';
                      }
                    }}
                  >
                    {updateProgressMutation.isPending ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      'Update'
                    )}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No goals set yet. Add your first fitness goal to get started!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GoalTracker;
