import React from 'react';

export default function InstructionSection({ icon: Icon, title, iconColor = 'text-primary', items = [] }) {
  if (!items.length) return null;
  return <section className="min-w-0 rounded-2xl border border-border/40 bg-card p-3 sm:p-4 shadow-sm">
    <h3 className="mb-3 flex items-start gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {Icon && <Icon size={14} className={`${iconColor} mt-0.5 shrink-0`} />}<span className="min-w-0 break-words">{title}</span>
    </h3>
    <ul className="space-y-2.5">
      {items.map((item, index) => <li key={index} className="flex min-w-0 items-start gap-2 text-sm leading-relaxed text-foreground/80">
        <span aria-hidden="true" className="shrink-0 text-primary">•</span><span className="min-w-0 flex-1 whitespace-pre-line [overflow-wrap:anywhere]">{item}</span>
      </li>)}
    </ul>
  </section>;
}