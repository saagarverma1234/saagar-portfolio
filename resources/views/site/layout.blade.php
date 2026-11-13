<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>@yield('title')</title>
<meta name="description" content="@yield('description')">
<link rel="canonical" href="https://saagarverma.com@yield('path')">
<meta name="author" content="Saagar Verma">
<meta name="theme-color" content="#0b0c10">
<meta name="color-scheme" content="dark">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Saagar Verma">
<meta property="og:title" content="@yield('og_title', $__env->yieldContent('title'))">
<meta property="og:description" content="@yield('description')">
<meta property="og:url" content="https://saagarverma.com@yield('path')">
@hasSection('og_image')
<meta property="og:image" content="@yield('og_image')">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="@yield('og_title', $__env->yieldContent('title'))">
<meta name="twitter:description" content="@yield('description')">
<meta name="twitter:image" content="@yield('og_image')">
@else
<meta property="og:image" content="https://saagarverma.com/images/saagar-verma.png">
<meta name="twitter:card" content="summary">
@endif
<link rel="icon" type="image/svg+xml" href="/images/logo.svg">
<link rel="apple-touch-icon" href="/images/logo.svg">
@yield('head')
<style>
/* Inter 700 (SIL Open Font License 1.1), the same file the games use */
@font-face { font-family: InterB; src: url('/metronomes/inter-700.woff2') format('woff2'); font-weight: 700; font-display: swap; }
:root { --bg: #0b0c10; --panel: #15161d; --panel2: #1c1d26; --line: #2a2c38; --text: #f4f4f7; --muted: #b8bac7; --dim: #8a8d9c; --gold: #ffcc66; --link: #ffd685;
        --head: InterB, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color-scheme: dark; }
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
html { -webkit-text-size-adjust: 100%; background: var(--bg); }
body { margin: 0; background: var(--bg); color: var(--text); font: 400 17px/1.65 system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; overflow-wrap: break-word;
       padding: 0 env(safe-area-inset-right) 0 env(safe-area-inset-left); overflow-x: hidden; }
a { color: var(--link); text-underline-offset: 3px; text-decoration-color: rgba(255,214,133,.45); }
a:hover { text-decoration-color: currentColor; }
:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; border-radius: 4px; }
.in { max-width: var(--maxw, 760px); margin: 0 auto; padding-left: 16px; padding-right: 16px; }

/* top bar: same on every site page */
.top { position: sticky; top: 0; z-index: 5; background: rgba(11,12,16,.88); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); border-bottom: 1px solid var(--line);
       padding-top: env(safe-area-inset-top); }
.top .in { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 58px; }
.brand { display: inline-flex; align-items: center; gap: 10px; min-height: 44px; color: var(--text); text-decoration: none; font: 700 16px/1 var(--head); white-space: nowrap; }
.brand img { width: 32px; height: 32px; border-radius: 50%; flex: 0 0 auto; }
.top nav { display: flex; gap: 2px; }
.top nav a { display: inline-flex; align-items: center; min-height: 44px; padding: 0 12px; border-radius: 999px; color: var(--muted); text-decoration: none; font: 700 15px/1 var(--head); }
@media (hover: hover) { .top nav a:hover { color: var(--text); background: var(--panel); } }
.top nav a[aria-current="page"] { color: var(--text); background: var(--panel2); }
@media (max-width: 439px) { .brand span { display: none; } }
@media (max-width: 340px) { .top nav a { padding: 0 9px; } }

