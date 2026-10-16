import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

export default function ResponsiveSheet({ onClose, title = 'Details', children, className, theme }) {
  const isLight = theme === 'porcelain';
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose?.(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            'responsive-sheet fixed inset-x-0 bottom-0 z-[81] mx-auto w-full max-w-xl min-w-0 max-h-[90dvh] overflow-y-auto overscroll-contain rounded-t-3xl border border-border bg-background text-foreground shadow-xl outline-none safe-pt md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-h-[85vh] md:rounded-2xl',
            isLight && 'force-porcelain',
            className
          )}
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          {/* Drag handle — visible on mobile only */}
          <div className="flex justify-center pt-2 pb-1 md:hidden">
            <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}