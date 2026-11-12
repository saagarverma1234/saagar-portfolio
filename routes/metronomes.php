<?php

use App\Http\Controllers\Metronomes\AdminController;
use App\Http\Controllers\Metronomes\EventController;
use Illuminate\Support\Facades\Route;

/*
| Metronome Sync Game stats. Loaded without the "web" middleware group, so the
| beacon sets no cookies and needs no CSRF token. The admin uses its own signed
| cookie (see AdminController) and checks Origin on POSTs. The admin lives at
| /metronomes-admin, outside the static public/metronomes folder.
*/

Route::post('/metronomes-api/event', [EventController::class, 'store']);

Route::get('/metronomes-admin', [AdminController::class, 'show']);
Route::permanentRedirect('/metronomes/admin', '/metronomes-admin');
Route::post('/metronomes-admin/login', [AdminController::class, 'login']);
Route::post('/metronomes-admin/logout', [AdminController::class, 'logout']);
Route::post('/metronomes-admin/delete-test', [AdminController::class, 'deleteTest']);
