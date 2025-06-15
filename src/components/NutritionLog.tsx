import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PremiumFeature from './PremiumFeature';

const NutritionLog = () => {
  const { user } = useAuth();
  const [foodEntry, setFoodEntry] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  });

  const queryClient = useQueryClient();

  const goals = {
    calories: 2200,
    protein: 150,
    carbs: 250,
    fat: 80
  };

  const fetchNutritionLogs = async () => {
    if (!user) return [];
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('user_nutrition_logs')
      .select('id, name, calories, protein, carbs, fat')
      .eq('user_id', user.id)
      .like('created_at', `${today}%`);

    if (error) {
      console.error('Error fetching nutrition logs:', error);
      return [];
    }
    return data;
  };

  const { data: foodLog = [], isLoading, isError } = useQuery({
    queryKey: ['nutritionLogs', user?.id, new Date().toDateString()],
    queryFn: fetchNutritionLogs,
    enabled: !!user,
  });

  const dailyIntake = foodLog.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.calories,
      protein: acc.protein + entry.protein,
      carbs: acc.carbs + entry.carbs,
      fat: acc.fat + entry.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const addFoodMutation = useMutation({
    mutationFn: async (newFood: { name: string, calories: number, protein: number, carbs: number, fat: number }) => {
      if (!user) throw new Error('User not authenticated.');
      const { data, error } = await supabase
        .from('user_nutrition_logs')
        .insert({ user_id: user.id, ...newFood })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutritionLogs', user?.id, new Date().toDateString()] });
      setFoodEntry({ name: '', calories: '', protein: '', carbs: '', fat: '' });
    },
    onError: (error) => {
      console.error('Error adding food entry:', error);
    },
  });


  const handleAddFood = () => {
    if (foodEntry.name && foodEntry.calories && user) {
      addFoodMutation.mutate({
        name: foodEntry.name,
        calories: parseFloat(foodEntry.calories) || 0,
        protein: parseFloat(foodEntry.protein) || 0,
        carbs: parseFloat(foodEntry.carbs) || 0,
        fat: parseFloat(foodEntry.fat) || 0
      });
    } else if (!user) {
      console.warn("User not authenticated to add food.");
    } else {
      console.warn("Please fill in food name and calories.");
    }
  };

  const getProgressColor = (current: number, goal: number) => {
    const percentage = (current / goal) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-muted-foreground">Loading nutrition data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-destructive">Error loading nutrition data.</p>
      </div>
    );
  }

  return (
    <PremiumFeature
      feature="Advanced Nutrition Tracking"
      description="Log your meals, track macros, and get detailed insights into your diet. Upgrade to Pro for unlimited logging and analysis."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Nutrition Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Calories</Label>
                  <span className={`font-semibold ${getProgressColor(dailyIntake.calories, goals.calories)}`}>
                    {dailyIntake.calories} / {goals.calories}
                  </span>
                </div>
                <Progress value={(dailyIntake.calories / goals.calories) * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Protein (g)</Label>
                  <span className={`font-semibold ${getProgressColor(dailyIntake.protein, goals.protein)}`}>
                    {dailyIntake.protein} / {goals.protein}
                  </span>
                </div>
                <Progress value={(dailyIntake.protein / goals.protein) * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Carbs (g)</Label>
                  <span className={`font-semibold ${getProgressColor(dailyIntake.carbs, goals.carbs)}`}>
                    {dailyIntake.carbs} / {goals.carbs}
                  </span>
                </div>
                <Progress value={(dailyIntake.carbs / goals.carbs) * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Fat (g)</Label>
                  <span className={`font-semibold ${getProgressColor(dailyIntake.fat, goals.fat)}`}>
                    {dailyIntake.fat} / {goals.fat}
                  </span>
                </div>
                <Progress value={(dailyIntake.fat / goals.fat) * 100} className="h-2" />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Today's Food Log</h4>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {foodLog.length > 0 ? (
                  foodLog.map((food, index) => (
                    <div key={food.id || index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="font-medium">{food.name}</span>
                      <Badge variant="outline">{food.calories} cal</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm text-center">No food logged today.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Food</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="foodName">Food Name</Label>
              <Input
                id="foodName"
                placeholder="e.g., Grilled Chicken"
                value={foodEntry.name}
                onChange={(e) => setFoodEntry(prev => ({ ...prev, name: e.target.value }))}
                disabled={addFoodMutation.isPending || !user}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  placeholder="165"
                  value={foodEntry.calories}
                  onChange={(e) => setFoodEntry(prev => ({ ...prev, calories: e.target.value }))}
                  disabled={addFoodMutation.isPending || !user}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="protein">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  step="0.1"
                  placeholder="31"
                  value={foodEntry.protein}
                  onChange={(e) => setFoodEntry(prev => ({ ...prev, protein: e.target.value }))}
                  disabled={addFoodMutation.isPending || !user}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={foodEntry.carbs}
                  onChange={(e) => setFoodEntry(prev => ({ ...prev, carbs: e.target.value }))}
                  disabled={addFoodMutation.isPending || !user}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fat">Fat (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  step="0.1"
                  placeholder="3.6"
                  value={foodEntry.fat}
                  onChange={(e) => setFoodEntry(prev => ({ ...prev, fat: e.target.value }))}
                  disabled={addFoodMutation.isPending || !user}
                />
              </div>
            </div>

            <Button
              onClick={handleAddFood}
              className="w-full"
              disabled={addFoodMutation.isPending || !user || !foodEntry.name || !foodEntry.calories}
            >
              {addFoodMutation.isPending ? 'Adding...' : (
                'Add to Food Log'
              )}
            </Button>
            {!user && (
              <p className="text-sm text-muted-foreground text-center">Please log in to add food entries.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </PremiumFeature>
  );
};

export default NutritionLog;
