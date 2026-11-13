@extends('site.layout')
@section('title', 'How Bump Theory Simulations Are Made | Saagar Verma')
@section('og_title', 'How Bump Theory Simulations Are Made')
@section('description', 'An honest look at how the Bump Theory channel makes its code-made 2D physics videos: fixed time steps, collision maths, counters that are checked in code, frames rendered to video and a sound for every bounce.')
@section('path', '/articles/how-bump-theory-simulations-are-made')
@section('og_image', 'https://saagarverma.com/bump-theory/og.png')
@section('content')
<article class="post">
@include('site.articles._top')

<p class="lede">Every video on the <a href="https://www.youtube.com/@bumptheory" rel="noopener" target="_blank">Bump Theory</a> channel is a small computer program. There is no filmed footage, no hand-animated motion and no stock music. A ball bounces where the physics says it bounces, and the counter shows what really happened. Here is how one gets made, step by step.</p>

<h2>1. Start with a rule you can say in one sentence</h2>
<p>Every video begins with a rule: "every time the ball hits the wall, it splits in two", "every bounce shrinks the ball and grows the wall", "when a red and a blue ball touch, the faster one wins". The rule is the whole video, so it has to be understood in the first two seconds and it has to be exactly what the code does. If the screen says every hit makes a new ball, then every hit makes a new ball: no hidden cooldowns, no secret caps, no balls quietly removed.</p>

<h2>2. Build a tiny world</h2>
<p>The world is simple: an arena (usually a ring or a box), and a list of balls. Each ball has a position, a velocity and a radius, and sometimes a colour or a health value. Some videos have gravity; many are zero gravity, where balls fly in straight lines at constant speed until they hit something. Walls can move, spin, shrink or break.</p>

<h2>3. Move time forward in fixed, small steps</h2>
<p>A computer can't simulate smooth time, so it fakes it with tiny jumps. Each jump, every ball moves by its velocity times the step length, then the program checks what it hit and reacts. The videos run at 60 frames per second, and the physics usually takes several smaller steps per frame: three steps per frame means 180 physics steps every second.</p>
<p>Two choices here matter a lot. First, the step is <strong>fixed</strong>: always the same length, never stretched when the computer is busy. With a fixed step and the same starting point, the simulation produces exactly the same result every single time. Second, the step is <strong>small</strong>. A fast ball moving in big jumps can leap straight over a thin wall without ever touching it, a glitch known as tunnelling. Smaller steps catch the hit.</p>

<figure class="fig">
<svg viewBox="0 0 600 280" role="img" aria-labelledby="f5t"><title id="f5t">With big time steps a fast ball can jump straight past a thin wall. With small steps one of the positions lands in the wall, so the hit is caught.</title>
<rect class="f-dim" x="330" y="36" width="10" height="76" rx="2"/>
<circle class="f-acc" cx="60.0" cy="74" r="9" opacity=".55"/>
<circle class="f-acc" cx="148.0" cy="74" r="9" opacity=".55"/>
<circle class="f-acc" cx="236.0" cy="74" r="9" opacity=".55"/>
<circle class="f-acc" cx="324.0" cy="74" r="9" opacity=".55"/>
<circle class="f-acc" cx="412.0" cy="74" r="9" opacity=".55"/>
<circle class="f-acc" cx="500.0" cy="74" r="9"/>
<text class="t-strong" x="50" y="140" font-size="23">big steps: wall missed</text>
<rect class="f-dim" x="330" y="158" width="10" height="76" rx="2"/>
<circle class="f-acc" cx="60.0" cy="196" r="9" opacity=".55"/>
<circle class="f-acc" cx="89.0" cy="196" r="9" opacity=".55"/>
<circle class="f-acc" cx="118.0" cy="196" r="9" opacity=".55"/>
<circle class="f-acc" cx="147.0" cy="196" r="9" opacity=".55"/>
<circle class="f-acc" cx="176.0" cy="196" r="9" opacity=".55"/>
<circle class="f-acc" cx="205.0" cy="196" r="9" opacity=".55"/>
<circle class="f-acc" cx="234.0" cy="196" r="9" opacity=".55"/>
<circle class="f-acc" cx="263.0" cy="196" r="9" opacity=".55"/>
<circle class="f-acc" cx="292.0" cy="196" r="9" opacity=".55"/>
<circle class="f-acc" cx="321.0" cy="196" r="9" opacity=".55"/>
<circle class="f-acc2" cx="321.0" cy="196" r="9"/>
<text class="t-strong" x="50" y="262" font-size="23">small steps: hit caught</text>
<text x="335" y="22" text-anchor="middle" font-size="20">thin wall</text>
</svg>
<figcaption>Big time steps can skip a thin wall entirely. Smaller steps land a position inside the wall, so the hit is detected.</figcaption>
</figure>

