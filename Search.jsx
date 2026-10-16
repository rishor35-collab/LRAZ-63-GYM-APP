import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { EXERCISES } from '@/lib/exerciseDatabase';
import { FOODS } from '@/lib/foodDatabase';
import { Card } from '@/components/ui/fitness';
import { Search as SearchIcon, Dumbbell, Apple, Calendar, ArrowLeft, X, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Search() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('exercises');
  const [programs, setPrograms] = useState([]);
  const [favs, setFavs] = useState({});

  useEffect(() => {
    base44.entities.TrainingProgram.list('-created_date', 100).then((p) => setPrograms(p || [])).catch(() => {});
    base44.entities.Favorite.list('-created_date', 500).then((f) => {
      const m = {}; (f || []).forEach((x) => { m[`${x.type}:${x.ref_id}`] = x; }); setFavs(m);
    }).catch(() => {});
  }, []);

  const toggleFav = async (type, ref_id, name, subtitle) => {
    const key = `${type}:${ref_id}`;
    if (favs[key]) {
      try { await base44.entities.Favorite.delete(favs[key].id); setFavs((p) => { const n = { ...p }; delete n[key]; return n; }); } catch (e) { console.error(e); }
    } else {
      try { const created = await base44.entities.Favorite.create({ type, ref_id, name, subtitle, created_at: new Date().toISOString() }); setFavs((p) => ({ ...p, [key]: created })); } catch (e) { console.error(e); }
    }
  };

  const query = q.toLowerCase().trim();

  const exResults = useMemo(() => {
    if (!query) return [];
    return EXERCISES.filter((e) => `${e.name} ${e.primary_muscle} ${e.muscle_group} ${(e.equipment || []).join(' ')}`.toLowerCase().includes(query)).slice(0, 30);
  }, [query]);

  const foodResults = useMemo(() => {
    if (!query) return [];
    return FOODS.filter((f) => `${f.name} ${f.category}`.toLowerCase().includes(query)).slice(0, 30);
  }, [query]);

  const progResults = useMemo(() => {
    if (!query) return [];
    return programs.filter((p) => (p.name || '').toLowerCase().includes(query)).slice(0, 20);
  }, [query, programs]);

  const tabs = [
    { key: 'exercises', label: 'Exercises', icon: Dumbbell, count: exResults.length },
    { key: 'foods', label: 'Foods', icon: Apple, count: foodResults.length },
    { key: 'programs', label: 'Programs', icon: Calendar, count: progResults.length },
  ];

  return (
    <div className="min-h-screen safe-pt px-4 pb-36 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"><ArrowLeft size={22} /></button>
        <h1 className="font-semibold text-lg">Search</h1>
      </div>

      <div className="relative mb-3">
        <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search exercises, foods, programs…"
          className="w-full glass rounded-xl pl-10 pr-10 py-3 text-sm outline-none min-h-[48px] focus:border-luxury-blue/50"
        />
        {q && <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"><X size={16} /></button>}
      </div>

      <div className="flex gap-2 mb-4">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all min-h-[40px]',
            tab === t.key ? 'bg-luxury-blue text-white' : 'glass text-muted-foreground'
          )}>
            <t.icon size={14} /> {t.label} {t.count > 0 && <span className="opacity-70">{t.count}</span>}
          </button>
        ))}
      </div>

      {!query && <p className="text-sm text-muted-foreground text-center py-10">Start typing to search across the exercise library, food database, and your programs.</p>}

      {query && tab === 'exercises' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {exResults.length === 0 && <Empty />}
          {exResults.map((e) => (
            <Card key={e.slug} className="flex items-center gap-3">
              <button onClick={() => navigate(`/exercise-history?name=${encodeURIComponent(e.name)}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <div className="w-10 h-10 rounded-xl bg-luxury-blue/15 flex items-center justify-center shrink-0"><Dumbbell size={18} className="text-luxury-blue" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{e.name}</p>
                  <p className="text-[11px] text-muted-foreground">{e.muscle_group} · {(e.equipment || []).join(', ')}</p>
                </div>
              </button>
              <button onClick={() => toggleFav('exercise', e.slug, e.name, `${e.muscle_group}`)} className={cn('min-h-[44px] min-w-[40px] flex items-center justify-center shrink-0', favs[`exercise:${e.slug}`] ? 'text-luxury-gold' : 'text-muted-foreground')}>
                <Star size={18} fill={favs[`exercise:${e.slug}`] ? 'currentColor' : 'none'} />
              </button>
            </Card>
          ))}
        </div>
      )}

      {query && tab === 'foods' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {foodResults.length === 0 && <Empty />}
          {foodResults.map((f, i) => (
            <Card key={i} className="flex items-center gap-3">
              <button onClick={() => navigate('/nutrition')} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <div className="w-10 h-10 rounded-xl bg-luxury-red/15 flex items-center justify-center shrink-0"><Apple size={18} className="text-luxury-red" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{f.name}</p>
                  <p className="text-[11px] text-muted-foreground">{f.category} · {f.calories} kcal · {f.protein_g}g protein</p>
                </div>
              </button>
              <button onClick={() => toggleFav('food', f.name, f.name, f.category)} className={cn('min-h-[44px] min-w-[40px] flex items-center justify-center shrink-0', favs[`food:${f.name}`] ? 'text-luxury-gold' : 'text-muted-foreground')}>
                <Star size={18} fill={favs[`food:${f.name}`] ? 'currentColor' : 'none'} />
              </button>
            </Card>
          ))}
        </div>
      )}

      {query && tab === 'programs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {progResults.length === 0 && <Empty />}
          {progResults.map((p) => (
            <button key={p.id} onClick={() => navigate(`/program/${p.id}`)} className="w-full text-left">
              <Card className="flex items-center gap-3 active:scale-[0.99] transition-transform">
                <div className="w-10 h-10 rounded-xl bg-luxury-blue/15 flex items-center justify-center shrink-0"><Calendar size={18} className="text-luxury-blue" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">{p.goal} · {p.split} · {p.days_per_week}d/wk</p>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const Empty = () => <p className="text-sm text-muted-foreground text-center py-10">No matches found.</p>;