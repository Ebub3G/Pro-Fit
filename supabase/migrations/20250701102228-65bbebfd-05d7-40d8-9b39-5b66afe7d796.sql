
-- Add weight and fitness goal fields to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN current_weight DOUBLE PRECISION,
ADD COLUMN target_weight DOUBLE PRECISION,
ADD COLUMN fitness_goal TEXT CHECK (fitness_goal IN ('lose_weight', 'gain_weight', 'gain_muscle', 'maintain_weight', 'improve_fitness'));

-- Update the existing user_goals table to be more comprehensive
ALTER TABLE public.user_goals 
ADD COLUMN weekly_workout_days INTEGER DEFAULT 3,
ADD COLUMN preferred_workout_type TEXT DEFAULT 'mixed';
