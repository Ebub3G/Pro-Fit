
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import PremiumFeature from './PremiumFeature';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, Utensils, Zap } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { Link } from 'react-router-dom';

interface Meal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealPlan {
  breakfast: Meal[];
  lunch: Meal[];
  dinner: Meal[];
  snacks: Meal[];
}

const NutritionLog = () => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);

  const goals = {
    calories: 2200,
    protein: 150,
    carbs: 250,
    fat: 80
  };

  const fetchUserDataForMealPlan = async () => {
    if (!user) return null;
    const { data, error } = await supabase.rpc('get_user_data_for_recommendations', { p_user_id: user.id });
    if (error) throw error;
    return data[0];
  };

  const { data: userData, isLoading: isLoadingUserData, isError: isErrorUserData } = useQuery({
    queryKey: ['userDataForMealPlan', user?.id],
    queryFn: fetchUserDataForMealPlan,
    enabled: !!user,
  });

  const mealPlanMutation = useMutation({
    mutationFn: async (data: { goal: string; weight: number; height: number; targets: typeof goals }) => {
      const { data: mealData, error } = await supabase.functions.invoke('meal-recommendation', {
        body: data,
      });

      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }
      return mealData as MealPlan;
    },
    onSuccess: (data) => {
      setMealPlan(data);
    },
    onError: (error) => {
      handleError(error, "Failed to generate meal plan. Please try again.");
      setMealPlan(null);
    },
  });

  const handleGenerateMealPlan = () => {
    if (!userData || !userData.goal || !userData.weight || !userData.height) return;
    mealPlanMutation.mutate({
      goal: userData.goal,
      weight: userData.weight,
      height: userData.height,
      targets: goals,
    });
  };

  const renderMeal = (meal: Meal) => (
    <div key={meal.name} className="p-3 bg-muted/50 rounded-lg">
      <p className="font-semibold">{meal.name}</p>
      <p className="text-sm text-muted-foreground">
        {meal.calories} cal &bull; {meal.protein}g P &bull; {meal.carbs}g C &bull; {meal.fat}g F
      </p>
    </div>
  );

  return (
    <PremiumFeature
      feature="AI-Powered Meal Plans"
      description="Get personalized daily meal plans based on your goals and BMI, complete with nutritional information. Upgrade to Pro for AI-powered meal recommendations."
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              <span>Daily Meal Recommendation</span>
            </div>
            <Button
              onClick={handleGenerateMealPlan}
              disabled={mealPlanMutation.isPending || isLoadingUserData || !userData?.goal || !userData.weight || !userData.height}
            >
              {mealPlanMutation.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  {mealPlan ? 'Regenerate' : 'Generate Plan'}
                </>
              )}
            </Button>
          </CardTitle>
          <CardDescription>
            Your AI-generated meal plan for today based on your goals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUserData && <div className="flex justify-center items-center h-40"><LoadingSpinner /></div>}
          {isErrorUserData && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>Could not load user data needed for recommendations.</AlertDescription></Alert>}

          {!isLoadingUserData && !isErrorUserData && (!userData?.goal || !userData?.weight || !userData?.height) && (
             <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Set up your profile for recommendations!</AlertTitle>
              <AlertDescription>
                Please add your {' '}
                {!userData?.height && <Link to="/profile" className="font-bold underline">height</Link>}
                {!userData?.height && (!userData?.weight || !userData?.goal) && ', '}
                {!userData?.weight && <span className="font-bold">weight entries</span>}
                {(!userData?.height || !userData?.weight) && !userData?.goal && ', and '}
                {!userData?.goal && <span className="font-bold">an active goal</span>}
                {' '} to get personalized meal plans.
              </AlertDescription>
            </Alert>
          )}

          {mealPlanMutation.isPending && <div className="flex justify-center items-center h-40"><LoadingSpinner /> <p className="ml-2">Generating your meal plan...</p></div>}
          
          {mealPlan && !mealPlanMutation.isPending && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-2">Breakfast</h3>
                <div className="space-y-2">{mealPlan.breakfast.map(renderMeal)}</div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Lunch</h3>
                <div className="space-y-2">{mealPlan.lunch.map(renderMeal)}</div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Dinner</h3>
                <div className="space-y-2">{mealPlan.dinner.map(renderMeal)}</div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Snacks</h3>
                <div className="space-y-2">{mealPlan.snacks.map(renderMeal)}</div>
              </div>
            </div>
          )}

          {!mealPlan && !mealPlanMutation.isPending && userData?.goal && userData.weight && userData.height &&(
            <div className="text-center text-muted-foreground py-10">
              <p>Click "Generate Plan" to get your personalized meal recommendations for today.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </PremiumFeature>
  );
};

export default NutritionLog;
