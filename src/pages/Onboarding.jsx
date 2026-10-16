import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/fitness';
import { Pill } from '@/components/ui/fitness';
import { ChevronRight, ChevronLeft, Check, Activity, Dumbbell, Apple, Moon, Target, TrendingUp, Heart, Brain, Calendar, Bell, ListChecks, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calcBMR, calcTDEE, calcCalorieTarget, calcMacros } from '@/lib/fitnessScience';

const GOALS = ['Muscle Gain', 'Strength Gain', 'Fat Loss', 'Body Recomposition', 'Endurance', 'General Fitness'];
const EXPERIENCE = ['Beginner', 'Intermediate', 'Advanced'];
const SPLITS = ['Full Body', 'Upper Lower', 'Push Pull Legs', 'Push Pull', 'Bro Split'];
const ACTIVITY = [
  { v: 'sedentary', l: 'Sedentary', d: 'Little to no exercise' },
  { v: 'light', l: 'Light', d: 'Light exercise 1-3 days' },
  { v: 'moderate', l: 'Moderate', d: 'Exercise 3-5 days' },
  { v: 'active', l: 'Active', d: 'Hard exercise 6-7 days' },
  { v: 'very_active', l: 'Very Active', d: 'Physical job + training' },
];
const EQUIPMENT = ['Barbell', 'Dumbbells', 'Cables', 'Machines', 'Kettlebells', 'Bands', 'Bodyweight', 'Smith Machine'];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    age: '', sex: 'male', height_cm: '', weight_kg: '', goal_weight_kg: '',
    preferred_units: 'metric', activity_level: 'moderate', primary_goal: 'Body Recomposition',
    experience_level: 'Beginner', days_per_week: 4, preferred_split: 'Upper Lower',
    gym_or_home: 'gym', equipment: ['Barbell', 'Dumbbells'], session_duration_minutes: 60,
    dietary_preference: '', allergies: [], injury_history: '',
  });

  const totalSteps = 6;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const next = () => setStep((s) => Math.min(totalSteps - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const toggleArray = (k, v) => setForm((f) => {
    const arr = f[k] || [];
    return { ...f, [k]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
  });

  const finish = async () => {
    setSaving(true);
    try {
      const profileData = {
        ...form,
        age: Number(form.age), height_cm: Number(form.height_cm),
        weight_kg: Number(form.weight_kg), goal_weight_kg: Number(form.goal_weight_kg),
        days_per_week: Number(form.days_per_week),
        session_duration_minutes: Number(form.session_duration_minutes),
        onboarding_completed: true,
      };
      await base44.auth.updateMe(profileData);

      // Compute initial nutrition targets and create a Goal
      const bmr = calcBMR({ weightKg: profileData.weight_kg, heightCm: profileData.height_cm, age: profileData.age, sex: profileData.sex });
      const tdee = calcTDEE(bmr, profileData.activity_level);
      const calorieTarget = calcCalorieTarget(tdee, profileData.primary_goal, 'Moderate');
      const macros = calcMacros({ weightKg: profileData.weight_kg, calorieTarget, goal: profileData.primary_goal });
      if (calorieTarget && macros) {
        await base44.entities.Goal.create({
          primary_goal: profileData.primary_goal,
          phase: profileData.primary_goal === 'Fat Loss' ? 'Cutting' : profileData.primary_goal === 'Muscle Gain' ? 'Hypertrophy' : 'Recomposition',
          target_weight_kg: profileData.goal_weight_kg,
          rate_preference: 'Moderate',
          starting_weight_kg: profileData.weight_kg,
          calorie_target: calorieTarget,
          protein_target_g: macros.proteinG,
          carb_target_g: macros.carbG,
          fat_target_g: macros.fatG,
          fiber_target_g: macros.fiberG,
          water_target_ml: macros.waterMl,
          step_target: 8000,
          status: 'active',
        });
      }
      navigate('/');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return true;
    if (step === 1) return form.age && form.height_cm && form.weight_kg;
    if (step === 2) return form.primary_goal && form.experience_level;
    if (step === 3) return form.preferred_split && form.days_per_week;
    return true;
  };

  return (
    <div className="min-h-screen luxury-gradient flex flex-col">
      <div className="px-5 safe-pt pb-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-luxury-blue/20 border border-luxury-blue/40 flex items-center justify-center">
            <span className="text-luxury-blue font-bold text-sm">63</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground tracking-widest uppercase">LRAZ 63</p>
            <p className="text-sm font-semibold">Performance OS</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={cn('h-1 flex-1 rounded-full transition-all', i <= step ? 'bg-luxury-blue glow-blue' : 'bg-muted/40')} />
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 overflow-y-auto">
        {step === 0 && <FeaturesStep />}
        {step === 1 && <PersonalStep form={form} set={set} />}
        {step === 2 && <GoalStep form={form} set={set} />}
        {step === 3 && <TrainingStep form={form} set={set} toggleArray={toggleArray} />}
        {step === 4 && <NutritionStep form={form} set={set} toggleArray={toggleArray} />}
        {step === 5 && <ReviewStep form={form} />}
      </div>

      <div className="px-5 safe-pb pt-4 flex items-center gap-3">
        {step > 0 && (
          <Button variant="ghost" onClick={back} className="px-4" disabled={saving}>
            <ChevronLeft size={18} /> Back
          </Button>
        )}
        {step < totalSteps - 1 ? (
          <Button onClick={next} disabled={!canProceed()} className="flex-1 bg-luxury-blue hover:bg-luxury-blue/90 glow-blue">
            {step === 0 ? 'Get Started' : 'Continue'} <ChevronRight size={18} />
          </Button>
        ) : (
          <Button onClick={finish} disabled={saving} className="flex-1 bg-luxury-red hover:bg-luxury-red/90 glow-red">
            {saving ? 'Building your plan…' : <>Launch LRAZ 63 <Check size={18} /></>}
          </Button>
        )}
      </div>
    </div>
  );
}

function StepHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-6 animate-fade-up">
      <div className="w-12 h-12 rounded-2xl bg-luxury-blue/15 border border-luxury-blue/30 flex items-center justify-center mb-4">
        <Icon size={22} className="text-luxury-blue" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

function PersonalStep({ form, set }) {
  return (
    <div className="animate-fade-up">
      <StepHeader icon={Activity} title="Your Baseline" subtitle="The fundamentals KAI uses to build your plan." />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Age"><Input type="number" value={form.age} onChange={(e) => set('age', e.target.value)} placeholder="28" /></Field>
        <Field label="Sex">
          <div className="flex gap-2">
            {['male', 'female'].map((s) => (
              <Pill key={s} active={form.sex === s} onClick={() => set('sex', s)} className="flex-1 justify-center">{s === 'male' ? 'Male' : 'Female'}</Pill>
            ))}
          </div>
        </Field>
        <Field label="Height (cm)"><Input type="number" value={form.height_cm} onChange={(e) => set('height_cm', e.target.value)} placeholder="178" /></Field>
        <Field label="Weight (kg)"><Input type="number" value={form.weight_kg} onChange={(e) => set('weight_kg', e.target.value)} placeholder="82" /></Field>
        <Field label="Goal Weight (kg)"><Input type="number" value={form.goal_weight_kg} onChange={(e) => set('goal_weight_kg', e.target.value)} placeholder="78" /></Field>
        <Field label="Units">
          <div className="flex gap-2">
            {['metric', 'imperial'].map((u) => (
              <Pill key={u} active={form.preferred_units === u} onClick={() => set('preferred_units', u)} className="flex-1 justify-center">{u === 'metric' ? 'Metric' : 'Imperial'}</Pill>
            ))}
          </div>
        </Field>
      </div>
      <div className="mt-5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Activity Level</Label>
        <div className="grid grid-cols-1 gap-2 mt-2">
          {ACTIVITY.map((a) => (
            <button key={a.v} onClick={() => set('activity_level', a.v)}
              className={cn('flex items-center justify-between p-3 rounded-xl border transition-all text-left',
                form.activity_level === a.v ? 'border-luxury-blue bg-luxury-blue/10' : 'border-border glass')}>
              <div><p className="text-sm font-medium">{a.l}</p><p className="text-xs text-muted-foreground">{a.d}</p></div>
              {form.activity_level === a.v && <Check size={18} className="text-luxury-blue" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function GoalStep({ form, set }) {
  return (
    <div className="animate-fade-up">
      <StepHeader icon={Target} title="Your Mission" subtitle="What KAI will optimize everything around." />
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Primary Goal</Label>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {GOALS.map((g) => (
          <button key={g} onClick={() => set('primary_goal', g)}
            className={cn('p-3 rounded-xl border text-sm font-medium transition-all text-left',
              form.primary_goal === g ? 'border-luxury-red bg-luxury-red/10 text-foreground' : 'border-border glass text-muted-foreground')}>
            {g}
          </button>
        ))}
      </div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground mt-5 block">Experience Level</Label>
      <div className="flex gap-2 mt-2">
        {EXPERIENCE.map((e) => (
          <Pill key={e} active={form.experience_level === e} onClick={() => set('experience_level', e)} className="flex-1 justify-center">{e}</Pill>
        ))}
      </div>
    </div>
  );
}

function TrainingStep({ form, set, toggleArray }) {
  return (
    <div className="animate-fade-up">
      <StepHeader icon={Dumbbell} title="Training Setup" subtitle="How, where, and with what you train." />
      <div className="flex gap-2 mb-4">
        {['gym', 'home'].map((g) => (
          <Pill key={g} active={form.gym_or_home === g} onClick={() => set('gym_or_home', g)} className="flex-1 justify-center">{g === 'gym' ? 'Gym' : 'Home'}</Pill>
        ))}
      </div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Preferred Split</Label>
      <div className="flex flex-wrap gap-2 mt-2 mb-4">
        {SPLITS.map((s) => <Pill key={s} active={form.preferred_split === s} onClick={() => set('preferred_split', s)}>{s}</Pill>)}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Field label={`Days / Week: ${form.days_per_week}`}>
          <input type="range" min={2} max={7} value={form.days_per_week} onChange={(e) => set('days_per_week', Number(e.target.value))} className="w-full accent-luxury-blue" />
        </Field>
        <Field label={`Session: ${form.session_duration_minutes}m`}>
          <input type="range" min={30} max={120} step={15} value={form.session_duration_minutes} onChange={(e) => set('session_duration_minutes', Number(e.target.value))} className="w-full accent-luxury-blue" />
        </Field>
      </div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Available Equipment</Label>
      <div className="flex flex-wrap gap-2 mt-2">
        {EQUIPMENT.map((eq) => <Pill key={eq} active={form.equipment.includes(eq)} onClick={() => toggleArray('equipment', eq)}>{eq}</Pill>)}
      </div>
    </div>
  );
}

function NutritionStep({ form, set, toggleArray }) {
  const diets = ['Omnivore', 'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Mediterranean', 'Paleo'];
  const allergens = ['Gluten', 'Dairy', 'Nuts', 'Eggs', 'Soy', 'Shellfish'];
  return (
    <div className="animate-fade-up">
      <StepHeader icon={Apple} title="Nutrition Profile" subtitle="KAI's fuel strategy for your goals." />
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Dietary Preference</Label>
      <div className="flex flex-wrap gap-2 mt-2 mb-4">
        {diets.map((d) => <Pill key={d} active={form.dietary_preference === d} onClick={() => set('dietary_preference', d)}>{d}</Pill>)}
      </div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Allergies / Intolerances</Label>
      <div className="flex flex-wrap gap-2 mt-2 mb-4">
        {allergens.map((a) => <Pill key={a} active={form.allergies.includes(a)} onClick={() => toggleArray('allergies', a)}>{a}</Pill>)}
      </div>
      <Field label="Injury History (optional)">
        <Input value={form.injury_history} onChange={(e) => set('injury_history', e.target.value)} placeholder="e.g. Lower back, right shoulder" />
      </Field>
    </div>
  );
}

function ReviewStep({ form }) {
  return (
    <div className="animate-fade-up">
      <StepHeader icon={Moon} title="Ready to Launch" subtitle="KAI will build your first adaptive plan now." />
      <Card className="space-y-2.5">
        <Row label="Goal" value={form.primary_goal} />
        <Row label="Experience" value={form.experience_level} />
        <Row label="Split" value={`${form.preferred_split} · ${form.days_per_week}d/wk`} />
        <Row label="Environment" value={`${form.gym_or_home === 'gym' ? 'Gym' : 'Home'} · ${form.session_duration_minutes}m`} />
        <Row label="Bodyweight" value={`${form.weight_kg} kg → ${form.goal_weight_kg || '—'} kg`} />
        <Row label="Activity" value={form.activity_level} />
        <Row label="Equipment" value={form.equipment.join(', ')} />
      </Card>
      <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
        LRAZ 63 provides fitness coaching, not medical advice. Body-composition values are estimates unless measured by a validated device. Consult a qualified professional for medical concerns.
      </p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

function FeaturesStep() {
  const features = [
    { icon: Dumbbell, title: 'Strength Programming', desc: 'Build periodized programs from templates, manual entry, or paste-from-text. Mesocycle blocks, double progression, warm-up planner, and deload logic — all deterministic.' },
    { icon: Activity, title: 'Live Workout Logger', desc: 'Track sets, reps, RPE/RIR, rest timers, estimated 1RM, PRs, and advanced set types (drop, AMRAP, cluster, supersets). Offline-first with auto-sync.' },
    { icon: Apple, title: 'Nutrition Logging', desc: '180+ food database, custom foods, saved meals, macro targets, live quantity scaling, and full history with trends.' },
    { icon: Heart, title: 'Cardio & HR Zones', desc: 'Track runs, rides, and intervals with pace, distance, calories, and heart-rate zone calculators.' },
    { icon: TrendingUp, title: 'Progress Analytics', desc: 'Body composition, strength PRs, cardio performance, progress photos, and a deterministic monthly report.' },
    { icon: Target, title: 'Goal Journey', desc: 'Set a goal and track your weight trend, target date, and what contributed to your progress.' },
    { icon: Brain, title: 'Training Insights', desc: 'Volume landmarks, muscle frequency, plateau detection, progression suggestions, and recovery history.' },
    { icon: Moon, title: 'Recovery Science', desc: 'Log sleep, soreness, energy, and HRV to compute readiness and recovery scores.' },
    { icon: Bell, title: 'Live Notifications', desc: 'Deterministic reminders for training, fueling, recovery, habits, and weigh-ins — no AI, no credits.' },
    { icon: ListChecks, title: 'Habits & Streaks', desc: 'Build daily habits like hydration, sleep, and mobility with streak tracking.' },
    { icon: Calendar, title: 'Calendar & Weekly Planner', desc: 'Schedule workouts, duplicate weeks, and plan your next 7 days of training.' },
    { icon: Sparkles, title: 'Themes & Customization', desc: 'Multiple luxury themes, accent colors, custom theme builder, OLED mode, and font choices.' },
  ];
  return (
    <div className="animate-fade-up">
      <StepHeader icon={Sparkles} title="Welcome to LRAZ 63" subtitle="Your elite performance OS — everything it can do for you." />
      <div className="space-y-2.5">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <Card key={i} className="flex items-start gap-3 p-3">
              <div className="w-10 h-10 rounded-xl bg-luxury-blue/15 text-luxury-blue flex items-center justify-center shrink-0"><Icon size={18} /></div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{f.desc}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}