import React from 'react';
import { Card } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';

export default function WidgetStatus({ title, loading, error, hasData, refreshing, onRetry, children }) {
  if (error && !hasData) return <Card className="min-h-[150px] flex flex-col justify-center gap-3"><p role="alert" className="text-sm text-destructive">Could not load {title.toLowerCase()}.</p><p className="text-xs text-muted-foreground">{error.message}</p><Button variant="outline" disabled={refreshing} onClick={onRetry}>Try again</Button></Card>;
  if (loading && !hasData) return <Card aria-busy="true" role="status" className="min-h-[150px] flex items-center justify-center"><p className="text-xs text-muted-foreground">Loading {title.toLowerCase()}…</p></Card>;
  return <>{error && <div role="status" className="mb-2 text-xs text-muted-foreground">Could not refresh; showing the last loaded data. <button onClick={onRetry} disabled={refreshing} className="min-h-11 underline">Retry</button></div>}{children}</>;
}