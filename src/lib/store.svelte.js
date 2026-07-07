// Central app state using Svelte 5 runes. Imported as a singleton.

const STORAGE_KEY = 'veent-roulette-state-v1';

// Separate id sequences per entity type.
let nextPrizeId = 1;
let nextRegistrantId = 1;
let nextWinnerId = 1;

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && typeof data === 'object') return data;
  } catch {
    /* ignore corrupt storage */
  }
  return null;
}

// Normalise saved data to the current shape (migrates the pre-rename `id`/
// `personName`/`prizeName` fields so old localStorage doesn't break rendering).
function migrate(data) {
  const out = { prizes: [], registrants: [], winners: [], settings: data?.settings };
  let p = 0;
  let r = 0;
  let w = 0;
  if (Array.isArray(data?.prizes)) {
    out.prizes = data.prizes.map((it) => ({
      prize_id: it.prize_id ?? it.id ?? ++p,
      name: String(it.name ?? ''),
      awarded: !!it.awarded,
    }));
  }
  if (Array.isArray(data?.registrants)) {
    out.registrants = data.registrants.map((it) => ({
      registrant_id: it.registrant_id ?? it.id ?? ++r,
      name: String(it.name ?? ''),
      hasWon: !!it.hasWon,
    }));
  }
  if (Array.isArray(data?.winners)) {
    out.winners = data.winners.map((it) => ({
      winner_id: it.winner_id ?? it.id ?? ++w,
      registrant_id: it.registrant_id ?? it.personId ?? null,
      registrant_name: String(it.registrant_name ?? it.personName ?? ''),
      prize_id: it.prize_id ?? it.prizeId ?? null,
      prize_name: String(it.prize_name ?? it.prizeName ?? ''),
      at: it.at ?? null,
    }));
  }
  return out;
}

const saved = migrate(loadInitial());

export const store = $state({
  prizes: saved?.prizes ?? [], // { prize_id, name, awarded }
  registrants: saved?.registrants ?? [], // { registrant_id, name, hasWon }
  winners: saved?.winners ?? [], // { winner_id, registrant_id, registrant_name, prize_id, prize_name, at }
  settings: {
    mode: saved?.settings?.mode ?? 'people', // 'people' | 'prizes'
    removeWinner: saved?.settings?.removeWinner ?? true,
    selectedPrizeId: saved?.settings?.selectedPrizeId ?? null,
    selectedRegistrantId: saved?.settings?.selectedRegistrantId ?? null,
  },
});

// Keep each id counter ahead of any restored ids.
function bumpCounters() {
  for (const p of store.prizes)
    if (typeof p.prize_id === 'number' && p.prize_id >= nextPrizeId) nextPrizeId = p.prize_id + 1;
  for (const r of store.registrants)
    if (typeof r.registrant_id === 'number' && r.registrant_id >= nextRegistrantId)
      nextRegistrantId = r.registrant_id + 1;
  for (const w of store.winners)
    if (typeof w.winner_id === 'number' && w.winner_id >= nextWinnerId)
      nextWinnerId = w.winner_id + 1;
}
bumpCounters();

// Derived pools of what is currently placed on the wheel.
export const wheel = {
  get items() {
    if (store.settings.mode === 'people') {
      return store.settings.removeWinner
        ? store.registrants.filter((r) => !r.hasWon)
        : store.registrants;
    }
    return store.settings.removeWinner
      ? store.prizes.filter((p) => !p.awarded)
      : store.prizes;
  },
};

// --- Mutations -------------------------------------------------------------

export function addPrize(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  store.prizes.push({ prize_id: nextPrizeId++, name: trimmed, awarded: false });
}

export function addRegistrant(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  store.registrants.push({ registrant_id: nextRegistrantId++, name: trimmed, hasWon: false });
}

export function removePrize(id) {
  store.prizes = store.prizes.filter((p) => p.prize_id !== id);
  if (store.settings.selectedPrizeId === id) store.settings.selectedPrizeId = null;
}

export function removeRegistrant(id) {
  store.registrants = store.registrants.filter((r) => r.registrant_id !== id);
  if (store.settings.selectedRegistrantId === id) store.settings.selectedRegistrantId = null;
}

// Records a winner given a registrant and a prize; marks source items as consumed.
export function recordWinner({ registrant_id, prize_id }) {
  const person = store.registrants.find((r) => r.registrant_id === registrant_id);
  const prize = store.prizes.find((p) => p.prize_id === prize_id);
  if (!person || !prize) return null;

  if (person.hasWon || prize.awarded) return null; // already consumed

  person.hasWon = true;
  prize.awarded = true;

  const entry = {
    winner_id: nextWinnerId++,
    registrant_id: person.registrant_id,
    registrant_name: person.name,
    prize_id: prize.prize_id,
    prize_name: prize.name,
    at: new Date().toISOString(),
  };
  store.winners.push(entry);
  return entry;
}

export function reset() {
  store.prizes = [];
  store.registrants = [];
  store.winners = [];
  store.settings.selectedPrizeId = null;
  store.settings.selectedRegistrantId = null;
}

// Wipe everything, including the id counters and persisted storage.
export function clearData() {
  reset();
  nextPrizeId = 1;
  nextRegistrantId = 1;
  nextWinnerId = 1;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}

// Replace state from an imported export object.
export function loadState(data) {
  if (!data || typeof data !== 'object') throw new Error('Invalid file');
  nextPrizeId = 1;
  nextRegistrantId = 1;
  nextWinnerId = 1;

  store.prizes = Array.isArray(data.prizes)
    ? data.prizes.map((p) => ({
        prize_id: nextPrizeId++,
        name: String(p.name ?? ''),
        awarded: !!p.awarded,
      }))
    : [];
  store.registrants = Array.isArray(data.registrants)
    ? data.registrants.map((r) => ({
        registrant_id: nextRegistrantId++,
        name: String(r.name ?? ''),
        hasWon: !!r.hasWon,
      }))
    : [];
  // Rebuild winners, re-linking to the freshly-minted ids by name match.
  store.winners = Array.isArray(data.winners)
    ? data.winners.map((w) => {
        const person = store.registrants.find((r) => r.name === w.registrant_name);
        const prize = store.prizes.find((p) => p.name === w.prize_name);
        return {
          winner_id: nextWinnerId++,
          registrant_id: person?.registrant_id ?? null,
          registrant_name: String(w.registrant_name ?? ''),
          prize_id: prize?.prize_id ?? null,
          prize_name: String(w.prize_name ?? ''),
          at: w.at ?? new Date().toISOString(),
        };
      })
    : [];
  if (data.mode === 'people' || data.mode === 'prizes') store.settings.mode = data.mode;
  store.settings.selectedPrizeId = null;
  store.settings.selectedRegistrantId = null;
}

// --- Persistence -----------------------------------------------------------
// Called from a $effect in App.svelte so it runs in a reactive context.
export function persist() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        prizes: store.prizes,
        registrants: store.registrants,
        winners: store.winners,
        settings: store.settings,
      })
    );
  } catch {
    /* storage may be full or unavailable */
  }
}
