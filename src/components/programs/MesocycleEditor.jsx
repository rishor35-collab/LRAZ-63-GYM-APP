import React from 'react';
import { Card } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Layers } from 'lucide-react';

const PHASES = ['Foundation', 'Hypertrophy', 'Strength', 'Power', 'Cutting', 'Lean Gaining', 'Recomposition', 'Maintenance', 'Deload', 'Competition Prep', 'Post-Event Recovery', 'Transition'];

// Mesocycle block editor: divides a program into phased blocks.
export default function MesocycleEditor({ blocks, onChange }) {
  const list = blocks || [];
  const update = (i, patch) => onChange(list.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const add = () => onChange([...list, { name: `Block ${list.length + 1}`, weeks: 4, phase: 'Hypertrophy', target_rpe: 7 }]);
  const remove = (i) => onChange(list.filter((_, j) => j !== i));
  return (
    <Card>
      <p className="text-sm font-semibold mb-1 flex items-center gap-2"><Layers size={15} className="text-luxury-blue" /> Mesocycle Blocks</p>
      <p className="text-[11px] text-muted-foreground mb-3">Divide your program into phased blocks (e.g. Accumulation → Intensification → Deload). Leave empty for a single-phase program.</p>
      <div className="space-y-2">
        {list.map((b, i) => (
          <div key={i} className="glass rounded-xl p-2.5 space-y-2">
            <div className="flex items-center gap-2">
              <Input value={b.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Block name" className="glass h-9 text-sm flex-1" />
              <button onClick={() => remove(i)} className="text-muted-foreground hover:text-luxury-red min-h-[40px] min-w-[36px] flex items-center justify-center"><Trash2 size={14} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] uppercase">Weeks</Label>
                <Input type="number" inputMode="numeric" value={b.weeks} onChange={(e) => update(i, { weeks: Number(e.target.value) || 0 })} className="glass h-9 text-center" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] uppercase">Phase</Label>
                <select value={b.phase} onChange={(e) => update(i, { phase: e.target.value })} className="glass h-9 w-full rounded-md text-xs px-1 bg-transparent border border-input">
                  {PHASES.map((p) => <option key={p} value={p} className="bg-background">{p}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] uppercase">RPE</Label>
                <Input type="number" inputMode="numeric" value={b.target_rpe} onChange={(e) => update(i, { target_rpe: Number(e.target.value) || 0 })} className="glass h-9 text-center" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <Button variant="outline" className="w-full glass border-dashed mt-2 min-h-[40px]" onClick={add}><Plus size={14} /> Add Block</Button>
    </Card>
  );
}