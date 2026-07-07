// Central app state using Svelte 5 runes. Imported as a singleton.

const STORAGE_KEY = 'veent-roulette-state-v1';

let nextId = 1;
function makeId() {
  return nextId++;
}

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

const saved = loadInitial();

export const store = $state({
  prizes: saved?.prizes ?? [], // { id, name, awarded }
  registrants: saved?.registrants ?? [], // { id, name, hasWon }
  winners: saved?.winners ?? [], // { id, personId, personName, prizeId, prizeName, at }
  settings: {
    mode: saved?.settings?.mode ?? 'people', // 'people' | 'prizes'
    removeWinner: saved?.settings?.removeWinner ?? true,
    selectedPrizeId: saved?.settings?.selectedPrizeId ?? null,
    selectedPersonId: saved?.settings?.selectedPersonId ?? null,
  },
});

// Keep the id counter ahead of any restored ids.
for (const list of [store.prizes, store.registrants, store.winners]) {
  for (const item of list) {
    if (typeof item.id === 'number' && item.id >= nextId) nextId = item.id + 1;
  }
}

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
  store.prizes.push({ id: makeId(), name: trimmed, awarded: false });
}

export function addRegistrant(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  store.registrants.push({ id: makeId(), name: trimmed, hasWon: false });
}

export function removePrize(id) {
  store.prizes = store.prizes.filter((p) => p.id !== id);
  if (store.settings.selectedPrizeId === id) store.settings.selectedPrizeId = null;
}

export function removeRegistrant(id) {
  store.registrants = store.registrants.filter((r) => r.id !== id);
  if (store.settings.selectedPersonId === id) store.settings.selectedPersonId = null;
}

// Records a winner given a person and a prize; marks source items as consumed.
export function recordWinner({ personId, prizeId }) {
  const person = store.registrants.find((r) => r.id === personId);
  const prize = store.prizes.find((p) => p.id === prizeId);
  if (!person || !prize) return null;

  if (person.hasWon || prize.awarded) return null; // already consumed

  person.hasWon = true;
  prize.awarded = true;

  const entry = {
    id: makeId(),
    personId: person.id,
    personName: person.name,
    prizeId: prize.id,
    prizeName: prize.name,
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
  store.settings.selectedPersonId = null;
}

// Replace state from an imported export object.
export function loadState(data) {
  if (!data || typeof data !== 'object') throw new Error('Invalid file');
  store.prizes = Array.isArray(data.prizes)
    ? data.prizes.map((p) => ({ id: makeId(), name: String(p.name ?? ''), awarded: !!p.awarded }))
    : [];
  store.registrants = Array.isArray(data.registrants)
    ? data.registrants.map((r) => ({ id: makeId(), name: String(r.name ?? ''), hasWon: !!r.hasWon }))
    : [];
  // Rebuild winners referencing the freshly-minted ids by name match.
  store.winners = Array.isArray(data.winners)
    ? data.winners.map((w) => {
        const person = store.registrants.find((r) => r.name === w.personName);
        const prize = store.prizes.find((p) => p.name === w.prizeName);
        return {
          id: makeId(),
          personId: person?.id ?? null,
          personName: String(w.personName ?? ''),
          prizeId: prize?.id ?? null,
          prizeName: String(w.prizeName ?? ''),
          at: w.at ?? new Date().toISOString(),
        };
      })
    : [];
  if (data.mode === 'people' || data.mode === 'prizes') store.settings.mode = data.mode;
  store.settings.selectedPrizeId = null;
  store.settings.selectedPersonId = null;
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
