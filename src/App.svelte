<script>
  import { persist } from './lib/store.svelte.js';
  import Wheel from './lib/Wheel.svelte';
  import Sidebar from './lib/Sidebar.svelte';
  import JsonPanels from './lib/JsonPanels.svelte';

  // Persist state on any change (runs in a reactive context).
  $effect(() => {
    persist();
  });
</script>

<div class="app">
  <header class="topbar">
    <div class="brand">
      <span class="dot"></span>
      <h1>Veent Roulette</h1>
    </div>
    <span class="tag">Raffle &amp; prize draw</span>
  </header>

  <main class="stage">
    <div class="wheel-col">
      <Wheel />
    </div>
    <div class="side-col">
      <Sidebar />
    </div>
  </main>

  <div class="data">
    <JsonPanels />
  </div>
</div>

<style>
  .app {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--primary);
    box-shadow: 0 0 12px var(--primary);
  }
  h1 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 600;
    letter-spacing: 0.01em;
  }
  .tag {
    color: var(--text-muted);
    font-size: 0.82rem;
  }
  .stage {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 1.1rem;
    align-items: stretch;
    min-height: 560px;
  }
  .wheel-col,
  .side-col {
    min-width: 0;
  }
  @media (max-width: 900px) {
    .stage {
      grid-template-columns: 1fr;
    }
  }
</style>
