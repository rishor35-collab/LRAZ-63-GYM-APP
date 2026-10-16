import React from 'react';
import { User, Settings, Share2, Check, Target, BadgeCheck, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function SocialProfileHeader({ user, form, stats, editing, saving, isPrivate, onEditToggle, onSave, onShare }) {
  const name = user?.full_name || 'Athlete';
  const handle = `@${form.username || (user?.email ? user.email.split('@')[0] : 'athlete')}`;
  const bio = form.primary_goal ? `${form.primary_goal} · ${form.experience_level || 'Athlete'}` : form.experience_level || 'Athlete';

  return (
    <div className="relative mb-4">
      {/* Cover banner — professional luxury gradient with subtle sheen */}
      <div className="h-32 rounded-b-3xl luxury-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--foreground)) 0%, transparent 40%)' }} />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-luxury-blue/60 to-transparent" />
      </div>

      {/* Avatar + identity */}
      <div className="px-4 -mt-12 flex flex-col items-center text-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full luxury-gradient border-4 border-background flex items-center justify-center shadow-xl glow-blue">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <User size={40} className="text-white" />
            )}
          </div>
          {isPrivate && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-background border-2 border-border flex items-center justify-center" title="Private profile">
              <Lock size={13} className="text-luxury-gold" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-2">
          <h1 className="text-xl font-bold tracking-tight">{name}</h1>
          <BadgeCheck size={18} className="text-luxury-blue" />
        </div>
        <p className="text-sm text-muted-foreground">{handle}</p>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 justify-center flex-wrap">
          <Target size={12} className="text-luxury-blue" /> {bio}
          {form.age && <><span>·</span><span>{form.age}y</span></>}
          {form.weight_kg && <><span>·</span><span>{form.weight_kg}kg</span></>}
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-6 mt-4 w-full max-w-xs">
          <StatBlock value={stats.workouts} label="Workouts" />
          <StatBlock value={stats.prs} label="PRs" accent />
          <StatBlock value={stats.streak} label="Day Streak" />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4 w-full">
          <Button
            variant={editing ? 'default' : 'outline'}
            className={cn('flex-1 min-h-[44px]', editing ? 'bg-luxury-blue glow-blue' : 'glass')}
            onClick={editing ? onSave : onEditToggle}
            disabled={saving}
          >
            {editing ? (saving ? 'Saving…' : <><Check size={16} /> Save</>) : <><Settings size={16} /> Edit Profile</>}
          </Button>
          <Button variant="outline" className="flex-1 glass min-h-[44px]" onClick={onShare}>
            <Share2 size={16} /> Share
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatBlock({ value, label, accent }) {
  return (
    <div className="flex flex-col items-center">
      <span className={cn('text-xl font-bold tabular-nums', accent ? 'text-luxury-red' : 'text-foreground')}>{value ?? 0}</span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}