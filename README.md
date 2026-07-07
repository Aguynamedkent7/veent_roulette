# Veent Roulette

A single-page roulette / raffle tool (Svelte 5 + Vite) themed after **veent.io**.

- **Left:** the spinning wheel + SPIN button.
- **Right:** a vertical sidebar to add **prizes** and **registrants**, choose the wheel mode, and toggle winner removal.
- **Bottom:** live JSON of **prizes → registrants → winners**, with per-panel copy plus one-click **Export / Import JSON**.

## Wheel modes
- **People on wheel** — the wheel spins registrants; you pick which prize the drawn person gets.
- **Prizes on wheel** — the wheel spins prizes; you pick who receives the drawn prize.

**Remove winner after each spin** (toggle) controls whether a drawn person/prize leaves the pool.

State persists to `localStorage`.

## Develop
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build -> dist/
npm run preview
```
