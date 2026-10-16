import React, { useId } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function RecordField({ field, value, onChange, disabled }) {
  const id = useId();
  return (
    <div className={cn('space-y-2 min-w-0', (field.options || field.type === 'textarea') && 'col-span-full')}>
      <Label htmlFor={id} className="text-xs text-muted-foreground capitalize">{field.label}{field.required ? ' *' : ''}</Label>
      {field.options ? <div id={id} role="group" aria-label={field.label} className="flex flex-wrap gap-2">
        {field.options.map(option => { const val = typeof option === 'object' ? option.value : option; const label = typeof option === 'object' ? option.label : option; return <button type="button" key={val} disabled={disabled} aria-pressed={value === val} onClick={() => onChange(val)} className={cn('min-h-11 rounded-xl border px-3 text-xs font-medium', value === val ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-muted/30 text-muted-foreground')}>{label}</button>; })}
      </div> : field.type === 'textarea' ? <Textarea id={id} value={value} disabled={disabled} onChange={e => onChange(e.target.value)} rows={3} /> :
        <Input id={id} type={field.type || 'text'} inputMode={field.type === 'number' ? 'decimal' : undefined} min={field.min} max={field.max} step={field.step} required={field.required} disabled={disabled} value={value} onChange={e => onChange(e.target.value)} />}
    </div>
  );
}