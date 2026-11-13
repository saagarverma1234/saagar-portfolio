@extends('site.layout')
@section('title', 'Can a Planet Really Be Safe? The Science Behind “Choose a Planet” | Saagar Verma')
@section('og_title', 'Can a Planet Really Be Safe?')
@section('description', 'The real science behind the Quiet Worlds “Choose a Planet” videos and game: the habitable zone, air pressure, gravity, magnetic fields, day length, and why the planet that looks safest is often a trap.')
@section('path', '/articles/can-a-planet-really-be-safe')
@section('og_image', 'https://saagarverma.com/quiet-worlds/og.png')
@section('content')
<article class="post">
@include('site.articles._top')

<p class="lede">The <a href="https://www.youtube.com/@myquietworlds" rel="noopener" target="_blank">Quiet Worlds</a> videos show four cosy little planets and ask a simple question: which one would you live on? Every one of them hides a secret. That is a story trick, but it is also good science. Real planets are exactly like that: the things that make a world look friendly in a picture say very little about whether you could survive there.</p>

<h2>What "safe" means for a human</h2>
<p>To live on a planet without a spacesuit, you would need all of these at once:</p>
<ul>
  <li>a temperature where water stays liquid and your body neither freezes nor overheats;</li>
  <li>air at the right pressure, with enough oxygen and not too much of anything poisonous;</li>
  <li>gravity your heart, bones and muscles can cope with;</li>
  <li>protection from the star's radiation;</li>
  <li>days and nights you can live with;</li>
  <li>water and something to eat.</li>
</ul>
<p>Miss any single one and the rest don't matter. That is why "safe" is such a high bar, and why the planet with the prettiest sky can still be the deadliest.</p>

<h2>Temperature and the habitable zone</h2>
<p>Astronomers talk about a star's <em>habitable zone</em>: the range of distances where a planet like Earth could keep liquid water on its surface. Too close and the oceans boil away; too far and they freeze. One widely used estimate puts the Sun's habitable zone between about 0.99 and 1.70 times Earth's distance from the Sun. Earth sits right near the inner edge.</p>

<figure class="fig">
<svg viewBox="0 0 600 250" role="img" aria-labelledby="f7t"><title id="f7t">The Sun's habitable zone runs from about 0.99 to 1.70 times Earth's distance. Venus is inside the inner edge, Earth near the inner edge, Mars inside the zone but too small to keep a thick atmosphere.</title>
<rect x="317.5" y="60" width="177.5" height="100" rx="8" fill="#3fbf7f" opacity=".16"/>
<text x="406.2" y="50" text-anchor="middle" font-size="21" class="t-strong">habitable zone</text>
<circle class="f-acc" cx="48" cy="110" r="30"/>
<text x="48" y="168" text-anchor="middle" font-size="19">Sun</text>
<line class="ln-soft" x1="70" y1="110" x2="570" y2="110" stroke-width="2"/>
<circle cx="250.0" cy="110" r="9" fill="#e8c27a"/>
<text class="t-strong" x="250.0" y="88" text-anchor="middle" font-size="21">Venus</text>
<text x="250.0" y="145" text-anchor="middle" font-size="18">0.72</text>
<circle cx="320.0" cy="110" r="9.5" fill="#4fb3e8"/>
<text class="t-strong" x="320.0" y="88" text-anchor="middle" font-size="21">Earth</text>
<text x="320.0" y="145" text-anchor="middle" font-size="18">1</text>
<circle cx="450.0" cy="110" r="6" fill="#e07a52"/>
<text class="t-strong" x="450.0" y="88" text-anchor="middle" font-size="21">Mars</text>
<text x="450.0" y="145" text-anchor="middle" font-size="18">1.52</text>
<line class="ln" x1="70.0" y1="186" x2="70.0" y2="193" stroke-width="1.5"/>
<text x="70.0" y="214" text-anchor="middle" font-size="18">0</text>
<line class="ln" x1="195.0" y1="186" x2="195.0" y2="193" stroke-width="1.5"/>
<text x="195.0" y="214" text-anchor="middle" font-size="18">0.5</text>
<line class="ln" x1="320.0" y1="186" x2="320.0" y2="193" stroke-width="1.5"/>
<text x="320.0" y="214" text-anchor="middle" font-size="18">1</text>
<line class="ln" x1="445.0" y1="186" x2="445.0" y2="193" stroke-width="1.5"/>
<text x="445.0" y="214" text-anchor="middle" font-size="18">1.5</text>
<line class="ln" x1="570.0" y1="186" x2="570.0" y2="193" stroke-width="1.5"/>
<text x="570.0" y="214" text-anchor="middle" font-size="18">2</text>
<line class="ln" x1="70" y1="186" x2="570" y2="186" stroke-width="1.5"/>
<text x="570" y="244" text-anchor="end" font-size="18">distance from the Sun (AU)</text>
</svg>
<figcaption>The Sun's habitable zone (Kopparapu et al. 2013). Being inside it is not enough: Mars is in the zone, but too small to keep a thick atmosphere.</figcaption>
</figure>

<p>But distance is only half of the story, because air acts like a blanket. Without its greenhouse gases, Earth's average surface temperature would be around &minus;18 &deg;C instead of about 15 &deg;C. Venus shows what happens when the blanket gets far too thick: its carbon dioxide atmosphere presses down about 90 times harder than Earth's, and the surface is around 465 &deg;C, hotter than Mercury even though Mercury is closer to the Sun. A century ago some scientists imagined Venus as a warm, swampy jungle world under its clouds. It was the ultimate "safe-looking" trap.</p>

