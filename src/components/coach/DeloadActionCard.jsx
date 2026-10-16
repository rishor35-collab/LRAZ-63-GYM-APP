import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Play, X, SlidersHorizontal } from 'lucide-react';
import { detectDeload } from '@/lib/performanceAnalytics';
import { cn, localDateStr } from '@/lib/utils';

// Surfaces a deterministic deload recommendation with Start / Customize / Ignore actions.
const DISMISS_KEY = 'deloadDismissed';
const todayStr = () => localDateStr();

export default function DeloadActionCard({ weeklyVolume, recovery }) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => {
    try { const t = JSON.parse(localStorage.getItem(DISMISS_KEY) || '0'); return t && Date.now() - t < 7 * 86400000; } catch (e) { return false; }
  });
  const [customizing, setCustomizing] = useState(false);
  const [pct, setPct] = useState(60);
  const deload = useMemo(() => detectDeload({ weeklyVolume, recovery }), [weeklyVolume, recovery]);

  if (!deload.recommended || dismissed) return null;

  const startDeload = async (percent) => {
    try {
      await base44.entities.ScheduledWorkout.create({
        date: todayStr(), title: 'Deload Week', focus: 'Deload',
        source: 'manual', completed: false,
        notes: `Reduced-volume deload at ~${percent}% of recent weekly load. Prioritize recovery and technique.`,
      });
    } catch (e) { console.error(e); }
    navigate('/workout/new');
  };
  const ignore = () => { try { localStorage.setItem(DISMISS_KEY, JSON.stringify(Date.now())); } catch (e) {} setDismissed(true); };

  return (
    <Card className="mb-4 border-luxury-gold/40 bg-luxury-gold/5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-luxury-gold/15 text-luxury-gold flex items-center justify-center shrink-0"><AlertTriangle size={18} /></div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Deload recommended</p>
          <ul className="text-[11px] text-muted-foreground leading-relaxed mt-1 space-y-0.5 list-disc list-inside">
            {deload.reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      </div>

      {customizing ? (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground">Deload volume (% of recent weekly load):</p>
          <div className="flex gap-2">
            {[50, 60, 70].map((p) => (
              <button key={p} onClick={() => setPct(p)} className={cn('flex-1 py-2 rounded-lg text-sm font-semibold min-h-[44px]', pct === p ? 'bg-luxury-blue text-white' : 'glass text-muted-foreground')}>{p}%</button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 bg-luxury-blue min-h-[44px]" onClick={() => startDeload(pct)}><Play size={14} /> Start {pct}%</Button>
            <Button size="sm" variant="ghost" className="min-h-[44px]" onClick={() => setCustomizing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 bg-luxury-blue min-h-[44px]" onClick={() => startDeload(60)}><Play size={14} /> Start Deload</Button>
          <Button size="sm" variant="outline" className="flex-1 glass min-h-[44px]" onClick={() => setCustomizing(true)}><SlidersHorizontal size={14} /> Customize</Button>
          <Button size="sm" variant="ghost" className="min-h-[44px]" onClick={ignore}><X size={14} /> Ignore</Button>
        </div>
      )}
    </Card>
  );
}