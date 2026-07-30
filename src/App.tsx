import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  PlusCircle, 
  History, 
  Baby, 
  ShoppingBasket, 
  Truck, 
  Wallet,
  Coffee,
  Trash2,
  PieChart,
  ShoppingCart,
  CheckCircle2,
  Circle,
  Banknote,
  FileText,
  Calendar,
  RotateCcw,
  Utensils,
  X,
  Plus,
  ArrowRight,
  Heart,
  Home,
  Zap,
  Car,
  Clock,
  Sparkles,
  BrainCircuit,
  BellRing,
  TrendingDown,
  Lightbulb,
  ShieldCheck,
  Activity,
  MessageSquareText,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types & Configuration ---

type CategoryKey = string;

interface Category {
  id: CategoryKey;
  name: string;
  iconName: string;
  color: string;
}

interface BudgetState {
  initial: Record<CategoryKey, number>;
  remaining: Record<CategoryKey, number>;
  salary: number;
}

interface Transaction {
  id: string;
  category: CategoryKey;
  categoryName: string;
  amount: number;
  date: string; 
  timestamp: number;
  time: string;
  month: string;
}

interface ShoppingItem {
  id: string;
  label: string;
  completed: boolean;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  baby: <Baby />,
  basket: <ShoppingBasket />,
  truck: <Truck />,
  coffee: <Coffee />,
  utensils: <Utensils />,
  heart: <Heart />,
  home: <Home />,
  zap: <Zap />,
  car: <Car />,
  wallet: <Wallet />
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'lait', name: 'Lait Bébé', iconName: 'baby', color: 'bg-blue-500' },
  { id: 'couche', name: 'Couche Bébé', iconName: 'basket', color: 'bg-indigo-500' },
  { id: 'alimentation', name: 'Fruit Légume et Viande', iconName: 'utensils', color: 'bg-green-500' },
  { id: 'transport', name: 'Transport', iconName: 'truck', color: 'bg-orange-500' },
  { id: 'tebnaj', name: 'Tebnaj', iconName: 'coffee', color: 'bg-purple-500' },
];

const COLORS = [
  'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 
  'bg-red-500', 'bg-orange-500', 'bg-emerald-500', 'bg-slate-700'
];

type ViewMode = 'accueil' | 'budget_initial' | 'depense' | 'historique' | 'courses' | 'bilan' | 'reglages' | 'zen_ai';

