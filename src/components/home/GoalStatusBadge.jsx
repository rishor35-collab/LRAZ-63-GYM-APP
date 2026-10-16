import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = {
  'Ahead': 'text-emerald-400 bg-emerald-500/10',
  'On Track': 'text-luxury-blue bg-luxury-blue/10',
  'Slightly Behind': 'text-luxury-gold bg-luxury-gold/10',
  'Needs Attention': 'text-luxury-red bg-luxury-red/10',
};

// Deterministic goal-status badge with a "Why?" explanation.
export default function GoalStatusBadge({ status }) {
  const [open, setOpen] = useState(false);
  if (!status) return null;
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 min-h-[32px]', COLORS[status.status] || COLORS['Needs Attention'])}>
        {status.status} <Info size={11} />
      </button>
      {open && <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{status.label} — {status.detail}</p>}
    </div>
  );
}