
-- Update the function to include the new profile fields
DROP FUNCTION IF EXISTS public.get_user_data_for_recommendations(uuid);

CREATE OR REPLACE FUNCTION public.get_user_data_for_recommendations(p_user_id uuid)
RETURNS TABLE(
  goal text, 
  weight double precision, 
  height double precision, 
  age integer, 
  gender text, 
  activity_level text,
  current_weight double precision,
  target_weight double precision,
  fitness_goal text
)
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
        (SELECT p.activity_level FROM profiles p WHERE p.id = p_user_id LIMIT 1) as activity_level,
        (SELECT p.current_weight FROM profiles p WHERE p.id = p_user_id LIMIT 1) as current_weight,
        (SELECT p.target_weight FROM profiles p WHERE p.id = p_user_id LIMIT 1) as target_weight,
        (SELECT p.fitness_goal FROM profiles p WHERE p.id = p_user_id LIMIT 1) as fitness_goal;
END;
$function$;
