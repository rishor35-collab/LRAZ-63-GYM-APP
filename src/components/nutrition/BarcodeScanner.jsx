import React, { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, X, Check, AlertCircle, Search } from 'lucide-react';
import { cn, localDateStr } from '@/lib/utils';
import { foodItemToFood } from '@/lib/foodDatabase';
import MobileSheet from '@/components/nutrition/MobileSheet';

// Barcode scanner using the native BarcodeDetector API where available, with
// manual barcode entry fallback. Looks up the barcode in the user's custom
// FoodItem records first; if not found, lets the user enter nutrition manually.
// Deterministic — no AI, no credits.
export default function BarcodeScanner({ selectedMeal, onLogged, onClose }) {
  const [mode, setMode] = useState('idle'); // idle | scanning | found | notfound
  const [barcode, setBarcode] = useState('');
  const [food, setFood] = useState(null);
  const [qty, setQty] = useState(1);
  const [saving, setSaving] = useState(false);
  const [manual, setManual] = useState({ name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', serving_size: 100, serving_unit: 'g' });
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  const hasBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = async () => {
    if (!hasBarcodeDetector) return;
    setMode('scanning');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });
      const tick = async () => {
        try {
          const codes = await detector.detect(video);
          if (codes && codes.length) {
            setBarcode(codes[0].rawValue);
            stopCamera();
            lookupBarcode(codes[0].rawValue);
            return;
          }
        } catch (e) { /* frame not ready */ }
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      setMode('idle');
      console.error('Camera error', e);
    }
  };

  const lookupBarcode = async (code) => {
    try {
      const items = await base44.entities.FoodItem.filter({ barcode: code });
      if (items && items.length) {
        setFood(foodItemToFood(items[0]));
        setMode('found');
      } else {
        setMode('notfound');
      }
    } catch (e) {
      setMode('notfound');
    }
  };

  const manualLookup = () => {
    if (!barcode.trim()) return;
    lookupBarcode(barcode.trim());
  };

  const logFood = async (f) => {
    setSaving(true);
    try {
      const factor = Number(qty) || 1;
      const today = localDateStr();
      await base44.entities.NutritionLog.create({
        date: today, meal: selectedMeal, food_name: f.name,
        quantity: factor * (f.quantity || 1), unit: f.unit || 'serving',
        calories: Math.round((f.calories || 0) * factor),
        protein_g: +((f.protein_g || 0) * factor).toFixed(1),
        carbs_g: +((f.carbs_g || 0) * factor).toFixed(1),
        fat_g: +((f.fat_g || 0) * factor).toFixed(1),
        fiber_g: +((f.fiber_g || 0) * factor).toFixed(1),
        sugar_g: +((f.sugar_g || 0) * factor).toFixed(1),
        sodium_mg: Math.round((f.sodium_mg || 0) * factor),
        source: 'Barcode', is_ai_estimated: false, logged_at: new Date().toISOString(),
      });
      onLogged();
      onClose();
    } catch (e) { setSaving(false); }
  };

  const saveManual = async () => {
    if (!manual.name.trim() || !manual.calories) return;
    setSaving(true);
    try {
      const today = localDateStr();
      const f = {
        name: manual.name,
        calories: Number(manual.calories) || 0,
        protein_g: Number(manual.protein_g) || 0,
        carbs_g: Number(manual.carbs_g) || 0,
        fat_g: Number(manual.fat_g) || 0,
        unit: manual.serving_unit,
        quantity: 1,
      };
      // Save as custom food with barcode for future scans
      await base44.entities.FoodItem.create({
        name: manual.name, barcode: barcode.trim(),
        serving_size: Number(manual.serving_size) || 100, serving_unit: manual.serving_unit,
        calories_per_serving: f.calories, protein_g: f.protein_g, carbs_g: f.carbs_g, fat_g: f.fat_g,
        category: 'Custom', is_custom: true,
      }).catch(() => {});
      await logFood(f);
    } catch (e) { setSaving(false); }
  };

  return (
    <MobileSheet onClose={onClose} onBackdropClick={() => { stopCamera(); onClose(); }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Barcode Scanner</h3>
          <Button variant="ghost" size="sm" onClick={() => { stopCamera(); onClose(); }}><X size={18} /></Button>
        </div>

        {mode === 'idle' && (
          <div className="space-y-4">
            {hasBarcodeDetector ? (
              <Button className="w-full bg-luxury-blue glow-blue min-h-[48px]" onClick={startCamera}><Camera size={18} /> Start Camera Scan</Button>
            ) : (
              <div className="glass rounded-xl p-3 flex items-start gap-2 border border-luxury-gold/30">
                <AlertCircle size={16} className="text-luxury-gold shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">Camera barcode scanning isn't supported on this browser. Enter the barcode manually below.</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Enter barcode…" className="glass h-11 tabular-nums" inputMode="numeric" />
              <Button variant="outline" className="glass" onClick={manualLookup} disabled={!barcode.trim()}><Search size={16} /> Look Up</Button>
            </div>
          </div>
        )}

        {mode === 'scanning' && (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-4/5 h-16 border-2 border-luxury-blue rounded-lg" />
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground">Point the camera at a product barcode…</p>
            <Button variant="outline" className="w-full glass" onClick={() => { stopCamera(); setMode('idle'); }}>Cancel</Button>
          </div>
        )}

        {mode === 'found' && food && (
          <div className="space-y-3 animate-fade-up">
            <div className="rounded-xl glass p-3">
              <p className="font-semibold text-sm">{food.name}</p>
              <p className="text-[11px] text-muted-foreground mb-2">Barcode: {barcode}</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <Macro label="kcal" value={Math.round(food.calories || 0)} accent="red" />
                <Macro label="P" value={Math.round(food.protein_g || 0)} accent="blue" />
                <Macro label="C" value={Math.round(food.carbs_g || 0)} />
                <Macro label="F" value={Math.round(food.fat_g || 0)} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Servings</span>
              <Input type="text" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} className="glass h-9 w-20 text-center tabular-nums" />
            </div>
            <Button className="w-full bg-luxury-red glow-red min-h-[44px]" onClick={() => logFood(food)} disabled={saving}>{saving ? 'Saving…' : <><Check size={16} /> Log It</>}</Button>
          </div>
        )}

        {mode === 'notfound' && (
          <div className="space-y-3 animate-fade-up">
            <div className="glass rounded-xl p-3 flex items-start gap-2 border border-luxury-gold/30">
              <AlertCircle size={16} className="text-luxury-gold shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">No food found for barcode <span className="tabular-nums">{barcode}</span>. Enter the nutrition from the label and it'll be saved for future scans.</p>
            </div>
            <Input value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} placeholder="Food name" className="glass h-10" />
            <div className="grid grid-cols-4 gap-2">
              <Input type="text" inputMode="decimal" value={manual.calories} onChange={(e) => setManual({ ...manual, calories: e.target.value })} placeholder="kcal" className="glass h-10 text-center text-xs tabular-nums" />
              <Input type="text" inputMode="decimal" value={manual.protein_g} onChange={(e) => setManual({ ...manual, protein_g: e.target.value })} placeholder="P g" className="glass h-10 text-center text-xs tabular-nums" />
              <Input type="text" inputMode="decimal" value={manual.carbs_g} onChange={(e) => setManual({ ...manual, carbs_g: e.target.value })} placeholder="C g" className="glass h-10 text-center text-xs tabular-nums" />
              <Input type="text" inputMode="decimal" value={manual.fat_g} onChange={(e) => setManual({ ...manual, fat_g: e.target.value })} placeholder="F g" className="glass h-10 text-center text-xs tabular-nums" />
            </div>
            <Button className="w-full bg-luxury-blue glow-blue min-h-[44px]" onClick={saveManual} disabled={saving || !manual.name.trim() || !manual.calories}>{saving ? 'Saving…' : <><Check size={16} /> Save & Log</>}</Button>
          </div>
        )}
    </MobileSheet>
  );
}

function Macro({ label, value, accent }) {
  return (
    <div className="flex flex-col">
      <span className={cn('text-base font-bold tabular-nums', accent === 'red' ? 'text-luxury-red' : accent === 'blue' ? 'text-luxury-blue' : 'text-foreground')}>{value}</span>
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}