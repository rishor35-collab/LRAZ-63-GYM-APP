import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, EmptyState } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';
import * as social from '@/lib/social';

export default function FollowList() {
  const { userId, type } = useParams();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const list = type === 'followers' ? await social.listFollowers(userId) : await social.listFollowing(userId);
        const idList = (list || []).map((f) => (type === 'followers' ? f.follower_id : f.following_id));
        const profs = [];
        for (const id of idList) { const p = await social.getProfile(id); if (p) profs.push(p); }
        setProfiles(profs);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [userId, type]);

  return (
    <div className="min-h-screen safe-pt px-4 pb-36 max-w-md mx-auto">
      <button onClick={() => navigate(-1)} className="min-h-[44px] flex items-center gap-1 text-muted-foreground mb-3"><ArrowLeft size={18} /> Back</button>
      <h1 className="text-xl font-bold mb-3 capitalize">{type}</h1>
      {loading ? (
        <p className="text-center text-muted-foreground py-8 text-sm">Loading…</p>
      ) : profiles.length === 0 ? (
        <EmptyState icon={Users} title={`No ${type} yet`} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {profiles.map((p) => (
            <Card key={p.user_id} className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/user/${p.user_id}`)}>
              <div className="w-11 h-11 rounded-full luxury-gradient flex items-center justify-center text-white font-bold shrink-0">{(p.display_name || '?')[0]?.toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{p.display_name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{p.is_private ? '🔒 Private' : 'Public profile'}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}