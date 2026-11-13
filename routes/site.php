<?php

use Illuminate\Support\Facades\Route;

/*
| Plain content pages (privacy, about, contact). Loaded without the "web"
| middleware group: they are static Blade views, so they set no cookies and
| create no sessions.
*/

Route::view('/privacy', 'site.privacy');
Route::view('/about', 'site.about');
Route::view('/contact', 'site.contact');
Route::permanentRedirect('/privacy-policy', '/privacy');
Route::view('/games', 'site.games');

/*
| Game list as JSON (from config/games.php) for the "More games" strip on the
| static game pages, so a new game appears there without editing each page.
*/
Route::get('/games.json', function () {
    $games = array_map(fn (array $game): array => [
        'slug' => $game['slug'],
        'url' => $game['url'],
        'title' => $game['title'],
        'channel' => $game['channel'],
        'tags' => $game['tags'] ?? [],
        'accent' => $game['accent'] ?? '#ffcc33',
        'thumb' => '/images/games/'.$game['slug'].'.webp',
    ], config('games', []));

    return response()->json($games, 200, ['Cache-Control' => 'public, max-age=600'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
});
