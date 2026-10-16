import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Shield, Download, Lock, Eye, Trash2, FileText, ArrowLeft } from 'lucide-react';

export default function Privacy() {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const exportData = async () => {
    setExporting(true);
    try {
      const [
        measurements, workouts, sets, nutrition, cardio, goals, programs,
        scheduled, recovery, achievements, photos, foodItems, savedMeals,
      ] = await Promise.all([
        base44.entities.BodyMeasurement.list('-date', 1000),
        base44.entities.WorkoutSession.list('-date', 1000),
        base44.entities.WorkoutSet.list('-created_date', 2000),
        base44.entities.NutritionLog.list('-date', 1000),
        base44.entities.CardioSession.list('-date', 1000),
        base44.entities.Goal.list('-created_date', 100),
        base44.entities.TrainingProgram.list('-created_date', 100),
        base44.entities.ScheduledWorkout.list('-date', 500),
        base44.entities.RecoveryRecord.list('-date', 500),
        base44.entities.Achievement.list('-created_date', 200),
        base44.entities.ProgressPhoto.list('-date', 500),
        base44.entities.FoodItem.list('-created_date', 500),
        base44.entities.SavedMeal.list('-created_date', 200),
      ]);
      const payload = {
        exported_at: new Date().toISOString(),
        app: 'LRAZ 63 Performance OS',
        body_measurements: measurements || [],
        workout_sessions: workouts || [],
        workout_sets: sets || [],
        nutrition_logs: nutrition || [],
        cardio_sessions: cardio || [],
        goals: goals || [],
        training_programs: programs || [],
        scheduled_workouts: scheduled || [],
        recovery_records: recovery || [],
        achievements: achievements || [],
        progress_photos: (photos || []).map((p) => ({ ...p, photo_url: '[private url omitted]' })),
        food_items: foodItems || [],
        saved_meals: savedMeals || [],
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lraz63-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDone(true); setTimeout(() => setDone(false), 2000);
    } catch (e) { console.error(e); }
    finally { setExporting(false); }
  };

  const csvCell = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const rowsToCsv = (rows, cols) => {
    if (!rows || !rows.length) return '';
    const keys = cols || Object.keys(rows[0]);
    const head = keys.map(csvCell).join(',');
    const body = rows.map((r) => keys.map((k) => csvCell(r[k])).join(',')).join('\n');
    return head + '\n' + body;
  };
  const exportCSV = async () => {
    setExporting(true);
    try {
      const [measurements, workouts, sets, nutrition, cardio] = await Promise.all([
        base44.entities.BodyMeasurement.list('-date', 1000),
        base44.entities.WorkoutSession.list('-date', 1000),
        base44.entities.WorkoutSet.list('-created_date', 2000),
        base44.entities.NutritionLog.list('-date', 1000),
        base44.entities.CardioSession.list('-date', 1000),
      ]);
      const sections = [
        ['BODY_MEASUREMENTS', measurements || [], ['date', 'weight_kg', 'body_fat_percent', 'waist_cm', 'resting_hr']],
        ['WORKOUT_SESSIONS', workouts || [], ['date', 'name', 'focus', 'status', 'total_volume_kg', 'duration_minutes']],
        ['WORKOUT_SETS', sets || [], ['exercise_name', 'set_index', 'weight_kg', 'reps', 'rpe', 'estimated_1rm']],
        ['NUTRITION_LOGS', nutrition || [], ['date', 'meal', 'food_name', 'calories', 'protein_g', 'carbs_g', 'fat_g']],
        ['CARDIO_SESSIONS', cardio || [], ['date', 'activity_label', 'duration_seconds', 'distance_km', 'calories', 'heart_rate_avg']],
      ];
      const csv = sections.map(([title, rows, cols]) => `# ${title}\n${rowsToCsv(rows, cols)}`).join('\n\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `lraz63-export-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDone(true); setTimeout(() => setDone(false), 2000);
    } catch (e) { console.error(e); }
    finally { setExporting(false); }
  };

  return (
    <div className="min-h-screen safe-pt px-4 pb-36 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"><ArrowLeft size={22} /></button>
        <h1 className="font-semibold text-lg">Privacy & Data</h1>
        <div className="w-11" />
      </div>

      <Card className="mb-4 border-luxury-blue/30 bg-luxury-blue/5">
        <p className="text-sm font-semibold mb-2 flex items-center gap-2"><Lock size={15} className="text-luxury-blue" /> Your Data Stays Yours</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">Every record you create — workouts, measurements, nutrition, photos, recovery — is stored privately and only visible to you. Nothing is shared with third parties or used for advertising.</p>
      </Card>

      <Card className="mb-4">
        <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Eye size={15} className="text-luxury-blue" /> Privacy Principles</p>
        <div className="space-y-2.5">
          <Principle icon={Lock} title="Private by default" desc="Body composition, measurements, and progress photos are sensitive and never exposed." />
          <Principle icon={Shield} title="No medical claims" desc="Body-fat, metabolic, and readiness values are estimates — not diagnoses." />
          <Principle icon={FileText} title="Full export" desc="Download every record you've entered at any time." />
        </div>
      </Card>

      <Card className="mb-4">
        <p className="text-sm font-semibold mb-1 flex items-center gap-2"><Download size={15} className="text-luxury-blue" /> Export Your Data</p>
        <p className="text-[11px] text-muted-foreground mb-3">Download a complete JSON backup of all your records (photo URLs are omitted for privacy).</p>
        <div className="space-y-2">
          <Button onClick={exportData} disabled={exporting} className="w-full bg-luxury-blue glow-blue min-h-[48px]">
            {exporting ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Exporting…</> : <><Download size={18} /> {done ? 'Exported!' : 'Download Data (JSON)'}</>}
          </Button>
          <Button onClick={exportCSV} disabled={exporting} variant="outline" className="w-full glass min-h-[48px]">
            <Download size={18} /> Download Data (CSV)
          </Button>
        </div>
      </Card>

      <Card className="mb-4 border-luxury-red/20">
        <p className="text-sm font-semibold mb-1 flex items-center gap-2 text-luxury-red"><Trash2 size={15} /> Delete Account</p>
        <p className="text-[11px] text-muted-foreground mb-3">Permanently erase your account and all associated data. This is irreversible.</p>
        <Button variant="outline" className="w-full border-luxury-red/40 text-luxury-red hover:bg-luxury-red/10 min-h-[44px]" onClick={() => navigate('/profile')}>Go to Profile to Delete</Button>
      </Card>
    </div>
  );
}

function Principle({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={15} className="text-luxury-blue shrink-0 mt-0.5" />
      <div><p className="text-sm font-medium">{title}</p><p className="text-[11px] text-muted-foreground">{desc}</p></div>
    </div>
  );
}