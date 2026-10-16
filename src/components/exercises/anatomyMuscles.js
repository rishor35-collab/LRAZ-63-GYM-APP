import { FRONT_PATHS, BACK_PATHS } from '@/components/exercises/anatomyPaths';

const RULES = [
  [/full body|cardio|conditioning/, 'all'], [/upper chest|clavicular/, 'upper_chest'],
  [/lower chest/, 'lower_chest'], [/chest|pectoral/, 'chest'],
  [/rear delt|posterior delt/, 'rear_delts'], [/shoulder|delt/, 'deltoids'],
  [/bicep/, 'biceps'], [/brachialis/, 'brachialis'], [/tricep/, 'triceps'],
  [/forearm|brachioradialis/, 'forearms'], [/grip/, 'grip'], [/oblique/, 'obliques'],
  [/core/, 'core'], [/\babs\b|abdominis|abdominal/, 'abs'], [/quad|rectus femoris|vastus/, 'quads'],
  [/tibialis/, 'tibialis'], [/hip flexor|iliopsoas/, 'hip_flexors'],
  [/inner thigh|adductor/, 'inner_thighs'], [/neck/, 'neck'], [/rotator|infraspinatus|teres minor/, 'rotator_cuff'],
  [/lower trap/, 'lower_traps'], [/upper back|rhomboid/, 'upper_back'],
  [/lower back|erector/, 'lower_back'], [/trap/, 'traps'], [/latissimus|\blats?\b/, 'lats'],
  [/back/, 'back'], [/glute(?:us)? medius|glute medius/, 'glute_medius'],
  [/glute/, 'glutes'], [/hamstring|biceps femoris|semitendinosus/, 'hamstrings'],
  [/soleus/, 'soleus'], [/calf|calves|gastrocnemius/, 'calves'], [/arm/, 'arms'],
];
const POSTERIOR = new Set(['rear_delts', 'triceps', 'rotator_cuff', 'lats', 'upper_back', 'lower_back', 'lower_traps', 'traps', 'back', 'glutes', 'glute_medius', 'hamstrings', 'calves', 'soleus']);
const GROUPS = { core: ['abs', 'obliques'], back: ['lats', 'upper_back', 'lower_back'], arms: ['biceps', 'triceps'], all: ['chest', 'deltoids', 'biceps', 'forearms', 'abs', 'obliques', 'quads', 'calves'] };
const keyFor = (name) => RULES.find(([pattern]) => pattern.test(String(name || '').toLowerCase()))?.[1];
const expand = (key) => GROUPS[key] || (key ? [key] : []);

export default function getAnatomyMuscles(primaryMuscle, secondaryMuscles = []) {
  const primary = keyFor(primaryMuscle);
  const view = POSTERIOR.has(primary) ? 'back' : 'front';
  const paths = view === 'back' ? BACK_PATHS : FRONT_PATHS;
  const active = new Map();
  (Array.isArray(secondaryMuscles) ? secondaryMuscles : []).forEach((name) => {
    expand(keyFor(name)).forEach((key) => active.set(key, 'secondary'));
  });
  expand(primary).forEach((key) => active.set(key, 'primary'));
  const highlights = [...active].flatMap(([key, role]) => (paths[key] || []).map((d) => ({ key, role, d })));
  return { view, highlights };
}