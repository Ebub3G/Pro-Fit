
-- Enable RLS on all tables and create proper policies
ALTER TABLE public.user_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_muscle_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_workout_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_weights
CREATE POLICY "Users can view their own weights" 
  ON public.user_weights 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weights" 
  ON public.user_weights 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weights" 
  ON public.user_weights 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weights" 
  ON public.user_weights 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policies for user_muscle_measurements
CREATE POLICY "Users can view their own muscle measurements" 
  ON public.user_muscle_measurements 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own muscle measurements" 
  ON public.user_muscle_measurements 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own muscle measurements" 
  ON public.user_muscle_measurements 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own muscle measurements" 
  ON public.user_muscle_measurements 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policies for user_nutrition_logs
CREATE POLICY "Users can view their own nutrition logs" 
  ON public.user_nutrition_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition logs" 
  ON public.user_nutrition_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition logs" 
  ON public.user_nutrition_logs 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition logs" 
  ON public.user_nutrition_logs 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policies for user_workout_logs
CREATE POLICY "Users can view their own workout logs" 
  ON public.user_workout_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout logs" 
  ON public.user_workout_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout logs" 
  ON public.user_workout_logs 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout logs" 
  ON public.user_workout_logs 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create user profiles table for additional user data
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Create user goals table
CREATE TABLE public.user_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('lose_weight', 'gain_weight', 'gain_muscle', 'maintain_weight')),
  target_weight DOUBLE PRECISION,
  target_date DATE,
  current_progress DOUBLE PRECISION DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_goals
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_goals
CREATE POLICY "Users can view their own goals" 
  ON public.user_goals 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" 
  ON public.user_goals 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
  ON public.user_goals 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
  ON public.user_goals 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add indexes for better performance
CREATE INDEX idx_user_weights_user_id_date ON public.user_weights(user_id, date DESC);
CREATE INDEX idx_user_muscle_measurements_user_id_date ON public.user_muscle_measurements(user_id, date DESC);
CREATE INDEX idx_user_nutrition_logs_user_id_created_at ON public.user_nutrition_logs(user_id, created_at DESC);
CREATE INDEX idx_user_workout_logs_user_id_date ON public.user_workout_logs(user_id, date DESC);
CREATE INDEX idx_user_goals_user_id_active ON public.user_goals(user_id, is_active);
