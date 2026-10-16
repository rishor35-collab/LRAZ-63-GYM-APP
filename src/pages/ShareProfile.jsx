import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Share2, Download, ArrowLeft, Trophy, Dumbbell, Flame, Activity, Target, Award, Lock } from 'lucide-react';
import { estimate1RM } from '@/lib/fitnessScience';
import { cn } from '@/lib/utils';

export default function ShareProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [data, setData] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const [goals, meas, workouts, ach, cardio, sets] = await Promise.all([
        base44.entities.Goal.list('-created_date', 1),
        base44.entities.BodyMeasurement.list('-date', 1),
        base44.entities.WorkoutSession.list('-date', 200),
        base44.entities.Achievement.list('-created_date', 50),
        base44.entities.CardioSession.list('-date', 200),
        base44.entities.WorkoutSet.list('-created_date', 500),
      ]);
      const completed = (workouts || []).filter((w) => w.status === 'completed');
      const totalVolume = completed.reduce((a, w) => a + (w.total_volume_kg || 0), 0);
      const prCount = completed.reduce((a, w) => a + (w.pr_count || 0), 0);

      // top lifts by e1RM
      const liftMap = {};
      (sets || []).forEach((s) => {
        if (!s.weight_kg || !s.reps || !s.exercise_name) return;
        const e = estimate1RM(s.weight_kg, s.reps);
        if (!liftMap[s.exercise_name] || e > liftMap[s.exercise_name].e1rm) liftMap[s.exercise_name] = { e1rm: e, weight: s.weight_kg, reps: s.reps };
      });
      const topLifts = Object.entries(liftMap).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.e1rm - a.e1rm).slice(0, 3);

      const unlocked = (ach || []).filter((a) => a.unlocked).slice(0, 4);

      setData({
        goal: goals?.[0],
        latest: meas?.[0],
        sessions: completed.length,
        totalVolume: Math.round(totalVolume),
        prCount,
        cardioSessions: (cardio || []).length,
        topLifts,
        achievements: unlocked,
      });
    } catch (e) { console.error(e); }
  };

  const initials = (user?.full_name || user?.email || 'A').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  const shareImage = async () => {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#090D10', scale: 2, useCORS: true });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'lraz-profile.png', { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          try { await navigator.share({ files: [file], title: 'LRAZ 63 Profile', text: 'My performance profile' }); } catch (e) {}
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'lraz-profile.png'; a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
      });
    } catch (e) { console.error(e); }
    finally { setSharing(false); }
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };

  if (!data) return <div className="flex justify-center py-20"><div className="w-7 h-7 border-4 border-luxury-blue/30 border-t-luxury-blue rounded-full animate-spin" /></div>;

  const isPrivate = !!user?.profile_private;

  return (
    <div className="min-h-screen safe-pt px-4 pb-36 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"><ArrowLeft size={22} /></button>
        <h1 className="font-semibold text-lg">Share Profile</h1>
        <div className="w-11" />
      </div>

      {/* Shareable card */}
      <div ref={cardRef} className="rounded-3xl overflow-hidden luxury-gradient border border-luxury-blue/30 p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-luxury-blue/20 border border-luxury-blue/40 flex items-center justify-center text-2xl font-bold text-white">{initials}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold text-white truncate">{user?.full_name || 'Athlete'}</p>
            {!isPrivate && <p className="text-xs text-white/70">{data.goal?.primary_goal || 'Performance'} · {user?.experience_level || 'Athlete'}</p>}
            {isPrivate && <p className="text-xs text-white/50 flex items-center gap-1"><Lock size={10} /> Private Profile</p>}
          </div>
          <span className="text-[10px] font-bold tracking-widest text-luxury-gold bg-luxury-gold/10 px-2 py-1 rounded-full">LRAZ 63</span>
        </div>

        {!isPrivate && (
          <>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <StatTile icon={Activity} label="Sessions" value={data.sessions} />
              <StatTile icon={Dumbbell} label="Volume kg" value={data.totalVolume} />
              <StatTile icon={Trophy} label="PRs" value={data.prCount} />
              <StatTile icon={Flame} label="Cardio" value={data.cardioSessions} />
              <StatTile icon={Target} label="Weight" value={data.latest?.weight_kg ? `${data.latest.weight_kg}kg` : '—'} />
              <StatTile icon={Target} label="Body Fat" value={data.latest?.body_fat_percent != null ? `${data.latest.body_fat_percent}%` : '—'} />
            </div>

            {data.topLifts.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-wider text-white/60 mb-2">Top Lifts (est. 1RM)</p>
                <div className="space-y-1.5">
                  {data.topLifts.map((l) => (
                    <div key={l.name} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                      <span className="text-sm text-white font-medium truncate">{l.name}</span>
                      <span className="text-sm font-bold text-luxury-gold tabular-nums">{Math.round(l.e1rm)}kg</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.achievements.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {data.achievements.map((a) => (
                  <span key={a.id} className="text-[10px] font-medium bg-luxury-red/15 text-luxury-red px-2 py-1 rounded-full flex items-center gap-1"><Award size={10} /> {a.title}</span>
                ))}
              </div>
            )}
          </>
        )}

        <p className="text-[9px] text-white/40 text-center">LRAZ 63 · Performance OS · {new Date().toLocaleDateString('en', { month: 'short', year: 'numeric' })}</p>
      </div>

      <p className="text-[11px] text-muted-foreground text-center mt-3 mb-4">Share your profile card as an image to post anywhere, or copy a link to this page.</p>

      <div className="space-y-2">
        <Button onClick={shareImage} disabled={sharing} className="w-full bg-luxury-blue glow-blue min-h-[48px]">
          {sharing ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Generating…</> : <><Share2 size={18} /> Share as Image</>}
        </Button>
        <Button onClick={copyLink} variant="outline" className="w-full min-h-[48px]">
          <Download size={16} /> {copied ? 'Link Copied!' : 'Copy Link'}
        </Button>
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value }) {
  return (
    <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
      <Icon size={13} className="text-luxury-blue mb-1" />
      <p className="text-lg font-bold text-white tabular-nums leading-none">{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-white/50 mt-1">{label}</p>
    </div>
  );
}