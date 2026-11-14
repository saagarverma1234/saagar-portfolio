<?php

namespace App\Http\Controllers;

use App\Services\QuietWorldsVotes;
use Illuminate\Cache\RateLimiter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * Public "% of players picked this" shares for Quiet Worlds.
 *
 * GET /quiet-worlds-api/votes?w=<world>&day=<drop number>[&beta=1]
 * Loaded without the "web" middleware group (no cookies), limited to 60 requests
 * a minute per IP (counted on a hash, never stored raw) and cached for two minutes
 * per world and day, both in their own cache store (config metronomes.votes_cache_store). beta=1 also counts test
 * events, so a test build (stats flagged test) can see its own votes; the live game never sends it.
 */
class QuietWorldsVotesController extends Controller
{
    public const CACHE_SECONDS = 120;

    public const MAX_PER_MINUTE = 60;

    public function show(Request $request, QuietWorldsVotes $votes): JsonResponse
    {
        $cache = Cache::store(config('metronomes.votes_cache_store', 'file'));
        $limiter = new RateLimiter($cache);
        $limitKey = 'qw-votes-ip:'.hash('sha256', (string) ($request->header('CF-Connecting-IP') ?: $request->ip()));
        if ($limiter->tooManyAttempts($limitKey, self::MAX_PER_MINUTE)) {
            return $this->reply(['ok' => false, 'error' => 'Too many requests.'], 429, false)
                ->header('Retry-After', (string) $limiter->availableIn($limitKey));
        }
        $limiter->hit($limitKey, 60);

        $world = $request->query('w');
        $day = filter_var($request->query('day'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => QuietWorldsVotes::MAX_DAY]]);
        if (! QuietWorldsVotes::isWorld($world) || $day === false) {
            return $this->reply(['ok' => false, 'error' => 'Unknown world or day.'], 422, false);
        }
        $includeTest = $request->query('beta') === '1';

        try {
            $body = $cache->remember(
                'qw-votes:'.($includeTest ? 'beta' : 'live').':'.$day.':'.$world,
                self::CACHE_SECONDS,
                fn (): array => $votes->forWorld($world, $day, $includeTest),
            );
        } catch (Throwable $e) {
            report($e);

            return $this->reply(['ok' => false, 'error' => 'Not available right now.'], 503, false);
        }

        return $this->reply(['ok' => true] + $body, 200, true);
    }

    /**
     * @param  array<string, mixed>  $body
     */
    private function reply(array $body, int $status, bool $cacheable): JsonResponse
    {
        return response()->json($body, $status, [
            'Cache-Control' => $cacheable ? 'public, max-age='.self::CACHE_SECONDS : 'no-store',
            'X-Robots-Tag' => 'noindex',
        ]);
    }
}
