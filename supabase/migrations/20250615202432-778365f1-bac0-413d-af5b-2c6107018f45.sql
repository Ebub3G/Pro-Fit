
CREATE OR REPLACE FUNCTION get_user_data_for_recommendations(p_user_id UUID)
RETURNS TABLE(goal TEXT, weight NUMERIC, height NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT goal_type FROM user_goals WHERE user_id = p_user_id AND is_active = true LIMIT 1) as goal,
        (SELECT w.weight FROM user_weights w WHERE w.user_id = p_user_id ORDER BY w.date DESC LIMIT 1) as weight,
        (SELECT p.height_cm FROM profiles p WHERE p.id = p_user_id LIMIT 1) as height;
END;
$$ LANGUAGE plpgsql;
