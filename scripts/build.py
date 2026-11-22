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
    for name in ("d2-plans.js", "d2-lite.js", "d2-pro.js", "d2-address.js", "d2-corp.js", "d2-badges.js", "d2-custom.js"):
        html = html.replace(f"/*@@{name}@@*/", (SRC2 / name).read_text())
    return html


if __name__ == "__main__":
    body = bundle()
    (ROOT / "app" / "embed.html").write_text(body)
    (ROOT / "app" / "index.html").write_text(HEAD + body + TAIL)
    body2 = bundle_design2()
    (ROOT / "app" / "design2-embed.html").write_text(body2)
    (ROOT / "app" / "design2.html").write_text(HEAD.replace("#1D4FF2", "#15161A").replace("LetsPlay</", "LetsPlay 2</") + body2 + "</body>\n</html>\n")
    print("built app/embed.html, app/index.html, app/design2-embed.html and app/design2.html")
