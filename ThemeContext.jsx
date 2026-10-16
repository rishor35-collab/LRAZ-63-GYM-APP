import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

export const THEMES = [
  { id: 'obsidian', name: 'Obsidian', desc: 'Black & blue' },
  { id: 'midnight', name: 'Midnight Sapphire', desc: 'Navy & electric blue' },
  { id: 'porcelain', name: 'Arctic White', desc: 'White & graphite' },
  { id: 'frost', name: 'Emerald Elite', desc: 'Charcoal & emerald' },
  { id: 'onyx', name: 'Titanium Silver', desc: 'Graphite & silver' },
  { id: 'rose', name: 'Crimson Performance', desc: 'Black & deep red' },
  { id: 'graphite', name: 'Graphite', desc: 'Neutral dark' },
  { id: 'slate', name: 'Slate', desc: 'Cool blue-gray' },
  { id: 'carbon', name: 'Carbon', desc: 'Warm charcoal' },
  { id: 'custom', name: 'Custom', desc: 'Build your own' },
  { id: 'system', name: 'System', desc: 'Follow device' },
];

export const ACCENTS = [
  { id: 'blue', name: 'Signature Blue' },
  { id: 'ice', name: 'Ice Blue' },
  { id: 'platinum', name: 'Platinum' },
  { id: 'emerald', name: 'Emerald' },
  { id: 'violet', name: 'Violet' },
  { id: 'custom', name: 'Custom Color' },
];

export const FONTS = [
  { id: 'inter', name: 'Inter' },
  { id: 'system', name: 'System' },
  { id: 'serif', name: 'Playfair' },
  { id: 'rounded', name: 'Quicksand' },
  { id: 'mono', name: 'Mono' },
];

const FONT_MAP = {
  inter: { heading: 'Inter', body: 'Inter', display: 'Inter' },
  system: { heading: 'ui-sans-serif, system-ui, sans-serif', body: 'ui-sans-serif, system-ui, sans-serif', display: 'ui-sans-serif, system-ui, sans-serif' },
  serif: { heading: "'Playfair Display', Georgia, serif", body: 'Inter, sans-serif', display: "'Playfair Display', Georgia, serif" },
  rounded: { heading: 'Quicksand, ui-sans-serif, sans-serif', body: 'Quicksand, ui-sans-serif, sans-serif', display: 'Quicksand, ui-sans-serif, sans-serif' },
  mono: { heading: 'ui-monospace, SFMono-Regular, Menlo, monospace', body: 'ui-monospace, SFMono-Regular, Menlo, monospace', display: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
};

const LS_THEME = 'lraz_theme';
const LS_ACCENT = 'lraz_accent';
const LS_OLED = 'lraz_oled';
const LS_DENSITY = 'lraz_density';
const LS_RADIUS = 'lraz_radius';
const LS_CARDS = 'lraz_cards';
const LS_MOTION = 'lraz_motion';
const LS_BG = 'lraz_bg';
const LS_COACH_BG = 'lraz_coach_bg';
const LS_COACH_GLOW = 'lraz_coach_glow';
const LS_COACH_ICON = 'lraz_coach_icon';

function resolveTheme(t) {
  if (t === 'system') return window.matchMedia('(prefers-color-scheme: light)').matches ? 'porcelain' : 'obsidian';
  return t || 'obsidian';
}

function hexToHsl(hex) {
  let h = String(hex || '#000000').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hue = 0, sat = 0;
  const li = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    sat = li > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hue = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue /= 6;
  }
  return { h: Math.round(hue * 360), s: Math.round(sat * 100), l: Math.round(li * 100) };
}
function hslStr(c) { return `${c.h} ${c.s}% ${c.l}%`; }
function shiftL(c, dl) { return { h: c.h, s: c.s, l: Math.max(8, Math.min(96, c.l + dl)) }; }

