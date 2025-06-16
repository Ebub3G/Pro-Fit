// supabase/functions/meal-recommendation/index.ts
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { z } from 'https://deno.land/x/zod@v3.23.0/mod.ts'; // Import Zod

const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

// Define the validation schema for the incoming request body
const mealRecommendationInputSchema = z.object({
  goal: z.enum(['lose_weight', 'maintain_weight', 'gain_weight', 'gain_muscle'], {
    errorMap: () => ({ message: "Invalid goal type." })
  }),
  weight: z.number().positive("Weight must be a positive number."), // in kg
  height: z.number().positive("Height must be a positive number."), // in cm
  age: z.number().int().positive("Age must be a positive integer.").min(13, "Age must be at least 13.").max(150, "Age seems too high."),
  gender: z.enum(['male', 'female'], {
    errorMap: () => ({ message: "Invalid gender." })
  }),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active'], {
    errorMap: () => ({ message: "Invalid activity level." })
  }),
  targets: z.object({
    calories: z.number().positive("Target calories must be positive."),
    protein: z.number().positive("Target protein must be positive."),
    carbs: z.number().positive("Target carbs must be positive."),
    fat: z.number().positive("Target fat must be positive."),
  }),
});


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();

    // Server-side validation using Zod
    const validationResult = mealRecommendationInputSchema.safeParse(requestBody);

    if (!validationResult.success) {
      // If validation fails, return a 400 Bad Request with validation errors
      const errors = validationResult.error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
      }));
      return new Response(JSON.stringify({ error: "Validation Failed", details: errors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { goal, weight, height, age, gender, activityLevel, targets } = validationResult.data;

    if (!perplexityApiKey) {
      throw new Error("PERPLEXITY_API_KEY is not set in environment variables.");
    }
    
    // The prompt now includes age, gender, and activityLevel for more accurate recommendations
    const prompt = `You are a nutrition assistant. Generate a daily meal plan (breakfast, lunch, dinner, and one snack) for a user with the following profile: Goal: ${goal}, Current Weight: ${weight} kg, Height: ${height} cm, Age: ${age} years, Gender: ${gender}, Activity Level: ${activityLevel}. Their daily macronutrient targets are: ${targets.calories} calories, ${targets.protein}g protein, ${targets.carbs}g carbs, and ${targets.fat}g fat. For each meal, provide the food item, an estimated calorie count, protein, carbs, and fat content. Also include a "summary" object with the total "calories", "protein", "carbs", and "fat" for the entire day. Please provide the output as a single JSON object without any extra text, explanation, or markdown. The JSON should follow this structure: { "breakfast": [{ "name": "...", "calories": ..., "protein": ..., "carbs": ..., "fat": ... }], "lunch": [...], "dinner": [...], "snacks": [...], "summary": { "calories": ..., "protein": ..., "carbs": ..., "fat": ... } }`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          { role: 'system', content: 'You are a helpful nutrition assistant that provides meal plans in JSON format.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        // Log the detailed error but return a generic message to the client
        console.error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorBody}`);
        throw new Error("Failed to get a response from the meal recommendation AI. Please try again later.");
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;

    // Perplexity might still wrap the JSON in a string, so we parse it.
    const mealPlan = JSON.parse(content);

    return new Response(JSON.stringify(mealPlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in meal-recommendation function:', error);
    // Return a generic error message to the client
    return new Response(JSON.stringify({ error: "An internal server error occurred." }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
