import { store } from './store.svelte.js';

// Build a clean, portable export object (order: prizes, registrants, winners).
export function buildExport() {
  return {
    exportedAt: new Date().toISOString(),
    mode: store.settings.mode,
    prizes: store.prizes.map(({ id, name, awarded }) => ({ id, name, awarded })),
    registrants: store.registrants.map(({ id, name, hasWon }) => ({ id, name, hasWon })),
    winners: store.winners.map(({ personName, prizeName, at }) => ({ personName, prizeName, at })),
  };
}

export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportFilename() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `roulette-export-${stamp}.json`;
}

// Parse an uploaded file into a plain object; throws on invalid JSON.
export function parseImport(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result));
      } catch {
        reject(new Error('File is not valid JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsText(file);
  });
}
