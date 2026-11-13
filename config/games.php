<?php

/*
|--------------------------------------------------------------------------
| Games hub (/games)
|--------------------------------------------------------------------------
|
| One entry per game, shown as a card on /games in this order. To add a game:
| put its static files in public/<slug>/, a 640x360 thumbnail in
| public/images/games/<slug>.webp (+ .jpg fallback), and add an entry here.
| The sitemap (public/sitemap.xml) is static, so add the game URL there too.
|
*/

return [
    [
        'slug' => 'bump-theory',
        'url' => '/bump-theory/',
        'title' => '1 Ball → 10,000',
        'channel' => 'Bump Theory',
        'description' => 'Place multiplier gates, walls and bumpers, drop one ball and watch it turn into thousands. 24 levels plus a sandbox.',
        'tags' => ['Puzzle', 'Physics'],
        'accent' => '#ffcc33',
    ],
    [
        'slug' => 'metronomes',
        'url' => '/metronomes/',
        'title' => 'Metronome Sync Game',
        'channel' => 'Chaos to Order',
        'description' => 'Up to 100 metronomes on one rolling board. Nudge, shake and flip them and watch chaos turn into perfect sync.',
        'tags' => ['Simulation', 'Real physics'],
        'accent' => '#ffcc66',
    ],
];
