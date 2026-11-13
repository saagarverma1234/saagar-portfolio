@php
    $games = config('games', []);
@endphp
@extends('site.layout')
@section('title', 'Free Browser Games: Physics Puzzles and Simulations | Saagar Verma')
@section('og_title', 'Free Physics Games')
@section('description', 'Free physics games from the Bump Theory and Chaos to Order YouTube channels. Play 1 Ball → 10,000 and the Metronome Sync Game in your browser, on phone or computer.')
@section('path', '/games')
@section('og_image', 'https://saagarverma.com/bump-theory/og.png')
@section('main_class', 'hub')
@section('head')
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
@endsection
@section('styles')
:root { --maxw: 1080px; }
.hub { padding-top: 22px; }
.hero h1 { font-size: clamp(32px, 8.5vw, 52px); line-height: 1.05; letter-spacing: -1px; margin: 0; }
.hero h1 span { color: var(--gold); }
.hero p { margin: 10px 0 0; color: var(--muted); font-size: 16px; max-width: 600px; line-height: 1.55; }
.count { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 12px; font: 700 12px/1 var(--head); letter-spacing: 2px; color: var(--dim); text-transform: uppercase; }
.count i { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 10px #4ade80; }
.games { list-style: none; margin: 22px 0 0; padding: 0; display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 640px) { .games { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; } }
@media (min-width: 1000px) { .games { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.game { position: relative; background: var(--panel); border: 1px solid var(--line); border-radius: 18px; overflow: hidden; display: flex; flex-direction: column;
        transition: border-color .15s, transform .15s; }
@media (hover: hover) { .game:hover { border-color: var(--accent, var(--gold)); transform: translateY(-2px); } }
.game:active { transform: scale(.99); }
.game:focus-within { border-color: var(--accent, var(--gold)); }
.thumb { display: block; aspect-ratio: 16 / 9; background: #07080b linear-gradient(135deg, var(--accent, var(--gold)) -60%, #07080b 70%); border-bottom: 1px solid var(--line); }
.thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
.gbody { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
.chan { display: flex; align-items: center; gap: 8px; font: 700 12px/1 var(--head); letter-spacing: 2px; text-transform: uppercase; color: var(--dim); }
.chan i { width: 8px; height: 8px; border-radius: 50%; background: var(--accent, var(--gold)); flex: 0 0 auto; }
.game h2 { margin: 0; font: 700 22px/1.2 var(--head); }
.game h2 a { color: var(--text); text-decoration: none; }
.game h2 a::after { content: ""; position: absolute; inset: 0; z-index: 1; border-radius: 18px; }
.game h2 a:focus-visible { outline: none; }
.game p { margin: 0; color: var(--muted); font-size: 15px; line-height: 1.5; flex: 1; }
.tags { display: flex; gap: 6px; flex-wrap: wrap; }
.tags span { font-size: 12px; line-height: 1; color: var(--muted); border: 1px solid var(--line); border-radius: 999px; padding: 6px 10px; }
.play { margin-top: 6px; display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 50px; padding: 0 22px; border-radius: 14px;
        background: var(--accent, var(--gold)); color: #1a1406; font: 700 17px/1 var(--head); }
.play svg { width: 16px; height: 16px; }
.about { margin: 36px 0 0; color: var(--muted); max-width: 720px; font-size: 16px; }
.about h2 { color: var(--text); font-size: 20px; margin: 0 0 8px; }
.about p { margin: 0 0 12px; }
.ad-wrap { margin: 24px 0 0; }
.ad-slot { min-height: 0; }
@endsection
@section('content')
<section class="hero">
  <div class="count"><i></i>{{ count($games) }} free {{ count($games) === 1 ? 'game' : 'games' }} &middot; no download</div>
  <h1>Free <span>physics games</span></h1>
  <p>Playable versions of the simulations from my YouTube channels. Every game runs in your browser on phone or computer, with no account.</p>
</section>

<ul class="games">
  @foreach ($games as $i => $game)
    <li class="game" style="--accent: {{ $game['accent'] ?? '#ffcc33' }}">
      <div class="thumb">
        <picture>
          <source srcset="/images/games/{{ $game['slug'] }}.webp" type="image/webp">
          <img src="/images/games/{{ $game['slug'] }}.jpg" alt="" width="640" height="360" @if ($i > 1) loading="lazy" @endif decoding="async">
        </picture>
      </div>
      <div class="gbody">
        <div class="chan"><i></i>{{ $game['channel'] }}</div>
        <h2><a href="{{ $game['url'] }}">{{ $game['title'] }}</a></h2>
        <p>{{ $game['description'] }}</p>
        @if (! empty($game['tags']))
          <div class="tags">@foreach ($game['tags'] as $tag)<span>{{ $tag }}</span>@endforeach</div>
        @endif
        <span class="play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>Play</span>
      </div>
    </li>
  @endforeach
</ul>

<!-- AdSense slot -->
<div class="ad-wrap"><div class="ad-slot" id="ad-slot" aria-hidden="true"></div></div>

<section class="about">
  <h2>About these games</h2>
  <p>Each game uses the same code as the videos it comes from. <a href="/bump-theory/">1 Ball &rarr; 10,000</a> is the Bump Theory multiplying-ball format turned into a puzzle: you place the gates. The <a href="/metronomes/">Metronome Sync Game</a> runs the real equations of coupled metronomes from the Chaos to Order channel. Every game page explains how it works below the game.</p>
  <p>Have an idea for the next game? Use the Suggestions box on any game page, or <a href="/contact">get in touch</a>.</p>
</section>
@endsection
