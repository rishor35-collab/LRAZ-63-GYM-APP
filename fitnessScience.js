// Fitness science calculations — versioned, evidence-based.
// All formulas are estimates; never present as clinical measurements.

export const CALC_VERSION = '1.0.0';

export const kgToLbs = (kg) => kg * 2.2046226218;
export const lbsToKg = (lbs) => lbs / 2.2046226218;
export const cmToIn = (cm) => cm / 2.54;
export const inToCm = (inches) => inches * 2.54;

// BMR — Mifflin-St Jeor (1990), widely adopted estimate.
export function calcBMR({ weightKg, heightCm, age, sex }) {
  if (!weightKg || !heightCm || !age) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'female' ? base - 161 : base + 5;
}

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
};

export function calcTDEE(bmr, activity = 'moderate') {
  if (!bmr) return null;
  return bmr * (ACTIVITY_MULTIPLIERS[activity] || 1.55);
}

export function calcCalorieTarget(tdee, goal, ratePreference = 'Moderate') {
  if (!tdee) return null;
  const rateFactor = ratePreference === 'Conservative' ? 0.85 : ratePreference === 'Faster' ? 0.78 : 0.82;
  const surplusFactor = ratePreference === 'Conservative' ? 1.05 : ratePreference === 'Faster' ? 1.12 : 1.08;
  if (goal === 'Fat Loss') return Math.round(tdee * rateFactor);
  if (goal === 'Muscle Gain' || goal === 'Strength Gain') return Math.round(tdee * surplusFactor);
  if (goal === 'Body Recomposition') return Math.round(tdee * 0.98);
  return Math.round(tdee);
}

export function calcMacros({ weightKg, calorieTarget, goal }) {
  if (!weightKg || !calorieTarget) return null;
  const proteinPerKg = goal === 'Fat Loss' ? 2.2 : goal === 'Muscle Gain' ? 1.8 : 2.0;
  const proteinG = Math.round(weightKg * proteinPerKg);
  const fatG = Math.round(weightKg * 0.9);
  const proteinCal = proteinG * 4;
  const fatCal = fatG * 9;
  const carbCal = Math.max(0, calorieTarget - proteinCal - fatCal);
  const carbG = Math.round(carbCal / 4);
  const fiberG = Math.round((calorieTarget / 1000) * 14);
  const waterMl = Math.round(weightKg * 35);
  return { proteinG, carbG, fatG, fiberG, waterMl };
}

// Estimated one-rep max. Epley (1 + reps/30) for reps ≤ 12, Brzycki (37 - reps)
// for 13-20 reps; reps capped at 20 so very high-rep sets don't overestimate.
// Returns null for invalid/non-positive inputs. Always an estimate, not a measurement.
export function estimate1RM(weightKg, reps) {
  const w = Number(weightKg), r = Number(reps);
  if (!isFinite(w) || !isFinite(r) || w <= 0 || r < 1) return null;
  if (r === 1) return +w.toFixed(1);
  const rr = Math.min(20, r); // cap influence of very high-rep sets
  if (rr <= 12) return +(w * (1 + rr / 30)).toFixed(1); // Epley
  return +((w * 36) / (37 - rr)).toFixed(1); // Brzycki
}

export function calcBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  return +(weightKg / (m * m)).toFixed(1);
}

// Navy method — clearly labeled estimate
export function navyBodyFat({ sex, heightCm, neckCm, waistCm, hipCm }) {
  if (!heightCm || !neckCm || !waistCm) return null;
  if (sex === 'female' && !hipCm) return null;
  if (sex === 'female') {
    const v = 163.205 * Math.log10(waistCm + hipCm - neckCm) - 97.684 * Math.log10(heightCm) - 78.387;
    return Math.max(0, +v.toFixed(1));
  }
  const v = 86.01 * Math.log10(waistCm - neckCm) - 70.041 * Math.log10(heightCm) + 36.76;
  return Math.max(0, +v.toFixed(1));
}

export function fatMassLeanMass(weightKg, bodyFatPercent) {
  if (!weightKg || bodyFatPercent == null) return { fatMass: null, leanMass: null };
  const fatMass = +(weightKg * bodyFatPercent / 100).toFixed(1);
  const leanMass = +(weightKg - fatMass).toFixed(1);
  return { fatMass, leanMass };
}

