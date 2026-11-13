@extends('site.layout')
@section('title', 'The Maths of 1 Ball Becoming 10,000 | Saagar Verma')
@section('og_title', 'The Maths of 1 Ball Becoming 10,000')
@section('description', 'How one ball turns into 10,000: multiplication chains, exponential growth, why doubling ten times gives about 1,000, and why the order and position of multiplier gates change the final count.')
@section('path', '/articles/maths-of-1-ball-to-10000')
@section('og_image', 'https://saagarverma.com/bump-theory/og.png')
@section('content')
<article class="post">
@include('site.articles._top')

<p class="lede">The Bump Theory game is called <a href="/bump-theory/">1 Ball &rarr; 10,000</a>. Ten thousand sounds like a lot of work for one ball, but four x10 gates in a row are enough. The reason is one of the most useful ideas in maths: when you multiply again and again, numbers stop growing steadily and start to explode.</p>

<h2>Adding versus multiplying</h2>
<p>Imagine two machines. The first adds 10 balls every time a ball passes through. The second multiplies the balls by 10. Start each with one ball and run four rounds:</p>
<div class="tbl">
<table>
  <tr><th>Round</th><th class="n">+10 each round</th><th class="n">x10 each round</th></tr>
  <tr><td>Start</td><td class="n">1</td><td class="n">1</td></tr>
  <tr><td>1</td><td class="n">11</td><td class="n">10</td></tr>
  <tr><td>2</td><td class="n">21</td><td class="n">100</td></tr>
  <tr><td>3</td><td class="n">31</td><td class="n">1,000</td></tr>
  <tr><td>4</td><td class="n">41</td><td class="n">10,000</td></tr>
</table>
</div>
<p>After one round, adding is actually ahead. After four, multiplying is about 240 times bigger. Adding grows by the same <em>amount</em> each step; multiplying grows by the same <em>proportion</em>, so every step builds on all the steps before it. That second kind is called exponential growth.</p>

<h2>Why doubling ten times is about 1,000</h2>
<p>The smallest useful multiplier is x2. Here is what four x2 gates do to a single ball:</p>

