<script>
  import { store, wheel, recordWinner } from './store.svelte.js';

  const PALETTE = ['#d90c2a', '#ff2357', '#ff0aad', '#f59e0b', '#fdffa4', '#e1f3fe'];
  const SIZE = 460;
  const R = SIZE / 2;

  let rotation = $state(0);
  let spinning = $state(false);
  let lastWinner = $state(null);
  let banner = $state(false);

  const items = $derived(wheel.items);
  const mode = $derived(store.settings.mode);

  // The counterpart the organizer must pick before spinning.
  const needsPrize = $derived(mode === 'people');
  const counterpartReady = $derived(
    needsPrize
      ? store.settings.selectedPrizeId != null &&
          store.prizes.some((p) => p.id === store.settings.selectedPrizeId && !p.awarded)
      : store.settings.selectedPersonId != null &&
          store.registrants.some((r) => r.id === store.settings.selectedPersonId && !r.hasWon)
  );

  const canSpin = $derived(items.length > 0 && counterpartReady && !spinning);

  const hint = $derived.by(() => {
    if (spinning) return 'Spinning…';
    if (items.length === 0)
      return mode === 'people' ? 'Add registrants to the wheel' : 'Add prizes to the wheel';
    if (!counterpartReady)
      return needsPrize ? 'Select a prize to award first →' : 'Select a person to receive it first →';
    return mode === 'people' ? 'Spin to draw a winner' : 'Spin to draw a prize';
  });

  function polar(cx, cy, r, angleDeg) {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  // Build an SVG wedge path for segment i of n.
  function segmentPath(i, n) {
    if (n === 1) {
      // Full circle as two arcs.
      return `M ${R} ${R} m ${-R} 0 a ${R} ${R} 0 1 0 ${R * 2} 0 a ${R} ${R} 0 1 0 ${-R * 2} 0`;
    }
    const seg = 360 / n;
    const start = i * seg;
    const end = start + seg;
    const p1 = polar(R, R, R, start);
    const p2 = polar(R, R, R, end);
    const largeArc = seg > 180 ? 1 : 0;
    return `M ${R} ${R} L ${p1.x} ${p1.y} A ${R} ${R} 0 ${largeArc} 1 ${p2.x} ${p2.y} Z`;
  }

  function labelTransform(i, n) {
    const seg = 360 / n;
    const mid = i * seg + seg / 2;
    const pos = polar(R, R, R * 0.62, mid);
    return { x: pos.x, y: pos.y, rotate: mid };
  }

  function spin() {
    if (!canSpin) return;
    spinning = true;
    banner = false;

    const n = items.length;
    const targetIndex = Math.floor(Math.random() * n);
    const seg = 360 / n;
    // Pointer sits at top (12 o'clock). We want segment center under it.
    const segCenter = targetIndex * seg + seg / 2;
    const turns = 6 + Math.floor(Math.random() * 3);
    // Normalise current rotation, then add full turns and the offset that
    // brings the chosen segment's center to the top pointer.
    const current = rotation % 360;
    const targetRotation =
      rotation - current + turns * 360 + (360 - segCenter);
    rotation = targetRotation;
    pendingIndex = targetIndex;
  }

  let pendingIndex = -1;

  function onTransitionEnd() {
    if (!spinning) return;
    spinning = false;
    const landed = items[pendingIndex];
    if (!landed) return;

    let personId, prizeId;
    if (mode === 'people') {
      personId = landed.id;
      prizeId = store.settings.selectedPrizeId;
    } else {
      prizeId = landed.id;
      personId = store.settings.selectedPersonId;
    }

    const entry = recordWinner({ personId, prizeId });
    if (entry) {
      lastWinner = entry;
      banner = true;
      // Clear the used counterpart selection so the next draw needs a fresh pick.
      if (mode === 'people') store.settings.selectedPrizeId = null;
      else store.settings.selectedPersonId = null;
    }
  }
</script>

<div class="wheel-stage card">
  <div class="wheel-wrap">
    <div class="pointer" aria-hidden="true"></div>

    {#if items.length === 0}
      <div class="empty-wheel">
        <span>No items on the wheel</span>
      </div>
    {:else}
      <svg
        class="wheel"
        viewBox="0 0 {SIZE} {SIZE}"
        style="transform: rotate({rotation}deg)"
        ontransitionend={onTransitionEnd}
      >
        {#each items as item, i (item.id)}
          {@const t = labelTransform(i, items.length)}
          <g>
            <path
              d={segmentPath(i, items.length)}
              fill={PALETTE[i % PALETTE.length]}
              stroke="#0d0d0d"
              stroke-width="2"
            />
            <text
              x={t.x}
              y={t.y}
              transform="rotate({t.rotate} {t.x} {t.y})"
              text-anchor="middle"
              dominant-baseline="middle"
              class="seg-label"
            >
              {item.name.length > 14 ? item.name.slice(0, 13) + '…' : item.name}
            </text>
          </g>
        {/each}
      </svg>
      <div class="hub"></div>
    {/if}
  </div>

  <div class="controls">
    <button class="btn btn-primary spin-btn" onclick={spin} disabled={!canSpin}>
      {spinning ? 'Spinning…' : 'SPIN'}
    </button>
    <p class="hint">{hint}</p>
  </div>

  {#if banner && lastWinner}
    <div class="winner-banner" role="status">
      🎉 <strong>{lastWinner.personName}</strong> won <strong>{lastWinner.prizeName}</strong>
      <button class="dismiss" onclick={() => (banner = false)} aria-label="Dismiss">×</button>
    </div>
  {/if}
</div>

<style>
  .wheel-stage {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
    padding: 1.75rem;
    position: relative;
    height: 100%;
    justify-content: center;
  }

  .wheel-wrap {
    position: relative;
    width: min(460px, 70vh, 100%);
    aspect-ratio: 1;
  }

  .wheel {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    transition: transform 5.2s cubic-bezier(0.17, 0.67, 0.32, 1);
    box-shadow: 0 0 0 6px var(--surface-2), 0 0 0 8px var(--border-strong), var(--shadow);
    display: block;
  }

  .seg-label {
    fill: #0d0d0d;
    font-size: 15px;
    font-weight: 600;
    pointer-events: none;
  }

  .hub {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 54px;
    height: 54px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: var(--surface);
    border: 3px solid var(--border-input-hover);
    box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.6);
  }

  .pointer {
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 16px solid transparent;
    border-right: 16px solid transparent;
    border-top: 26px solid var(--primary);
    z-index: 3;
    filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6));
  }

  .empty-wheel {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px dashed var(--border-strong);
    display: grid;
    place-items: center;
    color: var(--text-muted);
    font-size: 0.95rem;
  }

  .controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
  }

  .spin-btn {
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    padding: 0.8rem 2.6rem;
    border-radius: 999px;
  }

  .hint {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.85rem;
    min-height: 1.1em;
  }

  .winner-banner {
    position: absolute;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    background: var(--surface-2);
    border: 1px solid var(--border-input-hover);
    border-radius: 999px;
    padding: 0.6rem 1.1rem 0.6rem 1.2rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
    box-shadow: var(--shadow);
    white-space: nowrap;
  }
  .winner-banner strong {
    color: var(--accent);
  }
  .dismiss {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 1.2rem;
    line-height: 1;
    padding: 0 0.2rem;
  }
</style>
