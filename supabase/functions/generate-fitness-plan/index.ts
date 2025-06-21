
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { planType } = await req.json();
    
    console.log(`Generating ${planType} plan for user:`, user.id);

    // Fetch user profile and goals
    const { data: profile } = await supabase
      .from('profiles')
      .select('height_cm, age, gender, activity_level')
      .eq('id', user.id)
      .single();

    const { data: goals } = await supabase
      .from('user_goals')
      .select('goal_type, target_weight, current_progress')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const { data: weights } = await supabase
      .from('user_weights')
      .select('weight')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1);

    if (!profile || !profile.height_cm || !profile.age) {
      return new Response(JSON.stringify({ error: 'Please complete your profile first' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currentWeight = weights?.[0]?.weight || null;
    const primaryGoal = goals?.[0] || null;

    // Build comprehensive prompt for ChatGPT
    let prompt = '';
    
    if (planType === 'workout' || planType === 'combined') {
      prompt += `Create a personalized weekly workout plan for a ${profile.age}-year-old ${profile.gender} who is ${profile.height_cm}cm tall`;
      if (currentWeight) prompt += ` and weighs ${currentWeight}kg`;
      prompt += `. Activity level: ${profile.activity_level}.`;
      
      if (primaryGoal) {
        prompt += ` Primary goal: ${primaryGoal.goal_type}`;
        if (primaryGoal.target_weight) prompt += ` (target weight: ${primaryGoal.target_weight}kg)`;
      }
      
      prompt += `\n\nProvide a structured 7-day workout plan with:
      - Specific exercises for each day
      - Sets, reps, and rest periods
      - Progressive difficulty
      - Rest days included
      - Equipment needed (prefer bodyweight/minimal equipment)
      
      Format as JSON with this structure:
      {
        "title": "Personalized Workout Plan",
        "description": "Brief description",
        "weeklyPlan": {
          "monday": { "focus": "Upper Body", "exercises": [{"name": "Push-ups", "sets": 3, "reps": "8-12", "rest": "60s"}] },
          "tuesday": { "focus": "Cardio", "exercises": [...] },
          ...
        },
        "dailyTasks": ["Complete today's workout", "Track your progress", "Stay hydrated"]
      }`;
    }

    if (planType === 'nutrition' || planType === 'combined') {
      if (planType === 'combined') prompt += '\n\nALSO:\n\n';
      
      prompt += `Create a personalized nutrition plan for the same person.`;
      
      // Calculate BMR and daily calories
      let bmr = 0;
      if (profile.gender === 'male') {
        bmr = 88.362 + (13.397 * (currentWeight || 70)) + (4.799 * profile.height_cm) - (5.677 * profile.age);
      } else {
        bmr = 447.593 + (9.247 * (currentWeight || 60)) + (3.098 * profile.height_cm) - (4.330 * profile.age);
      }
      
      const activityMultipliers = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'active': 1.725,
        'very_active': 1.9
      };
      
      const dailyCalories = Math.round(bmr * (activityMultipliers[profile.activity_level as keyof typeof activityMultipliers] || 1.4));
      
      prompt += ` Estimated daily calorie needs: ${dailyCalories} calories.`;
      
      if (primaryGoal?.goal_type === 'lose_weight') {
        prompt += ` Adjust for weight loss (caloric deficit).`;
      } else if (primaryGoal?.goal_type === 'gain_weight' || primaryGoal?.goal_type === 'gain_muscle') {
        prompt += ` Adjust for weight/muscle gain (caloric surplus).`;
      }
      
      prompt += `\n\nProvide:
      - Daily calorie and macro targets
      - Sample meal ideas for breakfast, lunch, dinner, snacks
      - Hydration goals
      - Key nutritional guidelines
      
      ${planType === 'combined' ? 'Add to the existing JSON structure:' : 'Format as JSON:'}
      ${planType === 'combined' ? '' : '{'}
      "nutritionPlan": {
        "dailyCalories": ${dailyCalories},
        "macros": {"protein": "25%", "carbs": "45%", "fat": "30%"},
        "meals": {
          "breakfast": ["Oatmeal with berries", "Greek yogurt with nuts"],
          "lunch": ["Grilled chicken salad", "Quinoa bowl"],
          "dinner": ["Salmon with vegetables", "Lean beef with sweet potato"],
          "snacks": ["Apple with almond butter", "Protein smoothie"]
        },
        "hydration": "2.5-3L water daily",
        "guidelines": ["Eat protein with every meal", "Include vegetables in lunch and dinner"]
      }${planType === 'combined' ? '' : '}'}`;
      
      if (planType === 'nutrition') {
        prompt += `,
        "dailyTasks": ["Track your meals", "Drink enough water", "Take progress photos"]
        }`;
      } else {
        prompt += `,
        "combinedDailyTasks": ["Complete workout", "Track nutrition", "Stay hydrated", "Get adequate sleep"]
        }`;
      }
    }

    console.log('Sending prompt to OpenAI...');

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a certified fitness and nutrition expert. Always respond with valid JSON only, no additional text or explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const planContent = openAIData.choices[0].message.content;
    
    console.log('Received plan from OpenAI');

    let planData;
    try {
      planData = JSON.parse(planContent);
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', e);
      throw new Error('Invalid response format from AI');
    }

    // Store the plan in database
    const { data: newPlan, error: planError } = await supabase
      .from('user_ai_plans')
      .insert({
        user_id: user.id,
        plan_type: planType,
        title: planData.title || `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
        description: planData.description || 'AI-generated personalized plan',
        plan_data: planData,
        is_active: true
      })
      .select()
      .single();

    if (planError) {
      console.error('Error saving plan:', planError);
      throw planError;
    }

    // Create daily tasks for the next 7 days
    const tasks = [];
    const taskList = planData.dailyTasks || planData.combinedDailyTasks || ['Follow your plan', 'Track progress'];
    
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + i);
      
      for (const task of taskList) {
        tasks.push({
          user_id: user.id,
          plan_id: newPlan.id,
          task_type: planType === 'workout' ? 'workout' : planType === 'nutrition' ? 'nutrition' : 'habit',
          title: task,
          target_date: targetDate.toISOString().split('T')[0],
        });
      }
    }

    const { error: tasksError } = await supabase
      .from('user_daily_tasks')
      .insert(tasks);

    if (tasksError) {
      console.error('Error creating tasks:', tasksError);
    }

    console.log(`Successfully created ${planType} plan with ${tasks.length} tasks`);

    return new Response(JSON.stringify({ 
      success: true, 
      plan: newPlan,
      tasksCreated: tasks.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-fitness-plan:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate plan' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
