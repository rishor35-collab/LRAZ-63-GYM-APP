import React, { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { Card } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';

export default function RestCountdown({ deadline, onSkip }) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    let interval;
    const update = () => {
      const seconds = Math.max(0, Math.ceil(((deadline || 0) - Date.now()) / 1000));
      setRemaining(seconds);
      if (!seconds) clearInterval(interval);
    };
    update();
    if (deadline > Date.now()) interval = setInterval(update, 1000);
    document.addEventListener('visibilitychange', update);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', update); };
  }, [deadline]);
  if (!remaining) return null;
  return <Card className="mb-4 border-primary/40 flex items-center justify-between gap-3" role="timer" aria-label="Rest timer">
    <div className="flex items-center gap-3"><Timer size={20} className="text-primary shrink-0" /><div>
      <p className="text-sm font-semibold tabular-nums">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</p>
      <p className="text-[10px] text-muted-foreground">Rest timer</p>
    </div></div>
    <Button size="sm" variant="ghost" onClick={onSkip}>Skip</Button>
  </Card>;
}