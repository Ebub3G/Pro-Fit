import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface Goal {
  goal_type: string;
  target_weight: number | null;
  current_progress: number;
}

interface WeightEntry {
  weight: number;
  date: string;
}

interface MuscleEntry {
  chest: number | null;
  biceps: number | null;
  waist: number | null;
  thighs: number | null;
}

interface UserProfile {
  height_cm: number | null;
  age: number | null;
  gender: 'male' | 'female' | null;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
}

interface UserData {
  goals: Goal[];
  weights: WeightEntry[];
  muscle: MuscleEntry[];
  profile: UserProfile | null;
}

export const useRecommendations = () => {
    const { user } = useAuth();
    const { handleError } = useErrorHandler();
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchUserData = useCallback(async (): Promise<UserData | null> => {
        if (!user) return null;

        try {
            const [goalsResponse, weightsResponse, muscleResponse, profileResponse] = await Promise.all([
                supabase
                    .from('user_goals')
                    .select('goal_type, target_weight, current_progress')
                    .eq('user_id', user.id)
                    .eq('is_active', true),
                supabase
                    .from('user_weights')
                    .select('weight, date')
                    .eq('user_id', user.id)
                    .order('date', { ascending: false })
                    .limit(10),
                supabase
                    .from('user_muscle_measurements')
                    .select('chest, biceps, waist, thighs')
                    .eq('user_id', user.id)
                    .order('date', { ascending: false })
                    .limit(5),
                supabase
                    .from('profiles')
                    .select('height_cm, age, gender, activity_level')
                    .eq('id', user.id)
                    .maybeSingle()
            ]);

            if (goalsResponse.error) throw goalsResponse.error;
            if (weightsResponse.error) throw weightsResponse.error;
            if (muscleResponse.error) throw muscleResponse.error;
            if (profileResponse.error) throw profileResponse.error;

            return {
                goals: goalsResponse.data || [],
                weights: weightsResponse.data || [],
                muscle: muscleResponse.data || [],
                profile: profileResponse.data
            };
        } catch (error) {
            handleError(error, 'Failed to fetch user data for recommendations');
            return null;
        }
    }, [user, handleError]);

    const { data: userData, isLoading, refetch } = useQuery({
        queryKey: ['user-data-for-recommendations', user?.id],
        queryFn: fetchUserData,
        enabled: !!user,
        refetchInterval: autoRefresh ? 30000 : false,
    });

    const generateRecommendations = useCallback(() => {
        if (!userData) return;

        const { goals, weights, muscle, profile } = userData;
        let newRecommendations: string[] = [];
        let bmi = 0;
        let bmiCategory = '';

        if (profile?.height_cm && weights.length > 0 && profile?.age && profile?.gender && profile?.activity_level) {
            const heightM = profile.height_cm / 100;
            const latestWeight = weights[0].weight;
            bmi = latestWeight / (heightM * heightM);

            let bmiRecommendation = '';

            if (bmi < 18.5) {
                bmiCategory = 'underweight';
                bmiRecommendation = 'Consider a balanced diet for healthy weight gain.';
            } else if (bmi < 25) {
                bmiCategory = 'in the healthy range';
                bmiRecommendation = 'Keep up the great work maintaining your health!';
            } else if (bmi < 30) {
                bmiCategory = 'overweight';
                bmiRecommendation = 'Focus on a balanced diet and regular exercise for weight management.';
            } else {
                bmiCategory = 'obese';
                bmiRecommendation = 'It is recommended to create a sustainable workout and diet plan. Consulting a professional can be beneficial.';
            }

            newRecommendations.push(`💡 Your BMI is ${bmi.toFixed(1)} (${bmiCategory}). ${bmiRecommendation}`);
        }

        goals.forEach((goal: Goal) => {
            switch (goal.goal_type) {
                case 'lose_weight':
                    newRecommendations.push('🥗 Maintain a caloric deficit with nutritious, whole foods.');
                    if (bmi >= 25) {
                        newRecommendations.push('💪 Combine strength training with cardio to maximize fat loss while preserving muscle.');
                    } else {
                        newRecommendations.push('💪 Focus on cardio exercises like running or swimming.');
                    }
                    if (weights.length >= 2 && (weights[0].weight - weights[1].weight > 0)) {
                        newRecommendations.push('📉 Consider adjusting your diet as weight has increased recently');
                    }
                    break;
                case 'gain_weight':
                    newRecommendations.push('🍖 Increase protein intake and eat in a caloric surplus.');
                    if (bmi < 18.5) {
                        newRecommendations.push('🏋️ Focus on compound exercises like squats and deadlifts to build overall mass.');
                    } else {
                        newRecommendations.push('🏋️ Incorporate strength training to build muscle mass.');
                    }
                    break;
                case 'gain_muscle':
                    newRecommendations.push('🥩 Aim for 1.6-2.2g protein per kg of body weight.');
                    newRecommendations.push('💪 Focus on progressive overload in your resistance training for muscle growth.');
                    if (muscle.length > 0) {
                        newRecommendations.push('📏 Track muscle measurements to monitor growth progress');
                    }
                    break;
                case 'maintain_weight':
                    newRecommendations.push('⚖️ Balance cardio and strength training for a healthy body composition.');
                    newRecommendations.push('🎯 Focus on consistency in both diet and exercise to maintain your current weight.');
                    break;
            }
        });

        if (weights.length >= 3) {
            const trend = weights.slice(0, 3).reduce((acc, curr, index) => {
                if (index === 0) return acc;
                return acc + (weights[index - 1].weight - curr.weight);
            }, 0);

            if (Math.abs(trend) < 0.5) {
                newRecommendations.push('📊 Your weight is stable - great for maintaining current habits');
            }
        }

        if (newRecommendations.length === 0) {
            newRecommendations.push('🎯 Set a specific fitness goal to get personalized recommendations');
            newRecommendations.push('📊 Log your weight regularly to track progress');
            newRecommendations.push('💧 Stay hydrated and get adequate sleep for recovery');
        }
        
        if (!profile?.height_cm || !profile?.age || !profile?.gender || !profile?.activity_level) {
            newRecommendations.unshift('ADD_HEIGHT_PROMPT');
        }

        setRecommendations(Array.from(new Set(newRecommendations)).slice(0, 5));
    }, [userData]);

    useEffect(() => {
        if (userData) {
            generateRecommendations();
        }
    }, [userData, generateRecommendations]);

    return {
        recommendations,
        isLoading,
        autoRefresh,
        setAutoRefresh,
        refreshRecommendations: refetch
    };
};
