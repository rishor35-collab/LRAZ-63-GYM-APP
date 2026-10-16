import React, { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import BottomNav from '@/components/BottomNav';
import FloatingCoach from '@/components/FloatingCoach';
import DesktopSidebar from '@/components/DesktopSidebar';
import { startLiveNotificationScheduler } from '@/lib/reminders';
import { ensureMyProfile } from '@/lib/social';

const PageSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 border-4 border-luxury-blue/30 border-t-luxury-blue rounded-full animate-spin" />
  </div>
);

export default function AppLayout() {
  const location = useLocation();
  useEffect(() => {
    const cleanup = startLiveNotificationScheduler();
    ensureMyProfile().catch(() => {});
    import('@/lib/pushNotifications').then((m) => m.requestPushPermission()).catch(() => {});
    return cleanup;
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground safe-pt">
      <DesktopSidebar />
      <main className="min-h-screen md:pl-56">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <Suspense fallback={<PageSpinner />}>
            <Outlet />
          </Suspense>
        </motion.div>
      </main>
      <FloatingCoach />
      <BottomNav />
    </div>
  );
}