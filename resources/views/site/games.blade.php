@php
    $games = config('games', []);
    $title = 'Free Browser Games: Physics Puzzles and Simulations | Saagar Verma';
    $desc = 'Free physics games from the Bump Theory and Chaos to Order YouTube channels. Play 1 Ball → 10,000 and the Metronome Sync Game in your browser, on phone or computer.';
@endphp
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{{ $title }}</title>
<meta name="description" content="{{ $desc }}">
<link rel="canonical" href="https://saagarverma.com/games">
<meta name="theme-color" content="#000000">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Saagar Verma">
<meta property="og:title" content="Free Physics Games">
<meta property="og:description" content="{{ $desc }}">
<meta property="og:url" content="https://saagarverma.com/games">
<meta property="og:image" content="https://saagarverma.com/bump-theory/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Free Physics Games">
<meta name="twitter:description" content="{{ $desc }}">
<meta name="twitter:image" content="https://saagarverma.com/bump-theory/og.png">
<link rel="icon" type="image/svg+xml" href="/images/logo.svg">
@if (count($games))
<link rel="preload" as="image" href="/images/games/{{ $games[0]['slug'] }}.webp" type="image/webp">
@endif
<script type="application/ld+json">
{!! json_encode([
    '@context' => 'https://schema.org',
    '@type' => 'ItemList',
    'name' => 'Free browser games by Saagar Verma',
    'itemListElement' => array_map(fn ($g, $i) => [
        '@type' => 'ListItem',
        'position' => $i + 1,
        'url' => 'https://saagarverma.com'.$g['url'],
        'name' => $g['title'],
    ], $games, array_keys($games)),
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}
</script>
<style>
@font-face { font-family: InterB; src: url('/bump-theory/inter-700.woff2') format('woff2'); font-weight: 700; font-display: swap; }
:root { --bg: #000; --panel: #111218; --line: #2a2c38; --text: #f4f4f7; --muted: #b8bac7; --dim: #7d8090; --gold: #ffcc33; }
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--text); font: 400 16px/1.55 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; overflow-wrap: break-word; }
a { color: inherit; }
.wrap { max-width: 1040px; margin: 0 auto; padding: 0 16px; }
header.top { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 60px; flex-wrap: wrap; padding: 8px 0; }
.brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; font: 700 16px InterB, system-ui, sans-serif; }
.brand img { width: 30px; height: 30px; border-radius: 50%; }
header.top nav { display: flex; gap: 16px; font-size: 15px; flex-wrap: wrap; }
header.top nav a { color: var(--muted); text-decoration: none; }
header.top nav a:hover { color: var(--text); }
.hero { padding: 20px 0 8px; }
.hero h1 { margin: 0; font: 700 clamp(32px, 8vw, 52px)/1.05 InterB, system-ui, sans-serif; letter-spacing: -1px; }
.hero h1 span { color: var(--gold); }
.hero p { margin: 10px 0 0; color: var(--muted); font-size: 17px; max-width: 620px; }
.grid { list-style: none; margin: 24px 0 0; padding: 0; display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 640px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; } }
@media (min-width: 1000px) { .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.card { background: var(--panel); border: 1px solid var(--line); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; transition: border-color .15s, transform .15s; }
.card:hover { border-color: var(--accent, var(--gold)); transform: translateY(-2px); }
.thumb { display: block; aspect-ratio: 16 / 9; background: #0b0c10; }
.thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
.body { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
.chan { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: var(--dim); }
.card h2 { margin: 0; font: 700 21px/1.2 InterB, system-ui, sans-serif; }
.card h2 a { text-decoration: none; }
.card p { margin: 0; color: var(--muted); font-size: 15px; flex: 1; }
.tags { display: flex; gap: 6px; flex-wrap: wrap; }
.tags span { font-size: 12px; color: var(--muted); border: 1px solid var(--line); border-radius: 999px; padding: 2px 9px; }
.play { margin-top: 6px; align-self: flex-start; display: inline-flex; align-items: center; gap: 8px; min-height: 46px; padding: 0 22px; border-radius: 999px;
        background: var(--accent, var(--gold)); color: #1a1406; text-decoration: none; font: 700 17px InterB, system-ui, sans-serif; }
.play svg { width: 16px; height: 16px; }
.about { margin: 32px 0 0; color: var(--muted); max-width: 720px; }
.about h2 { color: var(--text); font: 700 20px InterB, system-ui, sans-serif; margin: 0 0 8px; }
.about p { margin: 0 0 12px; }
.about a { color: var(--gold); }
.ad-wrap { margin: 24px 0 0; }
.ad-slot { min-height: 0; }
footer { border-top: 1px solid var(--line); margin-top: 32px; color: var(--dim); font-size: 14px; padding: 20px 0 calc(24px + env(safe-area-inset-bottom)); }
footer nav { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-bottom: 8px; }
footer nav a { color: var(--muted); }
</style>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3532470064725978" crossorigin="anonymous"></script>
</head>
<body>
<div class="wrap">
  <header class="top">
    <a class="brand" href="/"><img src="/images/logo.svg" alt="" width="30" height="30">Saagar Verma</a>
    <nav aria-label="Site"><a href="/games">Games</a><a href="/about">About</a><a href="/contact">Contact</a></nav>
  </header>

  <main>
    <section class="hero">
      <h1>Free <span>physics games</span></h1>
      <p>Playable versions of the simulations from my YouTube channels. Every game runs in your browser on phone or computer, with no download and no account.</p>
    </section>

    <ul class="grid">
      @foreach ($games as $i => $game)
        <li class="card" style="--accent: {{ $game['accent'] ?? '#ffcc33' }}">
          <a class="thumb" href="{{ $game['url'] }}" tabindex="-1" aria-hidden="true">
            <picture>
              <source srcset="/images/games/{{ $game['slug'] }}.webp" type="image/webp">
              <img src="/images/games/{{ $game['slug'] }}.jpg" alt="" width="640" height="360" @if ($i > 0) loading="lazy" @endif decoding="async">
            </picture>
          </a>
          <div class="body">
            <div class="chan">{{ $game['channel'] }}</div>
            <h2><a href="{{ $game['url'] }}">{{ $game['title'] }}</a></h2>
            <p>{{ $game['description'] }}</p>
            @if (! empty($game['tags']))
              <div class="tags">@foreach ($game['tags'] as $tag)<span>{{ $tag }}</span>@endforeach</div>
            @endif
            <a class="play" href="{{ $game['url'] }}" aria-label="Play {{ $game['title'] }}"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>Play</a>
          </div>
        </li>
      @endforeach
    </ul>

    <!-- AdSense slot -->
    <div class="ad-wrap"><div class="ad-slot" id="ad-slot" aria-hidden="true"></div></div>

    <section class="about">
      <h2>About these games</h2>
      <p>Each game uses the same code as the videos it comes from. <a href="/bump-theory/">1 Ball &rarr; 10,000</a> is the Bump Theory multiplying-ball format turned into a puzzle: you place the gates. The <a href="/metronomes/">Metronome Sync Game</a> runs the real equations of coupled metronomes from the Chaos to Order channel. Both pages explain how they work below the game.</p>
      <p>Have an idea for the next game? Use the Suggestions box on any game page, or <a href="/contact">get in touch</a>.</p>
    </section>
  </main>

  <footer>
    <nav aria-label="Footer">
      <a href="/">Home</a><a href="/games">Games</a><a href="/about">About</a><a href="/contact">Contact</a><a href="/privacy">Privacy Policy</a>
    </nav>
    <div>&copy; {{ date('Y') }} Saagar Verma, India.</div>
  </footer>
</div>
</body>
</html>
