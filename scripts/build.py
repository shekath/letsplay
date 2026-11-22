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
    return html


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

if __name__ == "__main__":
    body = bundle()
    (ROOT / "app" / "embed.html").write_text(body)
    (ROOT / "app" / "index.html").write_text(HEAD + body + TAIL)
    print("built app/embed.html and app/index.html")
