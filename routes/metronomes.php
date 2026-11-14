<?php

use App\Http\Controllers\Metronomes\AdminController;
use App\Http\Controllers\Metronomes\EventController;
use Illuminate\Support\Facades\Route;

/*
| Game stats for all web games. Loaded without the "web" middleware group, so the
| beacon sets no cookies and needs no CSRF token. The admin (/admin) uses its own
| signed cookie (see AdminController) and checks Origin on POSTs.
*/

Route::post('/metronomes-api/event', [EventController::class, 'store']);

Route::get('/admin', [AdminController::class, 'show']);
Route::post('/admin/login', [AdminController::class, 'login']);
Route::post('/admin/logout', [AdminController::class, 'logout']);
Route::post('/admin/delete-test', [AdminController::class, 'deleteTest']);
Route::permanentRedirect('/metronomes-admin', '/admin');
Route::permanentRedirect('/metronomes/admin', '/admin');

// "% of players picked this" for Quiet Worlds: public, cached, 60 requests a minute per IP (see the controller).
Route::get('/quiet-worlds-api/votes', [\App\Http\Controllers\QuietWorldsVotesController::class, 'show']);

// Suggestions box on the game pages (no web middleware: no cookies; see GameFeedbackController).
Route::post('/game-feedback', [\App\Http\Controllers\GameFeedbackController::class, 'store']);
