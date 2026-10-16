import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, Pill, EmptyState } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layers, Pencil, FileUp, X, Check, Dumbbell, Sparkles, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActionSelect } from '@/components/ui/action-select';
import { generateProgram, parseProgramText } from '@/lib/programTemplates';
import DayEditor from '@/components/programs/DayEditor';
import MesocycleEditor from '@/components/programs/MesocycleEditor';
import { recordsChanged } from '@/lib/recordEditing';
import { fitnessRecords } from '@/lib/fitnessDataCache';

const GOALS = ['Hypertrophy', 'Muscle Gain', 'Strength', 'Fat Loss', 'Body Recomposition', 'Athletic Performance', 'General Fitness', 'Maintenance'];
const SPLITS = ['Upper Lower', 'Push Pull Legs', 'Push Pull', 'Full Body', 'Bro Split', 'Powerbuilding', 'Hybrid', 'Home'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export default function ProgramBuilder() {
  const [params] = useSearchParams();
  const initialMode = params.get('mode') || 'templates';
  const [mode, setMode] = useState(initialMode);
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-36">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-muted-foreground tracking-wider uppercase">Create Program</p>
          <h1 className="text-2xl font-bold tracking-tight">Program Builder</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/train')} className="min-h-[44px]"><X size={18} /></Button>
      </div>

      <div className="flex gap-2 mb-5">
        <Pill active={mode === 'templates'} onClick={() => setMode('templates')}><Layers size={13} /> Templates</Pill>
        <Pill active={mode === 'manual'} onClick={() => setMode('manual')}><Pencil size={13} /> Manual</Pill>
        <Pill active={mode === 'import'} onClick={() => setMode('import')}><FileUp size={13} /> Import Text</Pill>
      </div>

      {mode === 'templates' && <TemplateGenerator onDone={() => navigate('/train')} />}
      {mode === 'manual' && <ManualBuilder onDone={() => navigate('/train')} />}
      {mode === 'import' && <TextImporter onDone={() => navigate('/train')} />}
    </div>
  );
}

