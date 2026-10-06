(() => {
  const { CHAPTERS, ORDER, esc, pad, fmtLong, issueNo, store, getJSON } = Heft;
  const $ = id => document.getElementById(id);

  const FLAG = `<svg viewBox="0 0 26 40" aria-hidden="true"><path d="M0 0h26v40l-13-9-13 9z"/></svg>`;
  const ICON_ASSESS = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z"/></svg>`;

  function paragraphWithMark(text, highlight) {
    const t = esc(text);
    if (!highlight) return t;
    const h = esc(highlight);
    const i = t.indexOf(h);
    return i < 0 ? t : `${t.slice(0, i)}<mark>${h}</mark>${t.slice(i + h.length)}`;
  }

  // Bild zur Meldung, nur frei lizenzierte Bilder (Quelle und Lizenz stehen darunter).
  const safeUrl = u => /^https:\/\//.test(u || "") ? u : "";
  function figure(img) {
    if (!img || !safeUrl(img.url)) return "";
    const credit = [img.credit, img.license].filter(Boolean).map(esc).join(" · ");
    const src = safeUrl(img.source);
    return `<figure class="news-img">
      <img src="${esc(img.url)}" alt="${esc(img.alt || "")}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.closest('figure').remove()">
      ${credit ? `<figcaption>Bild: ${src ? `<a href="${esc(src)}" target="_blank" rel="noopener">${credit}</a>` : credit}</figcaption>` : ""}
    </figure>`;
  }

  function render(ed) {
    const date = fmtLong(ed.date);
    document.title = `Wrenfell · ${issueNo(ed.nr)} vom ${Heft.fmtShort(ed.date)}`;
    $("runhead-issue").textContent = `· ${issueNo(ed.nr)} · ${date}`;
    $("tag-example").hidden = !ed.example;
    $("toc-intro").textContent = ed.intro || "";

    const sections = ORDER
      .map(key => ed.sections.find(s => s.category === key))
      .filter(s => s && s.items && s.items.length);

    let page = 3;
    let toc = "";
    let html = "";
    sections.forEach((sec, ci) => {
      const ch = CHAPTERS[sec.category];
      const chId = `kapitel-${sec.category}`;
      const n = sec.items.length;
      toc += `<li class="toc-chapter ch-${sec.category}">
        <a class="toc-chapter-head" href="#${chId}"><span>Kapitel ${ci + 1}</span><strong>${esc(ch.name)}</strong></a>
        <ol class="toc-items">`;
      html += `<section class="chapter ch-${sec.category}" id="${chId}" data-chapter="${sec.category}" aria-labelledby="${chId}-t">
        <header class="opener" data-page="${page}">
          <p class="opener-no" aria-label="Kapitel ${ci + 1}"><span>${ci + 1}</span></p>
          <h2 class="opener-title" id="${chId}-t">${esc(ch.name)}</h2>
          <p class="opener-sub">${n} ${n === 1 ? "Meldung" : "Meldungen"}</p>
        </header>`;
      page++;
      sec.items.forEach((it, ii) => {
        const id = `s${pad(page)}`;
        toc += `<li><a href="#${id}" data-target="${id}"><span><span class="t">${esc(it.title)}</span></span><span class="pg">${pad(page)}</span></a></li>`;
        html += `<article class="article" id="${id}" data-page="${page}">
          <div class="margin">
            <span class="pg">${pad(page)}</span>
            <span class="lbl">${esc(ch.short)} · ${ii + 1}/${n}</span>
            ${FLAG.replace("<svg", '<svg class="flag"')}
          </div>
          <div class="col">
            <h3>${esc(it.title)}</h3>
            ${it.lead ? `<p class="lead">${esc(it.lead)}</p>` : ""}
            ${figure(it.image)}
            <div class="body">${(it.body || []).map(p => `<p>${paragraphWithMark(p, it.highlight)}</p>`).join("")}</div>
            ${(it.assessment || []).length ? `<aside class="assess" aria-label="Einschätzung">
              <span class="assess-tab">${ICON_ASSESS}Einschätzung</span>
              ${it.assessment.map(p => `<p>${esc(p)}</p>`).join("")}
            </aside>` : ""}
            ${(it.sources || []).length ? `<p class="sources"><b>Quellen</b>${it.sources.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>`).join("")}</p>` : ""}
          </div>
        </article>`;
        page++;
      });
      toc += `</ol></li>`;
      html += `</section>`;
    });

    $("toc-list").innerHTML = toc;
    $("strip-items").innerHTML = sections.map(sec => {
      const n = sec.items.length;
      return `<li><a class="ch-${sec.category}" href="#kapitel-${sec.category}"><i></i>${esc(CHAPTERS[sec.category].name)}<b>${n}</b></a></li>`;
    }).join("");
    $("chapters").innerHTML = html;

    const anhang = $("anhang");
    anhang.dataset.chapter = "anhang";
    anhang.querySelector(".opener").dataset.page = page;
    $("anhang-no").textContent = sections.length + 1;
    $("anhang-no").parentElement.setAttribute("aria-label", `Kapitel ${sections.length + 1}`);

    const present = new Set(sections.map(s => s.category));
    document.querySelectorAll(".tab").forEach(t => {
      if (CHAPTERS[t.dataset.ch]) t.classList.toggle("is-empty", !present.has(t.dataset.ch));
    });
  }

  // Textmarker zieht sich über den Kernsatz, sobald er gelesen wird.
  function drawMarks() {
    const marks = document.querySelectorAll("mark");
    if (!("IntersectionObserver" in window)) { marks.forEach(m => m.classList.add("is-drawn")); return; }
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("is-drawn"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -30% 0px" });
    marks.forEach(m => io.observe(m));
  }

  // Lesezeichen: merkt sich die zuletzt gelesene Seite dieser Ausgabe.
  function bookmark(ed) {
    const KEY = "heft-lesezeichen";
    const saved = store.get(KEY);
    const resume = $("bookmark-resume");
    const setFlag = id => {
      document.querySelectorAll(".article.has-flag").forEach(a => a.classList.remove("has-flag"));
      document.querySelectorAll(".flag-mini").forEach(f => f.remove());
      const art = document.getElementById(id);
      if (!art) return;
      art.classList.add("has-flag");
      const link = document.querySelector(`.toc-items a[data-target="${id}"] .pg`);
      if (link) link.insertAdjacentHTML("beforebegin", FLAG.replace("<svg", '<svg class="flag-mini"'));
    };

    if (saved && saved.date === ed.date && document.getElementById(saved.id)) {
      setFlag(saved.id);
      const pg = document.getElementById(saved.id).dataset.page;
      resume.href = `#${saved.id}`;
      resume.innerHTML = `${FLAG}Weiterlesen auf Seite ${pad(pg)}`;
      resume.hidden = false;
    }

    let timer;
    document.addEventListener("heft:page", e => {
      const el = e.detail;
      if (!el.classList.contains("article")) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        const prev = store.get(KEY);
        const prevPage = prev && prev.date === ed.date ? Number(document.getElementById(prev.id)?.dataset.page || 0) : 0;
        if (Number(el.dataset.page) > prevPage) {
          store.set(KEY, { date: ed.date, id: el.id });
          setFlag(el.id);
        }
      }, 2500);
    });
  }

  // Wikipedia-Texte enthalten gelegentlich Reste von Link-Markup.
  const cleanWiki = t => String(t).replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1").replace(/\s*\|\s*/g, " ").replace(/\s{2,}/g, " ").trim();

  async function onThisDay(iso) {
    const list = $("otd-list");
    const [, mm, dd] = iso.split("-");
    try {
      const data = await getJSON(`https://api.wikimedia.org/feed/v1/wikipedia/de/onthisday/selected/${mm}/${dd}`);
      const events = (data.selected || []).slice(0, 5);
      if (!events.length) throw new Error("leer");
      list.innerHTML = events.map(e => `<li><span class="y">${esc(e.year)}</span><span>${esc(cleanWiki(e.text))}</span></li>`).join("");
    } catch {
      list.innerHTML = `<li class="otd-wait">Wikipedia ist gerade nicht erreichbar. Beim nächsten Laden klappt es meist wieder.</li>`;
    }
  }

  // Begrüßung nach Tageszeit.
  function greet() {
    const h = new Date().getHours();
    const text = h < 5 ? "Noch wach? Willkommen bei Wrenfell."
      : h < 11 ? "Guten Morgen, schön dass du da bist."
      : h < 17 ? "Schönen Tag, willkommen bei Wrenfell."
      : h < 22 ? "Guten Abend, schön dass du da bist."
      : "Späte Runde? Willkommen bei Wrenfell.";
    $("greet").textContent = text;
  }

  async function init() {
    greet();
    const wanted = new URLSearchParams(location.search).get("d");
    let ed;
    try {
      const index = await getJSON("data/editions/index.json");
      if (!index.length) throw new Error("leer");
      const entry = (wanted && index.find(e => e.date === wanted)) || index[0];
      ed = await getJSON(`data/editions/${entry.date}.json`);
    } catch (err) {
      $("chapters").innerHTML = `<p class="state-note"><strong>Heute noch kein Heft.</strong>Die Ausgabe konnte nicht geladen werden. Entweder ist sie noch nicht erschienen, oder die Seite läuft ohne Webserver. Ältere Hefte findest du im <a href="archiv.html">Archiv</a>.</p>`;
      Heft.trackPages();
      onThisDay(new Date().toISOString().slice(0, 10));
      return;
    }
    render(ed);
    drawMarks();
    Heft.trackPages();
    bookmark(ed);
    onThisDay(ed.date);
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "instant" });
  }

  init();
})();
