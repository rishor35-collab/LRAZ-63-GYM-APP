import React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('glass rounded-2xl p-4', className)} {...props}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, className }) {
  return <h2 className={cn('text-lg font-semibold tracking-tight', className)}>{children}</h2>;
}

export function Stat({ label, value, unit, accent, sub }) {
  const accentColor = accent === 'red' ? 'text-luxury-red' : accent === 'blue' ? 'text-luxury-blue' : 'text-foreground';
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={cn('text-2xl font-bold tabular-nums', accentColor)}>
        {value}
        {unit && <span className="text-sm font-medium text-muted-foreground ml-0.5">{unit}</span>}
      </span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

export function Pill({ children, active, onClick, className }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all min-h-[44px] flex items-center',
        active
          ? 'bg-luxury-blue text-white glow-blue'
          : 'glass text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}

export function Ring({ value, size = 120, stroke = 10, label, sublabel, color = 'luxury-blue' }) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.min(100, Math.max(0, value || 0)) / 100) * circ;
  const colorClass = color === 'red' ? 'text-luxury-red' : color === 'gold' ? 'text-luxury-gold' : color === 'teal' ? 'text-luxury-teal' : 'text-luxury-blue';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/40" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className={cn(colorClass, 'transition-all duration-700')}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums">{Math.round(value || 0)}</span>
        {label && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>}
        {sublabel && <span className="text-[10px] text-muted-foreground">{sublabel}</span>}
      </div>
    </div>
  );
}

export function ConfidenceBadge({ level }) {
  const map = {
    'High Confidence': 'text-emerald-400 bg-emerald-500/10',
    'Moderate Confidence': 'text-luxury-gold bg-luxury-gold/10',
    'Low Confidence': 'text-orange-400 bg-orange-500/10',
    'Insufficient Data': 'text-muted-foreground bg-muted/20',
  };
  return <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', map[level] || map['Insufficient Data'])}>{level}</span>;
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mb-4"><Icon size={26} className="text-muted-foreground" /></div>}
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-xs">{description}</p>}
      {action}
    </div>
  );
}