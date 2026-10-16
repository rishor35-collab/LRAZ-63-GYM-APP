import React from 'react';

// Uses `fixed inset-0` so the global mobile CSS in index.css automatically
// reserves 80px + safe-area at the bottom for the fixed bottom nav on phones.
export default function FullScreenPage({ children }) {
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      <div className="max-w-md mx-auto w-full h-full flex flex-col">
        {children}
      </div>
    </div>
  );
}