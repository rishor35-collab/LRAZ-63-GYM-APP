import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Card, EmptyState } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, X, Plus, Check, Users, Calendar, Trophy } from 'lucide-react';
import { cn, localDateStr, localDayOffset } from '@/lib/utils';
import * as feed from '@/lib/activityFeed';
import { ensureMyProfile } from '@/lib/social';

const CHALLENGE_TYPES = [
  { id: 'workout_count', label: 'Workout Count', unit: 'workouts', target: 12 },
  { id: 'volume', label: 'Total Volume', unit: 'kg', target: 10000 },
  { id: 'cardio_distance', label: 'Cardio Distance', unit: 'km', target: 50 },
  { id: 'calories_burned', label: 'Calories Burned', unit: 'kcal', target: 5000 },
  { id: 'streak', label: 'Workout Streak', unit: 'days', target: 14 },
  { id: 'custom', label: 'Custom', unit: '', target: 10 },
];

export default function ChallengeList({ refreshKey }) {
  const { user } = useAuth();
  const [me, setMe] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const myProfile = await ensureMyProfile();
      setMe(myProfile);
      const list = await feed.listChallenges(50);
      setChallenges((list || []).filter((c) => c.status === 'active'));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const join = async (c) => { await feed.joinChallenge(c, me); load(); };
  const leave = async (c) => { await feed.leaveChallenge(c, me); load(); };

  if (loading) return <div className="flex justify-center py-10"><div className="w-7 h-7 border-4 border-luxury-blue/30 border-t-luxury-blue rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-3">
      <Button className="w-full bg-luxury-blue glow-blue" onClick={() => setCreating(true)}><Plus size={16} /> Create Challenge</Button>
      {challenges.length === 0 ? (
        <EmptyState icon={Target} title="No active challenges" description="Create a challenge and invite friends to compete." />
      ) : (
        challenges.map((c) => {
          const uid = user?.id || me?.user_id;
          const joined = (c.participant_ids || []).includes(uid);
          const isCreator = c.creator_id === uid;
          const daysLeft = c.end_date ? Math.max(0, Math.ceil((new Date(c.end_date + 'T23:59:59').getTime() - Date.now()) / 86400000)) : null;
          return (
            <Card key={c.id} className="p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{c.name}</p>
                  {c.description && <p className="text-[11px] text-muted-foreground mt-0.5">{c.description}</p>}
                </div>
                <div className="w-8 h-8 rounded-lg bg-luxury-blue/15 text-luxury-blue flex items-center justify-center shrink-0"><Trophy size={15} /></div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground mb-2.5">
                <span className="flex items-center gap-1"><Target size={11} /> {c.target_value} {c.unit}</span>
                <span className="flex items-center gap-1"><Users size={11} /> {(c.participant_ids || []).length} joined</span>
                {daysLeft != null && <span className="flex items-center gap-1"><Calendar size={11} /> {daysLeft}d left</span>}
              </div>
              <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                {(c.participant_names || []).slice(0, 5).map((n, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full glass">{n}</span>
                ))}
                {(c.participant_ids || []).length > 5 && <span className="text-[10px] text-muted-foreground">+{(c.participant_ids || []).length - 5}</span>}
              </div>
              {isCreator ? (
                <p className="text-[11px] text-luxury-blue font-medium text-center">Your challenge</p>
              ) : joined ? (
                <Button size="sm" variant="outline" className="w-full glass" onClick={() => leave(c)}>Leave Challenge</Button>
              ) : (
                <Button size="sm" className="w-full bg-luxury-blue glow-blue" onClick={() => join(c)}><Check size={14} /> Join Challenge</Button>
              )}
            </Card>
          );
        })
      )}
      {creating && <CreateChallengeSheet onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load(); }} me={me} />}
    </div>
  );
}

function CreateChallengeSheet({ onClose, onCreated, me }) {
  const [type, setType] = useState('workout_count');
  const [form, setForm] = useState({ name: '', description: '', target_value: 12, unit: 'workouts', duration_days: 30 });
  const [saving, setSaving] = useState(false);

  const selectType = (t) => {
    setType(t.id);
    setForm((f) => ({ ...f, target_value: t.target, unit: t.unit }));
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const today = localDateStr();
      const end = localDayOffset(form.duration_days || 30);
      await feed.createChallenge({
        name: form.name.trim(), description: form.description.trim() || undefined,
        type, target_value: Number(form.target_value) || 1, unit: form.unit || '',
        start_date: today, end_date: end,
      }, me);
      onCreated();
    } catch (e) { console.error(e); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-strong rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">New Challenge</h3>
          <Button variant="ghost" size="sm" onClick={onClose}><X size={18} /></Button>
        </div>
        <div className="space-y-3">
          <div><Label className="text-[10px] uppercase text-muted-foreground">Challenge Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. 30-Day Workout Streak" className="glass h-10" /></div>
          <div><Label className="text-[10px] uppercase text-muted-foreground">Description (optional)</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What's the challenge?" className="glass h-10" /></div>
          <div>
            <Label className="text-[10px] uppercase text-muted-foreground">Type</Label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar mt-1 pb-1">
              {CHALLENGE_TYPES.map((t) => (
                <button key={t.id} onClick={() => selectType(t)} className={cn('text-xs px-3 py-2 rounded-full whitespace-nowrap min-h-[36px] transition-all', type === t.id ? 'bg-luxury-blue text-white' : 'glass text-muted-foreground')}>{t.label}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label className="text-[10px] uppercase text-muted-foreground">Target</Label><Input type="number" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })} className="glass h-10 text-center tabular-nums" /></div>
            <div><Label className="text-[10px] uppercase text-muted-foreground">Unit</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="glass h-10 text-center" /></div>
            <div><Label className="text-[10px] uppercase text-muted-foreground">Days</Label><Input type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} className="glass h-10 text-center tabular-nums" /></div>
          </div>
          <Button className="w-full bg-luxury-blue glow-blue min-h-[44px]" onClick={save} disabled={saving || !form.name.trim()}>{saving ? 'Creating…' : <><Trophy size={16} /> Create Challenge</>}</Button>
        </div>
      </div>
    </div>
  );
}