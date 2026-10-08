// Eine langsam drehende Kugel aus Tintenpunkten, schwebend über der KI-Hand.
// Fährt die Maus darüber, weichen die Punkte sanft aus.
(() => {
  const canvas = document.getElementById("hero-globe");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Punkte gleichmäßig auf der Kugel verteilen (Fibonacci-Spirale).
  const N = 420;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const pts = Array.from({ length: N }, (_, i) => {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const a = golden * i;
    return { x: Math.cos(a) * r, y, z: Math.sin(a) * r, push: 0 };
  });

  // Punktfarbe folgt dem Farbschema.
  let ink = "#161616";
  const readInk = () => { ink = getComputedStyle(document.documentElement).getPropertyValue("--globe-ink").trim() || ink; if (reduce) requestAnimationFrame(draw); };
  readInk();
  document.addEventListener("heft:theme", readInk);

  let size = 0, dpr = 1;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    size = canvas.clientWidth;
    canvas.width = canvas.height = Math.round(size * dpr);
    if (reduce) requestAnimationFrame(draw);
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  let mouse = null;
  const stage = canvas.closest(".hero-stage") || canvas;
  stage.addEventListener("pointermove", e => {
    const b = canvas.getBoundingClientRect();
    mouse = { x: (e.clientX - b.left) / b.width * 2 - 1, y: (e.clientY - b.top) / b.height * 2 - 1 };
  });
  stage.addEventListener("pointerleave", () => { mouse = null; });

  const tilt = -0.38;
  const ct = Math.cos(tilt), st = Math.sin(tilt);
  let angle = 0, last = 0, visible = true;

  function draw(now) {
    const dt = last ? Math.min(now - last, 50) : 16;
    last = now;
    if (!reduce) angle += dt * 0.00018;
    const ca = Math.cos(angle), sa = Math.sin(angle);
    const R = size * 0.42 * dpr, c = size * dpr / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = ink;
    for (const p of pts) {
      // um die Y-Achse drehen, dann leicht nach vorn kippen
      const x1 = p.x * ca + p.z * sa;
      const z1 = -p.x * sa + p.z * ca;
      const y2 = p.y * ct - z1 * st;
      const z2 = p.y * st + z1 * ct;

      let target = 0;
      if (mouse) {
        const d = Math.hypot(x1 * 0.84 - mouse.x, y2 * 0.84 - mouse.y);
        target = Math.max(0, 0.5 - d) * (z2 > 0 ? 1 : 0.3);
      }
      p.push += (target - p.push) * 0.08;
      const k = 1 + p.push * 0.55;

      const depth = (z2 + 1) / 2;                 // 0 hinten, 1 vorn
      const px = c + x1 * R * k;
      const py = c + y2 * R * k;
      const r = (0.55 + depth * 1.25) * dpr * Math.max(size / 180, 0.7);
      ctx.globalAlpha = 0.16 + depth * 0.84;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (visible && !reduce) requestAnimationFrame(draw);
  }

  // Nur animieren, solange die Kugel zu sehen ist.
  new IntersectionObserver(([e]) => {
    const was = visible;
    visible = e.isIntersecting;
    if (visible && !was) { last = 0; requestAnimationFrame(draw); }
  }).observe(canvas);
  requestAnimationFrame(draw);
})();
