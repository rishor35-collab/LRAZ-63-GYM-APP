// Push notification helpers — deterministic, no AI.
// On native builds the platform handles device-token registration and the
// permission prompt automatically; on web we request the browser permission.
// Delivery is triggered through a backend function (service role) so a logged-in
// user can never push to another user directly. If backend functions are not
// available on the current plan, calls degrade silently — in-app notifications
// (AppNotification records) still work inside the app.
import { base44 } from '@/api/base44Client';

export async function requestPushPermission() {
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  } catch (e) { /* ignore */ }
}

export async function sendPush(user_id, title, content, action_url) {
  if (!user_id || !title || !content) return;
  try {
    await base44.functions.invoke('push-notify', { user_id, title, content, action_url });
  } catch (e) { /* backend functions may require Builder+; degrade silently */ }
}