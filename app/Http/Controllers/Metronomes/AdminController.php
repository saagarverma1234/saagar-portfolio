<?php

namespace App\Http\Controllers\Metronomes;

use App\Http\Controllers\Controller;
use App\Services\MetronomeStats;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Private stats page for the Metronome Sync Game.
 *
 * Auth is a single password (bcrypt hash in config/metronomes.php) and a signed,
 * HttpOnly cookie, so it works without sessions, cache or database tables.
 * POSTs must come from this site (Origin check) on top of SameSite=Lax.
 */
class AdminController extends Controller
{
    private const COOKIE = 'metronome_admin';

    private const COOKIE_DAYS = 30;

    private const PRESETS = ['today' => 'Today', 'yesterday' => 'Yesterday', '7d' => '7 days', '30d' => '30 days', 'all' => 'All time'];

    public function __construct(private MetronomeStats $stats) {}

    public function show(Request $request): Response
    {
        if (! $this->isAuthenticated($request)) {
            return $this->private(response()->view('metronomes.admin-login', [
                'error' => $request->query('e') === 'bad' ? 'Wrong password.' : ($request->query('e') === 'wait' ? 'Too many tries. Wait 15 minutes.' : ($request->query('e') === 'origin' ? 'Please log in from this page.' : null)),
            ]));
        }

        $includeTest = $request->boolean('test');
        if (! $this->stats->sqliteAvailable()) {
            return $this->private(response()->view('metronomes.admin', ['unavailable' => true, 'fallback' => $this->stats->fallbackPath()]));
        }

        try {
            return $this->private(response()->view('metronomes.admin', $this->dashboard($request, $includeTest)));
        } catch (Throwable $e) {
            report($e);

            return $this->private(response()->view('metronomes.admin', ['unavailable' => true, 'error' => $e->getMessage(), 'fallback' => $this->stats->fallbackPath()]));
        }
    }

    public function login(Request $request): Response
    {
        if (! $this->sameOrigin($request)) {
            return $this->go('/metronomes-admin?e=origin');
        }
        $who = substr(hash('sha256', (string) ($request->header('CF-Connecting-IP') ?: $request->ip())), 0, 16);
        if ($this->stats->loginBlocked($who)) {
            return $this->go('/metronomes-admin?e=wait');
        }

        $password = (string) $request->input('password', '');
        if ($password === '' || strlen($password) > 200 || ! password_verify($password, $this->hash())) {
            $this->stats->recordLoginFailure($who);

            return $this->go('/metronomes-admin?e=bad');
        }

        $this->stats->clearLoginFailures($who);
        $expires = time() + self::COOKIE_DAYS * 86400;

        return $this->go('/metronomes-admin', $this->cookie($request, $expires.'.'.$this->signature($expires), $expires));
    }

    public function logout(Request $request): Response
    {
        return $this->go('/metronomes-admin', $this->cookie($request, '', 1));
    }

    public function deleteTest(Request $request): Response
    {
        if ($this->isAuthenticated($request) && $this->sameOrigin($request)) {
            $this->stats->deleteTestEvents();
        }

        return $this->go('/metronomes-admin');
    }

    /**
     * @return array<string, mixed>
     */
    private function dashboard(Request $request, bool $includeTest): array
    {
        $now = time();
        $offset = MetronomeStats::IST_OFFSET;
        $todayStart = intdiv($now + $offset, 86400) * 86400 - $offset;
        $end = $now + 1;

        [$from, $to, $preset, $label] = $this->range($request, $todayStart, $end);

        $cards = [];
        foreach (['today' => [$todayStart, $end], '7d' => [$todayStart - 6 * 86400, $end], '30d' => [$todayStart - 29 * 86400, $end], 'all' => [0, $end]] as $key => [$a, $b]) {
            $cards[$key] = $this->stats->summary($a, $b, $includeTest);
        }

        $hourStart = intdiv($now + $offset, 3600) * 3600 - $offset - 47 * 3600;

        return [
            'unavailable' => false,
            'includeTest' => $includeTest,
            'testCount' => $this->stats->testEventCount(),
            'presets' => self::PRESETS,
            'preset' => $preset,
            'rangeLabel' => $label,
            'fromDate' => gmdate('Y-m-d', $from + $offset),
            'toDate' => gmdate('Y-m-d', max($from, $to - 1) + $offset),
            'live' => $this->stats->liveNow($includeTest),
            'cards' => $cards,
            'range' => $this->stats->summary($from, $to, $includeTest),
            'daily' => $this->stats->series($todayStart - 29 * 86400, $todayStart + 86400, 'day', $includeTest),
            'hourly' => $this->stats->series($hourStart, $hourStart + 48 * 3600, 'hour', $includeTest),
            'countries' => $this->stats->top('country', $from, $to, $includeTest),
            'referrers' => $this->stats->top('ref', $from, $to, $includeTest),
            'devices' => $this->stats->top('device', $from, $to, $includeTest, 5),
            'systems' => $this->stats->top('os', $from, $to, $includeTest, 6),
            'browsers' => $this->stats->top('browser', $from, $to, $includeTest, 8),
            'campaigns' => array_values(array_filter($this->stats->top('utm', $from, $to, $includeTest, 8), fn (array $row): bool => $row['label'] !== '')),
            'challenges' => $this->stats->challenges($from, $to, $includeTest),
            'controls' => $this->stats->controls($from, $to, $includeTest),
            'medianSync' => $this->stats->median('synced', $from, $to, $includeTest),
            'recent' => $this->stats->recent($includeTest),
            'suggestions' => $this->stats->suggestions($includeTest),
            'suggestionCount' => $this->stats->suggestionCount($includeTest),
            'suggestionGames' => MetronomeStats::SUGGESTION_GAMES,
            'generatedAt' => gmdate('j M, g:i A', $now + $offset),
        ];
    }

