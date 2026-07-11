import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Generates a structured meal plan, grocery list, to-do timeline, and budget feasibility assessment.
 * 
 * @param {Object} params
 * @param {string} params.apiKey - The Gemini API key provided by the user.
 * @param {string} params.modelName - The specific model to request (e.g. gemini-1.5-flash).
 * @param {string} params.dayDescription - User's description of their day/schedule.
 * @param {string} params.dietaryPreference - Vegetarian, Vegan, Keto, etc.
 * @param {number} params.householdSize - Number of people to cook for.
 * @param {string[]} params.equipment - List of available kitchen tools.
 * @param {number} params.budgetGoal - User's daily budget goal in USD.
 */
export async function generateCookingPlan({
  apiKey,
  modelName = 'gemini-1.5-flash-latest',
  dayDescription,
  dietaryPreference,
  householdSize,
  equipment,
  budgetGoal,
}) {
  const actualApiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY;

  if (!actualApiKey) {
    throw new Error('Missing Gemini API Key. Please provide a key in the settings or environment.');
  }

  const genAI = new GoogleGenerativeAI(actualApiKey);

  const prompt = `
You are an expert personal chef and budget planner AI. 
Generate a comprehensive, personalized cooking plan, timeline, grocery list, and budget feasibility analysis based on the user's input:

1. **User's Day/Schedule**: "${dayDescription}"
2. **Dietary Preference**: "${dietaryPreference}"
3. **Household Size**: ${householdSize} people
4. **Kitchen Equipment Available**: ${equipment.join(', ') || 'Standard kitchen (Stovetop, Oven)'}
5. **Daily Budget Goal**: $${budgetGoal} USD

**Instructions & Logic Rules**:
- **Meal Plan**: Create a breakfast, lunch, and dinner. The meals MUST fit their schedule. For example, if they are busy all day or working late, dinner should be a quick <20-min recipe or a slow cooker recipe started in the morning.
- **Cooking To-Do List (Timeline)**: Produce a chronological checklist of cooking activities for the day. Align it with their schedule (e.g. if they start work at 9 AM, breakfast prep should be around 8:00 AM. If they finish work at 6 PM, dinner prep starts at 6:30 PM). Break tasks down into clear, actionable checklist items (e.g., "Morning Prep: Chop onions and bell peppers for lunch/dinner (10 mins)").
- **Grocery List**: Group ingredients into categories: "Produce", "Pantry", "Dairy & Meat" (or "Proteins" if vegan/vegetarian), "Other". Scale the quantities of the ingredients to feed ${householdSize} people.
- **Substitutions**: For EVERY grocery item, provide a realistic, alternative ingredient in case they don't have it or want to swap.
- **Budget Feasibility Logic**:
  - Calculate realistic average retail prices in USD for the ingredients listed.
  - Compute the total estimated cost of all ingredients scaled for ${householdSize} people, and the cost per person.
  - Compare the total estimated cost with the user's Daily Budget Goal ($${budgetGoal} USD).
  - Set the "feasibility" field to:
    - "green" if total estimated cost <= budgetGoal.
    - "yellow" if total estimated cost is up to 35% over the budgetGoal.
    - "red" if total estimated cost is more than 35% over the budgetGoal.
  - Provide a short, encouraging "feasibilityReason" detailing why this budget status was assigned.
  - Provide 2-3 specific, actionable "savingTips" (e.g. "Buy dry beans instead of canned to save $1.50", "Substitute chicken breast for thighs to reduce meat expense").

Return a JSON object matching this schema:
{
  "meals": [
    {
      "id": "breakfast",
      "type": "breakfast",
      "title": "Name of breakfast dish",
      "timeToPrep": "e.g., 10 mins",
      "ingredients": ["1 cup oats", "1 banana", ...],
      "instructions": "Step-by-step quick instructions for breakfast."
    },
    {
      "id": "lunch",
      "type": "lunch",
      "title": "Name of lunch dish",
      "timeToPrep": "e.g., 15 mins",
      "ingredients": ["...", ...],
      "instructions": "..."
    },
    {
      "id": "dinner",
      "type": "dinner",
      "title": "Name of dinner dish",
      "timeToPrep": "e.g., 20 mins",
      "ingredients": ["...", ...],
      "instructions": "..."
    }
  ],
  "todoList": [
    {
      "id": "todo-1",
      "time": "e.g., 8:00 AM",
      "title": "Breakfast Preparation",
      "desc": "Assemble oats and fruit. Brew coffee. (10 mins)"
    },
    {
      "id": "todo-2",
      "time": "e.g., 12:30 PM",
      "title": "Lunch Preparation",
      "desc": "Chop vegetables and plate the salad. (15 mins)"
    },
    ...
  ],
  "groceryList": [
    {
      "id": "g-1",
      "category": "Produce",
      "name": "Fresh Spinach",
      "qty": "5 oz",
      "substitution": "Kale, Arugula, or Swiss Chard"
    },
    {
      "id": "g-2",
      "category": "Dairy & Meat",
      "name": "Chicken Breast",
      "qty": "1.5 lbs",
      "substitution": "Tofu, Tempeh, or Chicken Thighs"
    },
    ...
  ],
  "budgetAnalysis": {
    "estimatedTotalCost": 18.50,
    "costPerPerson": 4.63,
    "feasibility": "green",
    "feasibilityReason": "Estimated total cost of $18.50 is under your $20.00 budget, leaving a buffer of $1.50.",
    "savingTips": [
      "Buy store-brand canned beans instead of organic to save $0.80.",
      "Purchase spinach in bulk bags to save $1.20."
    ]
  }
}

Do not include any markdown backticks or formatting outside of the raw JSON object. The response must be a single, valid JSON object parseable by JSON.parse().
`;

  // Define a candidates array for fallback in case of 404 (model not found) error
  const candidates = [
    modelName,
    'gemini-flash-latest',
    'gemini-2.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];
  
  // Remove duplicates while maintaining order
  const uniqueCandidates = [...new Set(candidates)];
  let lastError = null;

  for (const currentModel of uniqueCandidates) {
    try {
      console.log(`[AI] Attempting content generation using: ${currentModel}`);
      
      const model = genAI.getGenerativeModel({
        model: currentModel,
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }, {
        apiVersion: 'v1beta'
      });

      const result = await model.generateContent(prompt);
      const textResponse = result.response.text();
      
      try {
        const parsed = JSON.parse(textResponse);
        console.log(`[AI] Successfully generated plan with model: ${currentModel}`);
        return parsed;
      } catch (parseErr) {
        console.error(`[AI] JSON parsing failed for model ${currentModel}:`, textResponse);
        throw new Error(`The AI returned invalid JSON. Please try generating again.`);
      }
    } catch (err) {
      console.warn(`[AI] Error with model ${currentModel}:`, err);
      lastError = err;
      
      const errMsg = err.message || err.toString();
      
      // If it is NOT a model 404/not found/endpoint error, throw immediately
      // (e.g. invalid API key, safety block, network offline) so we don't spin wheels.
      const isModelNotFoundError = 
        errMsg.includes('404') || 
        errMsg.includes('not found') || 
        errMsg.includes('ModelService') ||
        errMsg.includes('not supported') ||
        errMsg.includes('model');

      if (!isModelNotFoundError) {
        throw err;
      }
    }
  }

  throw new Error(
    `Gemini API Error (404 / Model Not Supported): All models failed. ` +
    `Please ensure your API key has access to Gemini. Last error: ${lastError?.message || lastError}`
  );
}
