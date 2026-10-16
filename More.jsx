import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/fitness';
import {
  Dumbbell, Plus, Calendar, Activity, History, Apple, TrendingUp, Target,
  Share2, Brain, User, Sparkles, Compass, Award, Heart, Shield, ListChecks, BarChart3, Search, Star, Users, MessageCircle, Smartphone, BookOpen,
} from 'lucide-react';

const GROUPS = [
  {
    title: 'Training',
    items: [
      { to: '/train', icon: Dumbbell, label: 'Train', desc: 'Today\'s workout & programs' },
      { to: '/exercises', icon: BookOpen, label: 'Exercise Library', desc: 'Browse all exercises' },
      { to: '/workout/new', icon: Plus, label: 'Log Workout', desc: 'Start a live session' },
      { to: '/program/new', icon: Sparkles, label: 'Build Program', desc: 'Templates, manual, or text' },
      { to: '/calendar', icon: Calendar, label: 'Calendar', desc: 'Scheduled workouts' },
      { to: '/cardio', icon: Activity, label: 'Cardio Session', desc: 'Track a run or ride' },
      { to: '/cardio/history', icon: History, label: 'Cardio History', desc: 'Past sessions and PRs' },
      { to: '/hr-zones', icon: Heart, label: 'HR Zones', desc: 'Heart rate training zones' },
    ],
  },
  {
    title: 'Nutrition',
    items: [
      { to: '/nutrition', icon: Apple, label: 'Daily Nutrition', desc: 'Log meals and track macros' },
      { to: '/nutrition/history', icon: History, label: 'Nutrition History', desc: 'Past intake and trends' },
    ],
  },
  {
    title: 'Progress & Recovery',
    items: [
      { to: '/progress', icon: TrendingUp, label: 'Progress', desc: 'Body, performance, photos, PRs' },
      { to: '/goal-journey', icon: Target, label: 'Goal Journey', desc: 'Weight trend and contributors' },
      { to: '/coach', icon: Brain, label: 'Training Insights', desc: 'Volume landmarks, plateaus' },
      { to: '/report', icon: BarChart3, label: 'Monthly Report', desc: 'Full monthly summary' },
      { to: '/habits', icon: ListChecks, label: 'Habits', desc: 'Daily habits and streaks' },
      { to: '/search', icon: Search, label: 'Search', desc: 'Find exercises, foods, programs' },
      { to: '/favorites', icon: Star, label: 'Favorites', desc: 'Starred exercises and foods' },
    ],
  },
  {
    title: 'Social',
    items: [
      { to: '/community', icon: Users, label: 'Community', desc: 'Discover and follow athletes' },
      { to: '/messages', icon: MessageCircle, label: 'Messages', desc: 'Private conversations' },
      { to: '/share', icon: Share2, label: 'Share Profile', desc: 'Post your athlete card' },
    ],
  },
  {
    title: 'Account',
    items: [
      { to: '/profile', icon: User, label: 'Profile & Goals', desc: 'Details, goals, appearance' },
      { to: '/features', icon: Sparkles, label: 'App Features', desc: 'Tour everything LRAZ 63 can do' },
      { to: '/widgets', icon: Smartphone, label: 'Widgets', desc: 'Home-screen widgets' },
      { to: '/privacy', icon: Shield, label: 'Privacy & Data', desc: 'Export data and controls' },
    ],
  },
];

export default function More() {
  return (
    <div className="min-h-screen safe-pt px-4 pt-6 pb-36 max-w-md mx-auto">
      <div className="mb-6">
        <p className="text-xs text-muted-foreground tracking-wider uppercase">Browse</p>
        <h1 className="text-3xl font-bold tracking-tight">Explore</h1>
        <p className="text-sm text-muted-foreground mt-1">Every section of your performance OS.</p>
      </div>

      {GROUPS.map((g) => (
        <div key={g.title} className="mb-6">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2.5 px-1">{g.title}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {g.items.map(({ to, icon: Icon, label, desc }) => (
              <Link key={to} to={to}>
                <Card className="flex items-center gap-3 active:scale-[0.99] transition-transform hover:border-primary/30">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{desc}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}

      <p className="text-center text-[10px] text-muted-foreground mt-4">LRAZ 63 · Performance OS</p>
    </div>
  );
}