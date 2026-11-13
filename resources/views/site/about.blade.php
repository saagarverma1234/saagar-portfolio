@extends('site.layout')
@section('title', 'About | Saagar Verma')
@section('description', 'Saagar Verma is a full stack developer and video creator in India who builds code-made physics videos for YouTube (Bump Theory, Chaos to Order, Swipe Theory) and free browser games based on them.')
@section('path', '/about')
@section('content')
<h1>About this site</h1>
<p class="lede">Hi, I'm Saagar Verma, a full stack developer and video creator based in India. saagarverma.com is my home on the web: my portfolio as a developer, and the place where I publish free browser games built from the physics simulations in my YouTube videos.</p>

<h2>Who I am</h2>
<p>I have spent more than six years building websites and web apps for clients around the world, mostly with Laravel, Vue and modern JavaScript, and editing video along the way. My <a href="/projects">projects page</a> lists client work, and my <a href="/certifications">certifications</a> are on their own page.</p>
<p>Alongside client work I run a group of YouTube channels where every video is made with code rather than filmed. I write small physics engines, run the simulations, and render the frames myself. That same code is what powers the games on this site.</p>

<h2>My channels</h2>
<div class="grid">
  <div class="card">
    <h3>Bump Theory</h3>
    <p>Satisfying 2D physics simulations: one ball that multiplies into thousands, light bouncing inside mirror shapes, balls that shrink, grow and escape. Short, loopable and made entirely in code.</p>
    <p><a href="https://www.youtube.com/@bumptheory" rel="noopener" target="_blank">youtube.com/@bumptheory</a></p>
  </div>
  <div class="card">
    <h3>Chaos to Order</h3>
    <p>Real physics of synchronisation. Dozens or hundreds of metronomes start out of step on a shared board and slowly fall into perfect time, with the maths kept faithful to the published research.</p>
    <p><a href="https://www.youtube.com/@chaostoorderlab" rel="noopener" target="_blank">youtube.com/@chaostoorderlab</a></p>
  </div>
  <div class="card">
    <h3>Swipe Theory</h3>
    <p>Bump Theory's sister channel: short animated stories where a funny character's day plays out swipe by swipe, timed to the beat of the music.</p>
    <p><a href="https://www.youtube.com/@swipetheoryhq" rel="noopener" target="_blank">youtube.com/@swipetheoryhq</a></p>
  </div>
</div>

<h2>What you can do here</h2>
<div class="grid">
  <div class="card">
    <h3><a href="/metronomes/">Metronome Sync Game</a></h3>
    <p>Up to 100 metronomes on one rolling board. Nudge it, shake it, flip a few, add a giant metronome, and watch chaos turn into order. The physics engine is a direct port of the one behind the Chaos to Order videos, based on Pantaleone's 2002 paper in the American Journal of Physics. The page explains <a href="/metronomes/#how-it-works">how the physics works</a>.</p>
  </div>
  <div class="card">
    <h3><a href="/bump-theory/">1 Ball &rarr; 10,000</a></h3>
    <p>A puzzle game from Bump Theory. Place multiplier gates, walls and bumpers, drop a single ball and see how many you can turn it into. 24 handmade levels from easy to nearly impossible, plus a sandbox. The page has <a href="/bump-theory/#how-it-works">a full guide, tips and the maths</a>.</p>
  </div>
</div>
<p>All games are listed on the <a href="/games">games page</a>. They are free, run entirely in your browser, need no account or download, and work on phones as well as computers.</p>

<h2>How the site is funded</h2>
<p>The games are free to play. The site shows ads served by Google AdSense, which helps cover hosting and the time spent building new games. Ads are kept in their own space below the game, never on top of the controls. You can read exactly what data the site and its ad partner use in the <a href="/privacy">privacy policy</a>.</p>

<h2>Get in touch</h2>
<p>Found a bug, have an idea for a new simulation, or want to work together? Visit the <a href="/contact">contact page</a> or email <a href="mailto:saagarverma1234@gmail.com">saagarverma1234@gmail.com</a>.</p>
@endsection
