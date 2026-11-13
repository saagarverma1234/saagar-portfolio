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
