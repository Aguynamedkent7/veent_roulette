<script>
  import { store, loadState } from './store.svelte.js';
  import { buildExport, downloadJson, exportFilename, parseImport } from './exportUtils.js';

  let importError = $state('');
  let copied = $state('');
  let fileInput;

  const panels = $derived([
    { key: 'prizes', title: 'Prizes', data: store.prizes },
    { key: 'registrants', title: 'Registrants', data: store.registrants },
    { key: 'winners', title: 'Winners', data: store.winners },
  ]);

  function exportAll() {
    downloadJson(buildExport(), exportFilename());
  }

  async function copyPanel(key, data) {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      copied = key;
      setTimeout(() => (copied = ''), 1200);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function onFile(e) {
    importError = '';
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await parseImport(file);
      loadState(data);
    } catch (err) {
      importError = err.message ?? 'Import failed';
    } finally {
      e.target.value = '';
    }
  }
</script>

<section class="json-area">
  <div class="bar">
    <h2>Data</h2>
    <div class="bar-actions">
      {#if importError}<span class="err">{importError}</span>{/if}
      <button class="btn" onclick={() => fileInput.click()}>Import JSON</button>
      <button class="btn btn-primary" onclick={exportAll}>Export JSON</button>
      <input
        bind:this={fileInput}
        type="file"
        accept="application/json,.json"
        onchange={onFile}
        hidden
      />
    </div>
  </div>

  <div class="grid">
    {#each panels as panel (panel.key)}
      <div class="json-card card">
        <header>
          <h4>{panel.title} <span class="n">({panel.data.length})</span></h4>
          <button class="copy" onclick={() => copyPanel(panel.key, panel.data)}>
            {copied === panel.key ? 'Copied' : 'Copy'}
          </button>
        </header>
        <pre>{JSON.stringify(panel.data, null, 2)}</pre>
      </div>
    {/each}
  </div>
</section>

<style>
  .json-area {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.6rem;
  }
  h2 {
    margin: 0;
    font-size: 1rem;
    letter-spacing: 0.02em;
  }
  .bar-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .err {
    color: var(--destructive);
    font-size: 0.8rem;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }
  .json-card {
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
  }
  .json-card header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.55rem 0.75rem;
    border-bottom: 1px solid var(--border);
  }
  h4 {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 600;
  }
  .n {
    color: var(--text-muted);
    font-weight: 400;
  }
  .copy {
    background: transparent;
    border: 1px solid var(--border-input);
    color: var(--text-muted);
    font-size: 0.72rem;
    padding: 0.15rem 0.5rem;
    border-radius: var(--radius-sm);
    transition: color var(--transition), border-color var(--transition);
  }
  .copy:hover {
    color: var(--text);
    border-color: var(--border-input-hover);
  }
  pre {
    margin: 0;
    padding: 0.75rem;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    line-height: 1.45;
    color: var(--text-dim);
    overflow: auto;
    max-height: 30vh;
    white-space: pre-wrap;
    word-break: break-word;
  }
  @media (max-width: 860px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
