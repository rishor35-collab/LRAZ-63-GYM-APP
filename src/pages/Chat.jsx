import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Share2, Dumbbell, Apple, Activity, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as social from '@/lib/social';
import ShareContentSheet from '@/components/social/ShareContentSheet';
import SharedContentSheet from '@/components/social/SharedContentSheet';

function AttachmentCard({ a, onOpen }) {
  const icons = { program: Dumbbell, meal: Apple, exercise: Dumbbell, workout: Activity, photo: ImageIcon };
  const Icon = icons[a.type] || Share2;
  return (
    <button onClick={() => onOpen(a)} className="mt-1.5 w-full flex items-center gap-2 rounded-xl bg-black/10 p-2 text-left">
      {a.image_url ? (
        <img src={a.image_url} alt={a.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0"><Icon size={16} /></div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold truncate">{a.name}</p>
        {a.subtitle && <p className="text-[10px] opacity-70 truncate">{a.subtitle}</p>}
      </div>
    </button>
  );
}

export default function Chat() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conv, setConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const load = async () => {
    try {
      const [list, convs] = await Promise.all([social.listMessages(conversationId), social.listConversations()]);
      setMessages(list || []);
      setConv((convs || []).find((x) => x.id === conversationId) || null);
    } catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, [conversationId]);
  useEffect(() => {
    const unsub = social.subscribeMessages(conversationId, () => { load(); });
    return unsub;
  }, [conversationId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!text.trim() || !conv) return;
    setSending(true);
    try { await social.sendMessage(conv, text.trim(), []); setText(''); load(); }
    catch (e) { console.error(e); }
    finally { setSending(false); }
  };
  const share = async (attachment) => {
    if (!conv) return;
    await social.sendMessage(conv, '', [attachment]);
    setShareOpen(false);
    load();
  };

  const otherName = () => {
    if (!conv) return 'Chat';
    const idx = (conv.participant_ids || []).findIndex((id) => id !== user?.id);
    return conv.participant_names?.[idx] || 'Chat';
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background safe-pt md:pt-0 md:static md:z-auto md:mx-auto md:max-w-3xl md:h-[calc(100dvh-2.5rem)] md:-mb-10 h-[100dvh]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <button onClick={() => navigate('/messages')} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground"><ArrowLeft size={20} /></button>
        <div className="w-9 h-9 rounded-full luxury-gradient flex items-center justify-center text-white font-bold shrink-0">{(otherName() || '?')[0]?.toUpperCase()}</div>
        <p className="font-semibold truncate flex-1">{otherName()}</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={mine ? 'flex justify-end' : 'flex justify-start'}>
              <div className={cn('max-w-[78%] rounded-2xl px-3.5 py-2.5', mine ? 'bg-luxury-blue text-white' : 'glass')}>
                {m.content && <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>}
                {(m.attachments || []).map((a, i) => <AttachmentCard key={i} a={a} onOpen={setSelected} />)}
                <p className={cn('text-[9px] mt-1', mine ? 'text-white/60' : 'text-muted-foreground')}>{new Date(m.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="px-3 py-3 border-t border-border shrink-0 safe-pb flex items-center gap-2">
        <button onClick={() => setShareOpen(true)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-luxury-blue"><Share2 size={20} /></button>
        <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder="Message…" className="glass flex-1 min-h-[44px]" />
        <Button onClick={send} disabled={sending || !text.trim()} className="bg-luxury-blue min-h-[44px] px-3"><Send size={18} /></Button>
      </div>
      <ShareContentSheet open={shareOpen} onClose={() => setShareOpen(false)} onShare={share} />
      <SharedContentSheet attachment={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}