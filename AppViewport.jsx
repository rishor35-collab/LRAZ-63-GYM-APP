import { useEffect } from 'react';

export default function AppViewport() {
  useEffect(() => {
    const viewport = window.visualViewport;
    const root = document.documentElement;
    let frame = 0, lastHeight, lastTop, lastKeyboard;
    const apply = () => {
      frame = 0;
      const height = Math.round(viewport?.height || window.innerHeight);
      const top = Math.round(viewport?.offsetTop || 0);
      const keyboard = !!viewport && window.innerHeight - height > 150;
      if (height !== lastHeight) { root.style.setProperty('--app-viewport-height', `${height}px`); lastHeight = height; }
      if (top !== lastTop) { root.style.setProperty('--app-viewport-top', `${top}px`); lastTop = top; }
      if (keyboard !== lastKeyboard) { root.classList.toggle('keyboard-open', keyboard); lastKeyboard = keyboard; }
    };
    const update = () => { if (!frame) frame = requestAnimationFrame(apply); };
    apply();
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return null;
}