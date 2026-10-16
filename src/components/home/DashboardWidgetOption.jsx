import React from 'react';
import { ChevronUp, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export default function DashboardWidgetOption({ item, definition, onChange, onMove, first, last }) {
  return <div className="glass rounded-xl p-3 space-y-2">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0"><p className="text-sm font-medium">{definition.label}</p><p className="text-[10px] text-muted-foreground">{definition.category}{item.added ? item.enabled ? ' · Enabled' : ' · Disabled' : ''}</p></div>
      {item.added ? <Switch aria-label={`Enable ${definition.label}`} checked={item.enabled} onCheckedChange={enabled => onChange({ enabled })} /> : <Button size="sm" variant="outline" onClick={() => onChange({ added: true, enabled: true })}><Plus size={16} /> Add</Button>}
    </div>
    {item.added && <div className="flex flex-wrap items-center gap-1">
      <Button size="sm" variant="ghost" aria-label={`Move ${definition.label} up`} disabled={first} onClick={() => onMove(-1)}><ChevronUp size={16} /></Button>
      <Button size="sm" variant="ghost" aria-label={`Move ${definition.label} down`} disabled={last} onClick={() => onMove(1)}><ChevronDown size={16} /></Button>
      <Button size="sm" variant="outline" onClick={() => onChange({ size: item.size === 'compact' ? 'standard' : 'compact' })}>{item.size === 'compact' ? 'Compact view' : 'Standard view'}</Button>
      <Button size="sm" variant="ghost" aria-label={`Remove ${definition.label}`} onClick={() => onChange({ added: false })}><Trash2 size={16} /></Button>
    </div>}
  </div>;
}