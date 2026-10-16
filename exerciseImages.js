// Exercise demonstration photos.
// Male-athlete photos are mapped for Chest, Back, and Shoulders.
// Other exercises have no default photo — users can upload their own.
const BASE = 'https://media.base44.com/images/public/6a7af27a605035ae79f8800a/';

const IMG = {
  // Chest (male athlete photos)
  bench_press: BASE + 'e519742a6_generated_image.png',
  dumbbell_bench_press: BASE + '0c3f0fafd_generated_image.png',
  incline_bench_press: BASE + '143599a23_generated_image.png',
  cable_crossover: BASE + 'b210e8022_generated_image.png',
  dips: BASE + '4a21e84b4_generated_image.png',
  dumbbell_fly: BASE + '7b374c078_generated_image.png',
  machine_chest_press: BASE + 'c99a11ac1_generated_image.png',
  push_up: null,
  // Shoulders (male athlete photos)
  overhead_press: BASE + '0bbbe913c_generated_image.png',
  dumbbell_shoulder_press: BASE + '272d4df52_generated_image.png',
  arnold_press: BASE + '51349b80e_generated_image.png',
  lateral_raise: BASE + 'f0b81e62f_generated_image.png',
  upright_row: BASE + '0342e0ff4_generated_image.png',
  reverse_dumbbell_fly: BASE + 'd96d78f38_generated_image.png',
  // Back (male athlete photos)
  barbell_row: BASE + '4624a6cf1_generated_image.png',
  lat_pulldown: BASE + '9aa048cd6_generated_image.png',
  pull_ups: BASE + '446991878_generated_image.png',
  chin_up: BASE + 'c8cfc317d_generated_image.png',
  seated_cable_row: BASE + 'eeba2dde7_generated_image.png',
  face_pulls: BASE + 'c6a4e95f8_generated_image.png',
  t_bar_row: BASE + '25888bb65_generated_image.png',
  straight_arm_pulldown: null,
  // Arms — no default photo, user can upload
  bicep_curl: null,
  dumbbell_curl: null,
  preacher_curl: null,
  overhead_tricep_extension: null,
  triceps_dip: null,
  cable_pushdown: null,
  // Legs — no default photo, user can upload
  goblet_squat: null,
  squat: null,
  front_squat: null,
  bulgarian_split_squat: null,
  deadlift: null,
  sumo_deadlift: null,
  dumbbell_rdl: null,
  leg_extension: null,
  leg_curl: null,
  calf_raise: null,
  hip_thrust: null,
  walking_lunge: null,
  // Core — no default photo, user can upload
  plank: null,
  crunch: null,
  russian_twist: null,
  hanging_leg_raise: null,
  // Functional / Cardio — no default photo, user can upload
  kettlebell_swing: null,
  jump_rope: null,
  battle_ropes: null,
};

