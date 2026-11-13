@extends('site.layout')
@section('title', 'Why Do Metronomes Sync on a Moving Board? | Saagar Verma')
@section('og_title', 'Why Do Metronomes Sync on a Moving Board?')
@section('description', 'Put metronomes on a board that can roll and they fall into step. Here is why: momentum through the board, Huygens\' clocks of 1665, the Kuramoto model in plain words, and how the IN STEP % in our game is measured.')
@section('path', '/articles/why-metronomes-sync')
@section('og_image', 'https://saagarverma.com/metronomes/og.png')
@section('content')
<article class="post">
@include('site.articles._top')

<p class="lede">Set a row of metronomes ticking at random on a light board that rests on two drink cans. Within a minute or two they are ticking as one. Nothing connects them except the board. So how does each metronome "know" what the others are doing?</p>

<h2>A clockmaker's sick week in 1665</h2>
<p>The first person to write this effect down was the Dutch scientist Christiaan Huygens, who had invented the pendulum clock in 1656. In February 1665 he was ill in bed and had two of his clocks hanging from the same wooden beam. He noticed that their pendulums swung in perfect opposition, one going left while the other went right. When he disturbed one, the pair drifted back into that same pattern within about half an hour.</p>
<p>Huygens called it "an odd kind of sympathy" and guessed the cause: tiny, almost invisible movements of the beam carried a signal from one clock to the other. He was right. In 2002 a team at Georgia Tech rebuilt the experiment with two pendulum clocks on a movable support and confirmed that the support's motion is the whole story.</p>
<p>Huygens's clocks locked in opposite directions. Metronomes on a rolling board usually lock in the same direction. Which pattern wins depends on details such as how heavy the support is and how much friction there is, but the mechanism is the same: the things that tick are joined by something that moves.</p>

<h2>Each metronome keeps itself going</h2>
<p>A metronome is a pendulum with an escapement, a small spring-driven catch that gives the pendulum a kick on every swing. If the swing gets too small, the kicks add energy. If it gets too big, friction takes more than the kicks give. So every metronome settles into its own steady swing size, whatever you do to it.</p>
<p>That self-correction matters. A plain pendulum that you nudge keeps the nudge forever, or loses its swing entirely. A metronome shrugs off changes to its swing size but is surprisingly easy to push earlier or later in its rhythm. Physicists call this a <em>self-sustained oscillator</em>, and it is the kind of thing that can synchronise.</p>
<p>No two metronomes are perfectly identical, either. Set to the same tempo, one runs a hair fast and another a hair slow. Left alone on a solid table, they drift apart forever.</p>

<h2>Momentum travels through the board</h2>
<p>Now put them on a board that can roll. When a pendulum swings to the right, the rest of the metronome, and the board under it, gets pushed slightly to the left. It is the same thing that happens when you step forward in a small boat and the boat moves back. Physicists call it conservation of momentum.</p>

