<?php

namespace App\Http\Controllers\Metronomes;

use App\Http\Controllers\Controller;
use App\Services\MetronomeStats;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Throwable;

class EventController extends Controller
{
    /**
     * Beacon endpoint for the game. Always answers 204, whatever happens.
     */
    public function store(Request $request, MetronomeStats $stats): Response
    {
        try {
            $stats->record($request, (string) $request->getContent());
        } catch (Throwable $e) {
            report($e);
        }

        return response()->noContent()->withHeaders([
            'Cache-Control' => 'no-store',
            'X-Robots-Tag' => 'noindex',
        ]);
    }
}
