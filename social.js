// Social + messaging helpers — deterministic, no AI. All operations use the
// Base44 client SDK and rely on per-entity RLS for authorization.
import { base44 } from '@/api/base44Client';
import { sendPush } from '@/lib/pushNotifications';

// Ensure the current user has a SocialProfile (creates one on first launch).
// Every app account automatically becomes part of the social system — no opt-in.
export async function ensureMyProfile() {
  try {
    const me = await base44.auth.me();
    if (!me) return null;
    const name = me.full_name || (me.email ? me.email.split('@')[0] : 'Athlete');
    const username = me.username || (me.email ? me.email.split('@')[0] : '');
    const avatar = me.avatar_url || '';
    const existing = await base44.entities.SocialProfile.filter({ user_id: me.id });
    if (existing && existing.length) {
      const p = existing[0];
      const patch = {};
      if (!p.display_name) patch.display_name = name;
      if (!p.username && username) patch.username = username;
      if (avatar && p.avatar_url !== avatar) patch.avatar_url = avatar;
      if (Object.keys(patch).length) {
        await base44.entities.SocialProfile.update(p.id, patch).catch(() => {});
        Object.assign(p, patch);
      }
      return p;
    }
    return await base44.entities.SocialProfile.create({
      user_id: me.id, display_name: name, username, avatar_url: avatar, is_private: !!me.profile_private,
    });
  } catch (e) { console.error('ensureMyProfile', e); return null; }
}

// Push profile fields (username, avatar, display_name, bio, is_private) to the
// current user's SocialProfile so they are visible to other users.
export async function syncMyProfile(fields) {
  try {
    const me = await base44.auth.me();
    if (!me) return;
    const arr = await base44.entities.SocialProfile.filter({ user_id: me.id });
    if (arr && arr.length) await base44.entities.SocialProfile.update(arr[0].id, fields).catch(() => {});
  } catch (e) { console.error('syncMyProfile', e); }
}

export async function getProfile(userId) {
  const arr = await base44.entities.SocialProfile.filter({ user_id: userId });
  return arr && arr.length ? arr[0] : null;
}
export async function listProfiles(limit = 100) {
  return await base44.entities.SocialProfile.list('-created_date', limit);
}
export async function getFollow(followerId, followingId) {
  const arr = await base44.entities.Follow.filter({ follower_id: followerId, following_id: followingId });
  return arr && arr.length ? arr[0] : null;
}

// Follow a user. Public profiles auto-accept; private profiles create a pending request.
export async function followUser(target, me) {
  if (!target || !me) return null;
  const existing = await getFollow(me.user_id, target.user_id);
  if (existing) return existing;
  const isPrivate = !!target.is_private;
  const status = isPrivate ? 'pending' : 'accepted';
  const rec = await base44.entities.Follow.create({
    follower_id: me.user_id, follower_name: me.display_name,
    following_id: target.user_id, following_name: target.display_name,
    status, acted_at: isPrivate ? null : new Date().toISOString(),
  });
  await notify(target.user_id, isPrivate ? 'follow_request' : 'follow', me.user_id, me.display_name,
    isPrivate ? `${me.display_name} requested to follow you.` : `${me.display_name} started following you.`,
    'profile', me.user_id);
  return rec;
}
export async function unfollowUser(target, me) {
  const f = await getFollow(me.user_id, target.user_id);
  if (f) await base44.entities.Follow.delete(f.id).catch(() => {});
}
export async function cancelRequest(target, me) {
  const f = await getFollow(me.user_id, target.user_id);
  if (f) await base44.entities.Follow.delete(f.id).catch(() => {});
}
export async function acceptRequest(follow, me) {
  await base44.entities.Follow.update(follow.id, { status: 'accepted', acted_at: new Date().toISOString() });
  await notify(follow.follower_id, 'follow_accepted', me.user_id, me.display_name,
    `${me.display_name} accepted your follow request.`, 'profile', me.user_id);
}
export async function declineRequest(follow) {
  await base44.entities.Follow.delete(follow.id).catch(() => {});
}

// Counts are computed dynamically from Follow records (accurate, no denormalized drift).
export async function listFollowers(userId) {
  return await base44.entities.Follow.filter({ following_id: userId, status: 'accepted' });
}
export async function listFollowing(userId) {
  return await base44.entities.Follow.filter({ follower_id: userId, status: 'accepted' });
}
export async function listIncomingRequests(userId) {
  return await base44.entities.Follow.filter({ following_id: userId, status: 'pending' });
}

export async function listNotifications(userId) {
  return await base44.entities.AppNotification.filter({ user_id: userId }, '-created_date', 100);
}
export async function markNotificationRead(id) {
  await base44.entities.AppNotification.update(id, { read: true }).catch(() => {});
}
export async function markAllRead(userId) {
  const unread = await base44.entities.AppNotification.filter({ user_id: userId, read: false });
  if (unread && unread.length) await base44.entities.AppNotification.bulkUpdate(unread.map((n) => ({ id: n.id, read: true }))).catch(() => {});
}
async function notify(userId, type, actorId, actorName, text, entityType, entityId) {
  if (userId === actorId) return; // never notify yourself
  await base44.entities.AppNotification.create({
    user_id: userId, type, actor_id: actorId, actor_name: actorName, text, entity_type: entityType, entity_id: entityId, read: false,
  }).catch(() => {});
  const action_url = entityType === 'conversation' && entityId ? `/messages/${entityId}` : entityType === 'profile' && actorId ? `/user/${actorId}` : '/';
  await sendPush(userId, 'LRAZ 63', text, action_url);
}

// ---- Messaging ----
export async function listConversations() {
  return await base44.entities.Conversation.list('-last_message_at', 100);
}
export async function createOrGetConversation(otherUserId, myName, otherName) {
  const me = await base44.auth.me();
  const existing = await base44.entities.Conversation.list('-last_message_at', 200);
  const found = (existing || []).find((c) => Array.isArray(c.participant_ids) && c.participant_ids.length === 2 && c.participant_ids.includes(me.id) && c.participant_ids.includes(otherUserId));
  if (found) return found;
  const ids = [me.id, otherUserId];
  const names = ids.map((id) => (id === me.id ? myName : otherName));
  return await base44.entities.Conversation.create({ participant_ids: ids, participant_names: names, last_message_at: new Date().toISOString(), last_message_preview: '' });
}
export async function sendMessage(conversation, content, attachments = []) {
  const me = await base44.auth.me();
  const msg = await base44.entities.Message.create({
    conversation_id: conversation.id, sender_id: me.id, participant_ids: conversation.participant_ids,
    content: content || '', attachments,
  });
  const preview = content || (attachments.length ? `Shared ${attachments[0].type}` : '');
  await base44.entities.Conversation.update(conversation.id, { last_message_at: new Date().toISOString(), last_message_preview: preview.slice(0, 80) }).catch(() => {});
  const otherId = conversation.participant_ids.find((id) => id !== me.id);
  if (otherId) await notify(otherId, 'message', me.id, me.full_name || 'Someone', content || 'Sent you content', 'conversation', conversation.id);
  return msg;
}
export async function listMessages(conversationId) {
  return await base44.entities.Message.filter({ conversation_id: conversationId }, 'created_date', 500);
}
export function subscribeMessages(conversationId, cb) {
  return base44.entities.Message.subscribe((event) => {
    if (event?.data?.conversation_id !== conversationId) return;
    cb(event);
  });
}