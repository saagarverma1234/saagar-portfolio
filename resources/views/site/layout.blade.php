<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>@yield('title')</title>
<meta name="description" content="@yield('description')">
<link rel="canonical" href="https://saagarverma.com@yield('path')">
<meta name="author" content="Saagar Verma">
<meta name="theme-color" content="#09090b">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Saagar Verma">
<meta property="og:title" content="@yield('title')">
<meta property="og:description" content="@yield('description')">
<meta property="og:url" content="https://saagarverma.com@yield('path')">
<meta property="og:image" content="https://saagarverma.com/images/saagar-verma.png">
<meta name="twitter:card" content="summary">
<link rel="icon" type="image/svg+xml" href="/images/logo.svg">
<link rel="apple-touch-icon" href="/images/logo.svg">
<style>
:root {
  --bg: #09090b; --surface: #18181b; --line: #27272a; --text: #fafafa; --muted: #a1a1aa; --dim: #71717a; --accent: #ffcc66;
  --link: #8ab4ff;
}
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) { --bg: #ffffff; --surface: #fafafa; --line: #e4e4e7; --text: #18181b; --muted: #52525b; --dim: #71717a; --accent: #a16207; --link: #1d4ed8; }
}
:root[data-theme="light"] { --bg: #ffffff; --surface: #fafafa; --line: #e4e4e7; --text: #18181b; --muted: #52525b; --dim: #71717a; --accent: #a16207; --link: #1d4ed8; }
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--text); font: 17px/1.65 system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; overflow-wrap: break-word; }
a { color: var(--link); text-underline-offset: 2px; }
.top { border-bottom: 1px solid var(--line); }
.top .in, main, .foot .in { max-width: 760px; margin: 0 auto; padding-left: 16px; padding-right: 16px; }
.top .in { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 60px; flex-wrap: wrap; padding-top: 8px; padding-bottom: 8px; }
.brand { display: inline-flex; align-items: center; gap: 10px; color: var(--text); text-decoration: none; font: 700 16px/1 ui-monospace, "JetBrains Mono", SFMono-Regular, Menlo, monospace; }
.brand img { width: 32px; height: 32px; border-radius: 50%; }
.top nav { display: flex; gap: 16px; flex-wrap: wrap; font-size: 15px; }
.top nav a { color: var(--muted); text-decoration: none; }
.top nav a:hover, .top nav a[aria-current="page"] { color: var(--text); }
main { padding-top: 28px; padding-bottom: 48px; }
h1 { font: 700 clamp(28px, 6vw, 38px)/1.15 ui-monospace, "JetBrains Mono", SFMono-Regular, Menlo, monospace; margin: 0 0 8px; letter-spacing: -.5px; }
h2 { font-size: 22px; line-height: 1.3; margin: 36px 0 8px; }
h3 { font-size: 18px; margin: 24px 0 4px; }
p, ul, ol { margin: 0 0 14px; }
ul, ol { padding-left: 22px; }
li { margin-bottom: 6px; }
.lede { color: var(--muted); font-size: 18px; }
.meta { color: var(--dim); font-size: 14px; margin-bottom: 24px; }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 16px 18px; margin: 18px 0; }
.card p:last-child, .card ul:last-child { margin-bottom: 0; }
.grid { display: grid; grid-template-columns: 1fr; gap: 12px; margin: 16px 0; }
@media (min-width: 640px) { .grid { grid-template-columns: 1fr 1fr; } }
.grid .card { margin: 0; }
.grid .card h3 { margin-top: 0; }
table { width: 100%; border-collapse: collapse; font-size: 15px; margin: 8px 0 18px; display: block; overflow-x: auto; }
th, td { text-align: left; vertical-align: top; border-bottom: 1px solid var(--line); padding: 8px 10px 8px 0; }
th { color: var(--muted); font-weight: 600; }
.email { font: 600 18px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; }
.foot { border-top: 1px solid var(--line); color: var(--dim); font-size: 14px; }
.foot .in { padding-top: 22px; padding-bottom: calc(26px + env(safe-area-inset-bottom)); }
.foot nav { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-bottom: 10px; }
.foot nav a { color: var(--muted); }
</style>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3532470064725978" crossorigin="anonymous"></script>
</head>
<body>
<header class="top">
  <div class="in">
    <a class="brand" href="/"><img src="/images/logo.svg" alt="" width="32" height="32">Saagar Verma</a>
    <nav aria-label="Site">
      <a href="/games">Games</a>
      <a href="/about" @if(request()->is('about')) aria-current="page" @endif>About</a>
      <a href="/contact" @if(request()->is('contact')) aria-current="page" @endif>Contact</a>
    </nav>
  </div>
</header>
<main>
@yield('content')
</main>
<footer class="foot">
  <div class="in">
    <nav aria-label="Footer">
      <a href="/">Home</a>
      <a href="/games">Games</a>
      <a href="/metronomes/">Metronome Sync Game</a>
      <a href="/bump-theory/">Bump Theory Game</a>
      <a href="/projects">Projects</a>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
      <a href="/privacy">Privacy Policy</a>
    </nav>
    <div>&copy; {{ date('Y') }} Saagar Verma, India.</div>
  </div>
</footer>
</body>
</html>
