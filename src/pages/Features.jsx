import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import {
  Dumbbell, Apple, Activity, TrendingUp, Target, Heart, Brain, Calendar, Bell,
  ListChecks, Moon, Sparkles, BarChart3, Shield, Palette, ArrowLeft,
} from 'lucide-react';

const FEATURES = [
  { icon: Dumbbell, title: 'Strength Programming', desc: 'Build periodized programs from templates, manual entry, or paste-from-text. Mesocycle blocks, double progression, warm-up planner, and deload logic — all deterministic.' },
  { icon: Activity, title: 'Live Workout Logger', desc: 'Track sets, reps, RPE/RIR, rest timers, estimated 1RM, PRs, and advanced set types (drop, AMRAP, cluster, supersets). Offline-first with auto-sync.' },
  { icon: Apple, title: 'Nutrition Logging', desc: '180+ food database, custom foods, saved meals, macro targets, live quantity scaling, and a full history with trends and adherence.' },
  { icon: Heart, title: 'Cardio & HR Zones', desc: 'Track runs, rides, and intervals with pace, distance, calories, and heart-rate zone calculators.' },
  { icon: TrendingUp, title: 'Progress Analytics', desc: 'Body composition, strength PRs, cardio performance, progress photos, and a deterministic monthly report.' },
  { icon: Target, title: 'Goal Journey', desc: 'Set a goal and track your weight trend, target date, and what contributed to your progress.' },
  { icon: Brain, title: 'Training Insights', desc: 'Volume landmarks, muscle frequency, plateau detection, progression suggestions, and recovery history.' },
  { icon: Moon, title: 'Recovery Science', desc: 'Log sleep, soreness, energy, and HRV to compute readiness and recovery scores.' },
  { icon: Bell, title: 'Live Notifications', desc: 'Deterministic reminders for training, fueling, recovery, habits, and weigh-ins — no AI, no credits.' },
  { icon: ListChecks, title: 'Habits & Streaks', desc: 'Build daily habits like hydration, sleep, and mobility with streak tracking.' },
  { icon: Calendar, title: 'Calendar & Weekly Planner', desc: 'Schedule workouts, duplicate weeks, and plan your next 7 days of training.' },
  { icon: BarChart3, title: 'Monthly Report', desc: 'A full deterministic summary of your training, nutrition, recovery, and progress.' },
  { icon: Palette, title: 'Themes & Customization', desc: 'Multiple luxury themes, accent colors, custom theme builder, OLED mode, and font choices.' },
  { icon: Shield, title: 'Privacy First', desc: 'Your data is yours. Export it anytime and control what stays private.' },
];

export default function Features() {
  const navigate = useNavigate();
  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-36">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg glass min-h-[44px] min-w-[44px] flex items-center justify-center"><ArrowLeft size={18} /></button>
        <div>
          <p className="text-xs text-muted-foreground tracking-wider uppercase">LRAZ 63</p>
          <h1 className="text-2xl font-bold tracking-tight">App Features</h1>
        </div>
      </div>

      <Card className="luxury-gradient border border-luxury-blue/30 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={18} className="text-luxury-blue" />
          <p className="font-semibold text-white">Your Performance OS</p>
        </div>
        <p className="text-xs text-white/70 leading-relaxed">Everything LRAZ 63 can do for you — elite strength programming, precise nutrition, recovery science, and live reminders. Deterministic, no AI credits.</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <Card key={i} className="flex items-start gap-3 p-3">
              <div className="w-10 h-10 rounded-xl bg-luxury-blue/15 text-luxury-blue flex items-center justify-center shrink-0"><Icon size={18} /></div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{f.desc}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}