<h2>Air: pressure and mixture both matter</h2>
<p>Breathing needs oxygen at roughly the pressure we get at sea level on Earth. Too little pressure is deadly on its own: below about 6% of Earth's sea-level pressure (the Armstrong limit), water boils at body temperature, so the liquid in your lungs and mouth would start to boil. Mars has about 0.6% of Earth's surface pressure, far below that line, which is why it needs a pressure suit even on a mild day.</p>
<p>The mixture matters too. Carbon dioxide is harmless in tiny amounts, but at around 4% of the air it is classed as immediately dangerous to life. Even oxygen can be a problem: breathing much more of it than normal for a long time damages the lungs, and an oxygen-rich atmosphere makes fires start and spread terrifyingly easily. A planet with "extra fresh air" might be a planet that burns.</p>
<p>Here's a sobering thought. For most of Earth's own history, its air had almost no free oxygen; it only built up after about 2.4 billion years ago. Drop a time-travelling human onto early Earth and they would suffocate on their own home planet.</p>

<h2>Gravity: heavier than it looks</h2>
<p>Surface gravity depends on a planet's mass and size. For two rocky planets made of the same stuff, gravity grows in step with the radius: a planet 1.5 times as wide as Earth would pull about 1.5 times as hard. Every step, every lifted arm and every heartbeat would be harder work, for life.</p>
<p>Low gravity sounds fun but has its own costs. Astronauts in orbit lose bone and muscle without daily exercise. And a small, low-gravity planet struggles to hold on to its atmosphere at all, because gas molecules escape more easily. That is part of why Mars, in the middle of the habitable zone, is a cold desert today.</p>

<h2>Radiation and the missing shield</h2>
<p>The Sun constantly blows a stream of charged particles called the solar wind. Earth's magnetic field deflects most of it. Mars lost its global magnetic field billions of years ago, and NASA's MAVEN spacecraft has watched the solar wind strip gas from the top of its atmosphere, with the loss jumping during solar storms. A planet can look calm and still be slowly losing its air, and its surface can be bathed in radiation you would never see.</p>

<h2>Day length and red dwarf stars</h2>
<p>Most stars in our galaxy are small, cool red dwarfs. Their habitable zones are very close in, so a planet there orbits in days or weeks, and the star's gravity is likely to lock it so one side always faces the star. That means a permanent day side and a permanent night side, with fierce winds carrying heat between them. Many red dwarfs also throw out powerful flares, especially when young. Proxima Centauri b, a planet around the nearest star to the Sun, orbits in the habitable zone of a red dwarf, and whether anything could survive there is still an open question.</p>

<h2>Why "the safe one" is often a trap</h2>
<p>Put all of this together and a pattern appears. The features we judge with our eyes are blue skies, calm seas, mild weather and gentle light. The features that actually decide survival are invisible: the exact gases in the air, the pressure, the radiation, the star's flares, the strength of gravity and what is dissolved in the water. A planet can pass every visual test and fail every invisible one.</p>
<p>That is the heart of "Choose a Planet". Each world in Quiet Worlds is a fantasy, but each one hides a catch, and you only find out by looking past the postcard. Real planetary scientists do the same thing every day when they study a newly discovered planet: they ask what can't be seen yet.</p>

<div class="try">
  <p><strong>Pick your world.</strong> Watch the Quiet Worlds episodes, then try the Choose Your Planet game: pick a planet, survive a year and see what it was hiding.</p>
  <a class="go" href="/quiet-worlds/">Play Choose Your Planet</a>
  <a class="go alt" href="https://www.youtube.com/@myquietworlds" rel="noopener" target="_blank">Watch Quiet Worlds</a>
</div>

<h2>Sources</h2>
<ol class="sources">
  <li>Kopparapu, R. K. et al. (2013). Habitable zones around main-sequence stars: new estimates. <em>The Astrophysical Journal</em> 765, 131. <a href="https://doi.org/10.1088/0004-637X/765/2/131" rel="noopener" target="_blank">doi:10.1088/0004-637X/765/2/131</a></li>
  <li>Shields, A. L., Ballard, S. &amp; Johnson, J. A. (2016). The habitability of planets orbiting M-dwarf stars. <em>Physics Reports</em> 663, 1&ndash;38. <a href="https://doi.org/10.1016/j.physrep.2016.10.003" rel="noopener" target="_blank">doi:10.1016/j.physrep.2016.10.003</a></li>
  <li>Jakosky, B. M. et al. (2015). MAVEN observations of the response of Mars to an interplanetary coronal mass ejection. <em>Science</em> 350. <a href="https://doi.org/10.1126/science.aad0210" rel="noopener" target="_blank">doi:10.1126/science.aad0210</a></li>
  <li>CDC / NIOSH. Carbon dioxide: Immediately Dangerous to Life or Health (IDLH) value, 40,000 ppm. <a href="https://www.cdc.gov/niosh/idlh/124389.html" rel="noopener" target="_blank">cdc.gov/niosh/idlh/124389.html</a></li>
</ol>
</article>
@include('site.articles._end')
@endsection
