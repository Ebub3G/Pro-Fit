
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { goal, weight, height, targets } = await req.json();

    if (!perplexityApiKey) {
      throw new Error("PERPLEXITY_API_KEY is not set in environment variables.");
    }
    
    if (!goal || !weight || !height || !targets) {
        return new Response(JSON.stringify({ error: "Missing required parameters: goal, weight, height, targets" }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const prompt = `You are a nutrition assistant. Generate a daily meal plan (breakfast, lunch, dinner, and one snack) for a user with the following profile: Goal: ${goal}, Current Weight: ${weight} kg, Height: ${height} cm. Their daily macronutrient targets are: ${targets.calories} calories, ${targets.protein}g protein, ${targets.carbs}g carbs, and ${targets.fat}g fat. For each meal, provide the food item, an estimated calorie count, protein, carbs, and fat content. Also include a "summary" object with the total "calories", "protein", "carbs", and "fat" for the entire day. Please provide the output as a single JSON object without any extra text, explanation, or markdown. The JSON should follow this structure: { "breakfast": [{ "name": "...", "calories": ..., "protein": ..., "carbs": ..., "fat": ... }], "lunch": [...], "dinner": [...], "snacks": [...], "summary": { "calories": ..., "protein": ..., "carbs": ..., "fat": ... } }`;

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
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorBody}`);
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