<figure class="fig">
<svg viewBox="0 0 600 300" role="img" aria-labelledby="f3t"><title id="f3t">A doubling tree: 1 ball becomes 2, 4, 8 and then 16 after four x2 gates.</title>
<line class="ln-soft" x1="280.0" y1="44.0" x2="170.0" y2="104.0" stroke-width="2"/>
<line class="ln-soft" x1="280.0" y1="44.0" x2="390.0" y2="104.0" stroke-width="2"/>
<text class="t-acc2" x="40" y="79.0" text-anchor="middle" font-size="21">x2</text>
<line class="ln-soft" x1="170.0" y1="104.0" x2="115.0" y2="164.0" stroke-width="2"/>
<line class="ln-soft" x1="170.0" y1="104.0" x2="225.0" y2="164.0" stroke-width="2"/>
<line class="ln-soft" x1="390.0" y1="104.0" x2="335.0" y2="164.0" stroke-width="2"/>
<line class="ln-soft" x1="390.0" y1="104.0" x2="445.0" y2="164.0" stroke-width="2"/>
<text class="t-acc2" x="40" y="139.0" text-anchor="middle" font-size="21">x2</text>
<line class="ln-soft" x1="115.0" y1="164.0" x2="87.5" y2="224.0" stroke-width="2"/>
<line class="ln-soft" x1="115.0" y1="164.0" x2="142.5" y2="224.0" stroke-width="2"/>
<line class="ln-soft" x1="225.0" y1="164.0" x2="197.5" y2="224.0" stroke-width="2"/>
<line class="ln-soft" x1="225.0" y1="164.0" x2="252.5" y2="224.0" stroke-width="2"/>
<line class="ln-soft" x1="335.0" y1="164.0" x2="307.5" y2="224.0" stroke-width="2"/>
<line class="ln-soft" x1="335.0" y1="164.0" x2="362.5" y2="224.0" stroke-width="2"/>
<line class="ln-soft" x1="445.0" y1="164.0" x2="417.5" y2="224.0" stroke-width="2"/>
<line class="ln-soft" x1="445.0" y1="164.0" x2="472.5" y2="224.0" stroke-width="2"/>
<text class="t-acc2" x="40" y="199.0" text-anchor="middle" font-size="21">x2</text>
<line class="ln-soft" x1="87.5" y1="224.0" x2="73.8" y2="284.0" stroke-width="2"/>
<line class="ln-soft" x1="87.5" y1="224.0" x2="101.2" y2="284.0" stroke-width="2"/>
<line class="ln-soft" x1="142.5" y1="224.0" x2="128.8" y2="284.0" stroke-width="2"/>
<line class="ln-soft" x1="142.5" y1="224.0" x2="156.2" y2="284.0" stroke-width="2"/>
<line class="ln-soft" x1="197.5" y1="224.0" x2="183.8" y2="284.0" stroke-width="2"/>
<line class="ln-soft" x1="197.5" y1="224.0" x2="211.2" y2="284.0" stroke-width="2"/>
<line class="ln-soft" x1="252.5" y1="224.0" x2="238.8" y2="284.0" stroke-width="2"/>
<line class="ln-soft" x1="252.5" y1="224.0" x2="266.2" y2="284.0" stroke-width="2"/>
<line class="ln-soft" x1="307.5" y1="224.0" x2="293.8" y2="284.0" stroke-width="2"/>
<line class="ln-soft" x1="307.5" y1="224.0" x2="321.2" y2="284.0" stroke-width="2"/>
<line class="ln-soft" x1="362.5" y1="224.0" x2="348.8" y2="284.0" stroke-width="2"/>
<line class="ln-soft" x1="362.5" y1="224.0" x2="376.2" y2="284.0" stroke-width="2"/>
<line class="ln-soft" x1="417.5" y1="224.0" x2="403.8" y2="284.0" stroke-width="2"/>
<line class="ln-soft" x1="417.5" y1="224.0" x2="431.2" y2="284.0" stroke-width="2"/>
<line class="ln-soft" x1="472.5" y1="224.0" x2="458.8" y2="284.0" stroke-width="2"/>
<line class="ln-soft" x1="472.5" y1="224.0" x2="486.2" y2="284.0" stroke-width="2"/>
<text class="t-acc2" x="40" y="259.0" text-anchor="middle" font-size="21">x2</text>
<circle class="f-acc" cx="280.0" cy="44.0" r="10"/>
<text class="t-strong" x="530" y="50" font-size="25">1</text>
<circle class="f-acc" cx="170.0" cy="104.0" r="10"/>
<circle class="f-acc" cx="390.0" cy="104.0" r="10"/>
<text class="t-strong" x="530" y="110" font-size="25">2</text>
<circle class="f-acc" cx="115.0" cy="164.0" r="10"/>
<circle class="f-acc" cx="225.0" cy="164.0" r="10"/>
<circle class="f-acc" cx="335.0" cy="164.0" r="10"/>
<circle class="f-acc" cx="445.0" cy="164.0" r="10"/>
<text class="t-strong" x="530" y="170" font-size="25">4</text>
<circle class="f-acc" cx="87.5" cy="224.0" r="8"/>
<circle class="f-acc" cx="142.5" cy="224.0" r="8"/>
<circle class="f-acc" cx="197.5" cy="224.0" r="8"/>
<circle class="f-acc" cx="252.5" cy="224.0" r="8"/>
<circle class="f-acc" cx="307.5" cy="224.0" r="8"/>
<circle class="f-acc" cx="362.5" cy="224.0" r="8"/>
<circle class="f-acc" cx="417.5" cy="224.0" r="8"/>
<circle class="f-acc" cx="472.5" cy="224.0" r="8"/>
<text class="t-strong" x="530" y="230" font-size="25">8</text>
<circle class="f-acc" cx="73.8" cy="284.0" r="6"/>
<circle class="f-acc" cx="101.2" cy="284.0" r="6"/>
<circle class="f-acc" cx="128.8" cy="284.0" r="6"/>
<circle class="f-acc" cx="156.2" cy="284.0" r="6"/>
<circle class="f-acc" cx="183.8" cy="284.0" r="6"/>
<circle class="f-acc" cx="211.2" cy="284.0" r="6"/>
<circle class="f-acc" cx="238.8" cy="284.0" r="6"/>
<circle class="f-acc" cx="266.2" cy="284.0" r="6"/>
<circle class="f-acc" cx="293.8" cy="284.0" r="6"/>
<circle class="f-acc" cx="321.2" cy="284.0" r="6"/>
<circle class="f-acc" cx="348.8" cy="284.0" r="6"/>
<circle class="f-acc" cx="376.2" cy="284.0" r="6"/>
<circle class="f-acc" cx="403.8" cy="284.0" r="6"/>
<circle class="f-acc" cx="431.2" cy="284.0" r="6"/>
<circle class="f-acc" cx="458.8" cy="284.0" r="6"/>
<circle class="f-acc" cx="486.2" cy="284.0" r="6"/>
<text class="t-strong" x="530" y="290" font-size="25">16</text>
<text x="530" y="20" font-size="19">balls</text>
</svg>
<figcaption>Each x2 gate doubles every ball that passes through it. Four gates turn 1 ball into 16; ten gates turn it into 1,024.</figcaption>
</figure>

