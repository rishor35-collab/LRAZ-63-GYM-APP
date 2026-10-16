import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, EmptyState } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Bell, BellRing, ChevronRight, Dumbbell, Apple, Activity, Scale, Heart, Target, Brain, Calendar, Droplet, Moon, BarChart3 } from 'lucide-react';
import { computeReminders, fireBrowserNotifications, loadReminderData } from '@/lib/reminders';
import { cn } from '@/lib/utils';

const ICONS = { Dumbbell, Apple, Activity, Scale, Heart, Target, Brain, Calendar, Droplet, Moon, BarChart3 };

export default function Notifications() {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [perm, setPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await loadReminderData();
      const r = computeReminders(data);
      setReminders(r);
      fireBrowserNotifications(r);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const enableNotifications = async () => {
    if (typeof Notification === 'undefined') return;
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === 'granted') {
      new Notification('LRAZ 63', { body: 'Notifications enabled. We will remind you to train, fuel, and stay on track.' });
      fireBrowserNotifications(reminders);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-36">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-muted-foreground tracking-wider uppercase">Reminders</p>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="min-h-[44px]"><ChevronRight size={18} /></Button>
      </div>

      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-luxury-blue/15 text-luxury-blue flex items-center justify-center">{perm === 'granted' ? <BellRing size={20} /> : <Bell size={20} />}</div>
            <div>
              <p className="text-sm font-semibold">Browser notifications</p>
              <p className="text-[11px] text-muted-foreground">{perm === 'granted' ? 'Enabled — reminders appear on your device.' : perm === 'denied' ? 'Blocked in browser settings.' : perm === 'unsupported' ? 'Not supported on this device.' : 'Get reminded to train, fuel and log.'}</p>
            </div>
          </div>
          {perm !== 'granted' && perm !== 'unsupported' && <Button size="sm" className="bg-luxury-blue glow-blue min-h-[40px]" onClick={enableNotifications}>Enable</Button>}
        </div>
      </Card>

      {loading ? (
        <div className="py-16 text-center text-muted-foreground text-sm">Checking your day…</div>
      ) : reminders.length === 0 ? (
        <EmptyState icon={BellRing} title="You're all caught up" description="No reminders right now. Everything you need to do today is done." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {reminders.map((r) => {
            const Icon = ICONS[r.icon] || Bell;
            const accent = r.priority === 'high' ? 'text-luxury-red bg-luxury-red/10' : r.priority === 'medium' ? 'text-luxury-blue bg-luxury-blue/10' : 'text-muted-foreground bg-muted/30';
            return (
              <Card key={r.id} className="flex items-start gap-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', accent)}><Icon size={18} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{r.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{r.body}</p>
                  <Button size="sm" className="mt-2 min-h-[40px] bg-luxury-blue glow-blue" onClick={() => navigate(r.action)}>{r.cta}</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground text-center mt-6 leading-relaxed">Reminders are calculated on your device from your data — no AI, no credits. Notifications fire live throughout the day while the app is open (or installed on your home screen), once per reminder per day. Enable browser notifications above to receive them on your device.</p>
    </div>
  );
}