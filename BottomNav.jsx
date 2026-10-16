import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Menu, X, Dumbbell, Apple, TrendingUp, Compass, User, Plus, Calendar, Activity, Target, Search, Star, ListChecks, Shield, Users, MessageCircle, BookOpen, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/train', label: 'Train', icon: Dumbbell },
  { to: '/nutrition', label: 'Nutrition', icon: Apple },
  { to: '/more', label: 'More', icon: Compass },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const go = (to) => { setOpen(false); navigate(to); };

  const NavItem = ({ to, label, icon: Icon }) => {
    const active = isActive(location.pathname, to);
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
    <>
      <nav className="fixed bottom-0 inset-x-0 z-[60] px-4 pb-3 pt-1 pointer-events-none safe-pb md:hidden">
        <div className="max-w-md mx-auto pointer-events-auto">
          <div className="glass-strong rounded-2xl px-2 py-1.5 flex items-center justify-between shadow-2xl relative">
            {NAV_ITEMS.slice(0, 2).map((item) => {
              const active = isActive(location.pathname, item.to);
              return (
                <button key={item.to} onClick={() => go(item.to)}
                  className={cn('flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all flex-1 min-h-[44px]', active ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>
                  <item.icon size={22} strokeWidth={active ? 2.6 : 2} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
            <button onClick={() => setOpen(true)} aria-label="Quick actions"
              className="flex flex-col items-center justify-center -mt-7 shrink-0 px-1">
              <span className="w-14 h-14 rounded-full btn-gold text-primary-foreground shadow-xl flex items-center justify-center glow-blue border-2 border-background">
                <Plus size={26} strokeWidth={2.6} />
              </span>
              <span className="text-[9px] text-muted-foreground mt-0.5">Menu</span>
            </button>
            {NAV_ITEMS.slice(2, 4).map((item) => {
              const active = isActive(location.pathname, item.to);
              return (
                <button key={item.to} onClick={() => go(item.to)}
                  className={cn('flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all flex-1 min-h-[44px]', active ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>
                  <item.icon size={22} strokeWidth={active ? 2.6 : 2} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="fixed inset-y-0 left-0 z-[70] w-72 max-w-[82%] glass-strong border-r border-border/50 flex flex-col safe-pt md:hidden"
            >
              <div className="px-5 py-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl luxury-gradient border border-primary/40 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-xs">63</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] tracking-widest uppercase text-muted-foreground">LRAZ 63</p>
                    <p className="text-sm font-semibold text-gradient-blue leading-tight">Performance OS</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground"><X size={20} /></button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 pb-6 no-scrollbar">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-1.5">Main</p>
                <div className="space-y-1 mb-4">
                  {MAIN.map((m) => <NavItem key={m.to} {...m} />)}
                </div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-1.5">Training</p>
                <div className="space-y-1 mb-4">
                  {TRAINING.map((m) => <NavItem key={m.to} {...m} />)}
                </div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-1.5">More</p>
                <div className="space-y-1">
                  {MORE.map((m) => <NavItem key={m.to} {...m} />)}
                </div>
                <p className="text-center text-[10px] text-muted-foreground mt-5">LRAZ 63 · Performance OS</p>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}