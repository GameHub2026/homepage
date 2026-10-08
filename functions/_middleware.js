// Privater Zugang: Jede Anfrage (Seiten, Daten, Bilder) braucht das Anmelde-Cookie.
// Das Passwort liegt als Secret SITE_PASSWORD im Cloudflare-Pages-Projekt, nie im Repo.
// Ohne gesetztes Secret bleibt die Seite zu.

const COOKIE = "wf_auth";
const YEAR = 60 * 60 * 24 * 365;

async function token(secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("wrenfell-v1"));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}

// Vergleich in konstanter Zeit, damit die Antwortzeit nichts verrät.
function same(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

const readCookie = (req, name) =>
  (req.headers.get("Cookie") || "").split(/;\s*/).map(c => c.split("=")).find(([k]) => k === name)?.[1] || "";

// Nur Pfade innerhalb der Seite als Ziel nach der Anmeldung zulassen.
const safeNext = n => (typeof n === "string" && n.startsWith("/") && !n.startsWith("//") ? n : "/");

export async function onRequest({ request, env, next }) {
  const secret = env.SITE_PASSWORD;
  const url = new URL(request.url);

  if (url.pathname === "/anmelden" && request.method === "POST") {
    const form = await request.formData();
    const pw = String(form.get("passwort") || "");
    const target = safeNext(String(form.get("weiter") || "/"));
    if (secret && same(pw, secret)) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: target,
          "Set-Cookie": `${COOKIE}=${await token(secret)}; Path=/; Max-Age=${YEAR}; HttpOnly; Secure; SameSite=Lax`,
          "Cache-Control": "no-store"
        }
      });
    }
    await new Promise(r => setTimeout(r, 700));
    return login(target, true);
  }

  if (url.pathname === "/abmelden") {
    return new Response(null, {
      status: 303,
      headers: { Location: "/", "Set-Cookie": `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` }
    });
  }

  if (secret && same(readCookie(request, COOKIE), await token(secret))) {
    const res = await next();
    const out = new Response(res.body, res);
    out.headers.set("X-Robots-Tag", "noindex, nofollow");
    // Seiten und Heftdaten immer frisch, Dateien mit ?v= dürfen lange im Speicher bleiben.
    const type = out.headers.get("Content-Type") || "";
    if (type.includes("text/html") || url.pathname.startsWith("/data/")) out.headers.set("Cache-Control", "no-cache");
    else if (url.searchParams.has("v")) out.headers.set("Cache-Control", "public, max-age=31536000, immutable");
    return out;
  }

  return login(url.pathname + url.search, false);
}

function login(target, failed) {
  const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Wrenfell</title>
<script>try{if(localStorage.getItem("wrenfell-theme")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}</script>
<style>
  :root { --paper:#EEEDE9; --ink:#161616; --ink-2:#4A4A47; --field:#fff; --btn:#3A3A38; --btn-ink:#fff; --err:#C9361F; color-scheme: light; }
  :root[data-theme="dark"] { --paper:#0F0F0E; --ink:#ECEBE6; --ink-2:#A3A29B; --field:#181816; --btn:#ECEBE6; --btn-ink:#121211; --err:#E2533A; color-scheme: dark; }
  * { box-sizing: border-box; margin: 0; }
  body { min-height: 100svh; display: grid; place-items: center; padding: 24px 16px; background: var(--paper); color: var(--ink);
         font: 400 16px/1.5 "Helvetica Neue", Arial, sans-serif; -webkit-font-smoothing: antialiased; }
  main { width: min(100%, 340px); text-align: center; }
  .mark { width: 56px; height: 56px; color: var(--ink); }
  h1 { margin-top: 10px; font-size: 30px; font-weight: 700; letter-spacing: -0.035em; }
  p { margin-top: 6px; color: var(--ink-2); font-size: 15px; }
  form { margin-top: 28px; display: grid; gap: 10px; }
  input { font: inherit; padding: 13px 18px; border-radius: 999px; border: 1.5px solid color-mix(in srgb, var(--ink) 18%, transparent);
          background: var(--field); color: var(--ink); text-align: center; }
  input:focus { outline: none; border-color: var(--ink); }
  button { font: 600 15px/1 "Helvetica Neue", Arial, sans-serif; padding: 14px 18px; border: 0; border-radius: 999px; background: var(--btn); color: var(--btn-ink); cursor: pointer; }
  .err { color: var(--err); font-size: 14px; }
</style>
</head>
<body>
<main>
  <svg class="mark" viewBox="0 0 100 100" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M96 40.5 L81 37.6 C78.8 30 71.5 26.6 64.5 28 C58.6 29.2 54.6 33.6 52.2 39 C47.8 42.4 42.6 43.6 37.6 42.4 C34.4 33.6 27.4 21.4 19 11.5 C20.2 25 23.4 40 29.6 51.6 C26.8 62 30.6 72.2 39.6 77.2 C48.8 82.2 61.4 80.6 69.4 73 C76.2 66.6 79.2 57.6 79.4 49.6 C79.6 46 80.8 43 82.6 41.6 Z M69.6 33.4 a2.3 2.3 0 1 0 0.01 0 Z M40 56.5 C50.5 64.5 63.5 64.2 73.5 55 C63.5 60.4 51 61.4 40 56.5 Z M45.5 65 C53.5 70.6 62.5 70.6 69 65.4 C61.6 68 53.4 68.2 45.5 65 Z"/></svg>
  <h1>Wrenfell</h1>
  <p>Privates Heft. Bitte anmelden.</p>
  <form method="post" action="/anmelden">
    <input type="hidden" name="weiter" value="${esc(target)}">
    <input type="password" name="passwort" autocomplete="current-password" placeholder="Passwort" aria-label="Passwort" required autofocus>
    ${failed ? '<span class="err" role="alert">Das Passwort stimmt nicht.</span>' : ""}
    <button type="submit">Anmelden</button>
  </form>
</main>
</body>
</html>`;
  return new Response(html, {
    status: 401,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" }
  });
}
