
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import { useQuery, useMutation } from '@tanstack/react-query';

// 1. Define Types matching Supabase RPC result
interface UserDataForMealPlan {
  goal: string | null;
  weight: number | null;
  height: number | null;
}

const NutritionLog = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mealPlan, setMealPlan] = React.useState<string | null>(null);

  // 2. Always fetch the latest user data (including height)
  const fetchUserDataForMealPlan = async (): Promise<UserDataForMealPlan | null> => {
    if (!user) return null;
    const { data, error } = await supabase.rpc('get_user_data_for_recommendations', { p_user_id: user.id });
    if (error) {
      console.error("Error fetching user data for meal plan:", error);
      throw error;
    }
    const entry = (data && data.length > 0) ? data[0] : null;
    // Ensure all fields are present (null if missing)
    return entry
      ? {
          goal: entry.goal ?? null,
          weight: entry.weight ?? null,
          height: entry.height ?? null,
        }
      : null;
  };

  // 3. Type userData as UserDataForMealPlan|null to avoid 'never' error
  const {
    data: userData,
    isLoading: isLoadingUserData,
    isError: isErrorUserData,
    refetch: refetchUserData,
  } = useQuery<UserDataForMealPlan | null>({
    queryKey: ['user-data-for-meal-plan', user?.id],
    queryFn: fetchUserDataForMealPlan,
    enabled: !!user,
  });

  // 4. Meal plan edge function
  const mealPlanMutation = useMutation({
    mutationFn: async () => {
      if (!userData) throw new Error("User data missing");
      // Now .height is always correctly saved and loaded from DB
      const res = await fetch('/functions/v1/meal-recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal: userData.goal,
          weight: userData.weight,
          height: userData.height,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();
      return result.meal_plan as string;
    },
    onSuccess: (mealPlan) => {
      setMealPlan(mealPlan);
      toast({ title: 'Meal Plan Ready!', description: 'Today’s meal plan was created for you.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.message || 'Failed to generate meal plan.' });
    },
  });

  const handleGenerateMealPlan = () => {
    mealPlanMutation.mutate();
  };

  // Always show persisted userData.height, unless user's profile changes!
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meal Recommendation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-w-xl mx-auto space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-muted-foreground text-sm">Get a daily meal plan based on your goal, BMI, and latest stats. <br />Macronutrient summary included!</p>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Button
              onClick={handleGenerateMealPlan}
              disabled={
                mealPlanMutation.isPending ||
                isLoadingUserData ||
                !userData?.goal ||
                userData.weight == null ||
                userData.height == null
              }
            >
              {mealPlanMutation.isPending ? <LoadingSpinner size="sm" /> : 'Generate Plan'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMealPlan(null);
                refetchUserData();
              }}
              disabled={isLoadingUserData}
            >
              Refresh Data
            </Button>
          </div>
          {isLoadingUserData && <div className="flex justify-center items-center h-40"><LoadingSpinner /></div>}
          {isErrorUserData && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>Could not load user data needed for recommendations.</AlertDescription></Alert>}
          {(!isLoadingUserData && !isErrorUserData && (!userData?.goal || userData.weight == null || userData.height == null)) && (
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Set up your profile for recommendations!</AlertTitle>
              <AlertDescription>
                Please complete your profile to generate a meal plan:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {userData?.height == null && (
                    <li>
                      Add your <Link to="/profile" className="font-bold underline">height</Link>.
                    </li>
                  )}
                  {userData?.weight == null && (
                    <li>
                      Add a <span className="font-bold">weight entry</span> in the 'Weight' tab.
                    </li>
                  )}
                  {userData?.goal == null && (
                    <li>
                      Set an <span className="font-bold">active goal</span> in the 'Goals' tab.
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Show the meal plan if available */}
          {mealPlan && (
            <div className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-950 mt-4 font-mono whitespace-pre-wrap text-sm">{mealPlan}</div>
          )}

          {!mealPlan && !mealPlanMutation.isPending && userData?.goal && userData.weight != null && userData.height != null && (
            <div className="text-center text-muted-foreground py-10">
              <p>Click "Generate Plan" to get your personalized meal recommendations for today.</p>
            </div>
          )}

          {/* Optionally, display the user's saved height for reference */}
          <div className="flex items-center justify-center mt-6 text-xs text-muted-foreground">
            {userData?.height && (
              <span>
                <span className="font-medium">Your saved height: </span>
                {userData.height} cm
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NutritionLog;
