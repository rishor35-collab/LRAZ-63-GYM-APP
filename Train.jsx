import React, { useEffect, useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { BookOpen, Layers, History, Plus, Calendar, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
const TodayView = lazy(() => import('@/components/train/TodayView'));

export default function Train() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadPrograms(); }, []);

  const loadPrograms = async () => {
    try {
      const progs = await base44.entities.TrainingProgram.filter({}, { sort: '-created_date', limit: 50 });
      setPrograms(progs.items);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const hasProgram = programs.some((p) => !p.archived && !p.draft);

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-36">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Train</h1>

      {/* Hero — Today's Workout */}
      <Suspense fallback={<div className="py-16 text-center text-sm text-muted-foreground">Loading today's training…</div>}>
        <TodayView programs={programs} />
      </Suspense>

      {/* Navigation Tiles */}
      <div className="grid grid-cols-3 gap-3 mt-5">
        <NavTile icon={BookOpen} label="Exercises" onClick={() => navigate('/exercises')} />
        <NavTile icon={Layers} label="Programs" onClick={() => navigate('/programs')} />
        <NavTile icon={Activity} label="Cardio" onClick={() => navigate('/cardio')} />
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <NavTile icon={History} label="History" onClick={() => navigate('/train-history')} />
        <NavTile icon={Calendar} label="Calendar" onClick={() => navigate('/calendar')} />
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <Button variant="outline" className="glass min-h-[52px] font-medium" onClick={() => navigate('/workout/new')}><Plus size={18} /> Quick Log</Button>
        <Button variant="outline" className="glass min-h-[52px] font-medium" onClick={() => navigate('/cardio/session')}><Activity size={18} /> Quick Cardio</Button>
      </div>
    </div>
  );
}

const NavTile = React.memo(function NavTile({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className="glass rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-primary/30 transition-all min-h-[96px]">
      <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Icon size={20} /></div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
});