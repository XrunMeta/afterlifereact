

export function createSayStore() {
  const histories = new Map();
  const inProgress = new Set();
  const seqs = new Map();
  return {
    appendTurn(callId, turn) {
      const arr = histories.get(callId) ?? [];
      arr.push(turn);
      histories.set(callId, arr);
      const next = (seqs.get(callId) ?? 0) + 1;
      seqs.set(callId, next);
      return next;
    },

    getHistory(callId) { return [...(histories.get(callId) ?? [])]; },
    beginTurn(callId) {
      if (inProgress.has(callId)) return false;
      inProgress.add(callId);
      return true;
    },
    endTurn(callId) { inProgress.delete(callId); },
    clear(callId) {
      histories.delete(callId);
      inProgress.delete(callId);
      seqs.delete(callId);
    },
  };
}
