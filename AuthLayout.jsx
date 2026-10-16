import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 safe-pt safe-pb">
      <div className="w-full max-w-md">
        {/* Branded splash header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl luxury-gradient border border-primary/30 mb-4 glow-blue">
            <span className="text-white font-bold text-lg">63</span>
          </div>
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-1">LRAZ 63</p>
          <h2 className="text-sm font-semibold text-gradient-blue tracking-wide">Performance OS</h2>
          <p className="text-[11px] text-muted-foreground mt-3 tracking-wide">Plan. Track. Improve.</p>
        </div>

        {/* Page icon + title */}
        <div className="text-center mb-6">
          {Icon && (
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
              <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>}
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}