<figure class="fig">
<svg viewBox="0 0 600 290" role="img" aria-labelledby="f1t"><title id="f1t">Metronomes on a board resting on two cans. When the pendulums swing right, the board slides left.</title>
<line class="ln-soft" x1="20" y1="222" x2="580" y2="222" stroke-width="2"/>
<circle class="ln" cx="180" cy="203" r="18" stroke-width="2.5"/><circle class="f-dim" cx="180" cy="203" r="3"/>
<circle class="ln" cx="420" cy="203" r="18" stroke-width="2.5"/><circle class="f-dim" cx="420" cy="203" r="3"/>
<rect class="ln" x="80" y="172" width="440" height="13" rx="3" stroke-width="2.5"/>
<path class="ln" d="M149 172 L164 96 L186 96 L201 172 Z" stroke-width="2.5" stroke-linejoin="round"/>
<line class="acc" x1="175" y1="160" x2="209.5" y2="74.7" stroke-width="3.5" stroke-linecap="round"/>
<rect class="f-acc" x="188.4" y="101.1" width="16" height="12" rx="2" transform="rotate(22 196.4 107.1)"/>
<path class="ln" d="M274 172 L289 96 L311 96 L326 172 Z" stroke-width="2.5" stroke-linejoin="round"/>
<line class="acc" x1="300" y1="160" x2="334.5" y2="74.7" stroke-width="3.5" stroke-linecap="round"/>
<rect class="f-acc" x="313.4" y="101.1" width="16" height="12" rx="2" transform="rotate(22 321.4 107.1)"/>
<path class="ln" d="M399 172 L414 96 L436 96 L451 172 Z" stroke-width="2.5" stroke-linejoin="round"/>
<line class="acc" x1="425" y1="160" x2="459.5" y2="74.7" stroke-width="3.5" stroke-linecap="round"/>
<rect class="f-acc" x="438.4" y="101.1" width="16" height="12" rx="2" transform="rotate(22 446.4 107.1)"/>
<line class="acc" x1="240.0" y1="52.0" x2="390.0" y2="52.0" stroke-width="3.5" stroke-linecap="round"/><path class="acc" d="M379.2 57.2 L390.0 52.0 L379.2 46.8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<text class="t-acc" x="315" y="30" text-anchor="middle" font-size="25">pendulums swing right</text>
<line class="acc2" x1="375.0" y1="244.0" x2="225.0" y2="244.0" stroke-width="3.5" stroke-linecap="round"/><path class="acc2" d="M235.8 238.8 L225.0 244.0 L235.8 249.2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<text class="t-acc2" x="300" y="282" text-anchor="middle" font-size="25">board slides left</text>
</svg>
<figcaption>When the pendulums swing one way, the board rolls the other way. The board's motion is the only link between the metronomes.</figcaption>
</figure>

<p>One metronome barely moves the board. But when many of them swing roughly together, their pushes add up and the board rocks from side to side in rhythm with the crowd. That rocking shakes every metronome on the board, including the ones that are out of step.</p>
<p>Here is the clever part. Moving a pendulum's pivot sideways is a bit like briefly tilting gravity. For a metronome that is slightly ahead of the crowd, the board's motion works against its swing and holds it back a little. For one that is behind, the board's motion helps it along. Each nudge is tiny, but they repeat on every swing, more than a hundred times a minute, and they all point the same way: toward the common beat.</p>
<p>This link through the board is called <em>coupling</em>. Its strength depends on how easily the board moves. A light board on rollers couples strongly. A heavy board couples weakly, and a solid table hardly at all, which is why your metronome on the piano never syncs with the one on the shelf.</p>

<h2>The Kuramoto model, in plain words</h2>
<p>In 1975 the Japanese physicist Yoshiki Kuramoto wrote down a simple model that captures what happens in crowds of oscillators like this. Picture runners on a circular track. Each runner has a favourite speed, some a little faster, some a little slower. Now add one rule: every runner is gently pulled toward the others, harder when the gap is bigger (up to a point).</p>
<p>Kuramoto showed something surprising. If the pull is weak compared with how different the runners' speeds are, nothing happens: the runners spread out around the track. But once the pull passes a certain critical strength, a group suddenly forms and runs together, and that group grows as the pull increases. It is less like a slow fade and more like water freezing.</p>
<p>For the curious, the model for runner <em>i</em> with favourite speed &omega;<sub>i</sub> looks like this, where &theta; is the position around the track, K is the strength of the pull and N is the number of runners:</p>
<p class="eq">d&theta;<sub>i</sub>/dt = &omega;<sub>i</sub> + (K/N) &Sigma;<sub>j</sub> sin(&theta;<sub>j</sub> &minus; &theta;<sub>i</sub>)</p>
<p>Metronomes on a board follow more detailed equations than this, but the big idea carries over: spread in natural tempos tries to pull them apart, coupling tries to pull them together, and sync takes over when coupling wins. The same picture explains fireflies that flash in unison, pacemaker cells in the heart, and the crowd on London's Millennium Bridge in 2000, whose footsteps fell into step with the bridge's sideways sway and made it wobble.</p>

