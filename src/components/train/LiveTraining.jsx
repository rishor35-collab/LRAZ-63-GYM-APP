import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Play, Plus, Activity, Clock, TrendingUp, Dumbbell } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function LiveTraining() {
  const navigate = useNavigate();
  const [active, setActive] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('lraz_active_workout');
      if (raw) setActive(JSON.parse(raw));
    } catch (e) {}
    base44.entities.WorkoutSession.filter({ status: 'completed' }, { sort: '-date', limit: 3 }).then((page) => setRecent(page.items)).catch(() => {});
  }, []);

  return (
    <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-2">
      {active ? (
        <Card className="luxury-gradient border border-luxury-blue/40 cursor-pointer" onClick={() => navigate('/workout/new')}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-luxury-blue/20 flex items-center justify-center shrink-0 animate-pulse-glow">
              <Play size={22} className="text-luxury-blue" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">Resume Workout</p>
              <p className="text-xs text-white/60 truncate">{active.session?.name || active.name || 'Active session'} · {active.blocks?.length || 0} exercises</p>
            </div>
            <Button size="sm" className="bg-luxury-blue glow-blue shrink-0 min-h-[40px]">Resume</Button>
          </div>
        </Card>
      ) : (
        <Card className="luxury-gradient border border-luxury-blue/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-luxury-blue/20 flex items-center justify-center shrink-0">
              <Dumbbell size={22} className="text-luxury-blue" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Start a Workout</p>
              <p className="text-xs text-white/60">Quick log or launch a program day</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button className="bg-luxury-blue glow-blue min-h-[44px]" onClick={() => navigate('/workout/new')}><Plus size={16} /> Quick Log</Button>
            <Button variant="outline" className="glass min-h-[44px]" onClick={() => navigate('/train')}><Activity size={16} /> Programs</Button>
          </div>
        </Card>
      )}

      {recent.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Recent Workouts</p>
          <div className="space-y-2">
            {recent.map((s) => (
              <Card key={s.id} className="p-3 cursor-pointer hover:border-luxury-blue/40 transition-all" onClick={() => navigate('/train')}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{s.name || 'Workout'}</p>
                    <p className="text-[11px] text-muted-foreground">{(s.date || '').slice(0, 10)}</p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground shrink-0">
                    {s.duration_minutes && <span className="flex items-center gap-1"><Clock size={11} /> {s.duration_minutes}m</span>}
                    {s.total_volume_kg ? <span className="flex items-center gap-1"><TrendingUp size={11} className="text-luxury-blue" /> {Math.round(s.total_volume_kg)}kg</span> : null}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}