<p>The "random" starting positions come from a random number generator with a fixed starting value, called a seed. Same seed, same video. We often try many seeds and pick one with good pacing, for example one where the first split doesn't happen in the first second. But once the seed is picked, every frame you see is exactly what the physics produced.</p>

<h2>4. Collisions: overlap, push apart, bounce</h2>
<p>Two round balls touch when the distance between their centres is less than the sum of their radii. A ball touches a wall when its centre is closer to the wall than its radius. When that happens the program does two things:</p>
<ul>
  <li><strong>Push apart.</strong> Move the objects so they no longer overlap, otherwise they stick together or jitter.</li>
  <li><strong>Bounce.</strong> Split the velocity into the part pointing into the wall (along the wall's <em>normal</em>, the direction straight out of the surface) and the part sliding along it. Flip the first part and keep the second.</li>
</ul>

<figure class="fig">
<svg viewBox="0 0 600 270" role="img" aria-labelledby="f6t"><title id="f6t">A bounce: the part of the velocity along the wall normal flips, the part along the wall stays.</title>
<line class="ln" x1="60" y1="210" x2="540" y2="210" stroke-width="4" stroke-linecap="round"/>
<text x="540" y="238" text-anchor="end" font-size="20">wall</text>
<circle class="f-acc" cx="300" cy="191" r="19"/>
<line class="acc2" x1="130.0" y1="60.0" x2="278.0" y2="176.0" stroke-width="3.5" stroke-linecap="round"/><path class="acc2" d="M265.3 173.2 L278.0 176.0 L272.3 164.3" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<text class="t-acc2" x="96" y="44" font-size="23">before</text>
<line class="acc" x1="322.0" y1="176.0" x2="470.0" y2="60.0" stroke-width="3.5" stroke-linecap="round"/><path class="acc" d="M464.3 71.7 L470.0 60.0 L457.3 62.8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<text class="t-acc" x="470" y="44" font-size="23">after</text>
<line class="ln" x1="300" y1="168" x2="300" y2="40" stroke-width="2" stroke-dasharray="6 6"/>
<path class="ln" d="M304.8 49.9 L300.0 40.0 L295.2 49.9" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<text x="312" y="56" font-size="21">normal n</text>
</svg>
<figcaption>On a bounce, the part of the velocity along the normal flips; the part along the wall is kept.</figcaption>
</figure>

<p>In symbols, with velocity <strong>v</strong>, unit normal <strong>n</strong> and bounciness e (1 means a perfect bounce with no energy lost):</p>
<p class="eq">v<sub>after</sub> = v &minus; (1 + e)(v &middot; n) n</p>
<p>Ball-on-ball collisions use the same idea along the line joining the two centres, sharing the push according to their masses. For more complicated shapes, such as gears, polygons and presses, we use Pymunk, a free and open-source 2D physics library built on the Chipmunk engine, and add our own rules on top.</p>

<h2>5. Counters that are checked, not animated</h2>
<p>The counter on screen is not a separate animation that someone tuned to look exciting. It is a variable in the program, changed by the very same line of code that creates or removes a ball. On top of that, the code checks itself: it asserts that the number of balls equals the starting number plus every split it recorded (minus anything lost, if the rule allows losses). If those ever disagree, the render stops with an error.</p>
<p>This rule exists because of a real mistake. An early draft of one video had a tiny hidden cooldown, a fraction of a second after each hit where a new hit didn't count. On screen, the numbers stopped adding up. The cooldown was removed and the self-check was added to every video after that.</p>

<h2>6. Simulate everything first, then draw</h2>
<p>The whole timeline is simulated before a single frame is drawn. The program records where everything is at each frame, plus a list of events: every hit, split, crack and escape, with its exact time. Only then does drawing start.</p>
<p>Each frame is drawn as vector graphics with Cairo, a free 2D graphics library, at 1080 &times; 1920 pixels (a vertical phone screen). A 30-second Short is 1,800 frames. The frames are drawn in parallel on several processor cores and streamed straight into FFmpeg, which encodes them as an H.264 video. Because frame 0 and the last frame are drawn by the same code, a video can end on exactly the picture it started with, so it loops seamlessly when YouTube replays it.</p>

<h2>7. A sound for every bounce</h2>
<p>The sound is built from the same event list, so every note lands on the frame where its collision happens. No recorded instruments are used. A marimba-like note, for example, is made from three sine waves that fade at different speeds: the main pitch, plus quieter tones at about 4 and 10 times its frequency, which is roughly how a real marimba bar rings.</p>
<p>A few tricks keep thousands of hits from turning into noise. Notes are picked from a pentatonic scale, five notes that sound pleasant in any combination. The number of notes per second is capped (for example at 60), so a crowd of 5,000 balls becomes a shimmer instead of a roar. "Which song is the ball playing?" videos go further: the bounce angle and speed are worked out so that every hit lands on the beat of a public-domain melody such as Ode to Joy.</p>
<p>Finally the audio is mixed and its loudness is measured with the EBU R 128 method and set to about &minus;14 LUFS, a common level for online video, so it isn't much louder or quieter than the videos around it.</p>

<h2>8. Checks before anything is posted</h2>
<ul>
  <li><strong>Stills:</strong> the first frame, a few middle frames and the last frame are saved as pictures and looked at closely.</li>
  <li><strong>Loop check:</strong> the first and last frames are compared pixel by pixel; the difference has to be almost zero.</li>
  <li><strong>Loudness check:</strong> the finished file is measured again.</li>
  <li><strong>Edge check:</strong> the picture has to reach every edge of the frame, with no empty bars.</li>
</ul>

<h2>Why bother doing it this way?</h2>
<p>Because the honesty is the point. Viewers count along, argue in the comments about whether the maths adds up, and ask "what if" questions. When the physics and the counter are real, every one of those questions has a true answer, and the next video can test it. The same approach powers the <a href="/bump-theory/">1 Ball &rarr; 10,000</a> game on this site, rewritten in JavaScript so the physics runs live in your browser.</p>

<div class="try">
  <p><strong>See it in action.</strong> Watch the simulations on YouTube, or build your own multiplying-ball machine in the game.</p>
  <a class="go" href="/bump-theory/">Play 1 Ball &rarr; 10,000</a>
  <a class="go alt" href="https://www.youtube.com/@bumptheory" rel="noopener" target="_blank">Watch Bump Theory</a>
</div>

<h2>Sources</h2>
<ol class="sources">
  <li>Fiedler, G. Fix Your Timestep! (why fixed physics steps give stable, repeatable simulations). <a href="https://gafferongames.com/post/fix_your_timestep/" rel="noopener" target="_blank">gafferongames.com</a></li>
  <li>Pymunk, a 2D physics library for Python built on Chipmunk2D. <a href="https://www.pymunk.org/" rel="noopener" target="_blank">pymunk.org</a></li>
  <li>Cairo 2D graphics library. <a href="https://www.cairographics.org/" rel="noopener" target="_blank">cairographics.org</a></li>
  <li>EBU R 128: Loudness normalisation and permitted maximum level of audio signals. <a href="https://tech.ebu.ch/publications/r128" rel="noopener" target="_blank">tech.ebu.ch/publications/r128</a></li>
</ol>
</article>
@include('site.articles._end')
@endsection
