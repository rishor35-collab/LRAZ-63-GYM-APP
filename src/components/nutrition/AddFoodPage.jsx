import React, { useState, useMemo } from 'react';
import { ChevronLeft, Search, ScanLine, Plus, Star, Minus, Check, ChevronRight, Layers, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FOODS, foodFactor, parseQty, isPer100g, defaultQty } from '@/lib/foodDatabase';
import FullScreenPage from '@/components/nutrition/FullScreenPage';
import { cn } from '@/lib/utils';

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-Workout', 'Post-Workout'];

export default function AddFoodPage({
  onClose, selectedMeal, setSelectedMeal,
  customFoods, favorites, toggleFavorite, addFood,
  recentFoods, savedMeals, onLogSavedMeal,
  onScan, onQuickAdd, onBuildMeal, onCopyDay, onCreateFood
}) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('search');
  const [detailFood, setDetailFood] = useState(null);
  const [toast, setToast] = useState(null);

  const allFoods = useMemo(() => [...(customFoods || []), ...FOODS], [customFoods]);
  const favNames = useMemo(() => new Set((favorites || []).map((f) => f.ref_id)), [favorites]);

  const searchResults = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return [];
    return allFoods.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 50);
  }, [search, allFoods]);

  const quickAdd = (food) => {
    addFood(food, defaultQty(food));
    setToast(`Added ${food.name}`);
    setTimeout(() => setToast(null), 1500);
  };

  if (detailFood) {
    return (
      <FoodDetailPage
        food={detailFood}
        onBack={() => setDetailFood(null)}
        onClose={onClose}
        selectedMeal={selectedMeal}
        setSelectedMeal={setSelectedMeal}
        addFood={addFood}
        isFavorite={favNames.has(detailFood.name)}
        onToggleFavorite={() => toggleFavorite(detailFood)}
      />
    );
  }

  const tabs = [
    { id: 'search', label: 'Search' },
    { id: 'recent', label: 'Recent' },
    { id: 'myfoods', label: 'My Foods' },
    { id: 'meals', label: 'Meals' },
  ];

  return (
    <FullScreenPage>
      {/* Header */}
      <div className="flex items-center px-2 pt-2 safe-pt shrink-0">
        <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-lg font-semibold flex-1 truncate">Add to {selectedMeal}</h2>
        <button onClick={onScan} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ScanLine size={20} />
        </button>
        <button onClick={onQuickAdd} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
          <Plus size={22} />
        </button>
      </div>

      {/* Search bar */}
      <div className="px-4 py-2 shrink-0">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); if (tab !== 'search') setTab('search'); }}
            placeholder="Search foods..."
            className="pl-9 h-11 w-full"
          />
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border px-2 overflow-x-auto no-scrollbar shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap min-h-[44px] flex items-center transition-colors',
              tab === t.id ? 'text-luxury-blue border-b-2 border-luxury-blue' : 'text-muted-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 min-h-0">
        {tab === 'search' && (
          <FoodList
            foods={searchResults}
            onPick={setDetailFood}
            onQuickAdd={quickAdd}
            favNames={favNames}
            emptyMessage={search ? 'No foods found. Try a different search.' : 'Start typing to search the food database.'}
          />
        )}
        {tab === 'recent' && (
          <FoodList
            foods={recentFoods}
            onPick={setDetailFood}
            onQuickAdd={quickAdd}
            favNames={favNames}
            emptyMessage="No recent foods yet. Foods you log will appear here for quick access."
          />
        )}
        {tab === 'myfoods' && (
          <>
            <FoodList
              foods={customFoods}
              onPick={setDetailFood}
              onQuickAdd={quickAdd}
              favNames={favNames}
              emptyMessage="No custom foods yet."
            />
            <button onClick={onCreateFood} className="w-full flex items-center justify-center gap-1.5 py-3 mt-3 text-sm font-medium text-luxury-blue min-h-[48px]">
              <Plus size={16} /> Create Food
            </button>
          </>
        )}
        {tab === 'meals' && (
          <>
            <SavedMealsList meals={savedMeals} onLog={(m) => { onLogSavedMeal(m); onClose(); }} />
            <div className="grid grid-cols-2 gap-2 mt-3 mb-4">
              <button onClick={onBuildMeal} className="flex items-center justify-center gap-1.5 py-3 rounded-xl glass text-sm font-medium min-h-[48px]">
                <Layers size={16} /> Build Meal
              </button>
              <button onClick={onCopyDay} className="flex items-center justify-center gap-1.5 py-3 rounded-xl glass text-sm font-medium min-h-[48px]">
                <Copy size={16} /> Copy Day
              </button>
            </div>
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-strong px-4 py-2 rounded-full text-xs font-medium animate-fade-up z-10 whitespace-nowrap">
          {toast}
        </div>
      )}
    </FullScreenPage>
  );
}

