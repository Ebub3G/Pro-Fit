
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const NutritionLog = () => {
  const [foodEntry, setFoodEntry] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  });

  const [dailyIntake, setDailyIntake] = useState({
    calories: 1850,
    protein: 120,
    carbs: 180,
    fat: 60
  });

  const goals = {
    calories: 2200,
    protein: 150,
    carbs: 250,
    fat: 80
  };

  const [foodLog, setFoodLog] = useState([
    { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    { name: 'Brown Rice', calories: 216, protein: 5, carbs: 45, fat: 1.8 },
    { name: 'Greek Yogurt', calories: 100, protein: 17, carbs: 6, fat: 0 }
  ]);

  const addFood = () => {
    if (foodEntry.name && foodEntry.calories) {
      const newFood = {
        name: foodEntry.name,
        calories: parseFloat(foodEntry.calories) || 0,
        protein: parseFloat(foodEntry.protein) || 0,
        carbs: parseFloat(foodEntry.carbs) || 0,
        fat: parseFloat(foodEntry.fat) || 0
      };
      
      setFoodLog([...foodLog, newFood]);
      setDailyIntake(prev => ({
        calories: prev.calories + newFood.calories,
        protein: prev.protein + newFood.protein,
        carbs: prev.carbs + newFood.carbs,
        fat: prev.fat + newFood.fat
      }));
      
      setFoodEntry({ name: '', calories: '', protein: '', carbs: '', fat: '' });
    }
  };

  const getProgressColor = (current: number, goal: number) => {
    const percentage = (current / goal) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
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
            <h4 className="font-semibold mb-3">Today's Food Log</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {foodLog.map((food, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="font-medium">{food.name}</span>
                  <Badge variant="outline">{food.calories} cal</Badge>
                </div>
              ))}
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
              />
            </div>
          </div>
          
          <Button onClick={addFood} className="w-full">
            Add to Food Log
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NutritionLog;