export function calcFFMI(weightKg, bodyFatPercent, heightCm) {
  if (!weightKg || bodyFatPercent == null || !heightCm) return null;
  const ffm = weightKg * (1 - bodyFatPercent / 100);
  const m = heightCm / 100;
  return +(ffm / (m * m)).toFixed(1);
}

export function waistToHeight(waistCm, heightCm) {
  if (!waistCm || !heightCm) return null;
  return +(waistCm / heightCm).toFixed(2);
}
export function waistToHip(waistCm, hipCm) {
  if (!waistCm || !hipCm) return null;
  return +(waistCm / hipCm).toFixed(2);
}

export function rollingAverage(values, window) {
  if (!values || values.length < window) return null;
  const slice = values.slice(-window);
  return +(slice.reduce((a, b) => a + b, 0) / slice.length).toFixed(1);
}

// Trailing moving-average series (one output per input, trailing window).
export function movingAverage(values, window = 7) {
  if (!values || !values.length) return [];
  const out = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    out.push(+(slice.reduce((a, b) => a + (isFinite(b) ? b : 0), 0) / slice.length).toFixed(2));
  }
  return out;
}

// Smoothed average of the most recent `window` numeric values. Falls back to the
// overall average when fewer than `window` points exist; null when empty.
export function smoothedAverage(values, window = 7) {
  const v = (values || []).filter((x) => x != null && isFinite(x));
  if (!v.length) return null;
  const slice = v.slice(-window);
  return +(slice.reduce((a, b) => a + b, 0) / slice.length).toFixed(2);
}

// Sufficient-data gate: true when at least `min` valid (finite, non-null) samples exist.
export function sufficientData(values, min) {
  const n = Array.isArray(values) ? values.filter((x) => x != null && isFinite(x)).length : (values != null ? 1 : 0);
  return n >= min;
}

export function weeklyRateOfChange(values) {
  if (!values || values.length < 2) return null;
  const recent = values.slice(-7);
  const prior = values.slice(-14, -7);
  if (prior.length === 0) return null;
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const priorAvg = prior.reduce((a, b) => a + b, 0) / prior.length;
  return +(recentAvg - priorAvg).toFixed(1);
}

export function trendDirection(values) {
  const r = weeklyRateOfChange(values);
  if (r == null) return 'insufficient';
  if (Math.abs(r) < 0.15) return 'stable';
  return r > 0 ? 'increasing' : 'decreasing';
}

export function dataConfidence(sampleSize, consistency = 1) {
  if (!sampleSize || sampleSize < 3) return 'Insufficient Data';
  if (sampleSize < 7) return 'Low Confidence';
  if (consistency < 0.6) return 'Low Confidence';
  if (sampleSize < 14) return 'Moderate Confidence';
  return 'High Confidence';
}

export function wilksScore(totalKg, bodyweightKg, sex) {
  if (!totalKg || !bodyweightKg) return null;
  const coeff = sex === 'female'
    ? 0.7528583238 / Math.pow(bodyweightKg, 0.1537689053)
    : 0.7906124566 / Math.pow(bodyweightKg, 0.1618720159);
  return +((totalKg * coeff * 100) / 0.7906124566).toFixed(1);
}

export function dotsScore(totalKg, bodyweightKg, sex) {
  if (!totalKg || !bodyweightKg) return null;
  const c = sex === 'female'
    ? [0.7528583238, 0.1537689053]
    : [0.7906124566, 0.1618720159];
  return +((totalKg * 500) / (c[0] * Math.pow(bodyweightKg, c[1]))).toFixed(1);
}

// Warm-up ramp planner. Deterministic percentages of the work-set weight.
// Weights rounded to the nearest 2.5 kg (and never below bar weight).
export function computeWarmupSets(workWeightKg, barWeightKg = 20) {
  if (!workWeightKg || workWeightKg <= 0) return [];
  const w = Number(workWeightKg);
  const steps = [
    { pct: 0.40, reps: 8, label: 'General warm-up' },
    { pct: 0.55, reps: 5, label: 'Prep' },
    { pct: 0.70, reps: 3, label: 'Activation' },
    { pct: 0.80, reps: 2, label: 'Heavy prep' },
    { pct: 0.90, reps: 1, label: 'Readiness' },
  ];
  return steps.map((s) => {
    const target = Math.max(barWeightKg, Math.round((w * s.pct) / 2.5) * 2.5);
    return { ...s, weight: target, pct: Math.round(s.pct * 100) };
  });
}