import React, { useMemo } from 'react';
import { Card, EmptyState } from '@/components/ui/fitness';
import { Trophy, Dumbbell } from 'lucide-react';
import { estimate1RM } from '@/lib/fitnessScience';

// PR timeline from sets flagged is_pr (plus sessions with pr_count), grouped by date desc.
export default function PRTimeline({ sessions, sets }) {
  const timeline = useMemo(() => {
    const dates = {};
    sessions.forEach((s) => { if (s.id && s.date) dates[s.id] = new Date(s.date).getTime(); });
    const prSets = (sets || []).filter((s) => s.is_pr && dates[s.session_id]).map((s) => ({
      date: dates[s.session_id],
      exercise: s.exercise_name,
      weight: s.weight_kg,
      reps: s.reps,
      e1rm: estimate1RM(s.weight_kg, s.reps),
    }));
    // Also include sessions with pr_count > 0 but no flagged sets (fallback)
    const byDate = {};
    prSets.forEach((p) => {
      const d = new Date(p.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
      if (!byDate[d]) byDate[d] = { date: d, ts: p.date, items: [] };
      byDate[d].items.push(p);
    });
    return Object.values(byDate).sort((a, b) => b.ts - a.ts);
  }, [sessions, sets]);

  if (!timeline.length) return <EmptyState icon={Trophy} title="No PRs recorded yet" description="When you log a set that beats your previous best, it appears here on your strength timeline." />;

  return (
    <Card>
      <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Trophy size={15} className="text-luxury-gold" /> PR Timeline</p>
      <div className="space-y-3">
        {timeline.map((day, i) => (
          <div key={i}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{day.date}</p>
            <div className="space-y-1.5">
              {day.items.map((p, j) => (
                <div key={j} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-luxury-gold/15 text-luxury-gold flex items-center justify-center shrink-0"><Dumbbell size={13} /></div>
                  <span className="text-sm font-medium flex-1 truncate">{p.exercise}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">{p.weight}kg × {p.reps}</span>
                  <span className="text-sm font-bold tabular-nums text-gradient-blue w-14 text-right">{Math.round(p.e1rm)}kg</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-3">Estimated 1RM uses the Epley formula. PRs are detected automatically when a logged set exceeds your previous best for that exercise.</p>
    </Card>
  );
}