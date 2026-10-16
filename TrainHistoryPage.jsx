import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import TrainHistory from '@/components/train/TrainHistory';

export default function TrainHistoryPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen safe-pt px-4 pb-36 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"><ArrowLeft size={22} /></button>
        <div>
          <h1 className="font-semibold text-lg leading-tight">Training History</h1>
          <p className="text-[11px] text-muted-foreground">View and edit your past workouts</p>
        </div>
      </div>
      <TrainHistory />
    </div>
  );
}