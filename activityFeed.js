// Activity feed + challenges — deterministic, no AI. All operations use the
// Base44 client SDK and rely on per-entity RLS for authorization.
import { base44 } from '@/api/base44Client';
import { localDayOffset } from './utils';

// ---- Activity Posts ----

// Create an activity post. Only posts if the user has opted in via share_to_feed.
export async function createPost(type, title, body, snapshot = null, entityType = null, entityId = null) {
  try {
    const me = await base44.auth.me();
    if (!me) return null;
    const arr = await base44.entities.SocialProfile.filter({ user_id: me.id });
    const p = arr && arr[0];
    if (!p || !p.share_to_feed) return null;
    return await base44.entities.ActivityPost.create({
      user_id: me.id,
      user_name: p.display_name || me.full_name || 'Athlete',
      avatar_url: p.avatar_url || '',
      type, title, body, snapshot,
      entity_type: entityType, entity_id: entityId,
      likes: [], comment_count: 0,
    });
  } catch (e) { console.error('createPost', e); return null; }
}

export async function listFeed(limit = 50) {
  return await base44.entities.ActivityPost.list('-created_date', limit);
}

export async function toggleLike(post, me) {
  if (!me || !post) return post;
  const uid = me.user_id || me.id;
  const liked = (post.likes || []).includes(uid);
  if (liked) {
    await base44.entities.ActivityPost.updateMany({ id: post.id }, { $pull: { likes: uid } }).catch(() => {});
    return { ...post, likes: (post.likes || []).filter((l) => l !== uid) };
  }
  await base44.entities.ActivityPost.updateMany({ id: post.id }, { $push: { likes: uid } }).catch(() => {});
  if (post.user_id !== uid) {
    await base44.entities.AppNotification.create({
      user_id: post.user_id, type: 'social', actor_id: uid, actor_name: me.display_name || 'Someone',
      text: `${me.display_name || 'Someone'} liked your post.`, entity_type: 'post', entity_id: post.id, read: false,
    }).catch(() => {});
  }
  return { ...post, likes: [...(post.likes || []), uid] };
}

export async function deletePost(postId) {
  try {
    await base44.entities.ActivityComment.deleteMany({ post_id: postId }).catch(() => {});
    await base44.entities.ActivityPost.delete(postId);
  } catch (e) { console.error('deletePost', e); }
}

// ---- Comments ----

export async function listComments(postId) {
  return await base44.entities.ActivityComment.filter({ post_id: postId }, 'created_date', 200);
}

export async function addComment(post, me, content) {
  if (!me || !content?.trim()) return null;
  const uid = me.user_id || me.id;
  const c = await base44.entities.ActivityComment.create({
    post_id: post.id, user_id: uid,
    user_name: me.display_name || 'Athlete', avatar_url: me.avatar_url || '',
    content: content.trim(),
  });
  await base44.entities.ActivityPost.updateMany({ id: post.id }, { $inc: { comment_count: 1 } }).catch(() => {});
  if (post.user_id !== uid) {
    await base44.entities.AppNotification.create({
      user_id: post.user_id, type: 'social', actor_id: uid, actor_name: me.display_name || 'Someone',
      text: `${me.display_name || 'Someone'} commented on your post.`, entity_type: 'post', entity_id: post.id, read: false,
    }).catch(() => {});
  }
  return c;
}

// ---- Challenges ----

export async function listChallenges(limit = 50) {
  return await base44.entities.Challenge.list('-created_date', limit);
}

export async function createChallenge(data, me) {
  if (!me) return null;
  const uid = me.user_id || me.id;
  const name = me.display_name || 'Athlete';
  return await base44.entities.Challenge.create({
    ...data,
    creator_id: uid, creator_name: name,
    participant_ids: [uid], participant_names: [name],
    status: 'active',
  });
}

export async function joinChallenge(challenge, me) {
  if (!me || !challenge) return;
  const uid = me.user_id || me.id;
  if ((challenge.participant_ids || []).includes(uid)) return;
  await base44.entities.Challenge.updateMany({ id: challenge.id }, {
    $push: { participant_ids: uid, participant_names: me.display_name || 'Athlete' }
  }).catch(() => {});
}

export async function leaveChallenge(challenge, me) {
  if (!me || !challenge) return;
  const uid = me.user_id || me.id;
  await base44.entities.Challenge.updateMany({ id: challenge.id }, {
    $pull: { participant_ids: uid, participant_names: me.display_name || 'Athlete' }
  }).catch(() => {});
}

// ---- Public Training Stats ----

// Recompute the current user's aggregate training stats and persist them to
// their SocialProfile so other users can see them (only if share_training_stats is on).
// Deterministic — reads the user's own records, no AI.
export async function refreshMyTrainingStats() {
  try {
    const me = await base44.auth.me();
    if (!me) return;
    const arr = await base44.entities.SocialProfile.filter({ user_id: me.id });
    if (!arr?.length) return;
    const p = arr[0];
    if (!p.share_training_stats) return;
    const [workouts, sets, cardio] = await Promise.all([
      base44.entities.WorkoutSession.filter({ status: 'completed' }, '-date', 500),
      base44.entities.WorkoutSet.list('-created_date', 1000),
      base44.entities.CardioSession.list('-date', 500),
    ]);
    const totalVolume = (sets || []).reduce((a, s) => a + (s.completed ? (Number(s.weight_kg) || 0) * (Number(s.reps) || 0) : 0), 0);
    const prCount = (sets || []).filter((s) => s.is_pr).length;
    const days = new Set((workouts || []).map((w) => (w.date || '').slice(0, 10)));
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = localDayOffset(-i);
      if (days.has(d)) streak++; else if (i > 0) break;
    }
    await base44.entities.SocialProfile.update(p.id, {
      public_workout_count: (workouts || []).length,
      public_total_volume: Math.round(totalVolume),
      public_pr_count: prCount,
      public_cardio_count: (cardio || []).length,
      public_streak: streak,
    });
  } catch (e) { console.error('refreshMyTrainingStats', e); }
}