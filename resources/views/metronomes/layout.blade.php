<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="referrer" content="same-origin">
<title>@yield('title', 'Metronome Stats')</title>
<link rel="icon" href="/metronomes/favicon.svg" type="image/svg+xml">
<style>
:root {
  --bg: #f4f4f2; --surface: #fcfcfb; --line: #e3e2de; --text: #1c1c1a; --muted: #5f5e5a; --dim: #8a8984;
  --accent: #2a78d6; --accent-soft: rgba(42,120,214,.12); --good: #1f8a4c; --bad: #c63b32; --radius: 12px;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #111110; --surface: #1a1a19; --line: #2e2e2b; --text: #f1f0ec; --muted: #b0afa9; --dim: #7f7e79;
    --accent: #3987e5; --accent-soft: rgba(57,135,229,.16); --good: #3fb36d; --bad: #ef6a5f;
  }
}
:root[data-theme="dark"] {
  --bg: #111110; --surface: #1a1a19; --line: #2e2e2b; --text: #f1f0ec; --muted: #b0afa9; --dim: #7f7e79;
  --accent: #3987e5; --accent-soft: rgba(57,135,229,.16); --good: #3fb36d; --bad: #ef6a5f;
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.wrap { max-width: 1040px; margin: 0 auto; padding: 16px 16px 40px; }
h1 { font-size: 20px; margin: 0; letter-spacing: -.2px; }
h2 { font-size: 13px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin: 0 0 10px; font-weight: 600; }
a { color: var(--accent); }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 14px; min-width: 0; }
.btn { appearance: none; border: 1px solid var(--line); background: var(--surface); color: var(--text); border-radius: 999px; padding: 8px 14px;
       font: inherit; font-size: 14px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; min-height: 38px; }
.btn.on { background: var(--accent); border-color: var(--accent); color: #fff; }
.btn.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.muted { color: var(--muted); }
.dim { color: var(--dim); }
input[type=password], input[type=date] { font: inherit; color: var(--text); background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 8px 10px; min-height: 40px; }
</style>
@stack('head')
</head>
<body>
@yield('body')
</body>
</html>
