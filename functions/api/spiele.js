// Spiele, die ich gerade spiele: liest nur den Schlüssel game-status-map aus der GameHub-D1
// (Binding GAMEHUB, nur SELECT) und ergänzt die Cover. Unbekannte Titel suche ich bei Steam.
// Die Anmeldung übernimmt functions/_middleware.js.
const json = (o, s = 200) => new Response(JSON.stringify(o), {
  status: s,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "private, max-age=300" }
});

async function steamCover(titel) {
  try {
    const r = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(titel)}&l=german&cc=de`);
    const hit = (await r.json()).items?.[0];
    return hit ? `https://cdn.akamai.steamstatic.com/steam/apps/${hit.id}/library_600x900.jpg` : "";
  } catch { return ""; }
}

export async function onRequestGet({ env, request }) {
  if (!env.GAMEHUB) return json({ error: "GameHub-Binding fehlt" }, 503);
  const row = await env.GAMEHUB.prepare("SELECT v FROM kv WHERE k = 'game-status-map'").first();
  let map = {};
  try { map = JSON.parse(row?.v || "{}"); } catch { /* leer */ }
  const playing = Object.entries(map).filter(([, s]) => s === "playing").map(([k]) => {
    const i = k.indexOf("::");
    return { plattform: k.slice(0, i), titel: k.slice(i + 2) };
  });

  // Bekannte Cover aus data/spiele.json, damit nicht jedes Mal gesucht wird.
  let known = {};
  try {
    const d = await (await env.ASSETS.fetch(new URL("/data/spiele.json", request.url))).json();
    known = Object.fromEntries(d.spiele.map(g => [g.titel, g.cover]));
  } catch { /* ohne Vorrat */ }

  const spiele = await Promise.all(playing.map(async g => ({ ...g, cover: known[g.titel] || await steamCover(g.titel) })));
  return json({ stand: new Date().toISOString(), quelle: "GameHub, Filter „Spiele ich gerade“", spiele });
}
