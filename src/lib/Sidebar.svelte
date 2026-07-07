<script>
  import {
    store,
    addPrize,
    addRegistrant,
    removePrize,
    removeRegistrant,
    reset,
  } from './store.svelte.js';
  import EntryList from './EntryList.svelte';

  const availablePrizes = $derived(store.prizes.filter((p) => !p.awarded));
  const availableRegistrants = $derived(store.registrants.filter((r) => !r.hasWon));

  function setMode(mode) {
    store.settings.mode = mode;
  }

  function confirmReset() {
    if (confirm('Clear all prizes, registrants and winners?')) reset();
  }
</script>

<aside class="sidebar card">
  <div class="controls-block">
    <div class="control">
      <span class="label">Wheel mode</span>
      <div class="toggle">
        <button
          class="toggle-btn"
          class:active={store.settings.mode === 'people'}
          onclick={() => setMode('people')}
        >
          People on wheel
        </button>
        <button
          class="toggle-btn"
          class:active={store.settings.mode === 'prizes'}
          onclick={() => setMode('prizes')}
        >
          Prizes on wheel
        </button>
      </div>
      <p class="explain">
        {#if store.settings.mode === 'people'}
          Wheel spins people — you pick the prize the winner gets.
        {:else}
          Wheel spins prizes — you pick who receives the drawn prize.
        {/if}
      </p>
    </div>

    <label class="checkbox">
      <input type="checkbox" bind:checked={store.settings.removeWinner} />
      <span>Remove winner from the wheel after each spin</span>
    </label>

    {#if store.settings.mode === 'people'}
      <div class="control">
        <span class="label">Prize to award this spin</span>
        <select class="field" bind:value={store.settings.selectedPrizeId}>
          <option value={null} disabled>Select a prize…</option>
          {#each availablePrizes as p (p.prize_id)}
            <option value={p.prize_id}>{p.name}</option>
          {/each}
        </select>
        {#if availablePrizes.length === 0}
          <p class="explain warn">No unawarded prizes left.</p>
        {/if}
      </div>
    {:else}
      <div class="control">
        <span class="label">Person to receive this spin</span>
        <select class="field" bind:value={store.settings.selectedRegistrantId}>
          <option value={null} disabled>Select a person…</option>
          {#each availableRegistrants as r (r.registrant_id)}
            <option value={r.registrant_id}>{r.name}</option>
          {/each}
        </select>
        {#if availableRegistrants.length === 0}
          <p class="explain warn">No eligible registrants left.</p>
        {/if}
      </div>
    {/if}
  </div>

  <div class="lists">
    <EntryList
      title="Prizes"
      placeholder="Add a prize…"
      items={store.prizes}
      idKey="prize_id"
      onAdd={addPrize}
      onRemove={removePrize}
      badge={(p) => (p.awarded ? 'awarded' : '')}
      muted={(p) => p.awarded}
    />
    <EntryList
      title="Registrants"
      placeholder="Add a person…"
      items={store.registrants}
      idKey="registrant_id"
      onAdd={addRegistrant}
      onRemove={removeRegistrant}
      badge={(r) => (r.hasWon ? 'won' : '')}
      muted={(r) => r.hasWon}
    />
  </div>

  <button class="btn reset" onclick={confirmReset}>Reset all</button>
</aside>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    padding: 1.1rem;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }
  .controls-block {
    flex: none;
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border);
  }
  .control {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .label {
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
  }
  .toggle {
    display: flex;
    background: var(--background-alt);
    border: 1px solid var(--border-input);
    border-radius: var(--radius);
    padding: 3px;
    gap: 3px;
  }
  .toggle-btn {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--text-muted);
    padding: 0.45rem 0.4rem;
    border-radius: calc(var(--radius) - 3px);
    font-size: 0.82rem;
    font-weight: 500;
    transition: background var(--transition), color var(--transition);
  }
  .toggle-btn.active {
    background: var(--primary);
    color: var(--primary-foreground);
  }
  .explain {
    margin: 0;
    font-size: 0.78rem;
    color: var(--text-muted);
    line-height: 1.4;
  }
  .explain.warn {
    color: var(--primary-hover);
  }
  .checkbox {
    display: flex;
    align-items: flex-start;
    gap: 0.55rem;
    font-size: 0.85rem;
    color: var(--text-dim);
    cursor: pointer;
    line-height: 1.35;
  }
  .checkbox input {
    margin-top: 0.15rem;
    accent-color: var(--primary);
    width: 1rem;
    height: 1rem;
  }
  .lists {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    flex: 1;
    min-height: 0;
  }
  .reset {
    flex: none;
    color: var(--text-muted);
    font-size: 0.82rem;
  }
  .reset:hover {
    color: var(--destructive);
    border-color: var(--destructive);
  }
</style>
