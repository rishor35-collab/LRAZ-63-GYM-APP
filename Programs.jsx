import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, EmptyState } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Layers, Archive, Trash2, Pencil, MoreVertical, Calendar, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Programs() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.TrainingProgram.filter({}, { sort: '-created_date', limit: 100 });
      setPrograms(res.items || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const archive = async (id) => {
    try { await base44.entities.TrainingProgram.update(id, { archived: true }); setMenuOpen(null); load(); }
    catch (e) { console.error(e); }
  };
  const unarchive = async (id) => {
    try { await base44.entities.TrainingProgram.update(id, { archived: false }); setMenuOpen(null); load(); }
    catch (e) { console.error(e); }
  };
  const remove = async (id) => {
    try { await base44.entities.TrainingProgram.delete(id); setMenuOpen(null); load(); }
    catch (e) { console.error(e); }
  };

  const active = programs.filter((p) => !p.archived && !p.draft);
  const drafts = programs.filter((p) => p.draft && !p.archived);
  const archived = programs.filter((p) => p.archived);

  return (
    <div className="min-h-screen safe-pt px-4 pb-36 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"><ArrowLeft size={22} /></button>
        <div className="flex-1">
          <h1 className="font-semibold text-lg leading-tight">Programs</h1>
          <p className="text-[11px] text-muted-foreground">View and edit your training programs</p>
        </div>
        <Button size="sm" onClick={() => navigate('/program/new')} className="min-h-[40px]"><Plus size={16} /> New</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-7 h-7 border-4 border-luxury-blue/30 border-t-luxury-blue rounded-full animate-spin" /></div>
      ) : programs.length === 0 ? (
        <EmptyState icon={Layers} title="No programs yet" description="Create your first training program to get started." action={<Button className="mt-4" onClick={() => navigate('/program/new')}><Plus size={16} /> Create Program</Button>} />
      ) : (
        <div className="space-y-5">
          {active.length > 0 && (
            <Section label="Active Programs">
              {active.map((p) => <ProgramCard key={p.id} program={p} menuOpen={menuOpen} setMenuOpen={setMenuOpen} onEdit={() => navigate(`/program/${p.id}`)} onArchive={() => archive(p.id)} onDelete={() => remove(p.id)} />)}
            </Section>
          )}
          {drafts.length > 0 && (
            <Section label="Drafts">
              {drafts.map((p) => <ProgramCard key={p.id} program={p} menuOpen={menuOpen} setMenuOpen={setMenuOpen} onEdit={() => navigate(`/program/${p.id}`)} onArchive={() => archive(p.id)} onDelete={() => remove(p.id)} draft />)}
            </Section>
          )}
          {archived.length > 0 && (
            <Section label="Archived">
              {archived.map((p) => <ProgramCard key={p.id} program={p} menuOpen={menuOpen} setMenuOpen={setMenuOpen} onEdit={() => navigate(`/program/${p.id}`)} onUnarchive={() => unarchive(p.id)} onDelete={() => remove(p.id)} archived />)}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 px-1">{label}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function ProgramCard({ program, menuOpen, setMenuOpen, onEdit, onArchive, onUnarchive, onDelete, draft, archived }) {
  const weekProgress = program.duration_weeks ? Math.min(100, ((program.start_date ? Math.round((Date.now() - new Date(program.start_date).getTime()) / (7 * 24 * 60 * 60 * 1000)) : 0) / program.duration_weeks) * 100) : 0;
  return (
    <Card className="relative">
      <div className="flex items-start justify-between gap-2">
        <button onClick={onEdit} className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate">{program.name}</p>
            {draft && <span className="text-[9px] uppercase bg-luxury-gold/20 text-luxury-gold px-1.5 py-0.5 rounded-full">Draft</span>}
            {archived && <span className="text-[9px] uppercase bg-muted/30 text-muted-foreground px-1.5 py-0.5 rounded-full">Archived</span>}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">{program.goal} · {program.split}</p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar size={11} />{program.days_per_week || 0} days/wk</span>
            <span className="flex items-center gap-1"><Dumbbell size={11} />{program.days?.length || 0} sessions</span>
            {program.duration_weeks > 0 && <span>{program.duration_weeks} weeks</span>}
          </div>
        </button>
        {!archived && (
          <button onClick={() => setMenuOpen(menuOpen === program.id ? null : program.id)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0">
            <MoreVertical size={18} />
          </button>
        )}
      </div>
      {menuOpen === program.id && (
        <div className="absolute right-3 top-12 z-10 glass-strong rounded-xl py-1 min-w-[140px] shadow-xl">
          <button onClick={onEdit} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-accent min-h-[40px]"><Pencil size={14} /> Edit</button>
          {archived ? (
            <button onClick={onUnarchive} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-accent min-h-[40px]"><Archive size={14} /> Unarchive</button>
          ) : (
            <button onClick={onArchive} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-accent min-h-[40px]"><Archive size={14} /> Archive</button>
          )}
          <button onClick={onDelete} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-destructive hover:bg-destructive/10 min-h-[40px]"><Trash2 size={14} /> Delete</button>
        </div>
      )}
    </Card>
  );
}