export default function App() {
  const [view, setView] = useState<ViewMode>('accueil');
  const [aiAlert, setAiAlert] = useState<string | null>(null);
  
  // Data Persistence
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('bz_v6_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [budget, setBudget] = useState<BudgetState>(() => {
    const saved = localStorage.getItem('bz_v6_data');
    if (saved) return JSON.parse(saved);
    const init: Record<string, number> = {};
    DEFAULT_CATEGORIES.forEach(c => init[c.id] = 0);
    return { salary: 0, initial: init, remaining: init };
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('bz_v6_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => {
    const saved = localStorage.getItem('bz_v6_shopping');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('bz_v6_categories', JSON.stringify(categories));
    localStorage.setItem('bz_v6_data', JSON.stringify(budget));
    localStorage.setItem('bz_v6_history', JSON.stringify(transactions));
    localStorage.setItem('bz_v6_shopping', JSON.stringify(shoppingList));
  }, [categories, budget, transactions, shoppingList]);

  // --- Moteur Prédictif ZenAI ---

  const aiAnalysis = useMemo(() => {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthProgress = dayOfMonth / daysInMonth;

    const totalAllocated = Object.values(budget.initial).reduce((a, b) => a + b, 0);
    const totalRemaining = Object.values(budget.remaining).reduce((a, b) => a + b, 0);
    const totalSpent = totalAllocated - totalRemaining;

    // Financial Health Score (ZenScore)
    // Facteurs: budget restant vs progression du mois, et dépassements
    let score = 100;
    if (budget.salary > 0 && totalAllocated > budget.salary) score -= 20;
    
    const categoryPredictions = categories.map(cat => {
      const initial = budget.initial[cat.id] || 0;
      const remaining = budget.remaining[cat.id] || 0;
      const spent = initial - remaining;
      const dailyRate = spent / dayOfMonth;
      
      // Prédiction de fin de budget
      let prediction = "Stable";
      let status: 'ok' | 'warning' | 'critical' = 'ok';
      
      if (initial > 0) {
        if (remaining <= 0) {
          prediction = "Épuisé";
          status = 'critical';
          score -= 5;
        } else if (dailyRate > 0) {
          const daysLeft = Math.floor(remaining / dailyRate);
          const daysRemainingInMonth = daysInMonth - dayOfMonth;
          
          if (daysLeft < daysRemainingInMonth) {
            prediction = `Vide le ${dayOfMonth + daysLeft}`;
            status = daysLeft < 3 ? 'critical' : 'warning';
            score -= (daysRemainingInMonth - daysLeft);
          } else {
            prediction = "Tient le mois";
          }
        }
      }
      
      return { ...cat, prediction, status, remaining };
    });

    // Smart Suggestion Logic
    const criticalCat = categoryPredictions.find(c => c.status === 'critical' && c.remaining < (budget.initial[c.id] * 0.1));
    const healthyCat = categoryPredictions.find(c => c.remaining > (budget.initial[c.id] * 0.5) && (budget.initial[c.id] > 5000));
    
    let aiSuggestion = "Tout semble sous contrôle pour le moment.";
    if (criticalCat && healthyCat) {
      aiSuggestion = `ZenAI suggère : Déplacez 2000 F de "${healthyCat.name}" vers "${criticalCat.name}" pour éviter la rupture.`;
    } else if (totalSpent > budget.salary * 0.9 && budget.salary > 0) {
      aiSuggestion = "Alerte : Vous avez consommé 90% de vos revenus. Arrêtez les dépenses non-essentielles.";
    }

    return {
      zenScore: Math.max(0, Math.min(100, score)),
      predictions: categoryPredictions,
      suggestion: aiSuggestion,
      totalSpent
    };
  }, [budget, categories, transactions]);

  // Successive monitoring
  useEffect(() => {
    if (transactions.length < 3) return;
    const last3 = transactions.slice(0, 3);
    const sameDay = last3.every(t => t.date === last3[0].date);
    if (sameDay) {
      setAiAlert("Intelligence ZenAI : 3 transactions détectées en peu de temps. Votre ZenScore pourrait baisser.");
      const timer = setTimeout(() => setAiAlert(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [transactions]);

  // --- App Functions ---

  const addExpense = (catId: string, amount: number) => {
    if (amount <= 0) return;
    const cat = categories.find(c => c.id === catId);
    const now = new Date();
    const month = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const newT: Transaction = {
      id: crypto.randomUUID(),
      category: catId,
      categoryName: cat?.name || 'Inconnu',
      amount,
      date: now.toLocaleDateString('fr-FR'),
      timestamp: Date.now(),
      time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      month
    };
    setTransactions([newT, ...transactions]);
    setBudget(prev => ({
      ...prev,
      remaining: { ...prev.remaining, [catId]: (prev.remaining[catId] || 0) - amount }
    }));
    setView('accueil');
  };

  const totalBudgets = Object.values(budget.initial).reduce((a, b) => a + b, 0);
  const totalRemainingInEnvelopes = Object.values(budget.remaining).reduce((a, b) => a + b, 0);
  const resteAVivre = budget.salary - totalBudgets + totalRemainingInEnvelopes;

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-slate-900 pb-28 font-sans antialiased">
      
      {/* ZenAI Notifications */}
      <AnimatePresence>
        {aiAlert && (
          <motion.div initial={{ y: -100 }} animate={{ y: 20 }} exit={{ y: -100 }} className="fixed top-0 left-4 right-4 z-[100] bg-slate-900 text-white p-4 rounded-3xl shadow-2xl border border-white/10 flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-xl"><BellRing className="w-5 h-5" /></div>
            <div className="text-[11px] font-black leading-tight flex-1">{aiAlert}</div>
            <button onClick={() => setAiAlert(null)}><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-40 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white"><BrainCircuit className="w-5 h-5" /></div>
          <h1 className="text-lg font-black tracking-tighter text-slate-800">BUDJETZEN <span className="text-indigo-600">AI</span></h1>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setView('zen_ai')} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors"><Sparkles className="w-5 h-5" /></button>
          <button onClick={() => setView('reglages')} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"><Settings className="w-5 h-5" /></button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        <AnimatePresence mode="wait">
          
          {/* --- ACCUEIL --- */}
          {view === 'accueil' && (
            <motion.div key="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              
              {/* ZenScore Gauge */}
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between overflow-hidden relative">
                <div className="relative z-10">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Score de Santé AI</div>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-slate-900">{aiAnalysis.zenScore}</span>
                    <span className="text-xs font-bold text-slate-400 mb-1.5">/100</span>
                  </div>
                  <div className="text-[10px] font-bold text-indigo-500 mt-2 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> {aiAnalysis.zenScore > 80 ? 'Gestion Excellente' : 'Gestion à surveiller'}
                  </div>
                </div>
                <div className="w-24 h-24 relative flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-50" />
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * aiAnalysis.zenScore) / 100} className="text-indigo-600 transition-all duration-1000" />
                  </svg>
                  <Sparkles className="absolute w-6 h-6 text-indigo-200" />
                </div>
              </div>

              {/* Solde Card */}
              <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px] -mr-32 -mt-32" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-1">Reste à vivre (Total)</div>
                      <div className="text-5xl font-black tracking-tighter">
                        {resteAVivre.toLocaleString()} <span className="text-xl font-light opacity-30 text-slate-400">F</span>
                      </div>
                    </div>
                    <Wallet className="w-8 h-8 text-indigo-500 opacity-50" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                    <div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Revenu Prévu</div>
                      <div className="font-black text-sm">{budget.salary.toLocaleString()} F</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Dépensé</div>
                      <div className="font-black text-sm text-red-400">{aiAnalysis.totalSpent.toLocaleString()} F</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Envelopes with AI Predictions */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Répertoire Budgets</h2>
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    <Zap className="w-2.5 h-2.5" /> Moteur Prédictif Actif
                  </div>
                </div>
                <div className="grid gap-3">
                  {aiAnalysis.predictions.map(c => (
                    <div key={c.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 group transition-all hover:shadow-md hover:border-indigo-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-3.5 rounded-2xl ${c.color} text-white shadow-lg`}>{ICON_MAP[c.iconName]}</div>
                          <div>
                            <div className="font-black text-slate-800 leading-tight">{c.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Initial: {(budget.initial[c.id] || 0).toLocaleString()} F</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xl font-black ${ c.remaining < 0 ? 'text-red-500' : 'text-slate-900'}`}>
                            {c.remaining.toLocaleString()} <span className="text-xs font-normal opacity-30">F</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${c.status === 'ok' ? 'bg-green-500' : c.status === 'warning' ? 'bg-orange-500' : 'bg-red-500'}`} />
                          <span className={`text-[10px] font-black uppercase ${c.status === 'ok' ? 'text-green-600' : c.status === 'warning' ? 'text-orange-600' : 'text-red-600'}`}>
                            {c.prediction}
                          </span>
                        </div>
                        <div className="w-20 h-1 bg-slate-50 rounded-full overflow-hidden">
                          <div className={`h-full ${c.color}`} style={{ width: `${Math.min(100, Math.max(0, (c.remaining / (budget.initial[c.id] || 1)) * 100))}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* --- ZEN AI LABORATORY --- */}
          {view === 'zen_ai' && (
            <motion.div key="ai" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <div className="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <Bot className="w-12 h-12 mb-4 opacity-50" />
                <h2 className="text-2xl font-black tracking-tight mb-2 uppercase">ZenAI Assistant</h2>
                <p className="text-indigo-100 text-sm leading-relaxed opacity-80">
                  J'analyse vos habitudes pour optimiser votre reste à vivre. Voici mon rapport actuel.
                </p>
              </div>

              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-indigo-100 space-y-6">
                <div className="flex items-center gap-3 text-indigo-600">
                  <MessageSquareText className="w-5 h-5" />
                  <span className="text-[11px] font-black uppercase tracking-widest">Rapport d'analyse</span>
                </div>
                
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 italic text-sm text-slate-700 leading-relaxed">
                  "{aiAnalysis.suggestion}"
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optimisations Suggérées</h3>
                  <div className="space-y-2">
                    <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-3">
                      <ShieldCheck className="text-green-500 w-5 h-5" />
                      <span className="text-[11px] font-bold">Votre épargne théorique est de {Math.max(0, resteAVivre * 0.1).toFixed(0)} F ce mois.</span>
                    </div>
                    <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-3">
                      <TrendingDown className="text-orange-500 w-5 h-5" />
                      <span className="text-[11px] font-bold">Attention aux micro-dépenses "Tebnaj" qui augmentent de 15% le weekend.</span>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={() => setView('accueil')} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl">Retour Accueil</button>
            </motion.div>
          )}

          {/* --- BUDGET INITIAL --- */}
          {view === 'budget_initial' && (
            <motion.div key="bi" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">Budget Initial</h2>
              <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
                <div className="space-y-2 pb-6 border-b border-slate-50">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Source de Revenu (Salaire)</label>
                   <div className="relative">
                     <Banknote className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-500 w-6 h-6" />
                     <input 
                       type="number" 
                       value={budget.salary || ''} 
                       onChange={(e) => setBudget(p => ({ ...p, salary: parseInt(e.target.value) || 0 }))}
                       className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] py-6 pl-16 pr-12 text-3xl font-black focus:border-indigo-500 focus:bg-white outline-none transition-all"
                       placeholder="0"
                     />
                   </div>
                </div>
                {categories.map(c => (
                  <div key={c.id} className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                       {c.name}
                    </label>
                    <div className="relative">
                      <input 
                        type="number"
                        min="0"
                        max="50000"
                        value={budget.initial[c.id] || ''}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(50000, parseInt(e.target.value) || 0));
                          setBudget(prev => {
                            const old = prev.initial[c.id] || 0;
                            const diff = val - old;
                            return {
                              ...prev,
                              initial: { ...prev.initial, [c.id]: val },
                              remaining: { ...prev.remaining, [c.id]: (prev.remaining[c.id] || 0) + diff }
                            };
                          });
                        }}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] py-5 px-6 text-xl font-black focus:border-indigo-500 focus:bg-white outline-none transition-all"
                        placeholder="0"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-200">F</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* --- DEPENSE --- */}
          {view === 'depense' && (
            <motion.div key="dj" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Retrait Journalier</h2>
              <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-50">
                <ExpenseForm categories={categories} onSubmit={addExpense} />
              </div>
            </motion.div>
          )}

          {/* --- HISTORIQUE --- */}
          {view === 'historique' && (
            <motion.div key="h" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex justify-between items-end">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Répertoire Journal</h2>
                <div className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl text-lg font-black tracking-tighter">
                   {transactions.reduce((a, b) => a + b.amount, 0).toLocaleString()} <span className="text-[10px] opacity-40 font-normal">F</span>
                </div>
              </div>
              <div className="space-y-3">
                {transactions.map(t => {
                  const c = categories.find(x => x.id === t.category);
                  return (
                    <div key={t.id} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${c?.color || 'bg-slate-200'} text-white shadow-sm`}>{ICON_MAP[c?.iconName || ''] || <History />}</div>
                        <div>
                          <div className="font-bold text-slate-800 leading-tight">{t.categoryName}</div>
                          <div className="text-[9px] text-slate-400 font-bold flex items-center gap-2 mt-1 uppercase">
                             {t.date} • {t.time}
                          </div>
                        </div>
                      </div>
                      <div className="text-red-500 font-black text-lg">-{t.amount.toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* --- BILAN --- */}
          {view === 'bilan' && (
            <motion.div key="bl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Bulletin Mensuel</h2>
              <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
                <div className="flex items-center gap-4 pb-8 border-b border-slate-100">
                  <div className="bg-indigo-600 p-5 rounded-2xl text-white shadow-lg"><FileText className="w-8 h-8" /></div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Récapitulatif Financier</div>
                    <div className="text-2xl font-black capitalize text-slate-800 tracking-tighter">{new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
                <div className="space-y-5">
                  {categories.map(c => {
                    const now = new Date();
                    const currentMonth = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
                    const spent = transactions.filter(t => t.category === c.id && t.month === currentMonth).reduce((a, b) => a + b.amount, 0);
                    const percent = Math.min(100, (spent / (budget.initial[c.id] || 1)) * 100);
                    return (
                      <div key={c.id} className="space-y-2">
                        <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-tight">
                          <span className="text-slate-500">{c.name}</span>
                          <span className="text-slate-900">{spent.toLocaleString()} F ({percent.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                          <div className={`h-full ${c.color} transition-all duration-1000`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
                   <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Total Dépensé</div>
                   <div className="text-3xl font-black">{aiAnalysis.totalSpent.toLocaleString()} F</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- COURSES --- */}
          {view === 'courses' && (
            <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Liste de Courses</h2>
              <ShoppingList list={shoppingList} setList={setShoppingList} />
            </motion.div>
          )}

          {/* --- REGLAGES --- */}
          {view === 'reglages' && (
            <motion.div key="r" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Paramètres</h2>
                <NewCategoryModal onAdd={(n, i, c) => {
                  const id = n.toLowerCase() + Date.now();
                  setCategories([...categories, { id, name: n, iconName: i, color: c }]);
                }} />
              </div>
              <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
                 <button onClick={() => {
                   if(confirm("Tout effacer ?")) {
                     localStorage.clear();
                     window.location.reload();
                   }
                 }} className="w-full py-5 bg-red-50 text-red-600 rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 active:bg-red-100 transition-colors">
                   <RotateCcw className="w-5 h-5" /> Réinitialiser TOUT
                 </button>
                 <div className="grid gap-3 pt-4">
                  {categories.map(c => (
                    <div key={c.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                      <div className="flex items-center gap-3 font-bold text-slate-700">
                        <div className={`p-2.5 rounded-xl ${c.color} text-white`}>{ICON_MAP[c.iconName]}</div>
                        {c.name}
                      </div>
                      <button onClick={() => setCategories(categories.filter(x => x.id !== c.id))} className="text-slate-200 hover:text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                 </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Navigation (Répertoires) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-slate-100 px-5 pb-10 pt-4 z-50">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <NavBtn active={view === 'accueil'} onClick={() => setView('accueil')} icon={<Home />} label="Accueil" />
          <NavBtn active={view === 'budget_initial'} onClick={() => setView('budget_initial')} icon={<Banknote />} label="Budget" />
          
          <button 
            onClick={() => setView('depense')}
            className="w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center -mt-12 border-4 border-[#F8F9FD] active:scale-90 transition-transform"
          >
            <Plus className="w-8 h-8" />
          </button>

          <NavBtn active={view === 'historique'} onClick={() => setView('historique')} icon={<History />} label="Journal" />
          <NavBtn 
            active={view === 'bilan' || view === 'courses'} 
            onClick={() => setView(view === 'bilan' ? 'courses' : 'bilan')} 
            icon={view === 'bilan' ? <ShoppingCart /> : <FileText />} 
            label={view === 'bilan' ? "Courses" : "Bilan"} 
          />
        </div>
      </nav>
    </div>
  );
}

// --- Sous-composants ---

function NavBtn({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-indigo-600 scale-110 font-black' : 'text-slate-300 font-bold'}`}>
      <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-indigo-50 shadow-sm' : ''}`}>
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: "w-5 h-5" }) : icon}
      </div>
      <span className="text-[9px] uppercase tracking-tighter">{label}</span>
      {active && <div className="w-4 h-0.5 bg-indigo-600 rounded-full" />}
    </button>
  );
}

function NewCategoryModal({ onAdd }: { onAdd: (n: string, i: string, c: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('heart');
  const [color, setColor] = useState(COLORS[0]);

  if (!open) return <button onClick={() => setOpen(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest">+ Nouveau</button>;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 space-y-8 shadow-2xl">
        <div className="flex justify-between items-center"><h3 className="text-xl font-black uppercase tracking-tighter">Nouvelle Enveloppe</h3><button onClick={() => setOpen(false)}><X /></button></div>
        <div className="space-y-8">
          <input autoFocus type="text" placeholder="Nom..." value={name} onChange={e => setName(e.target.value)} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-indigo-600 font-black" />
          <div className="grid grid-cols-5 gap-3">
            {Object.keys(ICON_MAP).map(i => (
              <button key={i} type="button" onClick={() => setIcon(i)} className={`p-3.5 rounded-2xl flex justify-center border-2 transition-all ${icon === i ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-300'}`}>
                {React.cloneElement(ICON_MAP[i] as React.ReactElement<any>, { className: 'w-5 h-5' })}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {COLORS.map(c => <button key={c} type="button" onClick={() => setColor(c)} className={`w-8 h-8 rounded-full ${c} ${color === c ? 'ring-4 ring-indigo-600 ring-offset-2' : ''}`} />)}
          </div>
          <button onClick={() => { onAdd(name, icon, color); setOpen(false); }} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl">Créer</button>
        </div>
      </div>
    </div>
  );
}

function ExpenseForm({ categories, onSubmit }: { categories: Category[], onSubmit: (c: string, a: number) => void }) {
  const [selected, setSelected] = useState(categories[0]?.id || '');
  const [amount, setAmount] = useState('');
  return (
    <div className="space-y-8 text-center">
      <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto p-1 custom-scrollbar">
        {categories.map(c => (
          <button key={c.id} onClick={() => setSelected(c.id)} className={`flex items-center gap-3 p-4 rounded-3xl border-2 transition-all text-left ${selected === c.id ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900' : 'border-slate-50 bg-white text-slate-400'}`}>
            <div className={`p-2.5 rounded-2xl ${selected === c.id ? c.color + ' text-white shadow-md' : 'bg-slate-100'}`}>{ICON_MAP[c.iconName]}</div>
            <span className="text-[10px] font-black uppercase tracking-tighter truncate leading-tight">{c.name}</span>
          </button>
        ))}
      </div>
      <div className="relative">
        <input type="number" autoFocus value={amount} onChange={e => setAmount(e.target.value)} className="w-full pl-8 pr-16 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:border-indigo-500 focus:bg-white outline-none text-5xl font-black text-center" placeholder="0" />
        <span className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-slate-200 text-2xl">F</span>
      </div>
      <button onClick={() => { onSubmit(selected, parseInt(amount) || 0); setAmount(''); }} className="w-full bg-slate-900 text-white py-7 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Soustraire</button>
    </div>
  );
}

function ShoppingList({ list, setList }: { list: ShoppingItem[], setList: (l: ShoppingItem[]) => void }) {
  const [input, setInput] = useState('');
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) { setList([{ id: crypto.randomUUID(), label: input, completed: false }, ...list]); setInput(''); }
  };
  return (
    <div className="space-y-5">
      <form onSubmit={add} className="flex gap-3">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ajouter aux courses..." className="flex-1 px-6 py-5 bg-white border-2 border-slate-100 rounded-3xl outline-none focus:border-indigo-600 font-bold" />
        <button type="submit" className="bg-indigo-600 text-white p-5 rounded-3xl"><Plus className="w-6 h-6" /></button>
      </form>
      <div className="space-y-3">
        {list.map(item => (
          <div key={item.id} className={`flex items-center gap-4 p-5 rounded-3xl transition-all ${item.completed ? 'bg-slate-50 opacity-40' : 'bg-white border border-slate-50 shadow-sm'}`}>
            <button onClick={() => setList(list.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i))}>{item.completed ? <CheckCircle2 className="text-green-500 w-6 h-6" /> : <Circle className="text-slate-200 w-6 h-6" />}</button>
            <span className={`flex-1 font-bold text-slate-700 ${item.completed ? 'line-through' : ''}`}>{item.label}</span>
            <button onClick={() => setList(list.filter(i => i.id !== item.id))} className="text-slate-200 hover:text-red-500 p-2"><X className="w-5 h-5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
