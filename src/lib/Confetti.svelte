<script>
  import { onMount } from 'svelte';

  // Full-screen canvas confetti burst. Mounts when shown, self-cleans on unmount.
  let canvas;

  const COLORS = ['#d90c2a', '#ff2357', '#ff0aad', '#f59e0b', '#fdffa4', '#e1f3fe', '#ffffff'];

  onMount(() => {
    const ctx = canvas.getContext('2d');
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const COUNT = 180;
    const particles = Array.from({ length: COUNT }, spawn);

    function spawn() {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 12;
      return {
        x: w / 2 + (Math.random() - 0.5) * 140,
        y: h / 2 - 40 + (Math.random() - 0.5) * 60,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        size: 6 + Math.random() * 8,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.35,
        color: COLORS[(Math.random() * COLORS.length) | 0],
      };
    }

    const GRAVITY = 0.32;
    const DRAG = 0.99;
    const MAX_FRAMES = 280;
    let frame = 0;
    let raf;

    function tick() {
      frame++;
      ctx.clearRect(0, 0, w, h);
      const alpha = Math.max(0, 1 - frame / MAX_FRAMES);
      for (const p of particles) {
        p.vy += GRAVITY;
        p.vx *= DRAG;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.55);
        ctx.restore();
      }
      if (frame < MAX_FRAMES) raf = requestAnimationFrame(tick);
    }

    function onResize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', onResize);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  });
</script>

<canvas bind:this={canvas} class="confetti" aria-hidden="true"></canvas>

<style>
  .confetti {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 60;
  }
</style>
