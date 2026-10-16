export function cardioElapsed(session) {
  if (!session) return 0;
  return (session.baseElapsed || 0) + (session.runningSince ? (Date.now() - session.runningSince) / 1000 : 0);
}
export function cardioIntervalPhase(elapsed, interval) {
  if (!interval) return null;
  const cycle = interval.workSec + interval.restSec;
  const total = cycle * interval.rounds;
  if (!cycle || elapsed >= total) return { phase: 'Done', round: interval.rounds, remaining: 0, total };
  const round = Math.floor(elapsed / cycle) + 1;
  const within = elapsed % cycle;
  const isWork = within < interval.workSec;
  return { phase: isWork ? 'Work' : 'Rest', round, remaining: isWork ? interval.workSec - within : cycle - within, total };
}