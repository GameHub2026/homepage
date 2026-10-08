// Gemeinsame Helfer für alle Seiten des Hefts.
const Heft = (() => {
  const CHAPTERS = {
    ki: { name: "KI & Technologie", short: "KI" },
    gaming: { name: "Gaming & Entertainment", short: "Gaming" },
    geschichte: { name: "Geschichte", short: "Geschichte" }
  };
  const ORDER = ["ki", "gaming", "geschichte"];

  const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n, l = 2) => String(n).padStart(l, "0");
  const parseDate = iso => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
  const fmtLong = iso => parseDate(iso).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const fmtShort = iso => parseDate(iso).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const issueNo = nr => `Heft Nr. ${pad(nr, 3)}`;

  const store = {
    get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* privat oder blockiert */ } }
  };

  async function getJSON(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
  }

  // Laufkopf-Seitenzahl und aktive Lasche folgen dem Lesen.
  function trackPages() {
    const pageEl = document.getElementById("runhead-page");
    const tabs = [...document.querySelectorAll(".tab")];
    const sections = [...document.querySelectorAll("[data-page]")];
    if (!pageEl || !sections.length) return;
    let current = null;
    const pick = () => {
      const line = window.innerHeight * 0.35;
      let best = sections[0];
      for (const s of sections) { if (s.getBoundingClientRect().top <= line) best = s; else break; }
      if (best === current) return;
      current = best;
      pageEl.textContent = pad(best.dataset.page);
      const ch = best.closest("[data-chapter]")?.dataset.chapter || null;
      tabs.forEach(t => t.classList.toggle("is-active", t.dataset.ch === ch));
      document.dispatchEvent(new CustomEvent("heft:page", { detail: best }));
    };
    let ticking = false;
    addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; pick(); });
    }, { passive: true });
    pick();
  }

  return { CHAPTERS, ORDER, esc, pad, parseDate, fmtLong, fmtShort, issueNo, store, getJSON, trackPages };
})();

// Header bekommt eine Linie, sobald man scrollt.
(() => {
  const h = document.getElementById("site-header");
  if (!h) return;
  const on = () => h.classList.toggle("is-scrolled", scrollY > 8);
  addEventListener("scroll", on, { passive: true });
  on();
})();

// Nach-oben-Button: erscheint erst nach etwas Scrollen.
(() => {
  const b = document.getElementById("to-top");
  if (!b) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const on = () => { b.hidden = scrollY < 700; };
  addEventListener("scroll", on, { passive: true });
  on();
  b.addEventListener("click", () => {
    scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    history.replaceState(null, "", location.pathname + location.search);
  });
})();

// Hell/Dunkel: Schalter oben rechts. Der Wechsel öffnet sich als Kreis vom Klickpunkt aus.
(() => {
  const root = document.documentElement;
  const buttons = [...document.querySelectorAll(".theme [data-set]")];
  if (!buttons.length) return;
  const meta = document.querySelector('meta[name="theme-color"]');
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const apply = theme => {
    if (theme === "dark") root.dataset.theme = "dark"; else delete root.dataset.theme;
    buttons.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.set === theme)));
    if (meta) meta.content = theme === "dark" ? "#0F0F0E" : "#EEEDE9";
    document.dispatchEvent(new CustomEvent("heft:theme", { detail: theme }));
  };
  apply(root.dataset.theme === "dark" ? "dark" : "light");

  buttons.forEach(b => b.addEventListener("click", e => {
    const next = b.dataset.set;
    if ((root.dataset.theme || "light") === next) return;
    try { localStorage.setItem("wrenfell-theme", next); } catch { /* privat oder blockiert */ }
    if (reduce || !document.startViewTransition) { apply(next); return; }
    const r = b.getBoundingClientRect();
    const x = e.clientX || r.left + r.width / 2, y = e.clientY || r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(() => apply(next)).ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        { duration: 650, easing: "cubic-bezier(.65,0,.25,1)", pseudoElement: "::view-transition-new(root)" }
      );
    });
  }));
})();

// Stand oben rechts: wann das Heft zuletzt aktualisiert wurde. Beim Darüberfahren
// zeigt es das heutige Datum und die laufende Uhrzeit in Berlin.
(() => {
  const box = document.getElementById("stamp");
  const out = document.getElementById("stamp-text");
  if (!box || !out) return;
  const TZ = "Europe/Berlin";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fDay = new Intl.DateTimeFormat("de-DE", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" });
  const fTime = new Intl.DateTimeFormat("de-DE", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
  const fLong = new Intl.DateTimeFormat("de-DE", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" });
  const fClock = new Intl.DateTimeFormat("de-DE", { timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short" });
  const clock = d => fClock.formatToParts(d).map(p => p.value).join("").replace(/\s+/g, " ");

  let stampText = "Aktualisiert";
  let mode = "stamp", timer = null, swap = null;

  // Text Zeichen für Zeichen setzen; neue Zeichen steigen gestaffelt und unscharf auf.
  function paint(text, all) {
    const old = [...out.children].map(c => c.textContent);
    out.classList.remove("is-out");
    out.textContent = "";
    [...text].forEach((ch, i) => {
      const s = document.createElement("span");
      s.className = "c";
      s.textContent = ch;
      if (!reduce && (all || old[i] !== ch)) { s.classList.add("is-in"); s.style.setProperty("--i", all ? i : 0); }
      out.appendChild(s);
    });
    out.setAttribute("aria-label", text);
  }
  function show(text) {
    clearTimeout(swap);
    if (reduce || !out.children.length) { paint(text, true); return; }
    out.classList.add("is-out");
    swap = setTimeout(() => paint(text, true), 150);
  }
  const live = () => {
    const now = new Date();
    return `${fLong.format(now)} · ${clock(now)}`;
  };
  function tick() {
    if (mode !== "live") return;
    paint(live(), false);
    timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
  }
  function enter() {
    if (mode === "live") return;
    mode = "live";
    show(live());
    clearTimeout(timer);
    timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 160);
  }
  function leave() {
    if (mode === "stamp") return;
    mode = "stamp";
    clearTimeout(timer);
    show(stampText);
  }
  box.addEventListener("pointerenter", e => { if (e.pointerType !== "touch") enter(); });
  box.addEventListener("pointerleave", e => { if (e.pointerType !== "touch") leave(); });
  box.addEventListener("focus", enter);
  box.addEventListener("blur", leave);
  box.addEventListener("click", () => (mode === "live" ? leave() : enter()));

  paint(stampText, false);
  fetch("data/editions/index.json", { cache: "no-cache" })
    .then(res => res.ok ? res.json().then(list => ({ list, lm: res.headers.get("last-modified") })) : Promise.reject())
    .then(({ list, lm }) => {
      const top = Array.isArray(list) ? list.find(e => !e.example) : null;
      let when = top && top.updated ? new Date(top.updated) : lm ? new Date(lm) : null;
      // Last-Modified ist der Zeitpunkt der Veröffentlichung; passt er nicht zum Heftdatum, nur das Datum zeigen.
      if (when && top && !top.updated && fDay.format(when) !== fDay.format(new Date(top.date + "T12:00:00"))) when = null;
      if (when && !isNaN(when)) stampText = `Aktualisiert ${fDay.format(when)} · ${fTime.format(when)}`;
      else if (top) stampText = `Aktualisiert ${fDay.format(new Date(top.date + "T12:00:00"))}`;
      if (mode === "stamp") show(stampText);
    })
    .catch(() => {});
})();