// Comprehensive map: every exercise slug/name (normalized) -> photo (or null).
const MAP = {
  // ===== CHEST =====
  barbell_bench_press: IMG.bench_press,
  bench_press: IMG.bench_press,
  paused_bench_press: IMG.bench_press,
  close_grip_bench_press: IMG.bench_press,
  decline_barbell_bench_press: IMG.bench_press,
  smith_machine_bench_press: IMG.bench_press,
  dumbbell_bench_press: IMG.dumbbell_bench_press,
  dumbbell_floor_press: IMG.dumbbell_bench_press,
  incline_barbell_bench_press: IMG.incline_bench_press,
  incline_dumbbell_bench_press: IMG.incline_bench_press,
  incline_dumbbell_chest_press: IMG.incline_bench_press,
  incline_barbell_press: IMG.incline_bench_press,
  incline_dumbbell_press: IMG.incline_bench_press,
  landmine_chest_press: IMG.incline_bench_press,
  decline_dumbbell_press: IMG.bench_press,
  machine_chest_press: IMG.machine_chest_press,
  cable_chest_press: IMG.machine_chest_press,
  cable_crossover: IMG.cable_crossover,
  cable_fly: IMG.cable_crossover,
  low_to_high_cable_fly: IMG.cable_crossover,
  high_to_low_cable_fly: IMG.cable_crossover,
  dumbbell_fly: IMG.dumbbell_fly,
  incline_dumbbell_fly: IMG.dumbbell_fly,
  machine_pec_deck: IMG.cable_crossover,
  reverse_pec_deck: IMG.reverse_dumbbell_fly,
  push_up: IMG.push_up,
  push_ups: IMG.push_up,
  decline_push_up: IMG.push_up,
  incline_push_up: IMG.push_up,
  diamond_push_up: IMG.push_up,
  diamond_push_up_bw: IMG.push_up,
  chest_dip: IMG.dips,
  dips: IMG.dips,
  weighted_chest_dip: IMG.dips,
  triceps_dip: IMG.triceps_dip,
  bench_dip: IMG.triceps_dip,

  // ===== BACK =====
  conventional_deadlift: IMG.deadlift,
  sumo_deadlift: IMG.sumo_deadlift,
  rack_pull: IMG.deadlift,
  stiff_leg_deadlift: IMG.deadlift,
  barbell_row: IMG.barbell_row,
  barbell_bent_over_row: IMG.barbell_row,
  pendlay_row: IMG.barbell_row,
  landmine_row: IMG.barbell_row,
  meadows_row: IMG.barbell_row,
  chest_supported_dumbbell_row: IMG.barbell_row,
  one_arm_dumbbell_row: IMG.barbell_row,
  machine_row: IMG.seated_cable_row,
  seated_cable_row: IMG.seated_cable_row,
  lat_pulldown: IMG.lat_pulldown,
  close_grip_lat_pulldown: IMG.lat_pulldown,
  neutral_grip_lat_pulldown: IMG.lat_pulldown,
  straight_arm_pulldown: IMG.straight_arm_pulldown,
  pull_up: IMG.pull_ups,
  pull_ups: IMG.pull_ups,
  chin_up: IMG.chin_up,
  inverted_row: IMG.barbell_row,
  muscle_up: IMG.pull_ups,
  dumbbell_pullover: IMG.barbell_row,
  cable_pullover: IMG.barbell_row,
  face_pull: IMG.face_pulls,
  face_pulls: IMG.face_pulls,
  barbell_shrug: IMG.upright_row,
  dumbbell_shrug: IMG.upright_row,
  dumbbell_shrugs: IMG.upright_row,
  farmer_carry: IMG.deadlift,
  suitcase_carry: IMG.deadlift,
  dead_hang: IMG.pull_ups,

  // ===== SHOULDERS =====
  barbell_overhead_press: IMG.overhead_press,
  overhead_shoulder_press: IMG.overhead_press,
  dumbbell_overhead_press: IMG.overhead_press,
  dumbbell_shoulder_press: IMG.dumbbell_shoulder_press,
  seated_dumbbell_shoulder_press: IMG.dumbbell_shoulder_press,
  seated_barbell_shoulder_press: IMG.overhead_press,
  smith_machine_shoulder_press: IMG.overhead_press,
  machine_shoulder_press: IMG.overhead_press,
  arnold_press: IMG.arnold_press,
  dumbbell_lateral_raise: IMG.lateral_raise,
  cable_lateral_raise: IMG.lateral_raise,
  machine_lateral_raise: IMG.lateral_raise,
  dumbbell_front_raise: IMG.lateral_raise,
  cable_front_raise: IMG.lateral_raise,
  reverse_dumbbell_fly: IMG.reverse_dumbbell_fly,
  cable_rear_delt_fly: IMG.reverse_dumbbell_fly,
  upright_row: IMG.upright_row,
  landmine_press: IMG.overhead_press,
  push_press: IMG.overhead_press,
  push_jerk: IMG.overhead_press,
  handstand_push_up: IMG.overhead_press,
  high_pull: IMG.upright_row,

  // ===== BICEPS =====
  barbell_curl: IMG.bicep_curl,
  barbell_bicep_curl: IMG.bicep_curl,
  biceps_barbell_curl: IMG.bicep_curl,
  ez_bar_curl: IMG.bicep_curl,
  ez_bar_bicep_curl: IMG.bicep_curl,
  dumbbell_curl: IMG.dumbbell_curl,
  alternating_dumbbell_curl: IMG.dumbbell_curl,
  hammer_curl: IMG.bicep_curl,
  hammer_curls: IMG.bicep_curl,
  dumbbell_hammer_curls: IMG.bicep_curl,
  cross_body_hammer_curl: IMG.bicep_curl,
  cable_curl: IMG.bicep_curl,
  preacher_curl: IMG.preacher_curl,
  concentration_curl: IMG.preacher_curl,
  spider_curl: IMG.bicep_curl,
  zottman_curl: IMG.bicep_curl,
  reverse_curl: IMG.bicep_curl,

  // ===== TRICEPS =====
  cable_pushdown: IMG.cable_pushdown,
  rope_pushdown: IMG.cable_pushdown,
  triceps_rope_pushdown: IMG.cable_pushdown,
  tricep_rope_pushdown: IMG.cable_pushdown,
  skull_crusher: IMG.overhead_tricep_extension,
  skull_crushers: IMG.overhead_tricep_extension,
  overhead_cable_extension: IMG.overhead_tricep_extension,
  overhead_cable_tricep_extension: IMG.overhead_tricep_extension,
  dumbbell_overhead_extension: IMG.overhead_tricep_extension,

  // ===== LEGS — Squat variations =====
  back_squat: IMG.squat,
  barbell_back_squat: IMG.squat,
  front_squat: IMG.front_squat,
  box_squat: IMG.squat,
  paused_squat: IMG.squat,
  safety_bar_squat: IMG.squat,
  smith_machine_squat: IMG.squat,
  hack_squat: IMG.squat,
  zercher_squat: IMG.squat,
  goblet_squat: IMG.goblet_squat,
  dumbbell_squat: IMG.goblet_squat,
  sumo_squat: IMG.squat,
  bodyweight_squat: IMG.goblet_squat,
  jump_squat: IMG.squat,
  bulgarian_split_squat: IMG.bulgarian_split_squat,
  bulgarian_split_squats: IMG.bulgarian_split_squat,
  leg_press: IMG.squat,
  leg_extension: IMG.leg_extension,
  leg_extensions: IMG.leg_extension,
  wall_sit: IMG.squat,

  // ===== LEGS — Hinge / Hamstrings / Glutes =====
  romanian_deadlift: IMG.dumbbell_rdl,
  dumbbell_romanian_deadlift: IMG.dumbbell_rdl,
  lying_leg_curl: IMG.leg_curl,
  lying_leg_curls: IMG.leg_curl,
  seated_leg_curl: IMG.leg_curl,
  standing_leg_curl: IMG.leg_curl,
  glute_ham_raise: IMG.leg_curl,
  nordic_hamstring_curl: IMG.leg_curl,
  barbell_hip_thrust: IMG.hip_thrust,
  hip_thrust: IMG.hip_thrust,
  smith_machine_hip_thrust: IMG.hip_thrust,
  single_leg_hip_thrust: IMG.hip_thrust,
  glute_bridge: IMG.hip_thrust,
  barbell_glute_bridge: IMG.hip_thrust,
  cable_glute_kickback: IMG.hip_thrust,
  cable_kickback: IMG.hip_thrust,
  cable_pull_through: IMG.deadlift,
  cable_hip_abduction: IMG.hip_thrust,
  hip_abduction_machine: IMG.hip_thrust,
  clamshell: IMG.hip_thrust,
  good_morning: IMG.deadlift,
  reverse_hyperextension: IMG.hip_thrust,

  // ===== LEGS — Calves / Lunges =====
  standing_calf_raise: IMG.calf_raise,
  standing_calf_raises: IMG.calf_raise,
  seated_calf_raise: IMG.calf_raise,
  single_leg_calf_raise: IMG.calf_raise,
  dumbbell_standing_calf_raise: IMG.calf_raise,
  leg_press_calf_raise: IMG.calf_raise,
  tibialis_raise: IMG.calf_raise,
  walking_lunge: IMG.walking_lunge,
  walking_lunges: IMG.walking_lunge,
  lunge: IMG.walking_lunge,
  reverse_lunge: IMG.walking_lunge,
  step_up: IMG.walking_lunge,
  dumbbell_thruster: IMG.squat,
  thruster: IMG.squat,

  // ===== CORE =====
  plank: IMG.plank,
  plank_hold: IMG.plank,
  side_plank: IMG.plank,
  crunch: IMG.crunch,
  bicycle_crunch: IMG.crunch,
  cable_crunch: IMG.crunch,
  v_up: IMG.crunch,
  hanging_knee_raise: IMG.hanging_leg_raise,
  hanging_leg_raise: IMG.hanging_leg_raise,
  hanging_leg_raises: IMG.hanging_leg_raise,
  russian_twist: IMG.russian_twist,
  cable_wood_chop: IMG.russian_twist,
  mountain_climber: IMG.plank,
  bird_dog: IMG.plank,
  dead_bug: IMG.plank,
  l_sit: IMG.plank,
  ab_wheel_rollout: IMG.plank,
  pallof_press: IMG.plank,

  // ===== FUNCTIONAL =====
  kettlebell_swing: IMG.kettlebell_swing,
  turkish_get_up: IMG.kettlebell_swing,
  burpee: IMG.push_up,
  bear_crawl: IMG.plank,
  plate_pinch: IMG.bicep_curl,
  wrist_roller: IMG.bicep_curl,
  barbell_wrist_curl: IMG.bicep_curl,
  reverse_wrist_curl: IMG.bicep_curl,
  sled_pull: IMG.barbell_row,
  sled_push: IMG.squat,
  clean_and_jerk: IMG.deadlift,
  hang_clean: IMG.deadlift,
  power_clean: IMG.deadlift,
  snatch: IMG.deadlift,
  hang_snatch: IMG.deadlift,
  power_snatch: IMG.deadlift,
  split_jerk: IMG.overhead_press,

  // ===== CARDIO =====
  jump_rope: IMG.jump_rope,
  battle_ropes: IMG.battle_ropes,
  treadmill_running: IMG.jump_rope,
  treadmill_walking: IMG.jump_rope,
  outdoor_running: IMG.jump_rope,
  outdoor_walking: IMG.jump_rope,
  outdoor_cycling: IMG.jump_rope,
  stationary_bike: IMG.jump_rope,
  spin_bike: IMG.jump_rope,
  air_bike: IMG.jump_rope,
  elliptical: IMG.jump_rope,
  rowing_machine: IMG.seated_cable_row,
  stair_climber: IMG.squat,
  hiking: IMG.jump_rope,
  swimming: IMG.jump_rope,
  incline_walking: IMG.jump_rope,
  ski_erg: IMG.seated_cable_row,
};

// Muscle-group-based fallback for custom exercises not in the MAP.
// Only groups with male-athlete photos have a fallback; others return null.
const GROUP_FALLBACK = {
  Chest: IMG.bench_press,
  Back: IMG.barbell_row,
  Shoulders: IMG.overhead_press,
};

function normalize(name) {
  return (name || '')
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

// name: exercise name or slug. muscleGroup: optional muscle group for smart fallback.
// Returns null when no male-athlete photo is available — caller should show placeholder.
export function getExerciseImage(name, muscleGroup) {
  if (!name) return null;
  const key = normalize(name);
  if (MAP[key]) return MAP[key];
  if (muscleGroup && GROUP_FALLBACK[muscleGroup]) return GROUP_FALLBACK[muscleGroup];
  return null;
}

// Load a user-uploaded photo for an exercise from localStorage.
export function getUserExercisePhoto(slug) {
  if (!slug) return null;
  return localStorage.getItem(`exercise_photo_${slug}`);
}