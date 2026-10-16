import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Clean mobile bottom sheet for Fuel modules.
 *
 * Structural rules:
 * - Uses standard `fixed inset-0` — the global CSS in index.css automatically
 *   reserves 80px + safe-area at the bottom for the fixed Home/Menu nav on
 *   mobile, and reduces that to 0 when the keyboard opens. No double padding.
 * - Panel: one scroll area (overflow-y-auto), no nested scroll containers.
 * - z-50: above page content, below bottom nav (z-60) so nav stays visible.
 * - p-4 only for visual breathing room — the global CSS handles nav clearance.
 * - Desktop: md:max-h-[85vh] keeps the original desktop sheet behavior.
 */
export default function MobileSheet({ onClose, onBackdropClick, children, className }) {
  const handleBackdrop = onBackdropClick || onClose;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleBackdrop} />
      <div className={cn(
        'relative w-full max-w-md mx-auto glass-strong rounded-t-3xl p-4',
        'max-h-[90dvh] overflow-y-auto animate-fade-up',
        'md:max-h-[85vh]',
        className
      )}>
        {children}
      </div>
    </div>
  );
}