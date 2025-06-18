
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, Utensils, Egg, Beef, Apple, Hash } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import { useQuery, useMutation } from '@tanstack/react-query';
import { calculateMacronutrientTargets } from '@/lib/nutritionCalculations';

// --- Define Types for the meal plan structure ---
interface MealItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
interface MealPlanSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
interface MealPlan {
  breakfast: MealItem[];
  lunch: MealItem[];
  dinner: MealItem[];
  snacks: MealItem[];
  summary: MealPlanSummary;
}

interface UserDataForMealPlan {
  goal: string | null;
  weight: number | null;
  height: number | null;
  age: number | null;
  gender: 'male' | 'female' | null;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
}

const MealCard = ({ title, items, icon }: { title: string; items: MealItem[]; icon: React.ReactNode }) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center text-xl">
                {icon}
                <span className="ml-2">{title}</span>
            </CardTitle>
        </CardHeader>
        <CardContent>
            <ul className="space-y-3">
                {items.map((item, index) => (
                    <li key={index} className="border-b pb-2">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {item.calories} kcal &bull; P: {item.protein}g &bull; C: {item.carbs}g &bull; F: {item.fat}g
                        </p>
                    </li>
                ))}
            </ul>
        </CardContent>
    </Card>
);

const NutritionLog = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mealPlan, setMealPlan] = React.useState<MealPlan | null>(null);

  const fetchUserDataForMealPlan = async (): Promise<UserDataForMealPlan | null> => {
    if (!user) return null;
    console.log('Fetching user data for meal plan, user ID:', user.id);
    const { data, error } = await supabase.rpc('get_user_data_for_recommendations', { p_user_id: user.id });
    if (error) {
      console.error("Error fetching user data for meal plan:", error);
      throw error;
    }
    console.log('Raw data from RPC:', data);
    
    const entry = (data && data.length > 0) ? data[0] : null;
    console.log('Processed entry:', entry);
    
    const result = entry
      ? {
          goal: entry.goal ?? null,
          weight: entry.weight ?? null,
          height: entry.height ?? null,
          age: entry.age ?? null,
          gender: (entry.gender === 'male' || entry.gender === 'female') ? entry.gender : null,
          activity_level: (['sedentary', 'light', 'moderate', 'active', 'very_active'].includes(entry.activity_level)) 
            ? entry.activity_level as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' 
            : null,
        }
      : null;
    
    console.log('Final user data for meal plan:', result);
    return result;
  };

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

  const mealPlanMutation = useMutation({
    mutationFn: async () => {
      console.log('Starting meal plan generation with userData:', userData);
      
      if (!userData || !userData.goal || !userData.weight || !userData.height || !userData.age || !userData.gender || !userData.activity_level) {
        const missingFields = [];
        if (!userData?.goal) missingFields.push('goal');
        if (!userData?.weight) missingFields.push('weight');
        if (!userData?.height) missingFields.push('height');
        if (!userData?.age) missingFields.push('age');
        if (!userData?.gender) missingFields.push('gender');
        if (!userData?.activity_level) missingFields.push('activity_level');
        
        console.error('Missing fields for meal plan:', missingFields);
        throw new Error(`User data is incomplete. Missing: ${missingFields.join(', ')}. Please update your profile.`);
      }

      const targets = calculateMacronutrientTargets({
        goal: userData.goal as any,
        weight: userData.weight,
        height: userData.height,
        age: userData.age,
        gender: userData.gender,
        activityLevel: userData.activity_level,
      });
      
      console.log('Calculated targets:', targets);

      const requestBody = {
        goal: userData.goal,
        weight: userData.weight,
        height: userData.height,
        age: userData.age,
        gender: userData.gender,
        activityLevel: userData.activity_level,
        targets: targets,
      };
      
      console.log('Sending request to meal recommendation API:', requestBody);

      const res = await fetch('/functions/v1/meal-recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Meal recommendation API error:', errorText);
        throw new Error(errorText);
      }
      
      const result = await res.json() as MealPlan;
      console.log('Meal plan result:', result);
      return result;
    },
    onSuccess: (data: MealPlan) => {
      setMealPlan(data);
      toast({ title: 'Meal Plan Ready!', description: 'Today\'s meal plan was created for you.' });
    },
    onError: (error: any) => {
      console.error('Meal plan generation error:', error);
      toast({ title: 'Error', description: error?.message || 'Failed to generate meal plan.' });
    },
  });

  const handleGenerateMealPlan = () => {
    console.log('Generate meal plan clicked');
    mealPlanMutation.mutate();
  };

  const isDataComplete = userData?.goal && 
                         userData.weight != null && 
                         userData.height != null && 
                         userData.age != null && 
                         userData.gender != null && 
                         userData.activity_level != null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meal Recommendation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-muted-foreground text-sm">Get a daily meal plan based on your goal, BMI, and latest stats. <br />Macronutrient summary included!</p>
          </div>
          
          {/* Debug section */}
          <Card className="bg-muted/20">
            <CardHeader>
              <CardTitle className="text-sm">Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs space-y-1">
                <p>Data Complete: {isDataComplete ? 'Yes' : 'No'}</p>
                <p>Goal: {userData?.goal || 'Missing'}</p>
                <p>Weight: {userData?.weight || 'Missing'}</p>
                <p>Height: {userData?.height || 'Missing'}</p>
                <p>Age: {userData?.age || 'Missing'}</p>
                <p>Gender: {userData?.gender || 'Missing'}</p>
                <p>Activity Level: {userData?.activity_level || 'Missing'}</p>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex items-center gap-3 mb-2">
            <Button
              onClick={handleGenerateMealPlan}
              disabled={mealPlanMutation.isPending || isLoadingUserData || !isDataComplete}
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
          
          {(!isLoadingUserData && !isErrorUserData && !isDataComplete) && (
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Set up your profile for recommendations!</AlertTitle>
              <AlertDescription>
                Please complete your profile to generate a meal plan:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {(userData?.height == null || userData?.age == null || userData?.gender == null || userData?.activity_level == null) && (
                    <li>
                      Please add your height, age, gender, and activity level in your <Link to="/profile" className="font-bold underline">profile</Link>.
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

          {/* --- Display the Meal Plan --- */}
          {mealPlan && (
            <div className="space-y-6 mt-6">
                <Card className="bg-muted/40">
                    <CardHeader>
                        <CardTitle className="flex items-center text-xl">
                            <Hash className="h-5 w-5 text-primary" />
                            <span className="ml-2">Daily Summary</span>
                        </CardTitle>
                        <CardDescription>
                            Your personalized macronutrient targets for today.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold">{mealPlan.summary.calories}</p>
                                <p className="text-sm text-muted-foreground">Calories</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{mealPlan.summary.protein}g</p>
                                <p className="text-sm text-muted-foreground">Protein</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{mealPlan.summary.carbs}g</p>
                                <p className="text-sm text-muted-foreground">Carbs</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{mealPlan.summary.fat}g</p>
                                <p className="text-sm text-muted-foreground">Fat</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                    <MealCard title="Breakfast" items={mealPlan.breakfast} icon={<Egg className="h-6 w-6 text-yellow-500" />} />
                    <MealCard title="Lunch" items={mealPlan.lunch} icon={<Utensils className="h-6 w-6 text-orange-500" />} />
                    <MealCard title="Dinner" items={mealPlan.dinner} icon={<Beef className="h-6 w-6 text-red-500" />} />
                    <MealCard title="Snacks" items={mealPlan.snacks} icon={<Apple className="h-6 w-6 text-green-500" />} />
                </div>
            </div>
          )}

          {!mealPlan && !mealPlanMutation.isPending && isDataComplete && (
            <div className="text-center text-muted-foreground py-10">
              <p>Click "Generate Plan" to get your personalized meal recommendations for today.</p>
            </div>
          )}

          {/* Display saved info for reference */}
          <div className="flex items-center justify-center mt-6 text-xs text-muted-foreground">
            {userData?.height && (
              <span>
                <span className="font-medium">Your saved height: </span>
                {userData.height} cm
              </span>
            )}
            {userData?.age && (
              <span className="ml-4">
                <span className="font-medium">Age: </span>
                {userData.age}
              </span>
            )}
            {userData?.gender && (
              <span className="ml-4">
                <span className="font-medium">Gender: </span>
                <span className="capitalize">{userData.gender}</span>
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NutritionLog;
