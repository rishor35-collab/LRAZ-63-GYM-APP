import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Card } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Lock, MessageCircle, Check, Clock, Dumbbell, Trophy, Activity, Flame, Target } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import * as social from '@/lib/social';
import { refreshMyTrainingStats } from '@/lib/activityFeed';

export default function UserProfile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState(null);
  const [follow, setFollow] = useState(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const myProfile = await social.ensureMyProfile();
      setMe(myProfile);
      const p = await social.getProfile(userId);
      setProfile(p);
      if (p) {
        const [f, fols, fing] = await Promise.all([
          myProfile ? social.getFollow(myProfile.user_id, p.user_id) : Promise.resolve(null),
          social.listFollowers(p.user_id),
          social.listFollowing(p.user_id),
        ]);
        setFollow(f);
        setFollowers((fols || []).length);
        setFollowing((fing || []).length);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [userId]);

  const isMe = userId === user?.id;
  const canViewPrivate = !profile?.is_private || isMe || follow?.status === 'accepted';
  const showStats = profile?.share_training_stats && canViewPrivate;

  const doFollow = async () => { if (!profile || !me) return; const f = await social.followUser(profile, me); setFollow(f); };
  const doUnfollow = async () => { if (!profile || !me) return; await social.unfollowUser(profile, me); setFollow(null); };
  const doCancel = async () => { if (!profile || !me) return; await social.cancelRequest(profile, me); setFollow(null); };
  const message = async () => {
    if (!profile || !me) return;
    const conv = await social.createOrGetConversation(profile.user_id, me.display_name, profile.display_name);
    navigate(`/messages/${conv.id}`);
  };

  const toggleShareStats = async () => {
    if (!profile || !isMe) return;
    setToggling(true);
    const next = !profile.share_training_stats;
    setProfile({ ...profile, share_training_stats: next });
    try {
      await base44.entities.SocialProfile.update(profile.id, { share_training_stats: next });
      if (next) await refreshMyTrainingStats();
    } catch (e) { console.error(e); }
    finally { setToggling(false); }
  };

  const toggleShareFeed = async () => {
    if (!profile || !isMe) return;
    setToggling(true);
    const next = !profile.share_to_feed;
    setProfile({ ...profile, share_to_feed: next });
    try { await base44.entities.SocialProfile.update(profile.id, { share_to_feed: next }); }
    catch (e) { console.error(e); }
    finally { setToggling(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-luxury-blue/30 border-t-luxury-blue rounded-full animate-spin" /></div>;
  if (!profile) return (
    <div className="min-h-screen safe-pt px-4 max-w-md mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="min-h-[44px]"><ArrowLeft size={18} /> Back</Button>
      <p className="text-center text-muted-foreground mt-10">Profile not found.</p>
    </div>
  );

  return (
    <div className="min-h-screen safe-pt px-4 pb-36 max-w-md mx-auto">
      <button onClick={() => navigate(-1)} className="min-h-[44px] flex items-center gap-1 text-muted-foreground mb-3"><ArrowLeft size={18} /> Back</button>
      <Card className="text-center mb-4">
        <div className="w-20 h-20 rounded-full luxury-gradient mx-auto flex items-center justify-center text-white font-bold text-2xl mb-3 overflow-hidden">
          {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : (profile.display_name || '?')[0]?.toUpperCase()}
        </div>
        <h1 className="text-xl font-bold">{profile.display_name}</h1>
        {profile.username && <p className="text-[11px] text-muted-foreground mt-0.5">@{profile.username}</p>}
        {profile.is_private && <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1 mt-1"><Lock size={11} /> Private profile</p>}
        {canViewPrivate && profile.bio && <p className="text-sm text-muted-foreground mt-2">{profile.bio}</p>}
        {!canViewPrivate && profile.is_private && !isMe && <p className="text-xs text-muted-foreground mt-2">Follow to see this athlete's bio.</p>}
        <div className="flex justify-center gap-6 mt-4">
          <button onClick={() => navigate(`/social/${profile.user_id}/followers`)} className="text-center">
            <p className="text-lg font-bold">{followers}</p>
            <p className="text-[10px] uppercase text-muted-foreground">Followers</p>
          </button>
          <button onClick={() => navigate(`/social/${profile.user_id}/following`)} className="text-center">
            <p className="text-lg font-bold">{following}</p>
            <p className="text-[10px] uppercase text-muted-foreground">Following</p>
          </button>
        </div>
      </Card>

      {showStats && (
        <Card className="mb-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Training Stats</p>
          <div className="grid grid-cols-3 gap-3">
            <StatItem icon={Dumbbell} label="Workouts" value={profile.public_workout_count || 0} color="text-luxury-blue" />
            <StatItem icon={Trophy} label="PRs" value={profile.public_pr_count || 0} color="text-luxury-gold" />
            <StatItem icon={Activity} label="Cardio" value={profile.public_cardio_count || 0} color="text-luxury-red" />
            <StatItem icon={Flame} label="Volume kg" value={Math.round(profile.public_total_volume || 0)} />
            <StatItem icon={Target} label="Streak" value={profile.public_streak || 0} unit="days" color="text-luxury-blue" />
          </div>
          {profile.public_goal && <p className="text-xs text-muted-foreground mt-3 text-center">Goal: {profile.public_goal}</p>}
        </Card>
      )}

      {isMe && (
        <Card className="mb-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Privacy & Sharing</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Share training stats</p>
                <p className="text-[11px] text-muted-foreground">Show workout count, PRs, volume on your profile</p>
              </div>
              <Switch checked={!!profile.share_training_stats} onCheckedChange={toggleShareStats} disabled={toggling} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Post to community feed</p>
                <p className="text-[11px] text-muted-foreground">Auto-share workouts, PRs, and milestones</p>
              </div>
              <Switch checked={!!profile.share_to_feed} onCheckedChange={toggleShareFeed} disabled={toggling} />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">Body measurements, progress photos, and nutrition data are never shared — only aggregate training stats you choose.</p>
        </Card>
      )}

      {!isMe ? (
        <div className="flex gap-2">
          {!follow ? (
            <Button className="flex-1 bg-luxury-blue min-h-[44px]" onClick={doFollow}>{profile.is_private ? 'Request to Follow' : 'Follow'}</Button>
          ) : follow.status === 'pending' ? (
            <Button variant="outline" className="flex-1 min-h-[44px]" onClick={doCancel}><Clock size={16} /> Requested</Button>
          ) : (
            <Button variant="outline" className="flex-1 min-h-[44px]" onClick={doUnfollow}><Check size={16} /> Following</Button>
          )}
          <Button variant="outline" className="flex-1 min-h-[44px]" onClick={message}><MessageCircle size={16} /> Message</Button>
        </div>
      ) : (
        <Button variant="outline" className="w-full min-h-[44px]" onClick={() => navigate('/profile')}>Edit my profile</Button>
      )}
    </div>
  );
}

function StatItem({ icon: Icon, label, value, unit, color }) {
  return (
    <div className="flex flex-col items-center text-center">
      <Icon size={16} className={color || 'text-muted-foreground'} />
      <p className="text-base font-bold tabular-nums mt-1">{value}{unit && <span className="text-[10px] text-muted-foreground ml-0.5">{unit}</span>}</p>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}