import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, EmptyState, Pill } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { Camera, Trash2, X, Upload, Lock, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const VIEWS = ['All', 'Front', 'Side', 'Back'];
const POSES = ['All', 'Relaxed', 'Flexed'];

export default function ProgressPhotos() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('All');
  const [pose, setPose] = useState('All');
  const [uploading, setUploading] = useState(false);
  const [viewer, setViewer] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { const p = await base44.entities.ProgressPhoto.list('-date', 200); setPhotos(p || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.ProgressPhoto.create({
        date: new Date().toISOString(),
        view: view === 'All' ? 'Front' : view,
        pose: pose === 'All' ? 'Relaxed' : pose,
        photo_url: file_url,
        is_private: true,
      });
      await load();
    } catch (err) { console.error(err); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const remove = async (id) => {
    try { await base44.entities.ProgressPhoto.delete(id); setPhotos((p) => p.filter((x) => x.id !== id)); setViewer(null); }
    catch (e) { console.error(e); }
  };

  const filtered = photos.filter((p) => (view === 'All' || p.view === view) && (pose === 'All' || p.pose === pose));

  if (loading) return <div className="flex justify-center py-10"><div className="w-7 h-7 border-4 border-luxury-blue/30 border-t-luxury-blue rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <Card className="border-luxury-blue/30 bg-luxury-blue/5">
        <div className="flex items-start gap-2.5">
          <Lock size={15} className="text-luxury-blue shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">Progress photos are private by default and only visible to you. They're stored to track visual changes over time — never shared without your action.</p>
        </div>
      </Card>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {VIEWS.map((v) => <Pill key={v} active={view === v} onClick={() => setView(v)}>{v}</Pill>)}
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mt-2">
        {POSES.map((p) => <Pill key={p} active={pose === p} onClick={() => setPose(p)}>{p}</Pill>)}
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="user" onChange={onPick} className="hidden" />
      <Button className="w-full bg-luxury-blue glow-blue min-h-[48px]" onClick={() => fileRef.current?.click()} disabled={uploading}>
        {uploading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Uploading…</> : <><Camera size={18} /> Add Progress Photo</>}
      </Button>

      {!filtered.length ? (
        <EmptyState icon={ImageIcon} title="No photos yet" description="Add a front, side or back photo to visually track your progress over time." />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {filtered.map((p) => (
            <button key={p.id} onClick={() => setViewer(p)} className="relative aspect-square rounded-xl overflow-hidden glass border border-border/60">
              <Image src={p.photo_url} alt="progress" fittingType="fill" className="w-full h-full" />
              <span className="absolute bottom-1 left-1 text-[8px] font-medium px-1.5 py-0.5 rounded bg-black/60 text-white">{p.view} · {p.pose}</span>
            </button>
          ))}
        </div>
      )}

      {viewer && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={() => setViewer(null)}>
          <div className="flex items-center justify-between p-4 safe-pt" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewer(null)} className="text-white min-h-[44px] min-w-[44px] flex items-center justify-center"><X size={22} /></button>
            <span className="text-xs text-white/70">{new Date(viewer.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })} · {viewer.view} · {viewer.pose}</span>
            <button onClick={() => remove(viewer.id)} className="text-luxury-red min-h-[44px] min-w-[44px] flex items-center justify-center"><Trash2 size={20} /></button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4" onClick={(e) => e.stopPropagation()}>
            <img src={viewer.photo_url} alt="progress" className="max-w-full max-h-full rounded-xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}