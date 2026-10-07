// Intro: Ein Funke wird zur Tintenflamme, die Flamme zum Zaunkönig,
// dann erscheint „Wrenfell“ und das Logo fliegt in den Header (rund 3,5 s).
// Läuft nur nach Alt+R, nicht beim normalen Laden oder Neuladen.
(() => {
  // Alt+R (Mac: Option+R) lädt die Seite neu und spielt dabei das Intro ab.
  addEventListener("keydown", e => {
    const isR = e.code === "KeyR" || ["r", "R", "®", "‰"].includes(e.key);
    if (e.altKey && !e.metaKey && !e.ctrlKey && isR) {
      e.preventDefault();
      if (e.repeat) return;        // gehaltene Taste: nur einmal neu laden
      try { sessionStorage.setItem("wrenfell-intro", "1"); } catch {}
      location.reload();
    }
  });

  const intro = document.getElementById("intro");
  if (!intro) return;
  const params = new URLSearchParams(location.search);
  if (params.has("introframe")) document.documentElement.classList.add("play-intro");
  if (!document.documentElement.classList.contains("play-intro")) { intro.remove(); return; }
  const $ = id => document.getElementById(id);
  const lockup = $("intro-lockup"), word = $("intro-word"), brand = $("brand");
  const noise = $("ink-noise"), disp = $("ink-disp"), blur = $("ink-blur");
  const reveal = $("ink-reveal"), dot = $("ink-dot"), sparksG = $("ink-sparks"), body = $("ink-body");

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const span = (t, a, b) => clamp((t - a) / (b - a));
  const outCubic = p => 1 - Math.pow(1 - p, 3);
  const outQuart = p => 1 - Math.pow(1 - p, 4);
  const inOut = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  const mix = (a, b, p) => a + (b - a) * p;

  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    body.removeAttribute("filter");
    const from = lockup.getBoundingClientRect();
    const to = brand.getBoundingClientRect();
    const s = to.height / from.height;
    const dx = to.left - from.left;
    const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
    lockup.style.transformOrigin = "left center";
    lockup.style.transition = "transform .75s cubic-bezier(.65,0,.2,1)";
    lockup.style.transform = `translate(${dx}px, ${dy}px) scale(${s})`;
    intro.classList.add("is-leaving");
    setTimeout(() => intro.remove(), 800);
  }

  // Das Intro wird ausdrücklich per Alt+R angefordert, deshalb läuft es auch bei
  // „Bewegung reduzieren“ voll ab. Nur ?introstatic zeigt die ruhige Variante.
  const reduce = new URLSearchParams(location.search).has("introstatic");
  if (reduce) {
    body.removeAttribute("filter");
    reveal.setAttribute("r", 90);
    word.style.opacity = 1;
    intro.classList.add("is-static");
    setTimeout(finish, 700);
    return;
  }

  // Funken
  const sparks = Array.from({ length: 10 }, (_, i) => {
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    const a = (i / 10) * Math.PI * 2 + Math.random() * .5;
    sparksG.appendChild(c);
    return { c, a, d: 14 + Math.random() * 16, r: .9 + Math.random() * 1.3 };
  });

  // Marke startet mittig, rückt später nach links neben den Schriftzug.
  let shift = 0;
  const measure = () => {
    const w = word.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(word).marginLeft) || 0;
    shift = (w + gap) / 2;
  };
  measure();
  document.fonts && document.fonts.ready.then(measure);

  // ?introframe=1200 friert das Intro bei 1200 ms ein (zum Prüfen).
  const frozen = Number(new URLSearchParams(location.search).get("introframe")) || null;

  let t0 = null, lastSeed = 0;
  function frame(now) {
    if (finished) return;
    if (t0 === null) t0 = now;
    const t = frozen ?? now - t0;

    // 1. Punkt (0–420 ms)
    const pd = span(t, 0, 200), pf = span(t, 240, 460);
    dot.setAttribute("r", (outCubic(pd) * 3.2 * (1 - pf)).toFixed(2));

    // 2. Funken sprühen (120–650 ms)
    const ps = span(t, 120, 650);
    sparks.forEach(s => {
      const d = outQuart(ps) * s.d;
      s.c.setAttribute("cx", (54 + Math.cos(s.a) * d).toFixed(2));
      s.c.setAttribute("cy", (58 + Math.sin(s.a) * d).toFixed(2));
      s.c.setAttribute("r", (s.r * (1 - ps) * (ps > 0 ? 1 : 0)).toFixed(2));
    });

    // 3. Tintenflamme züngelt nach oben und formt den Vogel (220–1550 ms)
    const pi = span(t, 220, 1550);
    const settle = outCubic(span(t, 560, 1550));
    reveal.setAttribute("cy", mix(84, 60, outCubic(span(t, 220, 1100))).toFixed(2));
    reveal.setAttribute("r", (outCubic(span(t, 220, 1150)) * 74).toFixed(2));
    disp.setAttribute("scale", (48 * (1 - settle)).toFixed(2));
    noise.setAttribute("baseFrequency", `${mix(0.05, 0.02, pi).toFixed(4)} ${mix(0.12, 0.035, pi).toFixed(4)}`);
    blur.setAttribute("stdDeviation", mix(2.8, 0.25, settle).toFixed(2));
    if (pi < 1 && now - lastSeed > 60) { noise.setAttribute("seed", (Math.random() * 999) | 0); lastSeed = now; }
    if (pi >= 1 && body.hasAttribute("filter")) body.removeAttribute("filter");

    // 4. Marke rückt nach links, Schriftzug erscheint (1450–2250 ms)
    const pl = inOut(span(t, 1450, 2100));
    const pw = outCubic(span(t, 1500, 2250));
    lockup.style.transform = `translateX(${(shift * (1 - pl)).toFixed(2)}px)`;
    word.style.opacity = pw.toFixed(3);
    word.style.filter = `blur(${(5 * (1 - pw)).toFixed(2)}px)`;
    word.style.transform = `translateX(${(14 * (1 - pw)).toFixed(2)}px)`;
    word.style.color = `rgb(${Math.round(mix(205, 22, pw))},${Math.round(mix(204, 22, pw))},${Math.round(mix(200, 22, pw))})`;

    // 5. Kurz halten, dann in den Header fliegen
    if (frozen) { measure(); return; }
    if (t > 2750) { finish(); return; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Klick, Tipp, Escape, Enter oder Leertaste überspringt das Intro, aber erst nach einer
  // kurzen Schonfrist. Sonst würde die noch gedrückte Alt+R-Taste (Wiederholung) oder
  // nachlaufendes Trackpad-Scrollen das Intro sofort beenden.
  const born = performance.now();
  const skip = () => {
    if (finished || performance.now() - born < 900) return;
    word.style.cssText += "opacity:1;filter:none;transform:none;color:inherit"; lockup.style.transform = "none"; finish();
  };
  if (!frozen) {
    addEventListener("pointerdown", skip, { passive: true });
    addEventListener("touchstart", skip, { passive: true });
    addEventListener("keydown", e => { if (!e.repeat && ["Escape", "Enter", " "].includes(e.key)) skip(); });
  }
})();