/* reading pages */
main { padding-top: 26px; padding-bottom: 40px; }
h1 { font: 700 clamp(30px, 7.5vw, 42px)/1.1 var(--head); margin: 0 0 12px; letter-spacing: -.5px; }
h2 { font: 700 21px/1.3 var(--head); margin: 34px 0 8px; }
h3 { font: 700 17px/1.35 var(--head); margin: 22px 0 4px; }
p, ul, ol { margin: 0 0 14px; }
ul, ol { padding-left: 22px; }
li { margin-bottom: 6px; }
strong { color: var(--text); font-weight: 600; }
.prose { color: #d6d7df; }
.lede { color: var(--muted); font-size: 18px; }
.meta { color: var(--dim); font-size: 14px; margin-bottom: 22px; }
.card { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; padding: 16px 18px; margin: 18px 0; }
.card p:last-child, .card ul:last-child { margin-bottom: 0; }
.card h3 a { color: var(--text); }
.grid { display: grid; grid-template-columns: 1fr; gap: 12px; margin: 16px 0; }
@media (min-width: 640px) { .grid { grid-template-columns: 1fr 1fr; } }
.grid .card { margin: 0; }
.grid .card h3 { margin-top: 0; }
.table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 8px 0 18px; border: 1px solid var(--line); border-radius: 12px; }
table { width: 100%; border-collapse: collapse; font-size: 15px; line-height: 1.5; }
.table-wrap table { min-width: 520px; }
th, td { text-align: left; vertical-align: top; border-bottom: 1px solid var(--line); padding: 10px 12px; }
tr:last-child td { border-bottom: 0; }
th { color: var(--muted); font-weight: 600; background: var(--panel); }
code { font: 14px ui-monospace, SFMono-Regular, Menlo, monospace; background: var(--panel2); border: 1px solid var(--line); border-radius: 6px; padding: 1px 5px; }
@media (max-width: 600px) {
  .table-wrap:has(.stack) { border: 0; overflow: visible; }
  .table-wrap table.stack { min-width: 0; }
  table.stack tr:first-child { display: none; }
  table.stack, table.stack tbody, table.stack tr, table.stack td { display: block; }
  table.stack tr { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 6px 14px; margin-bottom: 10px; }
  table.stack td { border: 0; padding: 6px 0; }
  table.stack td:first-child { font: 700 16px/1.3 var(--head); color: var(--text); padding-top: 8px; }
  table.stack td:not(:first-child)::before { content: attr(data-label); display: block; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: var(--dim); }
}
.email { font: 600 18px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 48px; padding: 0 22px; border-radius: 999px; background: var(--gold); color: #1a1406;
       text-decoration: none; font: 700 16px/1 var(--head); }
.btn svg { width: 18px; height: 18px; }

/* footer: same on every site page */
.foot { border-top: 1px solid var(--line); color: var(--dim); font-size: 14px; margin-top: 8px; }
.foot .in { padding-top: 18px; padding-bottom: calc(24px + env(safe-area-inset-bottom)); }
.foot nav { display: flex; flex-wrap: wrap; gap: 0 4px; margin: 0 -10px 8px; }
.foot nav a { color: var(--muted); text-decoration: none; min-height: 44px; display: inline-flex; align-items: center; padding: 0 10px; }
.foot nav a:hover { color: var(--text); text-decoration: underline; }
.foot .copy { padding: 0 0 0; }
@yield('styles')
</style>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3532470064725978" crossorigin="anonymous"></script>
</head>
<body>
<header class="top">
  <div class="in">
    <a class="brand" href="/" aria-label="Saagar Verma, home"><img src="/images/logo.svg" alt="" width="32" height="32"><span>Saagar Verma</span></a>
    <nav aria-label="Site">
      <a href="/games" @if(request()->is('games')) aria-current="page" @endif>Games</a>
      <a href="/about" @if(request()->is('about')) aria-current="page" @endif>About</a>
      <a href="/contact" @if(request()->is('contact')) aria-current="page" @endif>Contact</a>
    </nav>
  </div>
</header>
<main class="in @yield('main_class', 'prose')">
@yield('content')
</main>
<footer class="foot">
  <div class="in">
    <nav aria-label="Footer">
      <a href="/">Home</a>
      <a href="/games">Games</a>
      @foreach (config('games', []) as $footerGame)
        <a href="{{ $footerGame['url'] }}">{{ $footerGame['title'] }}</a>
      @endforeach
      <a href="/projects">Projects</a>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
      <a href="/privacy">Privacy Policy</a>
    </nav>
    <div class="copy">&copy; {{ date('Y') }} Saagar Verma, India.</div>
  </div>
</footer>
</body>
</html>