    /**
     * @return array{0: int, 1: int, 2: string, 3: string}
     */
    private function range(Request $request, int $todayStart, int $end): array
    {
        $offset = MetronomeStats::IST_OFFSET;
        $preset = (string) $request->query('range', '7d');
        $from = $request->query('from');
        $to = $request->query('to');

        if ($preset === 'custom' && is_string($from) && is_string($to)
            && preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
            $a = strtotime($from.' 00:00:00 UTC') - $offset;
            $b = strtotime($to.' 00:00:00 UTC') - $offset + 86400;
            if ($a !== false && $b > $a) {
                return [$a, min($b, $end), 'custom', gmdate('j M Y', $a + $offset).' to '.gmdate('j M Y', $b - 1 + $offset)];
            }
        }

        return match ($preset) {
            'today' => [$todayStart, $end, 'today', 'Today'],
            'yesterday' => [$todayStart - 86400, $todayStart, 'yesterday', 'Yesterday'],
            '30d' => [$todayStart - 29 * 86400, $end, '30d', 'Last 30 days'],
            'all' => [0, $end, 'all', 'All time'],
            default => [$todayStart - 6 * 86400, $end, '7d', 'Last 7 days'],
        };
    }

    private function hash(): string
    {
        return (string) config('metronomes.admin_hash');
    }

    private function signature(int $expires): string
    {
        return hash_hmac('sha256', 'metronome-admin|'.$expires.'|'.substr($this->hash(), -22), (string) config('app.key'));
    }

    private function isAuthenticated(Request $request): bool
    {
        $value = (string) $request->cookies->get(self::COOKIE, '');
        if (! preg_match('/^(\d{10})\.([0-9a-f]{64})$/', $value, $match)) {
            return false;
        }

        return (int) $match[1] > time() && $this->hash() !== '' && hash_equals($this->signature((int) $match[1]), $match[2]);
    }

    private function sameOrigin(Request $request): bool
    {
        $source = (string) ($request->header('Origin') ?: $request->header('Referer'));
        if ($source === '' || $source === 'null') {
            return false;
        }

        return strtolower((string) parse_url($source, PHP_URL_HOST)) === strtolower($request->getHost());
    }

    private function cookie(Request $request, string $value, int $expires): Cookie
    {
        $secure = $request->isSecure()
            || $request->header('X-Forwarded-Proto') === 'https'
            || str_contains((string) $request->header('CF-Visitor'), 'https');

        return Cookie::create(self::COOKIE, $value, $expires, '/metronomes-admin', null, $secure, true, false, Cookie::SAMESITE_LAX);
    }

    private function go(string $path, ?Cookie $cookie = null): Response
    {
        $response = new RedirectResponse($path, 303);
        if ($cookie) {
            $response->headers->setCookie($cookie);
        }

        return $this->private($response);
    }

    private function private(Response $response): Response
    {
        $response->headers->set('Cache-Control', 'private, no-store, no-cache, max-age=0, must-revalidate');
        $response->headers->set('Cloudflare-CDN-Cache-Control', 'no-store');
        $response->headers->set('CDN-Cache-Control', 'no-store');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('X-Robots-Tag', 'noindex, nofollow, noarchive');
        $response->headers->set('Referrer-Policy', 'same-origin');
        $response->headers->set('X-Frame-Options', 'DENY');

        return $response;
    }
}