<p>Keep going and the numbers run 32, 64, 128, 256, 512, and then 1,024 after the tenth gate. That is 2<sup>10</sup>, and it lands almost exactly on 1,000. The coincidence is so handy that computer people long used "kilobyte" for 1,024 bytes, until standards bodies introduced the "kibibyte" to keep the two apart.</p>
<p>It also gives a great mental shortcut: <strong>every ten doublings adds about three zeros</strong>. Twenty doublings is about a million (1,048,576 exactly) and thirty is about a billion. Bankers use a cousin of this trick, the "rule of 70": something growing by 7% a year doubles in about 10 years, because 70 &divide; 7 = 10.</p>

<h2>How many gates does 10,000 take?</h2>
<p>To reach a target with one kind of gate, keep multiplying until you pass it. Mathematicians call this question a logarithm, but counting works fine:</p>
<div class="tbl">
<table>
  <tr><th>Gate</th><th class="n">Gates needed</th><th class="n">Balls you get</th></tr>
  <tr><td>x2</td><td class="n">14</td><td class="n">16,384</td></tr>
  <tr><td>x3</td><td class="n">9</td><td class="n">19,683</td></tr>
  <tr><td>x5</td><td class="n">6</td><td class="n">15,625</td></tr>
  <tr><td>x10</td><td class="n">4</td><td class="n">10,000</td></tr>
</table>
</div>
<p>Thirteen x2 gates fall just short (8,192), which is why you need fourteen. Mixing gates works the same way: x2, then x3, then x5 gives 2 &times; 3 &times; 5 = 30. And because multiplication doesn't care about order, 5 &times; 3 &times; 2 is also 30. On paper, the order of your gates never matters.</p>
<p>On the board, it matters a lot.</p>

<h2>The catch: not every ball hits the gate</h2>
<p>When a ball passes a xN gate in the game, it comes out as N balls fanned into a spray. The next gate down only multiplies the balls that actually reach it. The rest fall past unchanged.</p>
<p>Suppose 10 balls arrive at a x2 gate and 6 of them hit it. The 6 become 12, the other 4 stay as 4, and you leave with 16, not 20. To write that as a rule, call the number of balls arriving <em>k</em> and the share that hits the gate <em>p</em> (6 out of 10 means p = 0.6):</p>
<p class="eq">balls after = p&middot;k&middot;N + (1 &minus; p)&middot;k = k &times; (1 + p(N &minus; 1))</p>
<p>Check it: 10 &times; (1 + 0.6 &times; 1) = 16. This one formula, from the game's How-it-works guide, explains most of the strategy. A gate is only worth its full multiplier when the whole stream goes through it. A x10 gate that catches half the balls is really a x5.5 gate, and one that catches just one ball in nine is no better than a perfect x2.</p>

<figure class="fig">
<svg viewBox="0 0 600 310" role="img" aria-labelledby="f4t"><title id="f4t">What a x10 gate is really worth: 1 + 9p, where p is the share of balls that hit it. At 100% it gives x10, at 50% x5.5, at 11% only x2.</title>
<line class="ln-soft" x1="78" y1="236.0" x2="560" y2="236.0" stroke-width="1.5"/>
<text x="68" y="241.0" text-anchor="end" font-size="21">x1</text>
<line class="ln-soft" x1="78" y1="167.3" x2="560" y2="167.3" stroke-width="1.5"/>
<text x="68" y="172.3" text-anchor="end" font-size="21">x4</text>
<line class="ln-soft" x1="78" y1="98.7" x2="560" y2="98.7" stroke-width="1.5"/>
<text x="68" y="103.7" text-anchor="end" font-size="21">x7</text>
<line class="ln-soft" x1="78" y1="30.0" x2="560" y2="30.0" stroke-width="1.5"/>
<text x="68" y="35.0" text-anchor="end" font-size="21">x10</text>
<text x="78.0" y="260" text-anchor="middle" font-size="20">0%</text>
<text x="198.5" y="260" text-anchor="middle" font-size="20">25%</text>
<text x="319.0" y="260" text-anchor="middle" font-size="20">50%</text>
<text x="439.5" y="260" text-anchor="middle" font-size="20">75%</text>
<text x="560.0" y="260" text-anchor="middle" font-size="20">100%</text>
<text x="319.0" y="286" text-anchor="middle" font-size="21">share of balls that hit the gate (p)</text>
<line class="acc" x1="78.0" y1="236.0" x2="560.0" y2="30.0" stroke-width="4" stroke-linecap="round"/>
<circle class="f-acc2" cx="560.0" cy="30.0" r="6.5"/>
<text class="t-strong" x="548.0" y="20.0" text-anchor="end" font-size="23">x10</text>
<circle class="f-acc2" cx="319.0" cy="133.0" r="6.5"/>
<text class="t-strong" x="307.0" y="123.0" text-anchor="end" font-size="23">x5.5</text>
<circle class="f-acc2" cx="131.6" cy="213.1" r="6.5"/>
<text class="t-strong" x="143.6" y="203.1" text-anchor="start" font-size="23">x2</text>
</svg>
<figcaption>A x10 gate is only worth x10 if every ball hits it. Its real factor is 1 + 9p.</figcaption>
</figure>

