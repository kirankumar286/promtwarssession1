import React, { useState, useEffect } from 'react';
import { 
  ChefHat, 
  Plus, 
  Minus, 
  Calendar, 
  DollarSign, 
  Utensils, 
  ShoppingCart, 
  Sparkles, 
  Clock, 
  User, 
  RefreshCw, 
  Check, 
  CheckCircle2, 
  ListTodo, 
  Settings, 
  AlertCircle, 
  HelpCircle,
  ArrowRight,
  TrendingDown,
  Info
} from 'lucide-react';
import { generateCookingPlan } from './services/gemini';

// Demo sample plan for simulation mode
const MOCK_PLAN = {
  meals: [
    {
      id: "breakfast",
      type: "breakfast",
      title: "Honey Banana Almond Oats",
      timeToPrep: "8 mins",
      ingredients: ["1 cup Rolled Oats", "1 sliced Banana", "1 tbsp Almond Butter", "1 tbsp Honey", "1.5 cups Almond Milk"],
      instructions: "Boil almond milk, add rolled oats and cook on low heat for 5 minutes. Pour into a bowl, top with banana slices, almond butter, and drizzle with honey."
    },
    {
      id: "lunch",
      type: "lunch",
      title: "Mediterranean Chickpea & Spinach Wrap",
      timeToPrep: "12 mins",
      ingredients: ["2 Whole Wheat Tortillas", "1 cup Canned Chickpeas (drained)", "1 cup Fresh Baby Spinach", "2 tbsp Hummus", "1/2 Cucumber (sliced)"],
      instructions: "Layer hummus on warmed tortillas. Top with fresh spinach, cucumber, and lightly mashed chickpeas. Roll up and slice."
    },
    {
      id: "dinner",
      type: "dinner",
      title: "One-Pan Garlic Herb Chicken & Roasted Broccoli",
      timeToPrep: "20 mins",
      ingredients: ["1.2 lbs Chicken Breast (or Firm Tofu)", "1 head of Broccoli (cut into florets)", "2 tbsp Olive Oil", "3 cloves Garlic (minced)", "1 Lemon"],
      instructions: "Preheat oven (or air fryer) to 400°F. Cut chicken/tofu and broccoli. Toss in olive oil, minced garlic, salt, and pepper. Roast for 20 mins. Squeeze fresh lemon juice on top before serving."
    }
  ],
  todoList: [
    {
      id: "todo-1",
      time: "8:00 AM",
      title: "Oatmeal Fuel-Up",
      desc: "Cook the oats in almond milk. Cut the banana and top the oatmeal with almond butter and honey (8 mins)."
    },
    {
      id: "todo-2",
      time: "12:15 PM",
      title: "Quick Wrap Assembly",
      desc: "Drain chickpeas, slice cucumber, spread hummus, and assemble the fresh spinach wraps (12 mins)."
    },
    {
      id: "todo-3",
      time: "6:30 PM",
      title: "One-Pan Dinner Prep & Roast",
      desc: "Chop broccoli. Cut chicken/tofu. Toss with garlic, oil, and spices. Spread onto sheet pan and roast at 400°F for 20 mins (25 mins total)."
    }
  ],
  groceryList: [
    {
      id: "g-1",
      category: "Produce",
      name: "Fresh Baby Spinach",
      qty: "5 oz",
      substitution: "Kale, Arugula, or Mixed Salad Greens"
    },
    {
      id: "g-2",
      category: "Produce",
      name: "Broccoli Head",
      qty: "1 large",
      substitution: "Cauliflower, Green Beans, or Asparagus"
    },
    {
      id: "g-3",
      category: "Produce",
      name: "Banana",
      qty: "1 medium",
      substitution: "Fresh Apple or Blueberries"
    },
    {
      id: "g-4",
      category: "Dairy & Meat",
      name: "Chicken Breast (or Firm Tofu)",
      qty: "1.2 lbs",
      substitution: "Tempeh, Seitan, or Canned Butter Beans"
    },
    {
      id: "g-5",
      category: "Pantry",
      name: "Rolled Oats",
      qty: "16 oz bag",
      substitution: "Steel Cut Oats or Quinoa flakes"
    },
    {
      id: "g-6",
      category: "Pantry",
      name: "Whole Wheat Tortillas",
      qty: "1 pack",
      substitution: "Pita bread or Gluten-Free wraps"
    },
    {
      id: "g-7",
      category: "Pantry",
      name: "Hummus",
      qty: "8 oz tub",
      substitution: "Pesto, Mashed Avocado, or Tzatziki"
    }
  ],
  budgetAnalysis: {
    estimatedTotalCost: 17.50,
    costPerPerson: 4.38,
    feasibility: "green",
    feasibilityReason: "At $17.50, your cooking plan is well within your budget target, leaving a comfortable margin for pantry staples.",
    savingTips: [
      "Buy loose broccoli instead of pre-cut bags to save up to $1.20.",
      "Purchase dry oats in cylinders rather than individual packets to cut oats expense in half.",
      "Opt for generic/store brand tortillas and hummus."
    ]
  }
};

