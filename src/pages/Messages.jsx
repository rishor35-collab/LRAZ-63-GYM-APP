import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Card, EmptyState } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { MessageCircle, Plus } from 'lucide-react';
import * as social from '@/lib/social';

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const list = await social.listConversations();
      setConvs(list || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const otherName = (c) => {
    const idx = (c.participant_ids || []).findIndex((id) => id !== user?.id);
    return c.participant_names?.[idx] || 'Conversation';
  };

  return (
    <div className="min-h-screen safe-pt px-4 pb-36 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Private 1-to-1 conversations.</p>
        </div>
        <Button size="sm" className="bg-luxury-blue min-h-[40px]" onClick={() => navigate('/community')}><Plus size={16} /> New</Button>
      </div>
      {loading ? (
        <p className="text-center text-muted-foreground py-10 text-sm">Loading…</p>
      ) : convs.length === 0 ? (
        <EmptyState icon={MessageCircle} title="No conversations yet" description="Find an athlete in Community to start chatting." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {convs.map((c) => (
            <Card key={c.id} className="flex items-center gap-3 active:scale-[0.99] transition-transform cursor-pointer" onClick={() => navigate(`/messages/${c.id}`)}>
              <div className="w-11 h-11 rounded-full luxury-gradient flex items-center justify-center text-white font-bold shrink-0">
                {(otherName(c) || '?')[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{otherName(c)}</p>
                <p className="text-[11px] text-muted-foreground truncate">{c.last_message_preview || 'Say hi 👋'}</p>
              </div>
              {c.last_message_at && <span className="text-[10px] text-muted-foreground shrink-0">{new Date(c.last_message_at).toLocaleDateString()}</span>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}