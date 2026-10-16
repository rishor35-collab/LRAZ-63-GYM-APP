import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, Pill, EmptyState } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Users, UserPlus, Check, Clock, X, Bell, MessageCircle, Activity, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as social from '@/lib/social';
import ActivityFeed from '@/components/community/ActivityFeed';
import ChallengeList from '@/components/community/ChallengeList';

export default function Community() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('discover');
  const [me, setMe] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [follows, setFollows] = useState({});
  const [q, setQ] = useState('');
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedKey, setFeedKey] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const myProfile = await social.ensureMyProfile();
      setMe(myProfile);
      const [all, myFollowing, reqs, notifs] = await Promise.all([
        social.listProfiles(100).catch(() => []),
        base44.entities.Follow.filter({ follower_id: myProfile?.user_id || '' }).catch(() => []),
        social.listIncomingRequests(myProfile?.user_id || '').catch(() => []),
        social.listNotifications(myProfile?.user_id || '').catch(() => []),
      ]);
      setProfiles(all || []);
      const fmap = {};
      (myFollowing || []).forEach((f) => (fmap[f.following_id] = f));
      setFollows(fmap);
      setRequests(reqs || []);
      setNotifications(notifs || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const doFollow = async (p) => {
    if (!me) return;
    const f = await social.followUser(p, me);
    setFollows((prev) => ({ ...prev, [p.user_id]: f }));
  };
  const doUnfollow = async (p) => {
    if (!me) return;
    await social.unfollowUser(p, me);
    setFollows((prev) => { const n = { ...prev }; delete n[p.user_id]; return n; });
  };
  const doCancel = async (p) => {
    if (!me) return;
    await social.cancelRequest(p, me);
    setFollows((prev) => { const n = { ...prev }; delete n[p.user_id]; return n; });
  };
  const accept = async (f) => {
    if (!me) return;
    await social.acceptRequest(f, me);
    setRequests((prev) => prev.filter((r) => r.id !== f.id));
  };
  const decline = async (f) => {
    await social.declineRequest(f);
    setRequests((prev) => prev.filter((r) => r.id !== f.id));
  };
  const openNotif = async (n) => {
    if (!n.read) await social.markNotificationRead(n.id);
    if (n.entity_type === 'profile' && n.actor_id) navigate(`/user/${n.actor_id}`);
    else if (n.entity_type === 'conversation' && n.entity_id) navigate(`/messages/${n.entity_id}`);
    else load();
  };

  const filtered = (profiles || []).filter((p) => p.user_id !== user?.id && (!q || (p.display_name?.toLowerCase().includes(q.toLowerCase()) || (p.username || '').toLowerCase().includes(q.toLowerCase()))));

  const tabs = [
    { id: 'discover', label: 'Discover' },
    { id: 'feed', label: 'Feed' },
    { id: 'challenges', label: 'Challenges' },
    { id: 'requests', label: 'Requests', badge: requests.length },
    { id: 'alerts', label: 'Alerts' },
  ];

  return (
    <div className="min-h-screen safe-pt px-4 pb-36 max-w-md mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Community</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Discover athletes, share progress, and compete.</p>
      </div>

      <div className="flex gap-2 mb-4 no-scrollbar overflow-x-auto md:flex-wrap">
        {tabs.map((t) => (
          <Pill key={t.id} active={tab === t.id} onClick={() => { setTab(t.id); if (t.id === 'feed' || t.id === 'challenges') setFeedKey((k) => k + 1); }}>
            {t.label}{t.badge ? ` (${t.badge})` : ''}
          </Pill>
        ))}
      </div>

      {tab === 'discover' && (
        <>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search athletes…" className="glass pl-9 min-h-[44px]" />
          </div>
          {loading ? (
            <p className="text-center text-muted-foreground py-10 text-sm">Loading…</p>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Users} title="No athletes yet" description="Invite friends to join LRAZ 63 to see them here." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filtered.map((p) => {
                const f = follows[p.user_id];
                return (
                  <Card key={p.user_id} className="flex items-center gap-3">
                    <button onClick={() => navigate(`/user/${p.user_id}`)} className="w-11 h-11 rounded-full luxury-gradient flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                      {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : (p.display_name || '?')[0]?.toUpperCase()}
                    </button>
                    <button onClick={() => navigate(`/user/${p.user_id}`)} className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold truncate">{p.display_name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">@{p.username || (p.user_id || '').slice(-6)} · {p.is_private ? '🔒 Private' : 'Public'}</p>
                    </button>
                    {!f ? (
                      <Button size="sm" className="bg-luxury-blue min-h-[40px]" onClick={() => doFollow(p)}>{p.is_private ? 'Request' : 'Follow'}</Button>
                    ) : f.status === 'pending' ? (
                      <Button size="sm" variant="outline" className="min-h-[40px]" onClick={() => doCancel(p)}><Clock size={14} /> Requested</Button>
                    ) : (
                      <Button size="sm" variant="outline" className="min-h-[40px]" onClick={() => doUnfollow(p)}><Check size={14} /> Following</Button>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'feed' && <ActivityFeed refreshKey={feedKey} />}

      {tab === 'challenges' && <ChallengeList refreshKey={feedKey} />}

      {tab === 'requests' && (
        requests.length === 0 ? (
          <EmptyState icon={UserPlus} title="No pending requests" description="Follow requests to you will appear here." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {requests.map((f) => (
              <Card key={f.id} className="flex items-center gap-3">
                <button onClick={() => navigate(`/user/${f.follower_id}`)} className="w-11 h-11 rounded-full luxury-gradient flex items-center justify-center text-white font-bold shrink-0">
                  {(f.follower_name || '?')[0]?.toUpperCase()}
                </button>
                <button onClick={() => navigate(`/user/${f.follower_id}`)} className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold truncate">{f.follower_name || 'Athlete'}</p>
                  <p className="text-[11px] text-muted-foreground">wants to follow you</p>
                </button>
                <Button size="sm" className="bg-luxury-blue min-h-[40px]" onClick={() => accept(f)}><Check size={14} /></Button>
                <Button size="sm" variant="outline" className="min-h-[40px]" onClick={() => decline(f)}><X size={14} /></Button>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === 'alerts' && (
        notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No alerts yet" description="Follows, likes, comments, and messages will show here." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {notifications.map((n) => (
              <Card key={n.id} className={cn('flex items-center gap-3', !n.read && 'border-luxury-blue/40')}>
                <div className="w-10 h-10 rounded-full bg-luxury-blue/15 text-luxury-blue flex items-center justify-center shrink-0">
                  {n.type === 'message' ? <MessageCircle size={16} /> : n.type === 'social' ? <Activity size={16} /> : <Bell size={16} />}
                </div>
                <button className="flex-1 min-w-0 text-left" onClick={() => openNotif(n)}>
                  <p className="text-sm">{n.text}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(n.created_date).toLocaleString()}</p>
                </button>
                {!n.read && <span className="w-2 h-2 rounded-full bg-luxury-blue shrink-0" />}
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}