import React from 'react';
import { Clock, TrendingUp, Dumbbell, Trophy, StickyNote, ChevronRight } from 'lucide-react';
import { localDateStr } from '@/lib/utils';

export default function WorkoutHistoryCard({ session, summary, onOpen }) {
  return <button type="button" onClick={onOpen} className="glass rounded-2xl p-4 w-full text-left hover:border-primary/40">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1"><p className="font-semibold text-sm truncate">{session.name || 'Workout'}</p><p className="text-[11px] text-muted-foreground mt-1">{localDateStr(session.date)}{session.program_day_name ? ` · ${session.program_day_name}` : ''}{session.focus ? ` · ${session.focus}` : ''}</p></div>
      <ChevronRight size={16} className="text-muted-foreground mt-1" />
    </div>
    <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1"><Clock size={12} />{session.duration_minutes ? `${session.duration_minutes}m` : '—'}</span>
      <span className="flex items-center gap-1"><TrendingUp size={12} className="text-primary" />{Math.round(session.total_volume_kg || 0)}kg</span>
      <span className="flex items-center gap-1"><Dumbbell size={12} />{summary ? `${summary.exerciseCount} ex · ${summary.totalSets} sets` : 'Loading sets…'}</span>
      {session.pr_count > 0 && <span className="flex items-center gap-1 text-luxury-gold"><Trophy size={12} />{session.pr_count} PRs</span>}
      {(session.notes || summary?.hasNotes) && <span className="flex items-center gap-1 text-primary"><StickyNote size={12} />Notes</span>}
    </div>
  </button>;
}