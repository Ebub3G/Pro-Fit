import { z } from 'zod';

// Define a schema for the input to ensure type safety
export const calculationInputSchema = z.object({
  goal: z.enum(['lose_weight', 'maintain_weight', 'gain_weight', 'gain_muscle']),
  weight: z.number().positive(), // in kg
  height: z.number().positive(), // in cm
  age: z.number().positive(), 
  gender: z.enum(['male', 'female']),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
});

type CalculationInput = z.infer<typeof calculationInputSchema>;

const activityFactors = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const goalCalorieAdjustments = {
  lose_weight: -500,
  maintain_weight: 0,
  gain_weight: 500,
  gain_muscle: 250, // Slight surplus for muscle gain
};

export const calculateMacronutrientTargets = (input: CalculationInput) => {
  const { goal, weight, height, age, gender, activityLevel } = calculationInputSchema.parse(input);

  // 1. Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor equation
  const genderConstant = gender === 'male' ? 5 : -161;
  const bmr = 10 * weight + 6.25 * height - 5 * age + genderConstant;

  // 2. Calculate TDEE (Total Daily Energy Expenditure)
  const tdee = bmr * activityFactors[activityLevel];

  // 3. Adjust calories based on goal
  const targetCalories = tdee + goalCalorieAdjustments[goal];

  // 4. Calculate macronutrients
  // Protein: 1.6g per kg of body weight (good for general fitness)
  const proteinGrams = Math.round(weight * 1.6);
  const proteinCalories = proteinGrams * 4;

  // Fat: 25% of total calories
  const fatCalories = Math.round(targetCalories * 0.25);
  const fatGrams = Math.round(fatCalories / 9);

  // Carbs: Remaining calories
  const carbCalories = targetCalories - proteinCalories - fatCalories;
  const carbGrams = Math.round(carbCalories / 4);

  return {
    calories: Math.round(targetCalories),
    protein: proteinGrams,
    carbs: carbGrams,
    fat: fatGrams,
  };
};
