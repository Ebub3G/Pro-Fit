
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { planType, userPreferences } = await req.json()
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client with the user's JWT
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Fetch comprehensive user data
    const { data: userData, error: dataError } = await supabase.rpc('get_user_data_for_recommendations', {
      p_user_id: user.id
    })

    if (dataError) {
      console.error('Error fetching user data:', dataError)
      throw new Error('Failed to fetch user data')
    }

    // Get additional profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('current_weight, target_weight, fitness_goal')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
    }

    const userInfo = userData?.[0] || {}
    const profileInfo = profile || {}

    // Calculate BMI and calorie needs
    const calculateBMI = (weight: number, height: number) => {
      const heightInMeters = height / 100
      return weight / (heightInMeters * heightInMeters)
    }

    const calculateCalories = (weight: number, height: number, age: number, gender: string, activityLevel: string) => {
      // Harris-Benedict equation
      let bmr = gender === 'male' 
        ? 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
        : 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)

      const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
      }

      return Math.round(bmr * (activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.2))
    }

    const currentWeight = profileInfo.current_weight || userInfo.weight
    const targetWeight = profileInfo.target_weight
    const fitnessGoal = profileInfo.fitness_goal || userInfo.goal
    const height = userInfo.height
    const age = userInfo.age
    const gender = userInfo.gender
    const activityLevel = userInfo.activity_level

    let bmi = null
    let calories = null
    
    if (currentWeight && height && age && gender && activityLevel) {
      bmi = calculateBMI(currentWeight, height)
      calories = calculateCalories(currentWeight, height, age, gender, activityLevel)
    }

    // Create comprehensive user context
    const userContext = `
User Profile:
- Age: ${age || 'Not specified'}
- Gender: ${gender || 'Not specified'}
- Height: ${height ? `${height}cm` : 'Not specified'}
- Current Weight: ${currentWeight ? `${currentWeight}kg` : 'Not specified'}
- Target Weight: ${targetWeight ? `${targetWeight}kg` : 'Not specified'}
- BMI: ${bmi ? bmi.toFixed(1) : 'Not calculated'}
- Activity Level: ${activityLevel || 'Not specified'}
- Fitness Goal: ${fitnessGoal || 'Not specified'}
- Daily Calorie Needs: ${calories ? `${calories} calories` : 'Not calculated'}
- Plan Type Requested: ${planType}
- Additional Preferences: ${JSON.stringify(userPreferences)}
`

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Generate plan based on type
    let systemPrompt = ''
    let planTitle = ''
    
    if (planType === 'workout') {
      systemPrompt = `You are an expert personal trainer and fitness coach. Create a comprehensive, personalized workout plan based on the user's profile. 

Consider their fitness goal, current fitness level, available time, and preferences. 

Return a detailed JSON response with this structure:
{
  "title": "Personalized Workout Plan",
  "description": "Brief description of the plan approach",
  "duration_weeks": 4,
  "weekly_schedule": [
    {
      "day": "Monday",
      "workout_type": "Upper Body Strength",
      "duration_minutes": 45,
      "exercises": [
        {
          "name": "Push-ups",
          "sets": 3,
          "reps": "8-12",
          "rest_seconds": 60,
          "instructions": "Keep your body straight, lower chest to ground"
        }
      ]
    }
  ],
  "daily_tasks": [
    {
      "task_type": "workout",
      "title": "Upper Body Strength Training",
      "description": "Focus on push-ups, squats, and planks"
    }
  ],
  "tips": ["Stay hydrated", "Focus on proper form"],
  "progression": "How to advance the plan over time"
}`
      
      planTitle = 'Personalized Workout Plan'
    } else if (planType === 'nutrition') {
      systemPrompt = `You are a certified nutritionist and dietitian. Create a comprehensive, personalized nutrition plan based on the user's profile.

Consider their fitness goal, current weight, target weight, activity level, and calorie needs.

Return a detailed JSON response with this structure:
{
  "title": "Personalized Nutrition Plan",
  "description": "Brief description of the nutrition approach",
  "daily_calories": ${calories || 2000},
  "macros": {
    "protein_grams": 120,
    "carbs_grams": 200,
    "fat_grams": 70
  },
  "meal_schedule": [
    {
      "meal": "Breakfast",
      "time": "7:00 AM",
      "calories": 400,
      "foods": [
        {
          "name": "Oatmeal with berries",
          "portion": "1 cup",
          "calories": 250,
          "protein": 8,
          "carbs": 45,
          "fat": 4
        }
      ]
    }
  ],
  "daily_tasks": [
    {
      "task_type": "nutrition",
      "title": "Track breakfast calories",
      "description": "Log your breakfast in your nutrition app"
    }
  ],
  "tips": ["Drink plenty of water", "Eat protein with each meal"],
  "shopping_list": ["Oats", "Berries", "Lean protein"]
}`
      
      planTitle = 'Personalized Nutrition Plan'
    } else {
      // Combined plan
      systemPrompt = `You are both an expert personal trainer and certified nutritionist. Create a comprehensive, personalized fitness and nutrition plan based on the user's profile.

This should be a complete lifestyle plan combining both workout and nutrition guidance.

Return a detailed JSON response with this structure:
{
  "title": "Complete Fitness & Nutrition Plan",
  "description": "Brief description of the combined approach",
  "duration_weeks": 4,
  "fitness_component": {
    "weekly_schedule": [
      {
        "day": "Monday",
        "workout_type": "Upper Body Strength",
        "duration_minutes": 45,
        "exercises": [
          {
            "name": "Push-ups",
            "sets": 3,
            "reps": "8-12",
            "rest_seconds": 60,
            "instructions": "Keep your body straight"
          }
        ]
      }
    ]
  },
  "nutrition_component": {
    "daily_calories": ${calories || 2000},
    "macros": {
      "protein_grams": 120,
      "carbs_grams": 200,
      "fat_grams": 70
    },
    "sample_meal_plan": [
      {
        "meal": "Breakfast",
        "foods": ["Oatmeal with berries", "Greek yogurt"],
        "calories": 400
      }
    ]
  },
  "daily_tasks": [
    {
      "task_type": "workout",
      "title": "Upper Body Strength Training",
      "description": "Focus on push-ups, squats, and planks"
    },
    {
      "task_type": "nutrition",
      "title": "Track breakfast calories",
      "description": "Log your breakfast in your nutrition app"
    }
  ],
  "tips": ["Stay consistent", "Listen to your body"],
  "weekly_goals": ["Complete 3 workouts", "Hit daily calorie targets"]
}`
      
      planTitle = 'Complete Fitness & Nutrition Plan'
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `${userContext}\n\nPlease create a detailed, actionable plan that is appropriate for this user's current fitness level and goals. Make sure all recommendations are safe and realistic.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    let planContent

    try {
      planContent = JSON.parse(data.choices[0].message.content)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError)
      // Fallback plan structure
      planContent = {
        title: planTitle,
        description: "AI-generated personalized plan based on your profile",
        daily_tasks: [
          {
            task_type: planType === 'nutrition' ? 'nutrition' : 'workout',
            title: `Start your ${planType} journey`,
            description: "Begin with small, manageable steps toward your fitness goals"
          }
        ],
        tips: ["Stay consistent", "Listen to your body", "Track your progress"]
      }
    }

    // Store the plan in the database
    const { data: savedPlan, error: saveError } = await supabase
      .from('user_ai_plans')
      .insert({
        user_id: user.id,
        plan_type: planType,
        title: planContent.title || planTitle,
        description: planContent.description || 'AI-generated personalized plan',
        plan_data: planContent,
        is_active: true
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving plan:', saveError)
      throw new Error('Failed to save plan')
    }

    // Create daily tasks from the plan
    if (planContent.daily_tasks && Array.isArray(planContent.daily_tasks)) {
      const today = new Date().toISOString().split('T')[0]
      
      const tasksToCreate = planContent.daily_tasks.map((task: any) => ({
        user_id: user.id,
        plan_id: savedPlan.id,
        task_type: task.task_type || planType,
        title: task.title || 'Complete daily task',
        description: task.description || '',
        target_date: today,
        is_completed: false
      }))

      const { error: taskError } = await supabase
        .from('user_daily_tasks')
        .insert(tasksToCreate)

      if (taskError) {
        console.error('Error creating daily tasks:', taskError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        plan: savedPlan
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in generate-fitness-plan function:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
