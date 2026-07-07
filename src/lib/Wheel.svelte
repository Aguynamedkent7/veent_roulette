<script>
  import { onMount } from 'svelte';
  import { store, wheel, recordWinner } from './store.svelte.js';
  import Confetti from './Confetti.svelte';

  const PALETTE = ['#d90c2a', '#ff2357', '#ff0aad', '#f59e0b', '#fdffa4', '#e1f3fe'];
  const SIZE = 460;
  const R = SIZE / 2;

  let rotation = $state(0);
  let spinning = $state(false);
  let lastWinner = $state(null);
  let banner = $state(false);

  // Gentle continuous idle rotation while not actively drawing.
  const IDLE_SPEED = 8; // degrees per second
  let idleRaf = null;
  let lastTs = null;

  function idleTick(ts) {
    if (spinning) return; // draw spin owns the wheel; don't reschedule
    if (lastTs != null) rotation += (IDLE_SPEED * (ts - lastTs)) / 1000;
    lastTs = ts;
    idleRaf = requestAnimationFrame(idleTick);
  }

  function startIdle() {
    lastTs = null;
    cancelAnimationFrame(idleRaf);
    idleRaf = requestAnimationFrame(idleTick);
  }

  onMount(() => {
    startIdle();
    return () => cancelAnimationFrame(idleRaf);
  });

  const items = $derived(wheel.items);
  const mode = $derived(store.settings.mode);
  // Which id field the wheel items carry depends on the mode.
  const idKey = $derived(mode === 'people' ? 'registrant_id' : 'prize_id');

  // The counterpart the organizer must pick before spinning.
  const needsPrize = $derived(mode === 'people');
  const counterpartReady = $derived(
    needsPrize
      ? store.settings.selectedPrizeId != null &&
          store.prizes.some((p) => p.prize_id === store.settings.selectedPrizeId && !p.awarded)
      : store.settings.selectedRegistrantId != null &&
          store.registrants.some(
            (r) => r.registrant_id === store.settings.selectedRegistrantId && !r.hasWon
          )
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
    cancelAnimationFrame(idleRaf); // hand the wheel over to the draw spin

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
    if (landed) {
      let registrant_id, prize_id;
      if (mode === 'people') {
        registrant_id = landed.registrant_id;
        prize_id = store.settings.selectedPrizeId;
      } else {
        prize_id = landed.prize_id;
        registrant_id = store.settings.selectedRegistrantId;
      }

      const entry = recordWinner({ registrant_id, prize_id });
      if (entry) {
        lastWinner = entry;
        banner = true;
        // Clear the used counterpart selection so the next draw needs a fresh pick.
        if (mode === 'people') store.settings.selectedPrizeId = null;
        else store.settings.selectedRegistrantId = null;
      }
    }

    startIdle(); // resume the gentle idle spin from where the draw stopped
  }
</script>

<div class="wheel-stage card">
  <div class="wheel-wrap">
    <div class="pointer" aria-hidden="true"></div>

    {#if items.length === 0}
      <div class="empty-wheel" style="transform: rotate({rotation}deg)">
        <span>No items on the wheel</span>
      </div>
    {:else}
      <svg
        class="wheel"
        class:is-spinning={spinning}
        viewBox="0 0 {SIZE} {SIZE}"
        style="transform: rotate({rotation}deg)"
        ontransitionend={onTransitionEnd}
      >
        {#each items as item, i (item[idKey])}
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
    <Confetti />
    <div class="winner-overlay" role="dialog" aria-modal="true" aria-label="Winner">
      <div class="winner-modal card">
        <button class="modal-close" onclick={() => (banner = false)} aria-label="Close">×</button>
        <p class="winner-eyebrow">Winner</p>
        <p class="winner-name">{lastWinner.registrant_name}</p>
        <div class="winner-divider"></div>
        <p class="winner-prize-label">Prize</p>
        <p class="winner-prize">{lastWinner.prize_name}</p>
        <button class="btn btn-primary winner-continue" onclick={() => (banner = false)}>
          Continue
        </button>
      </div>
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
    transition: none;
    box-shadow: 0 0 0 6px var(--surface-2), 0 0 0 8px var(--border-strong), var(--shadow);
    display: block;
  }
  /* Eased transition only while a draw is in progress; idle spin is frame-driven. */
  .wheel.is-spinning {
    transition: transform 5.2s cubic-bezier(0.17, 0.67, 0.32, 1);
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

  .winner-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: grid;
    place-items: center;
    padding: 1.5rem;
    background: rgba(0, 0, 0, 0.72);
    backdrop-filter: blur(4px);
    animation: overlay-in 0.18s ease-out;
  }
  @keyframes overlay-in {
    from {
      opacity: 0;
    }
  }

  .winner-modal {
    position: relative;
    width: min(560px, 100%);
    text-align: center;
    padding: 3rem 2.5rem 2.5rem;
    background: var(--surface);
    border: 1px solid var(--border-input-hover);
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.65);
    animation: modal-in 0.28s cubic-bezier(0.2, 0.8, 0.25, 1);
  }
  @keyframes modal-in {
    from {
      opacity: 0;
      transform: translateY(16px) scale(0.94);
    }
  }

  .modal-close {
    position: absolute;
    top: 0.9rem;
    right: 1rem;
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 1.6rem;
    line-height: 1;
    padding: 0.1rem 0.4rem;
    border-radius: var(--radius-sm);
    transition: color var(--transition);
  }
  .modal-close:hover {
    color: var(--text);
  }

  .winner-eyebrow {
    margin: 0 0 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.28em;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--primary);
  }
  .winner-name {
    margin: 0;
    font-size: clamp(2.2rem, 6vw, 3.4rem);
    font-weight: 700;
    line-height: 1.05;
    color: var(--text);
    word-break: break-word;
  }
  .winner-divider {
    width: 64px;
    height: 3px;
    background: var(--primary);
    border-radius: 999px;
    margin: 1.6rem auto;
  }
  .winner-prize-label {
    margin: 0 0 0.35rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    font-size: 0.72rem;
    color: var(--text-muted);
  }
  .winner-prize {
    margin: 0;
    font-size: clamp(1.4rem, 3.5vw, 2rem);
    font-weight: 600;
    color: var(--accent);
    word-break: break-word;
  }
  .winner-continue {
    margin-top: 2rem;
    padding: 0.75rem 2.8rem;
    border-radius: 999px;
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.04em;
  }
</style>