const CUSTOM_VARS = ['--background','--foreground','--card','--card-foreground','--popover','--popover-foreground','--primary','--primary-foreground','--secondary','--secondary-foreground','--muted','--muted-foreground','--border','--input','--ring','--luxury-blue','--luxury-blue-deep','--chart-1','--sidebar-background','--sidebar-foreground','--sidebar-primary','--sidebar-primary-foreground','--sidebar-accent','--sidebar-accent-foreground','--sidebar-border','--sidebar-ring'];

function applyCustomTheme(root, c) {
  const bg = hexToHsl(c.bg), card = hexToHsl(c.card), accent = hexToHsl(c.accent), text = hexToHsl(c.text);
  const isLight = text.l < 50;
  const mutedFg = isLight ? shiftL(text, 18) : shiftL(text, -22);
  const borderC = isLight ? shiftL(card, -12) : shiftL(card, -4);
  const mutedC = isLight ? shiftL(card, -6) : shiftL(card, -2);
  const secondaryC = isLight ? shiftL(card, -3) : shiftL(card, 3);
  const blueDeep = shiftL(accent, -25);
  const onAccent = accent.l > 62 ? '0 0% 8%' : '0 0% 100%';
  const set = (k, v) => root.style.setProperty(k, v);
  set('--background', hslStr(bg));
  set('--foreground', hslStr(text));
  set('--card', hslStr(card));
  set('--card-foreground', hslStr(text));
  set('--popover', hslStr(bg));
  set('--popover-foreground', hslStr(text));
  set('--primary', hslStr(accent));
  set('--primary-foreground', onAccent);
  set('--secondary', hslStr(secondaryC));
  set('--secondary-foreground', hslStr(text));
  set('--muted', hslStr(mutedC));
  set('--muted-foreground', hslStr(mutedFg));
  set('--border', hslStr(borderC));
  set('--input', hslStr(borderC));
  set('--ring', hslStr(accent));
  set('--luxury-blue', hslStr(accent));
  set('--luxury-blue-deep', hslStr(blueDeep));
  set('--chart-1', hslStr(accent));
  set('--sidebar-background', hslStr(bg));
  set('--sidebar-foreground', hslStr(isLight ? shiftL(text, -8) : shiftL(text, -10)));
  set('--sidebar-primary', hslStr(accent));
  set('--sidebar-primary-foreground', onAccent);
  set('--sidebar-accent', hslStr(card));
  set('--sidebar-accent-foreground', hslStr(text));
  set('--sidebar-border', hslStr(borderC));
  set('--sidebar-ring', hslStr(accent));
}
function clearCustomTheme(root) { CUSTOM_VARS.forEach((k) => root.style.removeProperty(k)); }

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState(() => localStorage.getItem(LS_THEME) || 'obsidian');
  const [accent, setAccentState] = useState(() => {
    const stored = localStorage.getItem(LS_ACCENT) || 'blue';
    return stored === 'champagne' ? 'blue' : stored;
  });
  const [customAccent, setCustomAccentState] = useState(() => localStorage.getItem('lraz_custom_accent') || '#3B82F6');
  const [oled, setOledState] = useState(() => localStorage.getItem(LS_OLED) === '1');
  const [font, setFontState] = useState(() => localStorage.getItem('lraz_font') || 'inter');
  const [density, setDensityState] = useState(() => localStorage.getItem(LS_DENSITY) || 'comfortable');
  const [radius, setRadiusState] = useState(() => localStorage.getItem(LS_RADIUS) || 'medium');
  const [cardStyle, setCardStyleState] = useState(() => localStorage.getItem(LS_CARDS) || 'subtle');
  const [reducedMotion, setReducedMotionState] = useState(() => localStorage.getItem(LS_MOTION) === '1');
  const [bgImage, setBgImageState] = useState(() => localStorage.getItem(LS_BG) || '');
  const [coachColors, setCoachColorsState] = useState(() => ({
    bg: localStorage.getItem(LS_COACH_BG) || '',
    glow: localStorage.getItem(LS_COACH_GLOW) || '',
    icon: localStorage.getItem(LS_COACH_ICON) || '',
  }));

  const apply = useCallback((t, a, o, d, r, cs, rm, bg, coach, ca) => {
    const root = document.documentElement;
    const resolved = resolveTheme(t);
    root.setAttribute('data-theme', resolved);
    root.setAttribute('data-accent', a);
    const isLight = resolved === 'porcelain';
    root.classList.toggle('oled', !!o && !isLight);
    root.classList.toggle('dark', !isLight);
    root.classList.toggle('light', isLight);
    root.setAttribute('data-density', d || 'comfortable');
    root.setAttribute('data-cards', cs || 'subtle');
    root.classList.toggle('reduce-motion', !!rm);
    const radiusMap = { sharp: '0.375rem', medium: '1rem', rounded: '1.5rem' };
    root.style.setProperty('--radius', radiusMap[r || 'medium'] || '1rem');
    if (bg) { root.style.setProperty('--bg-image', `url("${bg}")`); } else { root.style.removeProperty('--bg-image'); }
    // Floating coach button colors
    const cc = coach || {};
    if (cc.bg) root.style.setProperty('--coach-bg', cc.bg); else root.style.removeProperty('--coach-bg');
    if (cc.glow) root.style.setProperty('--coach-glow', cc.glow); else root.style.removeProperty('--coach-glow');
    if (cc.icon) root.style.setProperty('--coach-icon', cc.icon); else root.style.removeProperty('--coach-icon');
    clearCustomTheme(root);
    ['--luxury-gold','--luxury-teal','--anatomy-primary','--anatomy-secondary'].forEach((k) => root.style.removeProperty(k));
    if (resolved === 'custom') {
      try { const c = JSON.parse(localStorage.getItem('lraz_custom') || '{}'); if (c.bg) applyCustomTheme(root, c); } catch (e) { /* ignore */ }
    }
    if (a === 'custom' && ca) {
      const hsl = hexToHsl(ca);
      const hslVal = hslStr(hsl);
      const deep = hslStr(shiftL(hsl, -25));
      root.style.setProperty('--primary', hslVal);
      root.style.setProperty('--luxury-blue', hslVal);
      root.style.setProperty('--luxury-blue-deep', deep);
      root.style.setProperty('--luxury-gold', hslVal);
      root.style.setProperty('--luxury-teal', hslVal);
      root.style.setProperty('--ring', hslVal);
      root.style.setProperty('--chart-1', hslVal);
      root.style.setProperty('--sidebar-primary', hslVal);
      root.style.setProperty('--sidebar-ring', hslVal);
      root.style.setProperty('--anatomy-primary', hslVal);
      root.style.setProperty('--anatomy-secondary', deep);
    }
  }, []);

  // Apply on every change
  useEffect(() => { apply(theme, accent, oled, density, radius, cardStyle, reducedMotion, bgImage, coachColors, customAccent); }, [theme, accent, oled, density, radius, cardStyle, reducedMotion, bgImage, coachColors, customAccent, apply]);

  // Apply font family
  useEffect(() => {
    const f = FONT_MAP[font] || FONT_MAP.inter;
    const root = document.documentElement;
    root.style.setProperty('--font-heading', f.heading);
    root.style.setProperty('--font-body', f.body);
    root.style.setProperty('--font-display', f.display);
  }, [font]);

  // Listen for system changes when in system mode
  useEffect(() => {
    if (theme !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => apply(theme, accent, oled, density, radius, cardStyle, reducedMotion, bgImage, coachColors, customAccent);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [theme, accent, oled, apply]);

  // Adopt profile preference once user loads (profile is source of truth when present)
  useEffect(() => {
    if (!user) return;
    const t = user.theme_preference;
    const a = user.accent_color;
    const o = user.oled_mode;
    if (t && THEMES.some((x) => x.id === t)) { setThemeState(t); localStorage.setItem(LS_THEME, t); }
    if (a && ACCENTS.some((x) => x.id === a)) { setAccentState(a); localStorage.setItem(LS_ACCENT, a); }
    if (typeof o === 'boolean') { setOledState(o); localStorage.setItem(LS_OLED, o ? '1' : '0'); }
  }, [user]);

  const persist = useCallback(async (t, a, o) => {
    localStorage.setItem(LS_THEME, t);
    localStorage.setItem(LS_ACCENT, a);
    localStorage.setItem(LS_OLED, o ? '1' : '0');
    try { if (user) await base44.auth.updateMe({ theme_preference: t, accent_color: a, oled_mode: o }); } catch (e) { /* non-fatal */ }
  }, [user]);

  const setTheme = useCallback((t) => { setThemeState(t); persist(t, accent, oled); }, [accent, oled, persist]);
  const setAccent = useCallback((a) => { setAccentState(a); persist(theme, a, oled); }, [theme, oled, persist]);
  const setOled = useCallback((o) => { setOledState(o); persist(theme, accent, o); }, [theme, accent, persist]);

  const setCustomTheme = useCallback((colors) => {
    localStorage.setItem('lraz_custom', JSON.stringify(colors));
    apply(theme, accent, oled, density, radius, cardStyle, reducedMotion, bgImage, coachColors, customAccent);
  }, [theme, accent, oled, density, radius, cardStyle, reducedMotion, bgImage, coachColors, customAccent, apply]);

  const setFont = useCallback((f) => { setFontState(f); localStorage.setItem('lraz_font', f); }, []);

  const persistAppearance = useCallback((d, r, cs, rm, bg) => {
    localStorage.setItem(LS_DENSITY, d);
    localStorage.setItem(LS_RADIUS, r);
    localStorage.setItem(LS_CARDS, cs);
    localStorage.setItem(LS_MOTION, rm ? '1' : '0');
    localStorage.setItem(LS_BG, bg || '');
  }, []);
  const setDensity = useCallback((d) => { setDensityState(d); persistAppearance(d, radius, cardStyle, reducedMotion, bgImage); }, [radius, cardStyle, reducedMotion, bgImage, persistAppearance]);
  const setRadius = useCallback((r) => { setRadiusState(r); persistAppearance(density, r, cardStyle, reducedMotion, bgImage); }, [density, cardStyle, reducedMotion, bgImage, persistAppearance]);
  const setCardStyle = useCallback((cs) => { setCardStyleState(cs); persistAppearance(density, radius, cs, reducedMotion, bgImage); }, [density, radius, reducedMotion, bgImage, persistAppearance]);
  const setReducedMotion = useCallback((rm) => { setReducedMotionState(rm); persistAppearance(density, radius, cardStyle, rm, bgImage); }, [density, radius, cardStyle, bgImage, persistAppearance]);
  const setBgImage = useCallback((bg) => { setBgImageState(bg); persistAppearance(density, radius, cardStyle, reducedMotion, bg); }, [density, radius, cardStyle, reducedMotion, persistAppearance]);

  const setCoachColors = useCallback((cc) => {
    setCoachColorsState(cc);
    localStorage.setItem(LS_COACH_BG, cc.bg || '');
    localStorage.setItem(LS_COACH_GLOW, cc.glow || '');
    localStorage.setItem(LS_COACH_ICON, cc.icon || '');
  }, []);

  const setCustomAccent = useCallback((ca) => {
    setCustomAccentState(ca);
    localStorage.setItem('lraz_custom_accent', ca);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, accent, customAccent, oled, font, density, radius, cardStyle, reducedMotion, bgImage, coachColors, setTheme, setAccent, setCustomAccent, setOled, setCustomTheme, setFont, setDensity, setRadius, setCardStyle, setReducedMotion, setBgImage, setCoachColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};