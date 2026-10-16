import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ActionSelect({ label, value, options, onChange, className, placeholder = 'Select' }) {
  const [open, setOpen] = useState(false);
  const display = value != null && value !== '' ? String(value) : placeholder;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-11 min-h-[44px] rounded-lg glass border border-border bg-transparent px-3 text-sm flex items-center justify-between w-full"
      >
        <span className="truncate">{display}</span>
        <ChevronDown size={16} className="text-muted-foreground shrink-0" />
      </button>
      <Drawer open={open} onClose={() => setOpen(false)}>
        <DrawerContent className="max-w-md mx-auto">
          <DrawerHeader className="text-center">
            {label && <DrawerTitle>{label}</DrawerTitle>}
          </DrawerHeader>
          <div className="px-3 pb-6 space-y-1.5 max-h-[60vh] overflow-y-auto safe-pb">
            {options.map((o) => {
              const val = typeof o === 'object' && o !== null ? o.value : o;
              const lbl = typeof o === 'object' && o !== null ? o.label : o;
              const selected = String(val) === String(value);
              return (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => { onChange(val); setOpen(false); }}
                  className={cn(
                    'w-full min-h-[44px] flex items-center justify-between px-4 rounded-xl text-sm transition-all',
                    selected ? 'bg-luxury-blue/15 text-luxury-blue' : 'hover:bg-muted/40'
                  )}
                >
                  <span>{lbl}</span>
                  {selected && <Check size={16} />}
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export default ActionSelect;