
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, User, Mail, Calendar, LogOut, Moon, Sun, Home, Edit, Target, Scale } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import LoadingSpinner from '@/components/LoadingSpinner';

const profileFormSchema = z.object({
  height_cm: z.number().positive('Height must be a positive number.').gt(50, "Height seems too short.").lt(300, "Height seems too tall."),
  age: z.number().int().positive('Age must be a positive number.').gt(12, "Age must be over 12.").lt(150, "Age seems too high."),
  gender: z.enum(['male', 'female'], { required_error: "Please select a gender" }),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active'], { required_error: "Please select an activity level" }),
  current_weight: z.number().positive('Current weight must be a positive number.').gt(20, "Weight seems too low.").lt(500, "Weight seems too high."),
  target_weight: z.number().positive('Target weight must be a positive number.').gt(20, "Weight seems too low.").lt(500, "Weight seems too high."),
  fitness_goal: z.enum(['lose_weight', 'gain_weight', 'gain_muscle', 'maintain_weight', 'improve_fitness'], { required_error: "Please select a fitness goal" }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const Profile = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      console.log('Fetching profile for user:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('height_cm, age, gender, activity_level, current_weight, target_weight, fitness_goal')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Profile fetch error:', error);
        handleError(error, "Could not fetch profile information.");
      }
      console.log('Profile data fetched:', data);
      return data;
    },
    enabled: !!user,
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      height_cm: 0,
      age: 0,
      gender: undefined,
      activity_level: undefined,
      current_weight: 0,
      target_weight: 0,
      fitness_goal: undefined,
    },
    mode: 'onChange',
  });

  React.useEffect(() => {
    if (profile) {
      console.log('Setting form values with profile data:', profile);
      form.reset({
        height_cm: profile.height_cm || 0,
        age: profile.age || 0,
        gender: profile.gender as 'male' | 'female' | undefined,
        activity_level: profile.activity_level as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | undefined,
        current_weight: profile.current_weight || 0,
        target_weight: profile.target_weight || 0,
        fitness_goal: profile.fitness_goal as 'lose_weight' | 'gain_weight' | 'gain_muscle' | 'maintain_weight' | 'improve_fitness' | undefined,
      });
    }
  }, [profile, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (!user) throw new Error('User not authenticated');
      console.log('Updating profile with values:', values);
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          height_cm: values.height_cm,
          age: values.age,
          gender: values.gender,
          activity_level: values.activity_level,
          current_weight: values.current_weight,
          target_weight: values.target_weight,
          fitness_goal: values.fitness_goal,
         });
      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }
      console.log('Profile updated successfully');
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Your profile has been updated.' });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-data-for-recommendations', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-data-for-meal-plan', user?.id] });
    },
    onError: (error) => {
      console.error('Profile update mutation error:', error);
      handleError(error, 'Failed to update profile.');
    }
  });

  const onSubmit = (values: ProfileFormValues) => {
    console.log('Form submitted with values:', values);
    updateProfileMutation.mutate(values);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const getFitnessGoalLabel = (goal: string) => {
    switch (goal) {
      case 'lose_weight': return 'Lose Weight';
      case 'gain_weight': return 'Gain Weight';
      case 'gain_muscle': return 'Gain Muscle';
      case 'maintain_weight': return 'Maintain Weight';
      case 'improve_fitness': return 'Improve Fitness';
      default: return goal;
    }
  };

  const getWeightProgress = () => {
    if (!profile?.current_weight || !profile?.target_weight) return null;
    const current = profile.current_weight;
    const target = profile.target_weight;
    const difference = Math.abs(current - target);
    const direction = current > target ? 'lose' : 'gain';
    return { current, target, difference, direction };
  };

  const weightProgress = getWeightProgress();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Profile</h1>
          <div className="flex items-center space-x-2">
            <Link to="/">
              <Button variant="outline" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Account Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Email:</span>
                <span>{user?.email}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Joined:</span>
                <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Edit className="h-5 w-5" />
                <span>Personal Details</span>
              </CardTitle>
              <CardDescription>Update your personal information here.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProfile ? <LoadingSpinner /> : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="height_cm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Height (cm) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="e.g. 180" 
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                                value={field.value || ""} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="e.g. 30" 
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                                value={field.value || ""} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="current_weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Weight (kg) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1"
                                placeholder="e.g. 70.5" 
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                                value={field.value || ""} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="target_weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Weight (kg) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1"
                                placeholder="e.g. 65.0" 
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                                value={field.value || ""} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="fitness_goal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fitness Goal *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your fitness goal" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="lose_weight">Lose Weight</SelectItem>
                              <SelectItem value="gain_weight">Gain Weight</SelectItem>
                              <SelectItem value="gain_muscle">Gain Muscle</SelectItem>
                              <SelectItem value="maintain_weight">Maintain Weight</SelectItem>
                              <SelectItem value="improve_fitness">Improve Fitness</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="activity_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Activity Level *</FormLabel>
                           <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your activity level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                              <SelectItem value="light">Lightly active (light exercise/sports 1-3 days/week)</SelectItem>
                              <SelectItem value="moderate">Moderately active (moderate exercise/sports 3-5 days/week)</SelectItem>
                              <SelectItem value="active">Active (hard exercise/sports 6-7 days a week)</SelectItem>
                              <SelectItem value="very_active">Extra active (very hard exercise/sports & a physical job)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            This helps in calculating your daily calorie needs accurately.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? <LoadingSpinner size="sm" /> : 'Save Changes'}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>

        {profile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Fitness Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {profile.current_weight ? `${profile.current_weight}kg` : 'Not set'}
                  </div>
                  <div className="text-sm text-muted-foreground">Current Weight</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {profile.target_weight ? `${profile.target_weight}kg` : 'Not set'}
                  </div>
                  <div className="text-sm text-muted-foreground">Target Weight</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {profile.fitness_goal ? getFitnessGoalLabel(profile.fitness_goal) : 'Not set'}
                  </div>
                  <div className="text-sm text-muted-foreground">Fitness Goal</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {weightProgress ? `${weightProgress.difference.toFixed(1)}kg` : 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {weightProgress ? `To ${weightProgress.direction}` : 'Progress'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profile;
