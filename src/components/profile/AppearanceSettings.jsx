import React, { useState } from 'react';
import { useTheme, THEMES, ACCENTS, FONTS } from '@/lib/ThemeContext';
import { Card } from '@/components/ui/fitness';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Palette, Check, TrendingUp } from 'lucide-react';

export default function AppearanceSettings() {
  const { theme, accent, customAccent, oled, font, density, radius, cardStyle, reducedMotion, bgImage, coachColors, setTheme, setAccent, setCustomAccent, setOled, setFont, setDensity, setRadius, setCardStyle, setReducedMotion, setBgImage, setCoachColors } = useTheme();

  return (
    <Card className="mb-4">
      <p className="text-sm font-semibold mb-1 flex items-center gap-2"><Palette size={15} className="text-luxury-blue" /> Appearance</p>
      <p className="text-[11px] text-muted-foreground mb-3">Premium themes adapt every screen, chart, and sheet instantly.</p>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              'relative rounded-xl p-2.5 text-left border transition-all min-h-[64px]',
              theme === t.id ? 'border-luxury-blue ring-1 ring-luxury-blue/40' : 'border-border glass'
            )}
          >
            <ThemePreview themeId={t.id} />
            <div className="mt-2">
              <p className="text-xs font-semibold">{t.name}</p>
              <p className="text-[10px] text-muted-foreground">{t.desc}</p>
            </div>
            {theme === t.id && <Check size={14} className="absolute top-2 right-2 text-luxury-blue" />}
          </button>
        ))}
      </div>

      {theme === 'custom' && <CustomThemeBuilder />}

      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Accent</p>
      <div className="flex gap-2 flex-wrap mb-4">
        {ACCENTS.map((a) => (
          <button
            key={a.id}
            onClick={() => setAccent(a.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all min-h-[36px]',
              accent === a.id ? 'border-luxury-blue bg-luxury-blue/10 text-foreground' : 'border-border glass text-muted-foreground'
            )}
          >
            <span className="w-3 h-3 rounded-full" style={{ background: ACCENT_SWATCH[a.id] }} />
            {a.name}
          </button>
        ))}
      </div>

      {accent === 'custom' && (
        <div className="mb-4 mt-2">
          <div className="flex items-center gap-2.5 glass rounded-xl p-2.5 min-h-[52px]">
            <input type="color" value={customAccent} onChange={(e) => setCustomAccent(e.target.value)} className="w-11 h-11 rounded-lg cursor-pointer border-0 bg-transparent p-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold">Choose your color</p>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{customAccent}</p>
            </div>
            <div className="flex gap-1.5">
              {['#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F97316'].map((c) => (
                <button key={c} onClick={() => setCustomAccent(c)} className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110" style={{ background: c, borderColor: customAccent === c ? 'hsl(var(--foreground))' : 'transparent' }} />
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Font</p>
      <div className="flex gap-2 flex-wrap mb-4">
        {FONTS.map((f) => (
          <button key={f.id} onClick={() => setFont(f.id)} style={{ fontFamily: FONT_SAMPLE[f.id] }}
            className={cn('px-3 py-1.5 rounded-full text-xs border transition-all min-h-[36px]', font === f.id ? 'border-luxury-blue bg-luxury-blue/10 text-foreground' : 'border-border glass text-muted-foreground')}>{f.name}</button>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-xs font-medium">OLED / True Black</p>
          <p className="text-[10px] text-muted-foreground">Pure black background for OLED screens (dark themes).</p>
        </div>
        <Switch checked={oled} onCheckedChange={setOled} disabled={theme === 'porcelain'} />
      </div>

      <div className="border-t border-border/40 mt-4 pt-4 space-y-4">
        <OptionRow label="Interface Density" value={density} options={[['compact','Compact'],['comfortable','Comfortable'],['spacious','Spacious']]} onChange={setDensity} />
        <OptionRow label="Corner Radius" value={radius} options={[['sharp','Sharp'],['medium','Medium'],['rounded','Rounded']]} onChange={setRadius} />
        <OptionRow label="Card Appearance" value={cardStyle} options={[['subtle','Subtle'],['flat','Flat'],['elevated','Elevated']]} onChange={setCardStyle} />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium">Reduce Motion</p>
            <p className="text-[10px] text-muted-foreground">Minimize animations and transitions.</p>
          </div>
          <Switch checked={reducedMotion} onCheckedChange={setReducedMotion} />
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Background Image</p>
          <div className="flex items-center gap-2">
            <input type="url" placeholder="Paste an image URL…" value={bgImage} onChange={(e) => setBgImage(e.target.value)}
              className="flex-1 glass rounded-xl px-3 py-2 text-xs min-h-[40px] bg-transparent border border-border/50 focus:border-primary/50 outline-none" />
            {bgImage && <button onClick={() => setBgImage('')} className="text-xs text-muted-foreground px-2 min-h-[40px]">Clear</button>}
          </div>
        </div>
      </div>

      <FloatingButtonCustomizer coachColors={coachColors} setCoachColors={setCoachColors} />
    </Card>
  );
}

const COACH_PRESETS = [
  { name: 'Blue', bg: '#3B82F6', glow: '#3B82F6', icon: '#ffffff' },
  { name: 'Red', bg: '#EF4444', glow: '#EF4444', icon: '#ffffff' },
  { name: 'Green', bg: '#10B981', glow: '#10B981', icon: '#ffffff' },
  { name: 'Purple', bg: '#8B5CF6', glow: '#8B5CF6', icon: '#ffffff' },
  { name: 'Orange', bg: '#F97316', glow: '#F97316', icon: '#ffffff' },
  { name: 'Black', bg: '#1a1a1a', glow: '#3B82F6', icon: '#3B82F6' },
];

function FloatingButtonCustomizer({ coachColors, setCoachColors }) {
  const isCustom = coachColors.bg && !COACH_PRESETS.some((p) => p.bg === coachColors.bg);
  const update = (k, v) => setCoachColors({ ...coachColors, [k]: v });
  const applyPreset = (p) => setCoachColors({ bg: p.bg, glow: p.glow, icon: p.icon });
  const reset = () => setCoachColors({ bg: '', glow: '', icon: '' });
  return (
    <div className="border-t border-border/40 mt-4 pt-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium flex items-center gap-2"><TrendingUp size={14} className="text-luxury-blue" /> Floating Insights Button</p>
        <button onClick={reset} className="text-[10px] text-muted-foreground underline min-h-[32px]">Reset to default</button>
      </div>
      <p className="text-[10px] text-muted-foreground mb-3">Pick a color for the floating button on every screen.</p>

      {/* Live preview */}
      <div className="flex items-center justify-center py-4 mb-3 rounded-xl glass">
        <div className="w-16 h-16 rounded-full flex items-center justify-center border-2" style={{
          background: coachColors.bg || 'linear-gradient(135deg, hsl(240 10% 9%) 0%, hsl(240 8% 13%) 50%, hsl(var(--luxury-blue-deep) / 0.5) 100%)',
          borderColor: coachColors.glow || 'hsl(var(--luxury-blue) / 0.5)',
          boxShadow: `0 0 24px -2px ${coachColors.glow || 'hsl(var(--luxury-blue) / 0.45)'}`,
        }}>
          <TrendingUp size={26} style={{ color: coachColors.icon || '#ffffff' }} />
        </div>
      </div>

      {/* Preset swatches */}
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Quick Colors</p>
      <div className="flex gap-2.5 flex-wrap mb-4">
        {COACH_PRESETS.map((p) => {
          const active = coachColors.bg === p.bg;
          return (
            <button key={p.name} onClick={() => applyPreset(p)} className={cn('flex flex-col items-center gap-1 transition-all min-h-[52px]', active && 'scale-105')}>
              <span className={cn('w-10 h-10 rounded-full border-2 flex items-center justify-center', active ? 'border-foreground' : 'border-border/50')} style={{ background: p.bg, boxShadow: active ? `0 0 12px -2px ${p.glow}` : 'none' }}>
                {active && <Check size={16} style={{ color: p.icon }} />}
              </span>
              <span className="text-[10px] text-muted-foreground">{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* Custom color picker */}
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Custom Color</p>
      <div className="flex items-center gap-2 glass rounded-xl p-2 min-h-[48px]">
        <input type="color" value={coachColors.bg || '#3B82F6'} onChange={(e) => update('bg', e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent p-0" />
        <span className="text-xs font-mono uppercase tracking-wider flex-1">{coachColors.bg || 'Default'}</span>
        {coachColors.bg && (
          <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
            <input type="color" value={coachColors.icon || '#ffffff'} onChange={(e) => update('icon', e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0" />
            Icon
          </label>
        )}
      </div>
    </div>
  );
}

const FONT_SAMPLE = {
  inter: 'Inter, sans-serif',
  system: 'ui-sans-serif, system-ui, sans-serif',
  serif: "'Playfair Display', Georgia, serif",
  rounded: 'Quicksand, ui-sans-serif, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, monospace',
};

const ACCENT_SWATCH = {
  blue: 'hsl(220 88% 55%)',
  ice: 'hsl(198 90% 55%)',
  platinum: 'hsl(220 10% 60%)',
  emerald: 'hsl(158 60% 44%)',
  violet: 'hsl(265 68% 64%)',
  custom: 'linear-gradient(135deg, #3B82F6, #10B981, #EF4444, #8B5CF6)',
};

function ThemePreview({ themeId }) {
  const palettes = {
    obsidian: { bg: '#0a0a0c', card: '#16161a', accent: '#3B82F6' },
    midnight: { bg: '#070a14', card: '#0f1726', accent: '#3b82f6' },
    graphite: { bg: '#121212', card: '#1c1c1c', accent: '#6b8db5' },
    slate: { bg: '#0e1622', card: '#16202e', accent: '#5b91d6' },
    carbon: { bg: '#14110d', card: '#1f1a14', accent: '#f97316' },
    frost: { bg: '#0a1410', card: '#0f1f17', accent: '#10b981' },
    rose: { bg: '#0d0a0a', card: '#1a1414', accent: '#c24848' },
    onyx: { bg: '#0c0c0f', card: '#18181d', accent: '#b8b8c0' },
    porcelain: { bg: '#f5f3ee', card: '#ffffff', accent: '#3b82f6' },
    custom: { bg: '#0a0a0c', card: '#16161a', accent: '#3B82F6' },
    system: { bg: '#0a0a0c', card: '#16161a', accent: '#3B82F6' },
  };
  const p = palettes[themeId] || palettes.obsidian;
  return (
    <div className="w-full h-8 rounded-lg overflow-hidden flex" style={{ background: p.bg }}>
      <div className="flex-1" style={{ background: p.card }} />
      <div className="w-2.5" style={{ background: p.accent }} />
      <div className="w-4" style={{ background: p.card }} />
    </div>
  );
}

function CustomThemeBuilder() {
  const { setCustomTheme } = useTheme();
  const defaults = { bg: '#0a0a0c', card: '#16161a', accent: '#3B82F6', text: '#ffffff' };
  const [c, setC] = useState(() => {
    try { return { ...defaults, ...(JSON.parse(localStorage.getItem('lraz_custom') || '{}')) }; }
    catch (e) { return defaults; }
  });
  const update = (k, v) => { const next = { ...c, [k]: v }; setC(next); setCustomTheme(next); };
  return (
    <div className="mt-3 pt-3 border-t border-border/40">
      <p className="text-sm font-semibold mb-1">Build Your Theme</p>
      <p className="text-[11px] text-muted-foreground mb-3">Pick your own colors. Text color controls every font across the app.</p>
      <div className="grid grid-cols-2 gap-3">
        <ColorField label="Background" value={c.bg} onChange={(v) => update('bg', v)} />
        <ColorField label="Surface" value={c.card} onChange={(v) => update('card', v)} />
        <ColorField label="Accent" value={c.accent} onChange={(v) => update('accent', v)} />
        <ColorField label="Text Color" value={c.text} onChange={(v) => update('text', v)} />
      </div>
    </div>
  );
}

function OptionRow({ label, value, options, onChange }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
      <div className="flex gap-2">
        {options.map(([id, name]) => (
          <button key={id} onClick={() => onChange(id)}
            className={cn('flex-1 px-3 py-2 rounded-xl text-xs font-medium border transition-all min-h-[40px]',
              value === id ? 'border-primary bg-primary/10 text-foreground' : 'border-border glass text-muted-foreground')}>{name}</button>
        ))}
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 glass rounded-xl p-2 min-h-[44px]">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent p-0" />
        <span className="text-[11px] font-mono uppercase tracking-wider">{value}</span>
      </div>
    </label>
  );
}