<?php

namespace App\Http\Controllers;

use App\Services\MetronomeStats;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

/**
 * "Suggestions" box on the game pages (public/metronomes, public/bump-theory).
 *
 * Loaded without the "web" middleware group (no cookies, no sessions), so instead
 * of a CSRF token it requires a same-site Origin/Referer, a honeypot field and a
 * per-IP limit (5 an hour, counted on a keyed hash of the IP, never the raw IP).
 * Rows go to the "suggestions" table in the metronome stats SQLite file and are
 * listed on /metronomes-admin.
 */
class GameFeedbackController extends Controller
{
    public function store(Request $request, MetronomeStats $stats): JsonResponse
    {
        if (! $this->sameSite($request)) {
            return $this->reply(['ok' => false, 'error' => 'Please send this from the game page.'], 403);
        }

        // Bots fill every field; people never see this one. Pretend it worked.
        if (trim((string) $request->input('website', '')) !== '') {
            return $this->reply(['ok' => true]);
        }

        $game = (string) $request->input('game', '');
        $message = trim(preg_replace('/\r\n?/', "\n", (string) $request->input('message', '')));
        $contact = trim((string) $request->input('contact', ''));

        if (! array_key_exists($game, MetronomeStats::SUGGESTION_GAMES)) {
            return $this->reply(['ok' => false, 'error' => 'Unknown game.'], 422);
        }
        if (mb_strlen($message) < 3) {
            return $this->reply(['ok' => false, 'error' => 'Please write a few words.'], 422);
        }
        if (mb_strlen($message) > 500) {
            return $this->reply(['ok' => false, 'error' => 'Please keep it under 500 characters.'], 422);
        }
        if (mb_strlen($contact) > 120) {
            return $this->reply(['ok' => false, 'error' => 'Name or email is too long.'], 422);
        }

        try {
            $result = $stats->addSuggestion($game, $message, $contact, $stats->suggestionIpHash($request), (bool) $request->input('test', false));
        } catch (Throwable $e) {
            report($e);

            return $this->reply(['ok' => false, 'error' => 'Something went wrong. Please try again later.'], 500);
        }

        if ($result === 'limited') {
            return $this->reply(['ok' => false, 'error' => 'Thanks! You have sent a lot already. Please try again in an hour.'], 429);
        }

        return $this->reply(['ok' => true]);
    }

    private function sameSite(Request $request): bool
    {
        $source = (string) ($request->header('Origin') ?: $request->header('Referer'));
        if ($source === '' || $source === 'null') {
            return false;
        }

        return strtolower((string) parse_url($source, PHP_URL_HOST)) === strtolower($request->getHost());
    }

    /**
     * @param  array<string, mixed>  $body
     */
    private function reply(array $body, int $status = 200): JsonResponse
    {
        return response()->json($body, $status, [
            'Cache-Control' => 'no-store',
            'X-Robots-Tag' => 'noindex',
        ]);
    }
}
