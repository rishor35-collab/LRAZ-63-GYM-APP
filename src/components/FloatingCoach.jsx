import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';

export default function FloatingCoach() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  if (location.pathname.startsWith('/messages') || location.pathname.startsWith('/nutrition')) return null;

  return (
    <>
      <button
        onClick={() => navigate('/coach')}
        className="floating-coach-btn fixed bottom-32 right-4 z-40 group md:bottom-6"
        aria-label="Training Insights"
      >
        <span
          className="absolute inset-0 rounded-full blur-xl animate-pulse-glow"
          style={{ background: 'var(--coach-glow, var(--coach-bg, hsl(var(--luxury-blue) / 0.4)))' }}
        />
        <span
          className="relative flex items-center justify-center w-14 h-14 rounded-full border"
          style={{
            background: 'var(--coach-bg, linear-gradient(135deg, hsl(240 10% 9%) 0%, hsl(240 8% 13%) 50%, hsl(var(--luxury-blue-deep) / 0.5) 100%))',
            borderColor: 'var(--coach-glow, var(--coach-bg, hsl(var(--luxury-blue) / 0.5)))',
            boxShadow: '0 0 24px -4px var(--coach-glow, var(--coach-bg, hsl(var(--luxury-blue) / 0.45)))',
          }}
        >
          <TrendingUp size={24} style={{ color: 'var(--coach-icon, #ffffff)' }} />
        </span>
      </button>
    </>
  );
}