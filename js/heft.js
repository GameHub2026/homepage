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
