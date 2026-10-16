import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Card, EmptyState } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dumbbell, Trophy, Award, Activity, Flame, Target, Heart, MessageCircle, Trash2, X, Send, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as feed from '@/lib/activityFeed';
import { ensureMyProfile } from '@/lib/social';

const TYPE_META = {
  workout: { icon: Dumbbell, color: 'text-luxury-blue', bg: 'bg-luxury-blue/15' },
  pr: { icon: Trophy, color: 'text-luxury-gold', bg: 'bg-luxury-gold/15' },
  achievement: { icon: Award, color: 'text-luxury-gold', bg: 'bg-luxury-gold/15' },
  cardio: { icon: Activity, color: 'text-luxury-red', bg: 'bg-luxury-red/15' },
  milestone: { icon: Flame, color: 'text-luxury-red', bg: 'bg-luxury-red/15' },
  challenge: { icon: Target, color: 'text-luxury-blue', bg: 'bg-luxury-blue/15' },
};

export default function ActivityFeed({ refreshKey }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const myProfile = await ensureMyProfile();
      setMe(myProfile);
      const list = await feed.listFeed(50);
      setPosts(list || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const doLike = async (post) => {
    if (!me) return;
    const updated = await feed.toggleLike(post, me);
    setPosts((ps) => ps.map((p) => p.id === post.id ? updated : p));
  };

  const openComments = async (post) => {
    setCommenting(post);
    setLoadingComments(true);
    try {
      const list = await feed.listComments(post.id);
      setComments(list || []);
    } catch (e) { console.error(e); }
    finally { setLoadingComments(false); }
  };

  const submitComment = async () => {
    if (!commenting || !commentText.trim()) return;
    const c = await feed.addComment(commenting, me, commentText);
    if (c) {
      setComments((cs) => [...cs, c]);
      setPosts((ps) => ps.map((p) => p.id === commenting.id ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p));
      setCommentText('');
    }
  };

  const removePost = async (post) => {
    await feed.deletePost(post.id);
    setPosts((ps) => ps.filter((p) => p.id !== post.id));
  };

  if (loading) return <div className="flex justify-center py-10"><div className="w-7 h-7 border-4 border-luxury-blue/30 border-t-luxury-blue rounded-full animate-spin" /></div>;
  if (!posts.length) return <EmptyState icon={Activity} title="No activity yet" description="Completed workouts, PRs, and milestones from you and the community will appear here." />;

  return (
    <div className="space-y-3">
      {posts.map((post) => {
        const meta = TYPE_META[post.type] || TYPE_META.workout;
        const Icon = meta.icon;
        const liked = me && (post.likes || []).includes(me.user_id || me.id);
        const isMine = post.user_id === (user?.id || me?.user_id);
        return (
          <Card key={post.id} className="p-3">
            <div className="flex items-start gap-3">
              <button onClick={() => navigate(`/user/${post.user_id}`)} className="w-10 h-10 rounded-full luxury-gradient flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                {post.avatar_url ? <img src={post.avatar_url} alt="" className="w-full h-full object-cover" /> : (post.user_name || '?')[0]?.toUpperCase()}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/user/${post.user_id}`)} className="text-sm font-semibold truncate hover:underline">{post.user_name}</button>
                  <div className={cn('w-5 h-5 rounded-full flex items-center justify-center shrink-0', meta.bg)}>
                    <Icon size={11} className={meta.color} />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">{timeAgo(post.created_date)}</p>
              </div>
              {isMine && (
                <button onClick={() => removePost(post)} className="text-muted-foreground hover:text-luxury-red p-1 shrink-0"><Trash2 size={14} /></button>
              )}
            </div>
            <div className="mt-2.5">
              <p className="text-sm font-medium">{post.title}</p>
              {post.body && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{post.body}</p>}
              {post.snapshot && post.snapshot.summary && (
                <div className="mt-2 glass rounded-xl p-2.5 grid grid-cols-3 gap-2 text-center">
                  {post.snapshot.summary.map((s, i) => (
                    <div key={i}>
                      <p className="text-sm font-bold tabular-nums">{s.value}</p>
                      <p className="text-[9px] uppercase text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 mt-3">
              <button onClick={() => doLike(post)} className={cn('flex items-center gap-1.5 text-xs min-h-[36px] px-2 rounded-lg transition-all', liked ? 'text-luxury-red' : 'text-muted-foreground hover:text-foreground')}>
                <Heart size={15} className={cn(liked && 'fill-current')} />
                <span className="tabular-nums">{(post.likes || []).length || ''}</span>
              </button>
              <button onClick={() => openComments(post)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground min-h-[36px] px-2">
                <MessageCircle size={15} />
                <span className="tabular-nums">{post.comment_count || ''}</span>
              </button>
            </div>
          </Card>
        );
      })}

      {commenting && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCommenting(null)} />
          <div className="relative w-full max-w-md glass-strong rounded-t-3xl p-5 max-h-[70vh] flex flex-col animate-fade-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Comments</h3>
              <Button variant="ghost" size="sm" onClick={() => setCommenting(null)}><X size={18} /></Button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 mb-3">
              {loadingComments ? (
                <p className="text-center text-sm text-muted-foreground py-4">Loading…</p>
              ) : comments.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">No comments yet. Be the first!</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2.5">
                    <button onClick={() => navigate(`/user/${c.user_id}`)} className="w-8 h-8 rounded-full luxury-gradient flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden">
                      {c.avatar_url ? <img src={c.avatar_url} alt="" className="w-full h-full object-cover" /> : (c.user_name || '?')[0]?.toUpperCase()}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs"><span className="font-semibold">{c.user_name}</span> <span className="text-muted-foreground ml-1">{timeAgo(c.created_date)}</span></p>
                      <p className="text-sm mt-0.5">{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment…" className="glass h-11" onKeyDown={(e) => e.key === 'Enter' && submitComment()} />
              <Button size="icon" className="bg-luxury-blue glow-blue shrink-0 h-11 w-11" onClick={submitComment} disabled={!commentText.trim()}><Send size={16} /></Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}