<script>
  // Reusable "add + list with delete" used for both prizes and registrants.
  // Props: title, placeholder, items, idKey, onAdd(name), onRemove(id),
  //        badge(item) -> optional status label, muted(item) -> bool (dim consumed rows)
  let { title, placeholder, items, idKey, onAdd, onRemove, badge, muted } = $props();

  let value = $state('');

  function submit(e) {
    e.preventDefault();
    onAdd(value);
    value = '';
  }
</script>

<section class="entry">
  <header class="entry-head">
    <h3>{title}</h3>
    <span class="count">{items.length}</span>
  </header>

  <form class="add-row" onsubmit={submit}>
    <input class="field" bind:value {placeholder} />
    <button class="btn add-btn" type="submit" aria-label="Add {title}">+</button>
  </form>

  {#if items.length === 0}
    <p class="empty">Nothing yet.</p>
  {:else}
    <ul class="list">
      {#each items as item (item[idKey])}
        <li class="row" class:muted={muted?.(item)}>
          <span class="name" title={item.name}>{item.name}</span>
          {#if badge?.(item)}
            <span class="badge">{badge(item)}</span>
          {/if}
          <button class="del" onclick={() => onRemove(item[idKey])} aria-label="Remove {item.name}">×</button>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .entry {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    gap: 0.55rem;
  }
  .entry-head,
  .add-row {
    flex: none;
  }
  .entry-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  h3 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .count {
    font-size: 0.75rem;
    color: var(--text-muted);
    background: var(--background-alt);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 0.05rem 0.5rem;
  }
  .add-row {
    display: flex;
    gap: 0.4rem;
  }
  .add-btn {
    flex: 0 0 auto;
    width: 2.4rem;
    font-size: 1.2rem;
    line-height: 1;
    padding: 0;
  }
  .empty {
    margin: 0.2rem 0;
    color: var(--text-muted);
    font-size: 0.82rem;
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--background-alt);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.4rem 0.4rem 0.4rem 0.65rem;
  }
  .row.muted {
    opacity: 0.5;
  }
  .name {
    flex: 1;
    font-size: 0.88rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .badge {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--accent);
    border: 1px solid var(--border-strong);
    border-radius: 999px;
    padding: 0.05rem 0.45rem;
  }
  .del {
    flex: 0 0 auto;
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 1.15rem;
    line-height: 1;
    padding: 0 0.25rem;
    border-radius: var(--radius-sm);
    transition: color var(--transition), background var(--transition);
  }
  .del:hover {
    color: var(--primary-foreground);
    background: var(--destructive);
  }
</style>
