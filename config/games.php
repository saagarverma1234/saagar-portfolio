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
    [
        'slug' => 'quiet-worlds',
        'url' => '/quiet-worlds/',
        'title' => 'Choose Your Planet',
        'channel' => 'Quiet Worlds',
        'description' => 'Four cosy planets, every one with a secret. Pick a world, survive a year and see what it was hiding. 72 worlds plus a daily challenge.',
        'tags' => ['Choice', 'Mystery'],
        'accent' => '#f4c86e',
    ],
    [
        'slug' => 'swipe-theory',
        'url' => '/swipe-theory/',
        'title' => 'Protect Pumpkin!',
        'channel' => 'Swipe Theory',
        'description' => 'Put your finger on the screen and keep Pumpkin the cat safe from rain, meteors, lava and a dragon. 24 levels with a twist in every world, plus Endless.',
        'tags' => ['Arcade', 'Kids'],
        'accent' => '#ffa24c',
    ],
];
