
-- Add age, gender, and activity_level columns to the profiles table
ALTER TABLE public.profiles
ADD COLUMN age INTEGER,
ADD COLUMN gender TEXT,
ADD COLUMN activity_level TEXT;

-- Add check constraints to ensure data integrity, allowing NULL for existing users
ALTER TABLE public.profiles
ADD CONSTRAINT check_age CHECK (age IS NULL OR (age > 12 AND age < 150));

ALTER TABLE public.profiles
ADD CONSTRAINT check_gender CHECK (gender IS NULL OR (gender IN ('male', 'female')));

ALTER TABLE public.profiles
ADD CONSTRAINT check_activity_level CHECK (activity_level IS NULL OR (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')));

-- Drop the function because its return signature is changing
DROP FUNCTION public.get_user_data_for_recommendations(uuid);

-- Recreate the database function to fetch this new data for recommendations
CREATE FUNCTION public.get_user_data_for_recommendations(p_user_id uuid)
 RETURNS TABLE(goal text, weight numeric, height numeric, age integer, gender text, activity_level text)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT goal_type FROM user_goals WHERE user_id = p_user_id AND is_active = true LIMIT 1) as goal,
        (SELECT w.weight FROM user_weights w WHERE w.user_id = p_user_id ORDER BY w.date DESC LIMIT 1) as weight,
        (SELECT p.height_cm FROM profiles p WHERE p.id = p_user_id LIMIT 1) as height,
        (SELECT p.age FROM profiles p WHERE p.id = p_user_id LIMIT 1) as age,
        (SELECT p.gender FROM profiles p WHERE p.id = p_user_id LIMIT 1) as gender,
        (SELECT p.activity_level FROM profiles p WHERE p.id = p_user_id LIMIT 1) as activity_level;
END;
$function$;
