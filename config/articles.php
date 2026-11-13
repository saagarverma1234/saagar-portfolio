<?php

/*
|--------------------------------------------------------------------------
| Articles (/articles)
|--------------------------------------------------------------------------
|
| One entry per article, newest first. Each article is a Blade view at
| resources/views/site/articles/<slug>.blade.php and is served at
| /articles/<slug>. The sitemap (public/sitemap.xml) is static, so add new
| article URLs there too. "minutes" is the read time at about 220 words a minute.
|
*/

return [
    [
        'slug' => 'why-metronomes-sync',
        'title' => 'Why Do Metronomes Sync on a Moving Board?',
        'summary' => 'Coupled oscillators, Huygens\' clocks and the Kuramoto model, explained without the scary maths.',
        'minutes' => 7,
        'date' => '2026-11-13',
        'game' => '/metronomes/',
        'og_image' => 'https://saagarverma.com/metronomes/og.png',
    ],
    [
        'slug' => 'maths-of-1-ball-to-10000',
        'title' => 'The Maths of 1 Ball Becoming 10,000',
        'summary' => 'Why x2 ten times is about 1,000, and why the order of your gates changes the final count.',
        'minutes' => 6,
        'date' => '2026-11-13',
        'game' => '/bump-theory/',
        'og_image' => 'https://saagarverma.com/bump-theory/og.png',
    ],
    [
        'slug' => 'how-bump-theory-simulations-are-made',
        'title' => 'How Bump Theory Simulations Are Made',
        'summary' => 'Fixed time steps, honest counters, collision maths and sound made from every bounce.',
        'minutes' => 6,
        'date' => '2026-11-13',
        'game' => '/bump-theory/',
        'og_image' => 'https://saagarverma.com/bump-theory/og.png',
    ],
    [
        'slug' => 'can-a-planet-really-be-safe',
        'title' => 'Can a Planet Really Be Safe?',
        'summary' => 'Temperature, air, gravity and day length: the real science behind "Choose a Planet".',
        'minutes' => 5,
        'date' => '2026-11-13',
        'game' => '/quiet-worlds/',
        'og_image' => 'https://saagarverma.com/quiet-worlds/og.png',
    ],
];
