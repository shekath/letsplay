#!/usr/bin/env python3
"""Bundle app/src into two single-file builds:
  app/embed.html  - page fragment (no <html>/<head>) for hosted previews such as Claude Artifacts
  app/index.html  - standalone installable web app (PWA) for iOS/Android home screens
Usage: python3 scripts/build.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "app" / "src"


def bundle() -> str:
    html = (SRC / "shell.html").read_text()
    for marker, name in (("CSS", "styles.css"), ("ICONS", "icons.js"), ("DATA", "data.js"), ("APP", "app.js")):
        html = html.replace(f"/*@@{marker}@@*/", (SRC / name).read_text())
    html = html.replace("/*@@TOURNAMENT@@*/", (SRC / "tour-engine.js").read_text() + "\n" + (SRC / "tournament.js").read_text())
    return html.replace("/*@@FEATURES@@*/", (SRC / "features.js").read_text())


HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1D4FF2">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="LetsPlay">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="icon-192.png">
<style>:root{padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
"""
TAIL = """<script>if('serviceWorker' in navigator&&location.protocol!=='file:'){navigator.serviceWorker.register('sw.js').catch(function(){})}</script>
</body>
</html>
"""

SRC2 = ROOT / "app" / "design2" / "src"


def bundle_design2() -> str:
    """Design 2 shares Design 1's data and icons, with its own shell, styles and interaction code."""
    html = (SRC2 / "shell.html").read_text()
    for marker, path in (("CSS", SRC2 / "d2.css"), ("ICONS", SRC / "icons.js"), ("DATA", SRC / "data.js"), ("APP", SRC2 / "d2.js")):
        html = html.replace(f"/*@@{marker}@@*/", path.read_text())
    # Plan features run inside d2.js's scope: the shared tournament engine, then Design 2's own modules.
    html = html.replace("/*@@TOUR_ENGINE@@*/", (SRC / "tour-engine.js").read_text())
    for name in ("d2-plans.js", "d2-lite.js", "d2-pro.js", "d2-address.js", "d2-corp.js", "d2-badges.js", "d2-custom.js", "d2-auth.js"):
        html = html.replace(f"/*@@{name}@@*/", (SRC2 / name).read_text())
    return html


def build_site(body: str, body2: str) -> Path:
    """Static site for GitHub Pages: Splayer (Design 2) at the root, the original LetsPlay design at letsplay.html."""
    import json, shutil
    out = ROOT / "site"
    if out.exists():
        shutil.rmtree(out)
    out.mkdir()
    shutil.copytree(ROOT / "app" / "img", out / "img")
    for name in ("icon-192.png", "icon-512.png", "splayer-192.png", "splayer-512.png", "splayer-180.png"):
        shutil.copy(ROOT / "app" / name, out / name)
    head2 = (HEAD.replace("#1D4FF2", "#06140D")
             .replace('content="LetsPlay"', 'content="Splayer"')
             .replace('href="manifest.webmanifest"', 'href="splayer.webmanifest"')
             .replace('rel="icon" href="icon-192.png"', 'rel="icon" href="splayer-192.png"')
             .replace('rel="apple-touch-icon" href="icon-192.png"', 'rel="apple-touch-icon" href="splayer-180.png"')
             .replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="description" content="Splayer: find, join and host football, cricket, badminton, tennis and many more games near you.">'))
    splayer = (head2 + body2 + TAIL).replace("<title>Splayer Design 2</title>", "<title>Splayer · Find your game</title>")
    (out / "index.html").write_text(splayer)
    (out / "design2.html").write_text(splayer)
    head1 = HEAD.replace('href="manifest.webmanifest"', 'href="letsplay.webmanifest"')
    (out / "letsplay.html").write_text(head1 + body + TAIL)
    (out / "splayer.webmanifest").write_text(json.dumps({
        "name": "Splayer: find your game", "short_name": "Splayer", "start_url": "./index.html", "scope": "./",
        "display": "standalone", "orientation": "portrait", "background_color": "#06140D", "theme_color": "#06140D",
        "icons": [{"src": "splayer-192.png", "sizes": "192x192", "type": "image/png"},
                  {"src": "splayer-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}]}, indent=2))
    m1 = json.loads((ROOT / "app" / "manifest.webmanifest").read_text())
    m1["start_url"] = "./letsplay.html"
    (out / "letsplay.webmanifest").write_text(json.dumps(m1, indent=2))
    (out / "sw.js").write_text("""/* Offline cache for the Splayer demo: app shells first, then everything same-origin as it is used. */
const CACHE = 'splayer-v2';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html', './letsplay.html', './splayer.webmanifest', './splayer-192.png'])));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  /* Pages: network first so a new deploy shows up straight away; fall back to the cache offline. */
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res; }).catch(() => caches.match(e.request).then((hit) => hit || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return res;
  })));
});
""")
    (out / ".nojekyll").write_text("")
    (out / "404.html").write_text('<!doctype html><meta charset="utf-8"><title>Splayer</title><meta http-equiv="refresh" content="0; url=./"><a href="./">Open Splayer</a>')
    return out


if __name__ == "__main__":
    body = bundle()
    (ROOT / "app" / "embed.html").write_text(body)
    (ROOT / "app" / "index.html").write_text(HEAD + body + TAIL)
    body2 = bundle_design2()
    (ROOT / "app" / "design2-embed.html").write_text(body2)
    (ROOT / "app" / "design2.html").write_text(HEAD.replace("#1D4FF2", "#06140D").replace("LetsPlay</", "Splayer</") + body2 + "</body>\n</html>\n")
    print("built app/embed.html, app/index.html, app/design2-embed.html and app/design2.html")
    if "--site" in __import__("sys").argv:
        print("built", build_site(body, body2).relative_to(ROOT), "(GitHub Pages)")