<h2>How the game measures "IN STEP %"</h2>
<p>Our <a href="/metronomes/">Metronome Sync Game</a> runs the published equations for metronomes on a rolling board (from James Pantaleone's 2002 paper in the American Journal of Physics), solved in small, fixed time steps. Nothing is scripted. To show how close the crowd is to sync, it borrows Kuramoto's measure, called the <em>order parameter</em>.</p>
<p>First, each metronome gets a <em>phase</em>: where it is in its swing, as an angle on a circle. The game works this out from two numbers, the pendulum's angle and how fast it is moving, so a metronome at the far left, at the centre going right, at the far right and at the centre going left sit a quarter of a circle apart. Think of each metronome as an arrow pointing to its phase.</p>

<figure class="fig">
<svg viewBox="0 0 600 300" role="img" aria-labelledby="f2t"><title id="f2t">Phase arrows. Scattered arrows average to a short arrow (low IN STEP %); aligned arrows average to a long arrow (high IN STEP %).</title>
<circle class="ln-soft" cx="150" cy="120" r="78" stroke-width="2"/>
<line class="ln" x1="150.0" y1="120.0" x2="218.5" y2="105.4" stroke-width="2.2" stroke-linecap="round"/><path class="ln" d="M211.4 111.0 L218.5 105.4 L209.7 103.3" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<line class="ln" x1="150.0" y1="120.0" x2="168.1" y2="52.4" stroke-width="2.2" stroke-linecap="round"/><path class="ln" d="M169.8 61.2 L168.1 52.4 L162.2 59.2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<line class="ln" x1="150.0" y1="120.0" x2="96.4" y2="75.0" stroke-width="2.2" stroke-linecap="round"/><path class="ln" d="M105.1 77.2 L96.4 75.0 L100.1 83.2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<line class="ln" x1="150.0" y1="120.0" x2="86.6" y2="149.6" stroke-width="2.2" stroke-linecap="round"/><path class="ln" d="M92.2 142.6 L86.6 149.6 L95.6 149.7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<line class="ln" x1="150.0" y1="120.0" x2="126.1" y2="185.8" stroke-width="2.2" stroke-linecap="round"/><path class="ln" d="M125.2 176.8 L126.1 185.8 L132.5 179.5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<line class="ln" x1="150.0" y1="120.0" x2="202.0" y2="166.8" stroke-width="2.2" stroke-linecap="round"/><path class="ln" d="M193.4 164.3 L202.0 166.8 L198.6 158.5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<line class="acc" x1="150.0" y1="120.0" x2="149.6" y2="122.5" stroke-width="5" stroke-linecap="round"/><path class="acc" d="M145.9 110.1 L149.6 122.5 L157.0 111.8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<circle class="f-acc" cx="150" cy="120" r="4"/>
<text class="t-strong" x="150" y="232" text-anchor="middle" font-size="25">Out of step: 4%</text>
<text x="150" y="264" text-anchor="middle" font-size="21">short average arrow</text>
<circle class="ln-soft" cx="450" cy="120" r="78" stroke-width="2"/>
<line class="ln" x1="450.0" y1="120.0" x2="514.9" y2="93.8" stroke-width="2.2" stroke-linecap="round"/><path class="ln" d="M508.9 100.4 L514.9 93.8 L505.9 93.2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<line class="ln" x1="450.0" y1="120.0" x2="508.0" y2="80.9" stroke-width="2.2" stroke-linecap="round"/><path class="ln" d="M503.5 88.6 L508.0 80.9 L499.1 82.1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<line class="ln" x1="450.0" y1="120.0" x2="502.8" y2="74.1" stroke-width="2.2" stroke-linecap="round"/><path class="ln" d="M499.3 82.3 L502.8 74.1 L494.1 76.4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<line class="ln" x1="450.0" y1="120.0" x2="496.8" y2="68.0" stroke-width="2.2" stroke-linecap="round"/><path class="ln" d="M494.3 76.6 L496.8 68.0 L488.5 71.4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<line class="ln" x1="450.0" y1="120.0" x2="487.1" y2="60.6" stroke-width="2.2" stroke-linecap="round"/><path class="ln" d="M486.1 69.6 L487.1 60.6 L479.5 65.4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<line class="ln" x1="450.0" y1="120.0" x2="511.2" y2="86.1" stroke-width="2.2" stroke-linecap="round"/><path class="ln" d="M506.0 93.4 L511.2 86.1 L502.2 86.6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<line class="acc" x1="450.0" y1="120.0" x2="503.5" y2="77.2" stroke-width="5" stroke-linecap="round"/><path class="acc" d="M497.9 89.0 L503.5 77.2 L490.8 80.1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<circle class="f-acc" cx="450" cy="120" r="4"/>
<text class="t-strong" x="450" y="232" text-anchor="middle" font-size="25">In step: 98%</text>
<text x="450" y="264" text-anchor="middle" font-size="21">long average arrow</text>
</svg>
<figcaption>Each metronome is an arrow pointing to its phase. The gold arrow is their average; its length is the IN STEP number.</figcaption>
</figure>

<p>Then the game averages all the arrows. If they point every which way, they cancel and the average is a short arrow, close to 0%. If they all point the same way, the average is a full-length arrow: 100%. That length is the IN STEP number. A few details keep it honest and readable:</p>
<ul>
  <li>It is averaged over the last half second (30 readings at 60 per second), so it does not flicker with every swing.</li>
  <li>It shows 100% only when the average length rounds to 100, and the "Synced in" timer stops only after it holds there for half a second.</li>
  <li>If the crowd is disturbed and the number falls below 90%, the round counts as unsynced again and the timer restarts.</li>
</ul>
<div class="note">
  <p><strong>Why a perfect tie reads 0%.</strong> In the game's <em>50 vs 50</em> challenge, two teams are each perfectly in step but half a swing apart. Their arrows point in opposite directions and cancel exactly, so IN STEP shows close to 0% even though nothing looks random. The board feels the same cancellation: the two teams' pushes balance, so it barely moves. That balance is unstable, and a tiny imbalance grows until one team wins.</p>
</div>

<h2>What makes sync faster or slower</h2>
<ul>
  <li><strong>A lighter board</strong> moves more, so the coupling is stronger. In the game, "Add weights" puts a heavy load on the board and sync slows to a crawl.</li>
  <li><strong>Closer tempos</strong> need less coupling to lock. Metronomes set to very different tempos may never sync.</li>
  <li><strong>A heavy metronome</strong> pushes the board harder than the others, so the crowd tends to fall in behind it. Try "Add big one" and watch.</li>
  <li><strong>A steady outside drive</strong>, like the game's Shake motor, can drag everyone onto its own beat instead. This is called entrainment.</li>
</ul>

<div class="try">
  <p><strong>Try it yourself.</strong> Play with up to 100 metronomes in your browser, or build the real thing: a light board resting on two empty drink cans, with two or more metronomes set to the same tempo. Start them at random and wait.</p>
  <a class="go" href="/metronomes/">Play the Metronome Sync Game</a>
  <a class="go alt" href="https://www.youtube.com/@chaostoorderlab" rel="noopener" target="_blank">Watch Chaos to Order</a>
</div>

<h2>Sources</h2>
<ol class="sources">
  <li>Pantaleone, J. (2002). Synchronization of metronomes. <em>American Journal of Physics</em> 70, 992&ndash;1000. <a href="https://doi.org/10.1119/1.1501118" rel="noopener" target="_blank">doi:10.1119/1.1501118</a></li>
  <li>Bennett, M., Schatz, M. F., Rockwood, H. &amp; Wiesenfeld, K. (2002). Huygens's clocks. <em>Proceedings of the Royal Society A</em> 458, 563&ndash;579. <a href="https://doi.org/10.1098/rspa.2001.0888" rel="noopener" target="_blank">doi:10.1098/rspa.2001.0888</a></li>
  <li>Strogatz, S. H. (2000). From Kuramoto to Crawford: exploring the onset of synchronization in populations of coupled oscillators. <em>Physica D</em> 143, 1&ndash;20. <a href="https://doi.org/10.1016/S0167-2789(00)00094-4" rel="noopener" target="_blank">doi:10.1016/S0167-2789(00)00094-4</a></li>
  <li>Strogatz, S. H. et al. (2005). Crowd synchrony on the Millennium Bridge. <em>Nature</em> 438, 43&ndash;44. <a href="https://doi.org/10.1038/438043a" rel="noopener" target="_blank">doi:10.1038/438043a</a></li>
</ol>
</article>
@include('site.articles._end')
@endsection