function FoodList({ foods, onPick, onQuickAdd, favNames, emptyMessage }) {
  if (!foods || foods.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-10 px-4">{emptyMessage}</p>;
  }
  return (
    <div>
      {foods.map((f) => (
        <div key={f.name} className="flex items-center gap-2 py-3 border-b border-border/40">
          <button onClick={() => onPick(f)} className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium truncate" dir="auto">{f.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isPer100g(f) ? `${f.calories} kcal / 100g` : `${f.calories} kcal / ${f.quantity}${f.unit}`}
            </p>
          </button>
          {favNames.has(f.name) && <Star size={14} className="text-luxury-gold fill-current shrink-0" />}
          <button
            onClick={() => onQuickAdd(f)}
            className="w-11 h-11 rounded-lg bg-luxury-blue/15 flex items-center justify-center shrink-0 active:bg-luxury-blue/25 transition-colors"
            aria-label={`Quick add ${f.name}`}
          >
            <Plus size={18} className="text-luxury-blue" />
          </button>
        </div>
      ))}
    </div>
  );
}

function SavedMealsList({ meals, onLog }) {
  if (!meals || meals.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-10 px-4">No saved meals yet.</p>;
  }
  return (
    <div>
      {meals.map((m) => (
        <button
          key={m.id}
          onClick={() => onLog(m)}
          className="w-full flex items-center gap-2 py-3 border-b border-border/40 text-left"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" dir="auto">{m.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {Math.round(m.total_calories || 0)} kcal · {(m.items || []).length} foods
            </p>
          </div>
          <ChevronRight size={18} className="text-muted-foreground shrink-0" />
        </button>
      ))}
    </div>
  );
}

function FoodDetailPage({ food, onBack, onClose, selectedMeal, setSelectedMeal, addFood, isFavorite, onToggleFavorite }) {
  const [qty, setQty] = useState('');
  const per100 = isPer100g(food);
  const dq = defaultQty(food);
  const q = qty !== '' ? parseQty(qty) : dq;
  const factor = foodFactor(food, q);
  const grams = per100 ? +(q * 100).toFixed(1) : null;

  const inc = () => setQty(String(+(q + 1).toFixed(2)));
  const dec = () => setQty(String(+Math.max(0.5, q - 1).toFixed(2)));

  const handleAdd = () => {
    addFood(food, qty !== '' ? qty : dq);
    onClose();
  };

  return (
    <FullScreenPage>
      {/* Header */}
      <div className="flex items-center px-2 pt-2 safe-pt shrink-0">
        <button onClick={onBack} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-lg font-semibold flex-1 truncate" dir="auto">{food.name}</h2>
        <button onClick={onToggleFavorite} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
          <Star size={20} className={isFavorite ? 'text-luxury-gold fill-current' : 'text-muted-foreground'} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {/* Amount */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-2">Amount</p>
          <div className="flex items-center gap-3">
            <button onClick={dec} className="w-12 h-12 rounded-xl glass flex items-center justify-center shrink-0 active:bg-muted/40 transition-colors">
              <Minus size={20} />
            </button>
            <Input
              type="text"
              inputMode="decimal"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder={String(dq)}
              className="flex-1 h-14 text-center text-2xl tabular-nums font-bold min-w-0"
              autoFocus
            />
            <button onClick={inc} className="w-12 h-12 rounded-xl glass flex items-center justify-center shrink-0 active:bg-muted/40 transition-colors">
              <Plus size={20} />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {per100 ? `${q} × 100g = ${grams}g` : `${q} ${food.unit || ''}`}
          </p>
        </div>

        {/* Nutrition preview */}
        <div className="glass rounded-xl p-4 mb-6">
          <div className="text-center mb-4">
            <p className="text-4xl font-bold tabular-nums text-luxury-red">
              {Math.round((food.calories || 0) * factor)}
            </p>
            <p className="text-xs text-muted-foreground">kcal</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold tabular-nums text-luxury-blue">{+((food.protein_g || 0) * factor).toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground">Protein g</p>
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums">{+((food.carbs_g || 0) * factor).toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground">Carbs g</p>
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums">{+((food.fat_g || 0) * factor).toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground">Fat g</p>
            </div>
          </div>
        </div>

        {/* Meal selector */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Meal</p>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {MEALS.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMeal(m)}
                className={cn(
                  'text-xs px-3 py-2 rounded-full border whitespace-nowrap min-h-[40px] flex items-center transition-colors',
                  selectedMeal === m ? 'border-luxury-blue bg-luxury-blue/15 text-luxury-blue' : 'border-border text-muted-foreground'
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky bottom action */}
      <div className="px-4 pt-3 pb-4 safe-pb border-t border-border/40 shrink-0">
        <Button
          className="w-full bg-luxury-blue glow-blue min-h-[52px] text-base font-semibold"
          onClick={handleAdd}
        >
          <Check size={18} /> Add to {selectedMeal}
        </Button>
      </div>
    </FullScreenPage>
  );
}