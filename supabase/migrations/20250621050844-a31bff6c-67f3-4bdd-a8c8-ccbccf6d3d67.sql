
-- Create table for AI-generated workout and nutrition plans
CREATE TABLE public.user_ai_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('workout', 'nutrition', 'combined')),
  title TEXT NOT NULL,
  description TEXT,
  plan_data JSONB NOT NULL, -- stores the full AI-generated plan
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for daily tasks from the plans
CREATE TABLE public.user_daily_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  plan_id UUID REFERENCES public.user_ai_plans NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('workout', 'nutrition', 'habit')),
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for user_ai_plans
ALTER TABLE public.user_ai_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plans" 
  ON public.user_ai_plans 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own plans" 
  ON public.user_ai_plans 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans" 
  ON public.user_ai_plans 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plans" 
  ON public.user_ai_plans 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add RLS policies for user_daily_tasks
ALTER TABLE public.user_daily_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks" 
  ON public.user_daily_tasks 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" 
  ON public.user_daily_tasks 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" 
  ON public.user_daily_tasks 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" 
  ON public.user_daily_tasks 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_user_ai_plans_user_id ON public.user_ai_plans(user_id);
CREATE INDEX idx_user_ai_plans_active ON public.user_ai_plans(user_id, is_active);
CREATE INDEX idx_user_daily_tasks_user_id ON public.user_daily_tasks(user_id);
CREATE INDEX idx_user_daily_tasks_date ON public.user_daily_tasks(user_id, target_date);