function TemplateGenerator({ onDone }) {
  const { user } = useAuth();
  const [goal, setGoal] = useState(null);
  const [prefs, setPrefs] = useState({ days_per_week: 4, session_duration_minutes: 60, split: 'Upper Lower', duration_weeks: 8 });
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) fitnessRecords('Goal', user.id, { status: 'active' }, { sort: '-created_date', limit: 1 }).then((g) => setGoal(g[0] || null));
  }, [user?.id]);

  const generate = () => {
    setError('');
    try { setPreview(generateProgram({ user, goal, preferences: prefs })); }
    catch (e) { setError(e.message || 'Generation failed'); }
  };

  const save = async () => {
    setSaving(true); setError('');
    try { await base44.entities.TrainingProgram.create({ ...preview, is_ai_generated: false }); recordsChanged('TrainingProgram'); onDone(); }
    catch (e) { setError(e.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <Card className="luxury-gradient border border-luxury-blue/30">
        <div className="flex items-center gap-2 mb-3">
          <Layers size={18} className="text-luxury-blue" />
          <p className="font-semibold text-white">Template Program</p>
        </div>
        <p className="text-xs text-white/70 mb-4">Builds a periodized program instantly from fixed, evidence-based templates scaled to your experience. No AI, no credits — fully editable after saving.</p>
        <div className="space-y-3">
          <SelectField label="Split" value={prefs.split} options={SPLITS} onChange={(v) => setPrefs({ ...prefs, split: v })} />
          <SelectField label="Days per week" value={prefs.days_per_week} options={[2, 3, 4, 5, 6]} onChange={(v) => setPrefs({ ...prefs, days_per_week: Number(v) })} />
          <SelectField label="Session length (min)" value={prefs.session_duration_minutes} options={[30, 45, 60, 75, 90]} onChange={(v) => setPrefs({ ...prefs, session_duration_minutes: Number(v) })} />
          <SelectField label="Duration (weeks)" value={prefs.duration_weeks} options={[4, 6, 8, 12, 16]} onChange={(v) => setPrefs({ ...prefs, duration_weeks: Number(v) })} />
        </div>
      </Card>

      {!preview && <Button onClick={generate} className="w-full bg-luxury-blue glow-blue min-h-[44px]"><Layers size={16} /> Generate Program</Button>}
      {error && <p className="text-xs text-luxury-red text-center">{error}</p>}

      {preview && (
        <div className="space-y-3 animate-fade-up">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{preview.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{preview.goal} · {preview.split} · {preview.days_per_week}d/wk · {preview.duration_weeks}w</p>
              </div>
            </div>
            {preview.description && <p className="text-xs text-muted-foreground mt-2">{preview.description}</p>}
          </Card>
          {preview.days?.map((d, i) => (
            <Card key={i} className="p-3">
              <p className="text-sm font-semibold mb-1">{d.day_name} <span className="text-muted-foreground font-normal">· {d.focus}</span></p>
              <div className="space-y-1">
                {d.exercises?.map((ex, j) => (
                  <div key={j} className="flex justify-between text-xs">
                    <span>{ex.exercise_name}</span>
                    <span className="text-muted-foreground tabular-nums">{ex.sets}×{ex.reps_low}-{ex.reps_high}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 glass" onClick={() => setPreview(null)}>Regenerate</Button>
            <Button className="flex-1 bg-luxury-red glow-red" onClick={save} disabled={saving}>{saving ? 'Saving…' : <><Check size={16} /> Save Program</>}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ManualBuilder({ onDone }) {
  const [form, setForm] = useState({
    name: '', description: '', goal: 'Hypertrophy', split: 'Upper Lower',
    days_per_week: 4, session_duration_minutes: 60, experience_level: 'Intermediate',
    duration_weeks: 8, phase: 'Hypertrophy', blocks: [], days: [{ day_name: 'Day 1', focus: '', exercises: [] }],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addDay = () => setForm((f) => ({ ...f, days: [...f.days, { day_name: `Day ${f.days.length + 1}`, focus: '', exercises: [] }] }));
  const updateDay = (i, day) => setForm((f) => ({ ...f, days: f.days.map((d, j) => j === i ? day : d) }));
  const removeDay = (i) => setForm((f) => ({ ...f, days: f.days.filter((_, j) => j !== i) }));

  const save = async () => {
    setSaving(true); setError('');
    try {
      const payload = { ...form, name: form.name.trim() || 'New Program', is_ai_generated: false };
      await base44.entities.TrainingProgram.create(payload);
      recordsChanged('TrainingProgram');
      onDone();
    }
    catch (e) { setError(e.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const saveDraft = async () => {
    setSaving(true); setError('');
    try {
      const payload = { ...form, name: form.name.trim() || `Untitled Draft · ${new Date().toLocaleDateString()}`, is_ai_generated: false, draft: true, active: false };
      await base44.entities.TrainingProgram.create(payload);
      recordsChanged('TrainingProgram');
      onDone();
    }
    catch (e) { setError(e.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-3">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Program Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Off-Season Strength Block" className="glass mt-1" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Description</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional notes" className="glass mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Goal" value={form.goal} options={GOALS} onChange={(v) => setForm({ ...form, goal: v })} />
            <SelectField label="Split" value={form.split} options={SPLITS} onChange={(v) => setForm({ ...form, split: v })} />
            <SelectField label="Experience" value={form.experience_level} options={LEVELS} onChange={(v) => setForm({ ...form, experience_level: v })} />
            <SelectField label="Days/week" value={form.days_per_week} options={[2, 3, 4, 5, 6]} onChange={(v) => setForm({ ...form, days_per_week: Number(v) })} />
            <SelectField label="Session (min)" value={form.session_duration_minutes} options={[30, 45, 60, 75, 90]} onChange={(v) => setForm({ ...form, session_duration_minutes: Number(v) })} />
            <SelectField label="Weeks" value={form.duration_weeks} options={[4, 6, 8, 12, 16]} onChange={(v) => setForm({ ...form, duration_weeks: Number(v) })} />
          </div>
        </div>
      </Card>

      <MesocycleEditor blocks={form.blocks} onChange={(blocks) => setForm((f) => ({ ...f, blocks }))} />

      {form.days.map((day, i) => (
        <DayEditor key={i} day={day} onChange={(d) => updateDay(i, d)} onRemove={form.days.length > 1 ? () => removeDay(i) : null} index={i} />
      ))}

      <Button variant="outline" className="w-full glass border-dashed min-h-[44px]" onClick={addDay}><Dumbbell size={15} /> Add Day</Button>

      {error && <p className="text-xs text-luxury-red text-center">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="glass min-h-[44px]" onClick={saveDraft} disabled={saving}><Save size={16} /> Save Draft</Button>
        <Button onClick={save} disabled={saving} className="bg-luxury-blue glow-blue min-h-[44px]">{saving ? 'Saving…' : <><Check size={16} /> Save</>}</Button>
      </div>
    </div>
  );
}

function TextImporter({ onDone }) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const parse = () => {
    setError('');
    if (!text.trim()) { setError('Paste your program text first'); return; }
    const program = parseProgramText(text);
    if (!program.days.some((d) => d.exercises.length)) { setError('No exercises found. Use lines like "Bench Press 4x6-8"'); return; }
    setPreview(program);
  };

  const save = async () => {
    setSaving(true); setError('');
    try { await base44.entities.TrainingProgram.create({ ...preview, is_ai_generated: false, is_template: false }); recordsChanged('TrainingProgram'); onDone(); }
    catch (e) { setError(e.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <Card className="luxury-gradient border border-luxury-blue/30">
        <div className="flex items-center gap-2 mb-2">
          <FileUp size={18} className="text-luxury-blue" />
          <p className="font-semibold text-white">Import from Text</p>
        </div>
        <p className="text-xs text-white/70 mb-3">Paste a program (from a coach, spreadsheet, or notes). Day headers on their own line (e.g. "Upper A:"), then exercises as "Name setsxreps" (e.g. "Bench Press 4x6-8"). Parsed locally — no AI.</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={'Upper A:\nBench Press 4x6-8\nBarbell Row 4x8-10\n\nLower A:\nBack Squat 5x5\nRomanian Deadlift 3x8-12'} rows={8} className="w-full rounded-xl glass border border-white/15 p-3 text-sm text-white placeholder:text-white/40" />
      </Card>

      {!preview && <Button onClick={parse} className="w-full bg-luxury-blue glow-blue min-h-[44px]"><FileUp size={16} /> Parse Program</Button>}
      {error && <p className="text-xs text-luxury-red text-center">{error}</p>}

      {preview && (
        <div className="space-y-3 animate-fade-up">
          <Card>
            <p className="font-semibold">{preview.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{preview.days?.length || 0} days parsed</p>
          </Card>
          {preview.days?.map((d, i) => (
            <Card key={i} className="p-3">
              <p className="text-sm font-semibold mb-1">{d.day_name}</p>
              <div className="space-y-1">
                {d.exercises?.map((ex, j) => (
                  <div key={j} className="flex justify-between text-xs">
                    <span>{ex.exercise_name}</span>
                    <span className="text-muted-foreground tabular-nums">{ex.sets}×{ex.reps_low}-{ex.reps_high}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 glass" onClick={() => setPreview(null)}>Redo</Button>
            <Button className="flex-1 bg-luxury-red glow-red" onClick={save} disabled={saving}><Check size={16} /> Save</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return <ActionSelect label={label} value={value} options={options} onChange={onChange} />;
}