<h2>Why order and position change the answer</h2>
<p>Bigger multipliers throw a wider spray, and wide sprays are hard to catch. That breaks the "order doesn't matter" rule. Here is a made-up but realistic example with one x2 gate and one x10 gate, starting from a single ball that hits the first gate dead on:</p>
<ul>
  <li><strong>x2 first, x10 second.</strong> The x2 makes 2 balls in a narrow spray, so the x10 below catches, say, 90% of them: 2 &times; (1 + 0.9 &times; 9) &asymp; 18 balls.</li>
  <li><strong>x10 first, x2 second.</strong> The x10 makes 10 balls in a wide spray, so the x2 catches maybe 40%: 10 &times; (1 + 0.4 &times; 1) = 14 balls.</li>
</ul>
<p>Same two gates, different totals. That is the reason behind the game's first tip: small gates near the top where the stream is narrow, big gates at the bottom where a wide spray no longer has to hit anything. It is also why funnels help so much. Two walls in a V squeeze a spray back into a narrow stream, pushing <em>p</em> for the next gate close to 1.</p>
<p>The same thinking applies to losses. In a chain, the final count is the product of every gate's real factor, so a ball lost early costs you everything it would have become. Lose one ball to lava just before a x10 gate and you lose 10 at the end. Lose it before two x10 gates and you lose 100. Protect the stream most where it is smallest.</p>

<h2>Loops: where things really take off</h2>
<p>A chain of gates is a fixed number of steps. A loop has no end. In the game's sandbox, the Recycle switch sends balls that fall out of the bottom back to the top with their gate memory cleared. Now a single x2 gate doubles the count on every pass: ten passes is 2<sup>10</sup> = 1,024, and twenty is over a million.</p>
<p>Some Bump Theory videos use an even faster rule: every time two balls collide, a new ball appears. With N balls there are N &times; (N &minus; 1) &divide; 2 possible pairs, so 10 balls have 45 pairs and 100 balls have 4,950. More balls means many more chances to collide, so the counter starts slowly and then shoots up faster than plain doubling. In every case, the number on screen is exact: one ball, times every split, minus anything lost.</p>

<h2>Exponential growth outside the game</h2>
<p>The same maths drives compound interest, a virus spreading through a population, a nuclear chain reaction, and bacteria in a dish. In each case the important question is not "how much is added?" but "by what factor does it multiply, and how often?" Physicist Albert Bartlett spent decades arguing that this is the single most important piece of maths for understanding the world, because steady percentage growth always ends up bigger, faster, than intuition expects.</p>

<div class="try">
  <p><strong>Try it yourself.</strong> Build chains, test gate orders and watch the counter. 24 levels plus a sandbox with Recycle mode. Free, in your browser.</p>
  <a class="go" href="/bump-theory/">Play 1 Ball &rarr; 10,000</a>
  <a class="go alt" href="/bump-theory/#how-it-works">Read the game guide</a>
</div>

<h2>Sources</h2>
<ol class="sources">
  <li>Bartlett, A. A. (1978). Forgotten fundamentals of the energy crisis. <em>American Journal of Physics</em> 46, 876&ndash;888. <a href="https://doi.org/10.1119/1.11509" rel="noopener" target="_blank">doi:10.1119/1.11509</a></li>
  <li>National Institute of Standards and Technology. Prefixes for binary multiples (kibi, mebi, gibi). <a href="https://physics.nist.gov/cuu/Units/binary.html" rel="noopener" target="_blank">physics.nist.gov/cuu/Units/binary.html</a></li>
  <li>1 Ball &rarr; 10,000: How it works (the k &times; (1 + p(N &minus; 1)) rule and the Recycle mode). <a href="/bump-theory/#how-it-works">saagarverma.com/bump-theory</a></li>
</ol>
</article>
@include('site.articles._end')
@endsection
