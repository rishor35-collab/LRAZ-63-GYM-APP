import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Dumbbell, Apple, TrendingUp, Compass, User, Search, Star, Plus, Calendar, Activity, Target, Brain, Shield, Users, MessageCircle, BookOpen, ListChecks, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';

const MAIN = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/train', label: 'Train', icon: Dumbbell },
  { to: '/nutrition', label: 'Fuel', icon: Apple },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/community', label: 'Community', icon: Users },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
];

const TRAINING = [
  { to: '/exercises', label: 'Exercises', icon: BookOpen },
  { to: '/workout/new', label: 'Log Workout', icon: Plus },
  { to: '/program/new', label: 'Build Program', icon: Calendar },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/cardio', label: 'Cardio', icon: Activity },
  { to: '/goal-journey', label: 'Goal Journey', icon: Target },
];

const MORE = [
  { to: '/search', label: 'Search', icon: Search },
  { to: '/favorites', label: 'Favorites', icon: Star },
  { to: '/habits', label: 'Habits', icon: ListChecks },
  { to: '/coach', label: 'Training Insights', icon: Brain },
  { to: '/more', label: 'Explore All', icon: Compass },
  { to: '/privacy', label: 'Privacy & Data', icon: Shield },
];

const isActive = (pathname, to) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

export default function DesktopSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const go = (to) => navigate(to);

  const Item = ({ to, label, icon: Icon }) => {
    const active = isActive(pathname, to);
    return (
      <button
        onClick={() => go(to)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all min-h-[44px] text-left',
          active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
        )}
      >
        <Icon size={17} className={active ? 'text-primary' : 'text-muted-foreground'} />
        <span className="text-sm font-medium">{label}</span>
      </button>
    );
  };

  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-56 flex-col glass-strong border-r border-border/50 safe-pt z-30">
      <div className="px-5 py-5 flex items-center gap-2.5 shrink-0">
        <div className="w-10 h-10 rounded-xl luxury-gradient flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-xs">63</span>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground">LRAZ 63</p>
          <p className="text-sm font-semibold text-gradient-blue leading-tight">Performance OS</p>
        </div>
      </div>
      <div className="px-3 pb-3 shrink-0">
        <button onClick={() => navigate('/search')} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl glass text-muted-foreground text-sm min-h-[40px] hover:border-primary/30 transition-all">
          <Search size={15} />
          <span>Search anything…</span>
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-6 no-scrollbar">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mt-1 mb-1.5">Main</p>
        <div className="space-y-1 mb-4">
          {MAIN.map((m) => <Item key={m.to} {...m} />)}
        </div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-1.5">Training</p>
        <div className="space-y-1 mb-4">
          {TRAINING.map((m) => <Item key={m.to} {...m} />)}
        </div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-1.5">More</p>
        <div className="space-y-1">
          {MORE.map((m) => <Item key={m.to} {...m} />)}
        </div>
      </nav>
      <div className="px-3 pb-4 pt-3 border-t border-border/40 shrink-0">
        <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-muted/40 transition-all min-h-[44px]">
          <div className="w-9 h-9 rounded-full luxury-gradient flex items-center justify-center text-white font-bold text-xs shrink-0">
            {(user?.full_name || 'A').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold truncate">{user?.full_name || 'Athlete'}</p>
            <p className="text-[10px] text-muted-foreground">Premium</p>
          </div>
          <Sparkles size={14} className="text-primary shrink-0" />
        </button>
      </div>
    </aside>
  );
}