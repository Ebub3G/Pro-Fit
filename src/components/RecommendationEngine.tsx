
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lightbulb, Dumbbell, Apple } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface UserData {
  currentWeight: number;
  targetWeight: number;
  goalType: string;
  activityLevel: string;
  muscleData: any;
  nutritionData: any;
}

interface Recommendation {
  type: 'workout' | 'nutrition';
  title: string;
  description: string;
  items: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

const RecommendationEngine = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUserData = async (): Promise<UserData | null> => {
    if (!user) return null;

    const [goalsResult, weightsResult, muscleResult, nutritionResult] = await Promise.all([
      supabase.from('user_goals').select('*').eq('user_id', user.id).eq('is_active', true).limit(1),
      supabase.from('user_weights').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(1),
      supabase.from('user_muscle_measurements').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(1),
      supabase.from('user_nutrition_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
    ]);

    const goal = goalsResult.data?.[0];
    const currentWeight = weightsResult.data?.[0]?.weight || 70;

    if (!goal) return null;

    return {
      currentWeight,
      targetWeight: goal.target_weight || currentWeight,
      goalType: goal.goal_type,
      activityLevel: 'Intermediate',
      muscleData: muscleResult.data?.[0] || null, // Allow null muscle data
      nutritionData: nutritionResult.data || []
    };
  };

  const { data: userData } = useQuery({
    queryKey: ['userData', user?.id],
    queryFn: fetchUserData,
    enabled: !!user,
  });

  const generateRecommendations = async () => {
    if (!userData) return;

    setLoading(true);
    
    // Generate workout recommendations based on goal type
    const workoutRecs = generateWorkoutRecommendations(userData);
    const nutritionRecs = generateNutritionRecommendations(userData);
    
    setRecommendations([...workoutRecs, ...nutritionRecs]);
    setLoading(false);
  };

  const generateWorkoutRecommendations = (data: UserData): Recommendation[] => {
    const workouts: Recommendation[] = [];

    if (data.goalType === 'lose_weight') {
      workouts.push({
        type: 'workout',
        title: 'Fat Burning HIIT Workout',
        description: 'High-intensity interval training to maximize calorie burn',
        items: [
          '5 min warm-up (light jogging)',
          '30 sec burpees, 30 sec rest (repeat 8 times)',
          '30 sec mountain climbers, 30 sec rest (repeat 8 times)',
          '30 sec jump squats, 30 sec rest (repeat 8 times)',
          '5 min cool-down stretching'
        ],
        difficulty: 'Intermediate'
      });

      workouts.push({
        type: 'workout',
        title: 'Cardio Circuit Training',
        description: 'Combination of cardio and strength for weight loss',
        items: [
          '10 min treadmill/stationary bike',
          '3 sets of 15 push-ups',
          '3 sets of 20 bodyweight squats',
          '3 sets of 30 sec planks',
          '10 min rowing machine',
          '5 min stretching'
        ],
        difficulty: 'Beginner'
      });
    } else if (data.goalType === 'gain_muscle') {
      workouts.push({
        type: 'workout',
        title: 'Upper Body Strength Training',
        description: 'Build muscle mass in chest, shoulders, and arms',
        items: [
          'Bench Press: 4 sets of 8-10 reps',
          'Shoulder Press: 3 sets of 10-12 reps',
          'Pull-ups/Lat Pulldowns: 3 sets of 8-10 reps',
          'Bicep Curls: 3 sets of 12-15 reps',
          'Tricep Dips: 3 sets of 10-12 reps',
          'Face Pulls: 3 sets of 15 reps'
        ],
        difficulty: 'Intermediate'
      });

      workouts.push({
        type: 'workout',
        title: 'Lower Body Power Building',
        description: 'Focus on legs and glutes for overall strength',
        items: [
          'Squats: 4 sets of 8-10 reps',
          'Deadlifts: 4 sets of 6-8 reps',
          'Lunges: 3 sets of 12 reps each leg',
          'Bulgarian Split Squats: 3 sets of 10 each leg',
          'Calf Raises: 4 sets of 15-20 reps',
          'Glute Bridges: 3 sets of 15 reps'
        ],
        difficulty: 'Intermediate'
      });
    } else if (data.goalType === 'gain_weight') {
      workouts.push({
        type: 'workout',
        title: 'Full Body Strength Builder',
        description: 'Compound movements to build overall mass',
        items: [
          'Deadlifts: 5 sets of 5 reps',
          'Squats: 4 sets of 6-8 reps',
          'Bench Press: 4 sets of 6-8 reps',
          'Rows: 4 sets of 8-10 reps',
          'Overhead Press: 3 sets of 8-10 reps',
          'Pull-ups: 3 sets to failure'
        ],
        difficulty: 'Advanced'
      });
    }

    return workouts;
  };

  const generateNutritionRecommendations = (data: UserData): Recommendation[] => {
    const nutrition: Recommendation[] = [];
    const weightDiff = data.targetWeight - data.currentWeight;

    if (data.goalType === 'lose_weight') {
      nutrition.push({
        type: 'nutrition',
        title: 'Fat Loss Meal Plan',
        description: 'High protein, moderate carb diet for sustainable weight loss',
        items: [
          'Breakfast: Greek yogurt with berries and almonds (300 cal)',
          'Snack: Apple with 1 tbsp almond butter (200 cal)',
          'Lunch: Grilled chicken salad with olive oil dressing (400 cal)',
          'Snack: Protein shake with banana (250 cal)',
          'Dinner: Baked salmon with roasted vegetables (450 cal)',
          'Daily Target: 1600 calories, 120g protein, 150g carbs'
        ],
        difficulty: 'Beginner'
      });
    } else if (data.goalType === 'gain_muscle' || data.goalType === 'gain_weight') {
      nutrition.push({
        type: 'nutrition',
        title: 'Muscle Building Nutrition',
        description: 'High protein, high calorie diet for muscle growth',
        items: [
          'Breakfast: Oatmeal with protein powder and banana (500 cal)',
          'Snack: Trail mix with nuts and dried fruit (300 cal)',
          'Lunch: Chicken and rice bowl with avocado (600 cal)',
          'Pre-workout: Protein shake with berries (250 cal)',
          'Dinner: Lean beef with sweet potato and vegetables (650 cal)',
          'Evening: Casein protein with almond butter (300 cal)',
          'Daily Target: 2600 calories, 160g protein, 300g carbs'
        ],
        difficulty: 'Intermediate'
      });
    } else if (data.goalType === 'maintain_weight') {
      nutrition.push({
        type: 'nutrition',
        title: 'Balanced Maintenance Diet',
        description: 'Well-rounded nutrition for weight maintenance',
        items: [
          'Breakfast: Whole grain toast with eggs and avocado (400 cal)',
          'Snack: Greek yogurt with nuts (200 cal)',
          'Lunch: Quinoa bowl with mixed vegetables and chicken (500 cal)',
          'Snack: Fruit and handful of almonds (150 cal)',
          'Dinner: Fish with brown rice and steamed broccoli (550 cal)',
          'Daily Target: 1800 calories, 100g protein, 200g carbs'
        ],
        difficulty: 'Beginner'
      });
    }

    return nutrition;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'Intermediate': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'Advanced': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
          <Button 
            onClick={generateRecommendations}
            disabled={loading || !userData}
            size="sm"
          >
            {loading ? 'Generating...' : 'Get Recommendations'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!userData ? (
          <div className="text-center space-y-4 py-8">
            <p className="text-muted-foreground">
              Set up your goals to get personalized recommendations!
            </p>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>To get started:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Add a fitness goal in the Goals tab</li>
                <li>Log your current weight (optional but recommended)</li>
                <li>For muscle gain goals: track muscle measurements for better recommendations</li>
              </ul>
            </div>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center space-y-4 py-8">
            <p className="text-muted-foreground">
              Click "Get Recommendations" to receive personalized workout and nutrition advice!
            </p>
            {userData.goalType === 'gain_muscle' && !userData.muscleData && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <p><strong>Tip:</strong> Add muscle measurements in the Muscle Tracker for more precise muscle-building recommendations!</p>
              </div>
            )}
          </div>
        ) : (
          <Tabs defaultValue="workout" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="workout" className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                Workouts
              </TabsTrigger>
              <TabsTrigger value="nutrition" className="flex items-center gap-2">
                <Apple className="h-4 w-4" />
                Nutrition
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="workout" className="space-y-4">
              {recommendations.filter(r => r.type === 'workout').map((rec, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{rec.title}</h4>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                    <Badge className={getDifficultyColor(rec.difficulty)}>
                      {rec.difficulty}
                    </Badge>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {rec.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="nutrition" className="space-y-4">
              {recommendations.filter(r => r.type === 'nutrition').map((rec, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{rec.title}</h4>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                    <Badge className={getDifficultyColor(rec.difficulty)}>
                      {rec.difficulty}
                    </Badge>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {rec.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default RecommendationEngine;
