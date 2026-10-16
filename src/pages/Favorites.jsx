import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, EmptyState } from '@/components/ui/fitness';
import { ArrowLeft, Dumbbell, Apple, Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Favorites() {
  const navigate = useNavigate();
  const [favs, setFavs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { setFavs((await base44.entities.Favorite.list('-created_date', 200)) || []); } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const remove = async (f) => {
    try { await base44.entities.Favorite.delete(f.id); setFavs((p) => p.filter((x) => x.id !== f.id)); } catch (e) { console.error(e); }
  };

  const exercises = useMemo(() => favs.filter((f) => f.type === 'exercise'), [favs]);
  const foods = useMemo(() => favs.filter((f) => f.type === 'food'), [favs]);

  const open = (f) => {
    if (f.type === 'exercise') navigate(`/exercise-history?name=${encodeURIComponent(f.name)}`);
    else navigate('/nutrition');
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-7 h-7 border-4 border-luxury-blue/30 border-t-luxury-blue rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen safe-pt px-4 pb-36 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"><ArrowLeft size={22} /></button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Favorites</h1>
          <p className="text-[11px] text-muted-foreground">{favs.length} saved</p>
        </div>
      </div>

      {!favs.length ? (
        <EmptyState icon={Star} title="No favorites yet" description="Tap the star on any exercise or food in Search to pin it here for quick access." />
      ) : (
        <>
          {exercises.length > 0 && (
            <div className="mb-5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 px-1">Exercises ({exercises.length})</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {exercises.map((f) => (
                  <Card key={f.id} className="flex items-center gap-3">
                    <button onClick={() => open(f)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <div className="w-10 h-10 rounded-xl bg-luxury-blue/15 flex items-center justify-center shrink-0"><Dumbbell size={18} className="text-luxury-blue" /></div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{f.name}</p><p className="text-[11px] text-muted-foreground">{f.subtitle}</p></div>
                    </button>
                    <button onClick={() => remove(f)} className="text-muted-foreground hover:text-luxury-red min-h-[44px] min-w-[40px] flex items-center justify-center"><X size={15} /></button>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {foods.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 px-1">Foods ({foods.length})</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {foods.map((f) => (
                  <Card key={f.id} className="flex items-center gap-3">
                    <button onClick={() => open(f)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <div className="w-10 h-10 rounded-xl bg-luxury-red/15 flex items-center justify-center shrink-0"><Apple size={18} className="text-luxury-red" /></div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{f.name}</p><p className="text-[11px] text-muted-foreground">{f.subtitle}</p></div>
                    </button>
                    <button onClick={() => remove(f)} className="text-muted-foreground hover:text-luxury-red min-h-[44px] min-w-[40px] flex items-center justify-center"><X size={15} /></button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}