import React from 'react';
import { Zap, AlertTriangle, Shield, TrendingUp, Target } from 'lucide-react';
import InstructionSection from '@/components/exercises/InstructionSection';

export default function ExerciseTechniqueTab({ exercise }) {
  const sections = [
    { title: 'Coaching Cues', icon: Zap, items: exercise.coaching_cues || [] },
    { title: 'Common Mistakes', icon: AlertTriangle, iconColor: 'text-luxury-red', items: exercise.mistakes || exercise.common_mistakes || [] },
    { title: 'Safety Tips', icon: Shield, items: exercise.safety || exercise.safety_tips || [] },
    { title: 'Progressions', icon: TrendingUp, items: exercise.progressions || [] },
    { title: 'Regressions', icon: Target, items: exercise.regressions || [] },
  ].filter((section) => section.items.length);
  return <div className="grid min-w-0 grid-cols-1 items-start gap-3 md:grid-cols-2">
    {sections.map((section) => <InstructionSection key={section.title} {...section} />)}
    {!sections.length && <p className="rounded-2xl border border-border/50 bg-card p-4 text-sm text-muted-foreground">No technique details available for this exercise yet.</p>}
  </div>;
}