const KITCHEN_EQUIPMENT = [
  "Stovetop", "Oven", "Air Fryer", "Slow Cooker", "Microwave", "Blender", "Toaster"
];

function App() {
  // Config & State
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('GEMINI_API_KEY') || '');
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('GEMINI_MODEL') || 'gemini-flash-latest');
  const [showSettings, setShowSettings] = useState(false);
  
  // Form parameters
  const [dayDescription, setDayDescription] = useState('');
  const [dietaryPreference, setDietaryPreference] = useState('No Restrictions');
  const [householdSize, setHouseholdSize] = useState(1);
  const [selectedEquipment, setSelectedEquipment] = useState(["Stovetop", "Oven"]);
  const [budgetGoal, setBudgetGoal] = useState(20);

  // App running state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cookingPlan, setCookingPlan] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Interactive Checklist/Toggle States
  const [activeTab, setActiveTab] = useState('timeline');
  const [completedGroceries, setCompletedGroceries] = useState(new Set());
  const [completedTodoList, setCompletedTodoList] = useState(new Set());
  const [activeSubstitutions, setActiveSubstitutions] = useState(new Set());

  // Save API key & Model to localStorage when updated
  const handleSaveApiKey = (val) => {
    setApiKey(val);
    localStorage.setItem('GEMINI_API_KEY', val);
  };

  const handleSaveModel = (val) => {
    setSelectedModel(val);
    localStorage.setItem('GEMINI_MODEL', val);
  };

  // Helper to load templates
  const applyTemplate = (type) => {
    if (type === 'workday') {
      setDayDescription("Busy day! Meetings from 9 AM to 5:30 PM. Gym immediately after, getting home around 7:15 PM tired. Need a very quick dinner and minimal breakfast cleanup.");
      setBudgetGoal(15);
      setHouseholdSize(1);
    } else if (type === 'sunday') {
      setDayDescription("Relaxed Sunday. Sleeping in, light lunch, and hosting a small dinner for 3 family members around 6:30 PM. Have time to cook and prep.");
      setBudgetGoal(35);
      setHouseholdSize(3);
    } else if (type === 'mealprep') {
      setDayDescription("Active Saturday chores. Want to cook a big lunch that feeds me and my partner, with leftover portions. Need things that reheat well.");
      setBudgetGoal(25);
      setHouseholdSize(2);
    }
  };

  const handleToggleEquipment = (eq) => {
    setSelectedEquipment(prev => 
      prev.includes(eq) ? prev.filter(item => item !== eq) : [...prev, eq]
    );
  };

  // Handle plan generation
  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    if (!dayDescription.trim()) {
      setError("Please describe your day so we can tailor the timeline.");
      return;
    }

    setLoading(true);
    setError(null);
    setCompletedGroceries(new Set());
    setCompletedTodoList(new Set());
    setActiveSubstitutions(new Set());

    // Check if we are running in simulator mode or API mode
    const hasKey = apiKey.trim() || import.meta.env.VITE_GEMINI_API_KEY;

    if (!hasKey) {
      // Simulate with brief delay
      setTimeout(() => {
        // Adjust mock plan slightly for dietary preference if needed
        let modifiedPlan = { ...MOCK_PLAN };
        if (dietaryPreference !== 'No Restrictions') {
          modifiedPlan.meals = modifiedPlan.meals.map(m => {
            if (m.id === 'dinner') {
              return {
                ...m,
                title: `Garlic Herb Tofu & Roasted Broccoli (${dietaryPreference} Friendly)`,
                ingredients: m.ingredients.map(i => i.includes("Chicken") ? "1.5 lbs Firm Tofu" : i)
              };
            }
            return m;
          });
        }
        
        // Scale budget analysis based on household size
        const scaledCost = +(12.50 * householdSize + 5.00).toFixed(2);
        modifiedPlan.budgetAnalysis = {
          estimatedTotalCost: scaledCost,
          costPerPerson: +(scaledCost / householdSize).toFixed(2),
          feasibility: scaledCost <= budgetGoal ? "green" : (scaledCost <= budgetGoal * 1.35 ? "yellow" : "red"),
          feasibilityReason: `[SIMULATION MODE] Estimated cost for ${householdSize} people is $${scaledCost}. Budget goal is $${budgetGoal}.`,
          savingTips: MOCK_PLAN.budgetAnalysis.savingTips
        };

        setCookingPlan(modifiedPlan);
        setIsDemoMode(true);
        setLoading(false);
      }, 1500);
      return;
    }

    try {
      const plan = await generateCookingPlan({
        apiKey: apiKey.trim(),
        modelName: selectedModel,
        dayDescription,
        dietaryPreference,
        householdSize,
        equipment: selectedEquipment,
        budgetGoal,
      });
      setCookingPlan(plan);
      setIsDemoMode(false);
    } catch (err) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGrocery = (id) => {
    setCompletedGroceries(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleTodo = (id) => {
    setCompletedTodoList(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSubstitution = (id) => {
    setActiveSubstitutions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Group groceries by category for clean UI rendering
  const getGroceriesByCategory = () => {
    if (!cookingPlan || !cookingPlan.groceryList) return {};
    return cookingPlan.groceryList.reduce((groups, item) => {
      const cat = item.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
      return groups;
    }, {});
  };

  const groupedGroceries = getGroceriesByCategory();

  // Progress calculations
  const totalGroceries = cookingPlan?.groceryList?.length || 0;
  const checkedGroceries = completedGroceries.size;
  const groceryProgressPercent = totalGroceries > 0 ? (checkedGroceries / totalGroceries) * 100 : 0;

  const totalTodo = cookingPlan?.todoList?.length || 0;
  const checkedTodo = completedTodoList.size;
  const todoProgressPercent = totalTodo > 0 ? (checkedTodo / totalTodo) * 100 : 0;

  const budgetState = cookingPlan?.budgetAnalysis || null;

  return (
    <div className="app-container">
      {/* Header Banner */}
      <header className="header">
        <h1>Prep & Plate</h1>
        <p>AI-Powered cooking scheduling, grocery scaling, and budget logic mapped specifically to your daily schedule.</p>
        
        {/* Toggle Settings Button */}
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="tag-btn" 
          style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderColor: apiKey ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }}
        >
          <Settings size={16} />
          {apiKey ? 'API & Model Settings (Configured)' : 'Setup Gemini API & Model'}
        </button>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="glass-panel api-key-container" style={{ marginBottom: '2rem', animation: 'fadeIn 0.25s ease' }}>
          <div className="api-key-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
              <Settings size={18} className="text-primary" /> API & Model Configuration
            </h3>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noreferrer" 
              className="api-key-link"
            >
              Get free key from Google AI Studio <ArrowRight size={12} style={{ display: 'inline' }} />
            </a>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Gemini API Key</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="password"
                  placeholder="Paste your Gemini API key here..."
                  value={apiKey}
                  onChange={(e) => handleSaveApiKey(e.target.value)}
                  className="input-text"
                  style={{ flex: 1 }}
                />
                {apiKey && (
                  <button 
                    onClick={() => handleSaveApiKey('')}
                    className="tag-btn" 
                    style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Preferred AI Model</label>
                <select 
                  value={selectedModel} 
                  onChange={(e) => handleSaveModel(e.target.value)} 
                  className="input-select"
                >
                  <option value="gemini-flash-latest">Gemini Flash (Latest - Recommended)</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash (Latest Version)</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Older Version)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                </select>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  ℹ️ <em>If you receive a "Model not found (404)" error, try switching to <strong>Gemini Flash (Latest - Recommended)</strong>.</em>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* LEFT SIDE: Inputs / Parameter panel */}
        <aside className="glass-panel">
          <form onSubmit={handleGeneratePlan} className="form-section">
            <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ChefHat size={22} color="var(--primary)" /> Meal Planner
            </h2>

            {/* Quick Templates */}
            <div className="form-group">
              <label>Select Template Day</label>
              <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                <button type="button" onClick={() => applyTemplate('workday')} className="tag-btn">Busy Workday</button>
                <button type="button" onClick={() => applyTemplate('sunday')} className="tag-btn">Hosting Sunday</button>
                <button type="button" onClick={() => applyTemplate('mealprep')} className="tag-btn">Batch Prep</button>
              </div>
            </div>

            {/* Day Description */}
            <div className="form-group">
              <label htmlFor="day-desc">Describe your Day / Schedule</label>
              <textarea
                id="day-desc"
                placeholder="E.g., In office until 6 PM, workout until 7 PM, need a quick dinner with easy cleanup."
                value={dayDescription}
                onChange={(e) => setDayDescription(e.target.value)}
                className="input-text"
                required
              />
            </div>

            {/* Dietary Preference */}
            <div className="form-group">
              <label htmlFor="diet">Dietary Preference</label>
              <select
                id="diet"
                value={dietaryPreference}
                onChange={(e) => setDietaryPreference(e.target.value)}
                className="input-select"
              >
                <option>No Restrictions</option>
                <option>Vegetarian</option>
                <option>Vegan</option>
                <option>Keto</option>
                <option>Gluten-Free</option>
                <option>Low-Carb</option>
              </select>
            </div>

            {/* Household Size Counter */}
            <div className="form-group">
              <label>Servings / Household Size</label>
              <div className="counter-box">
                <button 
                  type="button" 
                  onClick={() => setHouseholdSize(Math.max(1, householdSize - 1))}
                  className="counter-btn"
                >
                  <Minus size={16} />
                </button>
                <span className="counter-val">{householdSize} {householdSize === 1 ? 'person' : 'people'}</span>
                <button 
                  type="button" 
                  onClick={() => setHouseholdSize(householdSize + 1)}
                  className="counter-btn"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Kitchen Equipment available */}
            <div className="form-group">
              <label>Kitchen Equipment available</label>
              <div className="tag-grid">
                {KITCHEN_EQUIPMENT.map(eq => {
                  const isActive = selectedEquipment.includes(eq);
                  return (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => handleToggleEquipment(eq)}
                      className={`tag-btn ${isActive ? 'active' : ''}`}
                    >
                      {eq}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily Budget Goal */}
            <div className="form-group">
              <label htmlFor="budget">Daily Budget Goal</label>
              <div className="currency-input-wrapper">
                <span className="currency-symbol">$</span>
                <input
                  id="budget"
                  type="number"
                  min="5"
                  max="500"
                  value={budgetGoal}
                  onChange={(e) => setBudgetGoal(Number(e.target.value))}
                  className="input-text"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading} 
              className="btn-primary"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  Structuring Cooking Plan...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  {apiKey.trim() || import.meta.env.VITE_GEMINI_API_KEY ? 'Generate AI Cooking Plan' : 'Preview Demo Cooking Plan'}
                </>
              )}
            </button>

            {/* Info Message if Demo Mode */}
            {!(apiKey.trim() || import.meta.env.VITE_GEMINI_API_KEY) && (
              <p style={{ fontSize: '0.75rem', color: 'var(--warning)', textAlign: 'center', marginTop: '0.25rem' }}>
                <AlertCircle size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                No API Key configured. Clicking will show a static simulation plan.
              </p>
            )}
          </form>
        </aside>

        {/* RIGHT SIDE: Dashboard Results */}
        <main className="dashboard-results">
          {error && (
            <div className="glass-panel" style={{ borderColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.08)', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', wordBreak: 'break-word', overflowWrap: 'break-word', overflow: 'hidden' }}>
              <AlertCircle color="var(--danger)" size={24} style={{ flexShrink: 0 }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <h4 style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Generation Failed</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>{error}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--warning)', marginTop: '0.5rem', fontWeight: '500' }}>
                  💡 Tip: Click "Setup Gemini API & Model" at the top and try switching the preferred model to <strong>Gemini 2.5 Flash</strong> or <strong>Gemini 1.5 Flash (Latest Version)</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Empty state when no plan has been loaded yet */}
          {!cookingPlan && !loading && (
            <div className="glass-panel empty-state">
              <div className="empty-state-icon">
                <Utensils />
              </div>
              <h3>Your Cooking Plan Awaits</h3>
              <p>Fill out your day's schedule on the left, click generate, and the AI will craft your day's chronological meal preparation steps, recipe checklist, and feasibility report.</p>
              
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={() => applyTemplate('workday')} className="tag-btn">Try Workday Template</button>
                <button onClick={() => applyTemplate('sunday')} className="tag-btn">Try Hosting Template</button>
              </div>
            </div>
          )}

          {/* Loading Shimmer State */}
          {loading && (
            <div className="form-section">
              {/* Fake progress bar */}
              <div className="glass-panel shimmer-card" style={{ height: '70px', borderRadius: '16px' }} />
              {/* Fake grid of cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-panel shimmer-card" style={{ height: '300px', borderRadius: '18px' }} />
                <div className="glass-panel shimmer-card" style={{ height: '300px', borderRadius: '18px' }} />
                <div className="glass-panel shimmer-card" style={{ height: '300px', borderRadius: '18px' }} />
              </div>
            </div>
          )}

          {/* Main output panel */}
          {cookingPlan && !loading && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              {/* Demo Mode Alert Banner */}
              {isDemoMode && (
                <div className="glass-panel" style={{ borderColor: 'var(--warning)', background: 'rgba(245, 158, 11, 0.08)', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <Info color="var(--warning)" size={20} />
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <strong>Demo Simulator Mode Active</strong>. To create customized cooking plans using Gemini AI, configure an API key at the top.
                    </p>
                  </div>
                  <button onClick={() => setShowSettings(true)} className="tag-btn" style={{ borderColor: 'var(--warning)', color: 'var(--warning)', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                    Setup API Key
                  </button>
                </div>
              )}

              {/* Progress Summary Ribbon */}
              <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timeline Prep Tasks</span>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {checkedTodo} / {totalTodo} Complete
                    </h4>
                  </div>
                  <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '1.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grocery Purchased</span>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {checkedGroceries} / {totalGroceries} Bought
                    </h4>
                  </div>
                </div>
                
                {/* Feasibility Indicator */}
                {budgetState && (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>Budget Feasibility</span>
                    <span className={`feasibility-badge ${budgetState.feasibility}`}>
                      {budgetState.feasibility === 'green' && 'Within Budget'}
                      {budgetState.feasibility === 'yellow' && 'Slightly Over'}
                      {budgetState.feasibility === 'red' && 'Over Budget'}
                    </span>
                  </div>
                )}
              </div>

              {/* Tabs Navigation */}
              <nav className="tabs-bar">
                <button 
                  onClick={() => setActiveTab('timeline')} 
                  className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
                >
                  <ListTodo size={16} /> Cooking Timeline
                </button>
                <button 
                  onClick={() => setActiveTab('meals')} 
                  className={`tab-btn ${activeTab === 'meals' ? 'active' : ''}`}
                >
                  <Utensils size={16} /> Breakfast/Lunch/Dinner
                </button>
                <button 
                  onClick={() => setActiveTab('grocery')} 
                  className={`tab-btn ${activeTab === 'grocery' ? 'active' : ''}`}
                >
                  <ShoppingCart size={16} /> Grocery List
                </button>
                <button 
                  onClick={() => setActiveTab('budget')} 
                  className={`tab-btn ${activeTab === 'budget' ? 'active' : ''}`}
                >
                  <DollarSign size={16} /> Budget Analysis
                </button>
              </nav>

              {/* TAB CONTENT: Cooking Timeline */}
              {activeTab === 'timeline' && (
                <div className="glass-panel" style={{ animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.3rem' }}>Chronological Cooking Tasks</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tick off steps as you go</span>
                  </div>

                  {/* Todo checklist progress bar */}
                  <div className="budget-progress-bar" style={{ height: '6px', marginBottom: '2rem' }}>
                    <div 
                      className="budget-progress-fill green" 
                      style={{ width: `${todoProgressPercent}%` }} 
                    />
                  </div>

                  <div className="timeline">
                    {cookingPlan.todoList && cookingPlan.todoList.length > 0 ? (
                      cookingPlan.todoList.map((todo) => {
                        const isDone = completedTodoList.has(todo.id);
                        return (
                          <div 
                            key={todo.id} 
                            className={`timeline-item ${isDone ? 'completed' : ''}`}
                          >
                            <span className="timeline-marker" />
                            <div className="timeline-content">
                              {/* Checkbox trigger */}
                              <div 
                                onClick={() => handleToggleTodo(todo.id)}
                                className="custom-checkbox"
                              >
                                {isDone && <Check size={12} color="#fff" />}
                              </div>
                              <span className="timeline-time">{todo.time}</span>
                              <div className="timeline-body">
                                <h4 className="timeline-title">{todo.title}</h4>
                                <p className="timeline-desc">{todo.desc}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p style={{ color: 'var(--text-secondary)' }}>No timeline steps generated.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB CONTENT: Meals */}
              {activeTab === 'meals' && (
                <div className="meals-grid" style={{ animation: 'fadeIn 0.3s ease' }}>
                  {cookingPlan.meals && cookingPlan.meals.map((meal) => (
                    <div key={meal.id} className="glass-panel meal-card">
                      <span className={`meal-type-badge ${meal.type}`}>
                        {meal.type}
                      </span>
                      <h3 className="meal-title">{meal.title}</h3>
                      
                      <div className="meal-meta">
                        <div className="meal-meta-item">
                          <Clock size={14} />
                          <span>{meal.timeToPrep} prep</span>
                        </div>
                        <div className="meal-meta-item">
                          <User size={14} />
                          <span>Feeds {householdSize}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="meal-section-title">Ingredients needed</h4>
                        <ul className="meal-ingredients-list">
                          {meal.ingredients && meal.ingredients.map((ing, idx) => (
                            <li key={idx}>{ing}</li>
                          ))}
                        </ul>
                      </div>

                      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 className="meal-section-title">Quick Instructions</h4>
                        <p className="meal-instruction">{meal.instructions}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB CONTENT: Grocery List & Substitutions */}
              {activeTab === 'grocery' && (
                <div className="glass-panel" style={{ animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.3rem' }}>Your Interactive Grocery List</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Scaled for {householdSize} servings</span>
                  </div>

                  {/* Grocery shopping progress bar */}
                  <div className="budget-progress-bar" style={{ height: '6px', marginBottom: '2rem' }}>
                    <div 
                      className="budget-progress-fill green" 
                      style={{ width: `${groceryProgressPercent}%` }} 
                    />
                  </div>

                  {Object.keys(groupedGroceries).length > 0 ? (
                    Object.keys(groupedGroceries).map(category => (
                      <div key={category} className="grocery-category">
                        <h4 className="grocery-category-title">
                          <ShoppingCart size={16} color="var(--primary)" />
                          {category}
                        </h4>
                        
                        <div className="grocery-list">
                          {groupedGroceries[category].map((item) => {
                            const isBought = completedGroceries.has(item.id);
                            const showSwap = activeSubstitutions.has(item.id);
                            return (
                              <div 
                                key={item.id} 
                                className={`grocery-item ${isBought ? 'completed' : ''}`}
                              >
                                <div className="grocery-item-left">
                                  <div 
                                    onClick={() => handleToggleGrocery(item.id)}
                                    className="custom-checkbox"
                                  >
                                    {isBought && <Check size={12} color="#fff" />}
                                  </div>
                                  <span className="grocery-name">{item.name}</span>
                                  <span className="grocery-qty">{item.qty}</span>
                                </div>

                                <div className="grocery-item-right">
                                  {/* Substitution swap toggle */}
                                  <div className="substitution-box">
                                    <button 
                                      onClick={() => handleToggleSubstitution(item.id)}
                                      className="sub-toggle-btn"
                                      type="button"
                                    >
                                      {showSwap ? 'Hide Swap' : 'Need Swap?'}
                                    </button>
                                    {showSwap && (
                                      <span className="sub-display-text">
                                        Use: {item.substitution}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-secondary)' }}>No grocery list found.</p>
                  )}
                </div>
              )}

              {/* TAB CONTENT: Budget Analysis */}
              {activeTab === 'budget' && budgetState && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
                  <div className="glass-panel">
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>Budget Feasibility Report</h3>
                    
                    <div className="budget-status-card">
                      <div className="budget-metric">
                        <div className="budget-metric-label">Daily Budget Target</div>
                        <div className="budget-metric-value" style={{ color: 'var(--text-primary)' }}>
                          ${budgetGoal.toFixed(2)}
                        </div>
                      </div>

                      <div className="budget-metric" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="budget-metric-label">Estimated Grocery Total</div>
                        <div className="budget-metric-value" style={{ 
                          color: budgetState.feasibility === 'green' ? 'var(--success)' : (budgetState.feasibility === 'yellow' ? 'var(--warning)' : 'var(--danger)')
                        }}>
                          ${budgetState.estimatedTotalCost.toFixed(2)}
                        </div>
                      </div>

                      <div className="budget-metric" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="budget-metric-label">Cost per Person</div>
                        <div className="budget-metric-value" style={{ color: 'var(--text-secondary)' }}>
                          ${budgetState.costPerPerson.toFixed(2)}
                        </div>
                      </div>

                      {/* Visual budget comparison slider/bar */}
                      <div className="budget-progress-container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                          <span>Budget Utilized</span>
                          <span>{Math.round((budgetState.estimatedTotalCost / budgetGoal) * 100)}%</span>
                        </div>
                        <div className="budget-progress-bar">
                          <div 
                            className={`budget-progress-fill ${budgetState.feasibility}`}
                            style={{ width: `${Math.min(100, (budgetState.estimatedTotalCost / budgetGoal) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="budget-advice-box" style={{ 
                      borderLeftColor: budgetState.feasibility === 'green' ? 'var(--success)' : (budgetState.feasibility === 'yellow' ? 'var(--warning)' : 'var(--danger)')
                    }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <HelpCircle size={16} /> Feasibility Breakdown
                      </h4>
                      <p>{budgetState.feasibilityReason}</p>
                    </div>
                  </div>

                  {/* Money-saving suggestions */}
                  <div className="glass-panel">
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <TrendingDown size={20} color="var(--success)" /> 
                      Smart Cost-Saving Swaps & Tips
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {budgetState.savingTips && budgetState.savingTips.map((tip, index) => (
                        <div 
                          key={index}
                          style={{ 
                            background: 'rgba(16, 185, 129, 0.04)', 
                            border: '1px solid rgba(16, 185, 129, 0.1)', 
                            padding: '1rem', 
                            borderRadius: '12px',
                            display: 'flex',
                            gap: '0.75rem',
                            alignItems: 'flex-start'
                          }}
                        >
                          <CheckCircle2 size={16} color="var(--success)" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <footer className="footer">
        <p>Built as a premium AI Micro-App. Deployable on Vercel.</p>
      </footer>
    </div>
  );
}

export default App;
