<?php

namespace App\Services;

use Illuminate\Database\Connection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Anonymous play stats for the web games (public/metronomes, bump-theory,
 * swipe-theory, quiet-worlds). Every event carries a whitelisted `game`.
 *
 * Events live in their own SQLite file under storage/app, created on first use,
 * so the feature needs no migrations and no server config. When pdo_sqlite is
 * missing, events are appended to an NDJSON file instead and imported into
 * SQLite automatically once it becomes available.
 */
class MetronomeStats
{
    public const CONNECTION = 'metronome_stats';

    public const IST_OFFSET = 19800;

    public const EVENTS = [
        'pageview', 'play', 'control', 'synced', 'challenge_start', 'challenge_complete', 'share', 'mute', 'heartbeat',
        'level', 'result',
        'level_created', 'level_played', 'daily_played', 'daily_completed', 'share_card',
        'qw_pick', 'qw_choice', 'qw_end',
    ];

    /** Events that only Quiet Worlds may send (see QuietWorldsVotes). */
    public const QUIET_WORLDS_EVENTS = ['qw_pick', 'qw_choice', 'qw_end'];

    /**
     * Games that may send events, keyed by the value the tracker sends (`g`). Beacons without `g` are metronomes.
     */
    public const GAMES = ['metronomes' => 'Metronomes', 'bump-theory' => 'Bump Theory', 'swipe-theory' => 'Swipe Theory', 'quiet-worlds' => 'Quiet Worlds'];

    /**
     * Games made for a family audience: no persistent browser ID is stored for them, even if one is sent.
     */
    public const KIDS_GAMES = ['swipe-theory'];

    /** Game modes for level/result events. */
    public const MODES = ['level', 'sandbox', 'endless', 'classic', 'daily'];

    /** How a share happened. */
    public const SHARE_WAYS = ['top', 'banner', 'button', 'share', 'copy', 'save'];

    public const CONTROLS = [
        'nudge', 'shake', 'flip', 'big', 'weights', 'lift', 'teams', 'count', 'speed', 'reset', 'randomise', 'again', 'tap',
        'menu', 'create', 'skip',
    ];

    /** Start layouts a player level can use. */
    public const LEVEL_STARTS = ['random', 'tie2', 'tie3'];

    /** What a player did with the result card. */
    public const CARD_ACTIONS = ['open', 'share', 'save', 'copy'];

    /** Game modes of the metronome game, sent with share_card. */
    public const PLAY_MODES = ['free', 'challenge', 'daily', 'level'];

    public const CHALLENGES = ['c100', '5050', 'tie3', 'shake', 'weights', 'lift', 'big'];

    public const MAX_EVENTS_PER_MINUTE = 90;

    private ?Connection $connection = null;

    /** Restricts the dashboard queries to one game; null = all games. */
    private ?string $game = null;

    public function forGame(?string $game): static
    {
        $this->game = $game !== null && isset(self::GAMES[$game]) ? $game : null;

        return $this;
    }

    public function game(): ?string
    {
        return $this->game;
    }

    /**
     * SQL filter for the dashboard queries. The game value is whitelisted above, so inlining it is safe.
     */
    private function scope(bool $includeTest): string
    {
        return ($includeTest ? '' : ' AND test = 0').($this->game ? " AND game = '".$this->game."'" : '');
    }

    public function sqliteAvailable(): bool
    {
        return extension_loaded('pdo_sqlite');
    }

    public function path(): string
    {
        return (string) config('metronomes.stats_path', storage_path('app/metronome-stats.sqlite'));
    }

    public function fallbackPath(): string
    {
        return preg_replace('/\.sqlite$/', '', $this->path()).'.ndjson';
    }

    public function db(): Connection
    {
        if ($this->connection) {
            return $this->connection;
        }

        $path = $this->path();
        if (! is_file($path)) {
            @mkdir(dirname($path), 0775, true);
            touch($path);
        }

        config(['database.connections.'.self::CONNECTION => [
            'driver' => 'sqlite',
            'database' => $path,
            'prefix' => '',
            'foreign_key_constraints' => false,
            'busy_timeout' => 3000,
            'journal_mode' => 'wal',
            'synchronous' => 'normal',
        ]]);

        $connection = DB::connection(self::CONNECTION);
        $this->migrate($connection);
        $this->connection = $connection;
        $this->importFallback();

        return $connection;
    }

    private function migrate(Connection $connection): void
    {
        $version = (int) ($connection->selectOne('PRAGMA user_version')->user_version ?? 0);
        if ($version >= 3) {
            return;
        }
        if ($version === 2) {
            $this->migrateGames($connection);

            return;
        }
        if ($version === 1) {
            $this->migrateSuggestions($connection);
            $this->migrateGames($connection);

            return;
        }

        $connection->statement('CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts INTEGER NOT NULL,
            name TEXT NOT NULL,
            vid TEXT NOT NULL,
            cid TEXT NOT NULL DEFAULT \'\',
            sid TEXT NOT NULL DEFAULT \'\',
            country TEXT NOT NULL DEFAULT \'\',
            ref TEXT NOT NULL DEFAULT \'\',
            utm TEXT NOT NULL DEFAULT \'\',
            chal TEXT NOT NULL DEFAULT \'\',
            ctrl TEXT NOT NULL DEFAULT \'\',
            device TEXT NOT NULL DEFAULT \'\',
            os TEXT NOT NULL DEFAULT \'\',
            browser TEXT NOT NULL DEFAULT \'\',
            ret INTEGER NOT NULL DEFAULT 0,
            num REAL,
            data TEXT NOT NULL DEFAULT \'\',
            test INTEGER NOT NULL DEFAULT 0
        )');
        $connection->statement('CREATE INDEX IF NOT EXISTS events_ts ON events (ts)');
        $connection->statement('CREATE INDEX IF NOT EXISTS events_name_ts ON events (name, ts)');
        $connection->statement('CREATE INDEX IF NOT EXISTS events_vid_ts ON events (vid, ts)');
        $connection->statement('CREATE TABLE IF NOT EXISTS login_failures (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, who TEXT NOT NULL)');
        $connection->statement('CREATE INDEX IF NOT EXISTS login_failures_who_ts ON login_failures (who, ts)');
        $connection->statement('PRAGMA user_version = 1');
        $this->migrateSuggestions($connection);
        $this->migrateGames($connection);
    }

    /**
     * Version 2: player suggestions from the game pages (see GameFeedbackController).
     */
    private function migrateSuggestions(Connection $connection): void
    {
        $connection->statement('CREATE TABLE IF NOT EXISTS suggestions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at INTEGER NOT NULL,
            game TEXT NOT NULL,
            message TEXT NOT NULL,
            contact TEXT NOT NULL DEFAULT \'\',
            ip_hash TEXT NOT NULL,
            test INTEGER NOT NULL DEFAULT 0
        )');
        $connection->statement('CREATE INDEX IF NOT EXISTS suggestions_created ON suggestions (created_at)');
        $connection->statement('CREATE INDEX IF NOT EXISTS suggestions_ip_created ON suggestions (ip_hash, created_at)');
        $connection->statement('PRAGMA user_version = 2');
    }

    /**
     * Version 3: a `game` column on events. Existing rows all came from the metronome game,
     * so the column default labels them; nothing is rewritten or dropped.
     */
    private function migrateGames(Connection $connection): void
    {
        $hasColumn = collect($connection->select('PRAGMA table_info(events)'))->contains(fn ($column) => $column->name === 'game');
        if (! $hasColumn) {
            try {
                $connection->statement("ALTER TABLE events ADD COLUMN game TEXT NOT NULL DEFAULT 'metronomes'");
            } catch (Throwable $e) {
                // Another request added it at the same moment.
                if (! str_contains(strtolower($e->getMessage()), 'duplicate column')) {
                    throw $e;
                }
            }
        }
        $connection->statement('CREATE INDEX IF NOT EXISTS events_game_name_ts ON events (game, name, ts)');
        $connection->statement('PRAGMA user_version = 3');
    }

    /**
     * Validate a raw beacon body and store it. Silently drops anything invalid.
     */
    public function record(Request $request, string $body): void
    {
        if ($body === '' || strlen($body) > 2048) {
            return;
        }
        $payload = json_decode($body, true);
        if (! is_array($payload) || ! in_array($payload['e'] ?? null, self::EVENTS, true)) {
            return;
        }
        $game = $payload['g'] ?? 'metronomes';
        if (! is_string($game) || ! isset(self::GAMES[$game])) {
            return;
        }

        if (in_array($payload['e'], self::QUIET_WORLDS_EVENTS, true) && ! $this->validQuietWorldsVote($game, $payload['e'], $payload['d'] ?? null)) {
            return;
        }

        $userAgent = substr((string) $request->userAgent(), 0, 400);
        $isTest = ! empty($payload['test']);
        if (! $isTest && $this->isBot($userAgent)) {
            return;
        }

        $row = $this->buildRow($request, $payload, $userAgent, $isTest);
        $row['game'] = $game;
        if (in_array($game, self::KIDS_GAMES, true)) {
            $row['cid'] = '';
        }

        if (! $this->sqliteAvailable()) {
            @file_put_contents($this->fallbackPath(), json_encode($row)."\n", FILE_APPEND | LOCK_EX);

            return;
        }

        $db = $this->db();
        $recent = $db->table('events')->where('vid', $row['vid'])->where('ts', '>=', $row['ts'] - 60)->count();
        if ($recent >= self::MAX_EVENTS_PER_MINUTE) {
            return;
        }
        if (in_array($row['name'], self::QUIET_WORLDS_EVENTS, true) && $this->isRepeatVote($db, $row)) {
            return;
        }
        $db->table('events')->insert($row);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function buildRow(Request $request, array $payload, string $userAgent, bool $isTest): array
    {
        $name = $payload['e'];
        $data = is_array($payload['d'] ?? null) ? $payload['d'] : [];
        $ip = (string) ($request->header('CF-Connecting-IP') ?: $request->ip());
        $country = strtoupper((string) $request->header('CF-IPCountry', ''));
        [$device, $os, $browser] = $this->parseUserAgent($userAgent, (int) ($data['tp'] ?? 0));

        $row = [
            'ts' => time(),
            'name' => $name,
            'vid' => $this->visitorHash($ip, $userAgent),
            'cid' => $this->hexId($payload['cid'] ?? ''),
            'sid' => $this->hexId($payload['sid'] ?? ''),
            'country' => preg_match('/^[A-Z][A-Z0-9]$/', $country) ? $country : '',
            'ref' => '',
            'utm' => '',
            'chal' => $this->challenge($data['ch'] ?? ''),
            'ctrl' => '',
            'device' => $device,
            'os' => $os,
            'browser' => $browser,
            'ret' => 0,
            'num' => null,
            'data' => '',
            'test' => $isTest ? 1 : 0,
        ];

        $extra = [];
        switch ($name) {
            case 'pageview':
                $row['ref'] = $this->classifyReferrer((string) ($data['ref'] ?? ''), $browser, (string) ($data['us'] ?? ''));
                $row['utm'] = implode('/', array_filter([
                    $this->slug($data['us'] ?? ''), $this->slug($data['um'] ?? ''), $this->slug($data['uc'] ?? ''),
                ]));
                $row['chal'] = $this->challenge($data['c'] ?? '');
                $row['ret'] = empty($data['ret']) ? 0 : 1;
                $extra['sw'] = min(10000, max(0, (int) ($data['sw'] ?? 0)));
                break;
            case 'control':
                $control = (string) ($data['c'] ?? '');
                $row['ctrl'] = in_array($control, self::CONTROLS, true) ? $control : 'other';
                if (isset($data['v'])) {
                    $extra['v'] = $this->slug($data['v']);
                }
                if (isset($data['n'])) {
                    $row['num'] = $this->number($data['n'], 0, 100);
                }
                break;
            case 'synced':
            case 'challenge_complete':
                $row['num'] = $this->number($data['t'] ?? null, 0, 36000);
                $extra['n'] = (int) $this->number($data['n'] ?? 0, 0, 101);
                $extra['flips'] = (int) $this->number($data['flips'] ?? 0, 0, 100000);
                break;
            case 'challenge_start':
                $row['ctrl'] = ($data['src'] ?? '') === 'link' ? 'link' : 'chip';
                break;
            case 'share':
                $row['ctrl'] = in_array($data['w'] ?? '', self::SHARE_WAYS, true) ? $data['w'] : 'top';
                $extra['synced'] = empty($data['synced']) ? 0 : 1;
                break;
            case 'level':
            case 'result':
                $row['ctrl'] = in_array($data['m'] ?? '', self::MODES, true) ? $data['m'] : '';
                $row['num'] = $this->number($data['n'] ?? null, 0, 1000);
                if ($name === 'result') {
                    $extra['won'] = empty($data['won']) ? 0 : 1;
                    if (isset($data['st'])) {
                        $extra['st'] = (int) $this->number($data['st'], 0, 3);
                    }
                    if (isset($data['sc'])) {
                        $extra['sc'] = (int) $this->number($data['sc'], 0, 100000000);
                    }
                }
                break;
            case 'level_created':
                $row['ctrl'] = in_array($data['s'] ?? '', self::LEVEL_STARTS, true) ? $data['s'] : '';
                $row['num'] = $this->number($data['tg'] ?? null, 0, 600);
                $extra['n'] = (int) $this->number($data['n'] ?? 0, 0, 100);
                $extra['b'] = (int) $this->number($data['b'] ?? 0, 0, 300);
                $extra['tl'] = (int) $this->number($data['tl'] ?? 0, 0, 63);
                $extra['mf'] = (int) $this->number($data['mf'] ?? 0, 0, 99);
                $extra['w'] = empty($data['w']) ? 0 : 1;
                $extra['how'] = in_array($data['how'] ?? '', ['play', 'share', 'copy'], true) ? $data['how'] : '';
                break;
            case 'level_played':
                $row['ctrl'] = ($data['src'] ?? '') === 'builder' ? 'builder' : 'link';
                $row['num'] = $this->number($data['tg'] ?? null, 0, 600);
                $extra['n'] = (int) $this->number($data['n'] ?? 0, 0, 100);
                break;
            case 'daily_played':
                $row['num'] = $this->number($data['day'] ?? null, 0, 100000);
                break;
            case 'daily_completed':
                $row['num'] = $this->number($data['t'] ?? null, 0, 36000);
                $extra['day'] = (int) $this->number($data['day'] ?? 0, 0, 100000);
                $extra['flips'] = (int) $this->number($data['flips'] ?? 0, 0, 100000);
                $extra['par'] = empty($data['par']) ? 0 : 1;
                break;
            case 'share_card':
                $row['ctrl'] = in_array($data['w'] ?? '', self::CARD_ACTIONS, true) ? $data['w'] : 'open';
                $extra['m'] = in_array($data['m'] ?? '', self::PLAY_MODES, true) ? $data['m'] : 'free';
                break;
            case 'mute':
                $row['num'] = empty($data['on']) ? 0 : 1;
                break;
            case 'qw_pick':
                $row['ctrl'] = $data['w'];
                $row['num'] = (int) $data['day'];
                break;
            case 'qw_choice':
                $row['ctrl'] = $data['w'];
                $row['num'] = (int) $data['b'] * 10 + (int) $data['o'];
                $extra['b'] = (int) $data['b'];
                $extra['o'] = (int) $data['o'];
                break;
            case 'qw_end':
                $row['ctrl'] = $data['w'];
                $row['num'] = (int) $data['r'];
                $extra['day'] = (int) $data['day'];
                break;
            case 'heartbeat':
                $row['num'] = $this->number($data['s'] ?? 15, 0, 60);
                break;
        }
        $row['data'] = $extra ? json_encode($extra) : '';

        return $row;
    }

    /**
     * One vote per browser (or per hashed visitor when no browser ID is sent) for the same world, beat and option in a day.
     *
     * @param  array<string, mixed>  $row
     */
    private function isRepeatVote(Connection $db, array $row): bool
    {
        return $db->table('events')
            ->where($row['cid'] !== '' ? 'cid' : 'vid', $row['cid'] !== '' ? $row['cid'] : $row['vid'])
            ->where('game', 'quiet-worlds')->where('name', $row['name'])->where('ctrl', $row['ctrl'])->where('num', $row['num'])
            ->where('ts', '>=', $row['ts'] - 86400)
            ->exists();
    }

    /**
     * A Quiet Worlds vote must come from that game and name a known world, a real beat and option,
     * ending or drop day. Anything else is dropped, so the shares cannot be filled with junk.
     */
    private function validQuietWorldsVote(string $game, string $event, mixed $data): bool
    {
        if ($game !== 'quiet-worlds' || ! is_array($data) || ! QuietWorldsVotes::isWorld($data['w'] ?? null)) {
            return false;
        }
        $isInt = fn (mixed $value, int $min, int $max): bool => is_int($value) && $value >= $min && $value <= $max;

        return match ($event) {
            'qw_pick' => $isInt($data['day'] ?? null, 1, QuietWorldsVotes::MAX_DAY),
            'qw_choice' => $isInt($data['b'] ?? null, 1, QuietWorldsVotes::BEATS) && $isInt($data['o'] ?? null, 0, QuietWorldsVotes::OPTIONS - 1),
            'qw_end' => $isInt($data['r'] ?? null, 0, count(QuietWorldsVotes::ENDINGS) - 1) && $isInt($data['day'] ?? null, 0, QuietWorldsVotes::MAX_DAY),
            default => false,
        };
    }

    public function visitorHash(string $ip, string $userAgent): string
    {
        $salt = hash_hmac('sha256', 'metronome-stats|'.gmdate('Y-m-d', time() + self::IST_OFFSET), (string) config('app.key'));

        return substr(hash('sha256', $salt.'|'.$ip.'|'.$userAgent), 0, 16);
    }

    private function hexId(mixed $value): string
    {
        return is_string($value) && preg_match('/^[0-9a-f]{16}$/', $value) ? $value : '';
    }

    private function challenge(mixed $value): string
    {
        return in_array($value, self::CHALLENGES, true) ? $value : '';
    }

    private function slug(mixed $value): string
    {
        return substr(preg_replace('/[^a-z0-9_.\-]/', '', strtolower((string) $value)), 0, 40);
    }

    private function number(mixed $value, float $min, float $max): ?float
    {
        if (! is_numeric($value)) {
            return null;
        }

        return max($min, min($max, round((float) $value, 2)));
    }

    public function isBot(string $userAgent): bool
    {
        return $userAgent === '' || (bool) preg_match('/bot|crawl|spider|slurp|preview|headless|lighthouse|python|curl|wget|go-http|java\/|httpclient|facebookexternalhit|whatsapp\/|scrapy|monitor/i', $userAgent);
    }

    /**
     * @return array{0: string, 1: string, 2: string}
     */
    public function parseUserAgent(string $ua, int $touchPoints = 0): array
    {
        $os = match (true) {
            (bool) preg_match('/iPhone|iPad|iPod/i', $ua) => 'iOS',
            (bool) preg_match('/Android/i', $ua) => 'Android',
            (bool) preg_match('/CrOS/i', $ua) => 'ChromeOS',
            (bool) preg_match('/Windows/i', $ua) => 'Windows',
            (bool) preg_match('/Macintosh|Mac OS X/i', $ua) => $touchPoints > 1 ? 'iOS' : 'macOS',
            (bool) preg_match('/Linux/i', $ua) => 'Linux',
            default => 'Other',
        };

        $device = match (true) {
            (bool) preg_match('/iPad|Tablet|PlayBook|Silk/i', $ua) => 'tablet',
            str_contains($ua, 'Macintosh') && $touchPoints > 1 => 'tablet',
            (bool) preg_match('/Android/i', $ua) && ! preg_match('/Mobile/i', $ua) => 'tablet',
            (bool) preg_match('/Mobi|iPhone|iPod|Android|Windows Phone/i', $ua) => 'phone',
            default => 'desktop',
        };

        $browser = match (true) {
            (bool) preg_match('/FBAN|FBAV|FB_IAB|FBIOS/i', $ua) => 'Facebook app',
            (bool) preg_match('/Instagram/i', $ua) => 'Instagram app',
            (bool) preg_match('/com\.google\.ios\.youtube|YouTube/i', $ua) => 'YouTube app',
            (bool) preg_match('/Edg(e|A|iOS)?\//', $ua) => 'Edge',
            (bool) preg_match('/SamsungBrowser/', $ua) => 'Samsung',
            (bool) preg_match('/OPR\/|Opera/', $ua) => 'Opera',
            (bool) preg_match('/Firefox|FxiOS/', $ua) => 'Firefox',
            (bool) preg_match('/Chrome|CriOS/', $ua) => 'Chrome',
            (bool) preg_match('/Safari/', $ua) => 'Safari',
            default => 'Other',
        };

        return [$device, $os, $browser];
    }

    public function classifyReferrer(string $host, string $browser = '', string $utmSource = ''): string
    {
        $host = strtolower(preg_replace('/^www\./i', '', trim($host)));
        $utmSource = strtolower($utmSource);

        $fromHost = match (true) {
            $host === '' => '',
            (bool) preg_match('/(^|\.)(youtube\.com|youtu\.be)$|^com\.google\.android\.youtube/', $host) => 'YouTube',   // 15 Nov: the Android YouTube app sends android-app://com.google.android.youtube (was counted as Google)
            (bool) preg_match('/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/', $host) => 'Facebook',
            (bool) preg_match('/(^|\.)instagram\.com$/', $host) => 'Instagram',
            (bool) preg_match('/(^|\.)google\.[a-z.]+$|^com\.google\./', $host) => 'Google',
            (bool) preg_match('/(^|\.)bing\.com$/', $host) => 'Bing',
            (bool) preg_match('/(^|\.)(duckduckgo\.com|yahoo\.com|yandex\.[a-z]+|ecosia\.org|baidu\.com)$/', $host) => 'Other search',
            (bool) preg_match('/(^|\.)(t\.co|x\.com|twitter\.com)$/', $host) => 'X',
            (bool) preg_match('/(^|\.)reddit\.com$/', $host) => 'Reddit',
            (bool) preg_match('/(^|\.)(whatsapp\.com|wa\.me)$/', $host) => 'WhatsApp',
            (bool) preg_match('/(^|\.)tiktok\.com$/', $host) => 'TikTok',
            (bool) preg_match('/(^|\.)saagarverma\.com$|^localhost$|^127\.0\.0\.1$/', $host) => 'Internal',
            default => substr(preg_replace('/[^a-z0-9.\-]/', '', $host), 0, 60),
        };
        if ($fromHost !== '') {
            return $fromHost;
        }

        return match (true) {
            $browser === 'Facebook app' || in_array($utmSource, ['facebook', 'fb'], true) => 'Facebook',
            $browser === 'Instagram app' || in_array($utmSource, ['instagram', 'ig'], true) => 'Instagram',
            $browser === 'YouTube app' || in_array($utmSource, ['youtube', 'yt'], true) => 'YouTube',
            default => 'Direct',
        };
    }

    private function importFallback(): void
    {
        $file = $this->fallbackPath();
        if (! is_file($file) || ! $this->connection) {
            return;
        }
        $claimed = $file.'.importing';
        if (! @rename($file, $claimed)) {
            return;
        }
        $handle = fopen($claimed, 'r');
        $columns = ['ts', 'name', 'vid', 'cid', 'sid', 'country', 'ref', 'utm', 'chal', 'ctrl', 'device', 'os', 'browser', 'ret', 'num', 'data', 'test', 'game'];
        $this->connection->transaction(function () use ($handle, $columns): void {
            while (($line = fgets($handle)) !== false) {
                $row = json_decode($line, true);
                if (is_array($row) && isset($row['ts'], $row['name'], $row['vid'])) {
                    $this->connection->table('events')->insert(array_intersect_key($row, array_flip($columns)));
                }
            }
        });
        fclose($handle);
        @rename($claimed, $file.'.imported-'.time());
    }

    /**
     * Login throttling, stored next to the events: 5 failures per 15 minutes per client.
     */
    public function loginBlocked(string $who): bool
    {
        try {
            return $this->db()->table('login_failures')->where('who', $who)->where('ts', '>=', time() - 900)->count() >= 5;
        } catch (Throwable) {
            return false;
        }
    }

    public function recordLoginFailure(string $who): void
    {
        try {
            $this->db()->table('login_failures')->insert(['ts' => time(), 'who' => $who]);
            $this->db()->table('login_failures')->where('ts', '<', time() - 86400)->delete();
        } catch (Throwable) {
        }
    }

    public function clearLoginFailures(string $who): void
    {
        try {
            $this->db()->table('login_failures')->where('who', $who)->delete();
        } catch (Throwable) {
        }
    }

    public function deleteTestEvents(): int
    {
        return $this->db()->table('events')->where('test', 1)->delete()
            + $this->db()->table('suggestions')->where('test', 1)->delete();
    }

    /**
     * Games that may receive suggestions, keyed by the value the page sends.
     */
    public const SUGGESTION_GAMES = ['metronomes' => 'Metronome Sync Game', 'bump-theory' => 'Bump Theory: 1 Ball → 10,000', 'swipe-theory' => 'Swipe Theory: Protect Pumpkin!', 'quiet-worlds' => 'Quiet Worlds: Choose Your Planet'];

    public const SUGGESTIONS_PER_HOUR = 5;

    public const SUGGESTIONS_PER_DAY_TOTAL = 300;

    /**
     * Keyed hash of the client IP for rate limiting suggestions. The raw IP is never stored.
     */
    public function suggestionIpHash(Request $request): string
    {
        $ip = (string) ($request->header('CF-Connecting-IP') ?: $request->ip());

        return substr(hash_hmac('sha256', 'game-feedback|'.$ip, (string) config('app.key')), 0, 16);
    }

    /**
     * Store one suggestion. Returns 'ok', or 'limited' when this IP (or the whole site) sent too many.
     */
    public function addSuggestion(string $game, string $message, string $contact, string $ipHash, bool $isTest): string
    {
        $now = time();
        $row = ['created_at' => $now, 'game' => $game, 'message' => $message, 'contact' => $contact, 'ip_hash' => $ipHash, 'test' => $isTest ? 1 : 0];

        if (! $this->sqliteAvailable()) {
            @file_put_contents(preg_replace('/\.sqlite$/', '', $this->path()).'-suggestions.ndjson', json_encode($row)."\n", FILE_APPEND | LOCK_EX);

            return 'ok';
        }

        $table = $this->db()->table('suggestions');
        if ((clone $table)->where('ip_hash', $ipHash)->where('created_at', '>=', $now - 3600)->count() >= self::SUGGESTIONS_PER_HOUR
            || (clone $table)->where('created_at', '>=', $now - 86400)->count() >= self::SUGGESTIONS_PER_DAY_TOTAL) {
            return 'limited';
        }
        $table->insert($row);

        return 'ok';
    }

    /**
     * Newest suggestions first.
     *
     * @return list<object>
     */
    public function suggestions(bool $includeTest, int $limit = 100): array
    {
        $query = $this->db()->table('suggestions')->orderByDesc('id')->limit($limit);
        if (! $includeTest) {
            $query->where('test', 0);
        }
        if ($this->game) {
            $query->where('game', $this->game);
        }

        return $query->get(['id', 'created_at', 'game', 'message', 'contact', 'test'])->all();
    }

    public function suggestionCount(bool $includeTest): int
    {
        $query = $this->db()->table('suggestions');
        if (! $includeTest) {
            $query->where('test', 0);
        }
        if ($this->game) {
            $query->where('game', $this->game);
        }

        return $query->count();
    }

    /**
     * Headline numbers for one time window.
     *
     * @return array<string, float|int|null>
     */
    public function summary(int $from, int $to, bool $includeTest): array
    {
        $test = $this->scope($includeTest);
        $row = $this->db()->selectOne("SELECT
                COUNT(DISTINCT CASE WHEN name = 'pageview' THEN (CASE WHEN cid <> '' THEN cid ELSE 'h' || vid END) END) AS visitors,
                COUNT(DISTINCT CASE WHEN name = 'pageview' AND ret = 1 THEN (CASE WHEN cid <> '' THEN cid ELSE 'h' || vid END) END) AS returners,
                SUM(name = 'pageview') AS pageviews,
                SUM(name = 'play') AS plays,
                SUM(name = 'synced') AS syncs,
                SUM(name = 'share') AS shares,
                SUM(name = 'result') AS results,
                SUM(CASE WHEN name = 'heartbeat' THEN num ELSE 0 END) AS seconds
            FROM events WHERE ts >= ? AND ts < ?{$test}", [$from, $to]);

        $pageviews = (int) $row->pageviews;
        $visitors = (int) $row->visitors;

        return [
            'visitors' => $visitors,
            'pageviews' => $pageviews,
            'plays' => (int) $row->plays,
            'play_rate' => $pageviews ? round(100 * $row->plays / $pageviews, 1) : null,
            'syncs' => (int) $row->syncs,
            'shares' => (int) $row->shares,
            'results' => (int) $row->results,
            'avg_time' => $pageviews ? (int) round($row->seconds / $pageviews) : null,
            'returning_rate' => $visitors ? round(100 * $row->returners / $visitors, 1) : null,
        ];
    }

    public function liveNow(bool $includeTest): int
    {
        $test = $this->scope($includeTest);

        return (int) $this->db()->selectOne("SELECT COUNT(DISTINCT CASE WHEN sid <> '' THEN sid ELSE vid END) AS n FROM events WHERE ts >= ?{$test}", [time() - 120])->n;
    }

    /**
     * Visitors and pageviews per IST day or hour.
     *
     * @return list<array{label: string, visitors: int, pageviews: int}>
     */
    public function series(int $from, int $to, string $unit, bool $includeTest): array
    {
        $test = $this->scope($includeTest);
        $format = $unit === 'hour' ? '%Y-%m-%d %H' : '%Y-%m-%d';
        $rows = $this->db()->select("SELECT strftime('{$format}', ts + ".self::IST_OFFSET.", 'unixepoch') AS bucket,
                COUNT(DISTINCT CASE WHEN cid <> '' THEN cid ELSE 'h' || vid END) AS visitors, COUNT(*) AS pageviews
            FROM events WHERE name = 'pageview' AND ts >= ? AND ts < ?{$test} GROUP BY bucket", [$from, $to]);
        $byBucket = [];
        foreach ($rows as $row) {
            $byBucket[$row->bucket] = $row;
        }

        $step = $unit === 'hour' ? 3600 : 86400;
        $series = [];
        for ($t = $from; $t < $to; $t += $step) {
            $key = gmdate($unit === 'hour' ? 'Y-m-d H' : 'Y-m-d', $t + self::IST_OFFSET);
            $series[] = [
                'label' => $key,
                'visitors' => (int) ($byBucket[$key]->visitors ?? 0),
                'pageviews' => (int) ($byBucket[$key]->pageviews ?? 0),
            ];
        }

        return $series;
    }

    /**
     * Top values of one pageview column, by distinct visitors.
     *
     * @return list<array{label: string, visitors: int, pageviews: int}>
     */
    public function top(string $column, int $from, int $to, bool $includeTest, int $limit = 10): array
    {
        abort_unless(in_array($column, ['country', 'ref', 'device', 'os', 'browser', 'utm', 'chal'], true), 500);
        $test = $this->scope($includeTest);
        $rows = $this->db()->select("SELECT {$column} AS label,
                COUNT(DISTINCT CASE WHEN cid <> '' THEN cid ELSE 'h' || vid END) AS visitors, COUNT(*) AS pageviews
            FROM events WHERE name = 'pageview' AND ts >= ? AND ts < ?{$test}
            GROUP BY {$column} ORDER BY visitors DESC, pageviews DESC LIMIT {$limit}", [$from, $to]);

        return array_map(fn ($row): array => ['label' => (string) $row->label, 'visitors' => (int) $row->visitors, 'pageviews' => (int) $row->pageviews], $rows);
    }

    /**
     * @return list<array{control: string, uses: int, visitors: int}>
     */
    public function controls(int $from, int $to, bool $includeTest): array
    {
        $test = $this->scope($includeTest);
        $rows = $this->db()->select("SELECT ctrl, COUNT(*) AS uses, COUNT(DISTINCT CASE WHEN cid <> '' THEN cid ELSE 'h' || vid END) AS visitors
            FROM events WHERE name = 'control' AND ts >= ? AND ts < ?{$test} GROUP BY ctrl ORDER BY uses DESC", [$from, $to]);

        return array_map(fn ($row): array => ['control' => (string) $row->ctrl, 'uses' => (int) $row->uses, 'visitors' => (int) $row->visitors], $rows);
    }

    /**
     * Per challenge: how many sessions started it, how many finished, and the median finish time.
     *
     * @return list<array<string, mixed>>
     */
    public function challenges(int $from, int $to, bool $includeTest): array
    {
        $test = $this->scope($includeTest);
        $rows = $this->db()->select("SELECT chal,
                SUM(name = 'challenge_start') AS starts,
                SUM(name = 'challenge_start' AND ctrl = 'link') AS from_links,
                COUNT(DISTINCT CASE WHEN name = 'challenge_start' THEN sid END) AS start_sessions,
                COUNT(DISTINCT CASE WHEN name = 'challenge_complete' THEN sid END) AS done_sessions,
                SUM(name = 'challenge_complete') AS completions
            FROM events WHERE name IN ('challenge_start', 'challenge_complete') AND chal <> '' AND ts >= ? AND ts < ?{$test}
            GROUP BY chal ORDER BY starts DESC", [$from, $to]);

        return array_map(fn ($row): array => [
            'challenge' => (string) $row->chal,
            'starts' => (int) $row->starts,
            'from_links' => (int) $row->from_links,
            'completions' => (int) $row->completions,
            'completion_rate' => $row->start_sessions ? round(100 * min(1, $row->done_sessions / $row->start_sessions), 1) : null,
            'median_time' => $this->median('challenge_complete', $from, $to, $includeTest, (string) $row->chal),
        ], $rows);
    }

    public function median(string $event, int $from, int $to, bool $includeTest, ?string $challenge = null): ?float
    {
        $query = $this->db()->table('events')->where('name', $event)->whereNotNull('num')->where('ts', '>=', $from)->where('ts', '<', $to);
        if (! $includeTest) {
            $query->where('test', 0);
        }
        if ($challenge !== null) {
            $query->where('chal', $challenge);
        }
        if ($this->game) {
            $query->where('game', $this->game);
        }
        $count = (clone $query)->count();
        if ($count === 0) {
            return null;
        }
        $values = $query->orderBy('num')->offset(intdiv($count - 1, 2))->limit(2 - $count % 2)->pluck('num')->all();

        return round(array_sum($values) / count($values), 1);
    }

    /**
     * @return list<object>
     */
    public function recent(bool $includeTest, int $limit = 50): array
    {
        $query = $this->db()->table('events')->where('name', '<>', 'heartbeat')->orderByDesc('id')->limit($limit);
        if (! $includeTest) {
            $query->where('test', 0);
        }
        if ($this->game) {
            $query->where('game', $this->game);
        }

        return $query->get(['ts', 'game', 'name', 'country', 'ref', 'chal', 'ctrl', 'device', 'os', 'browser', 'num', 'data', 'test'])->all();
    }

    /**
     * Headline numbers per game for one window (ignores the game filter).
     *
     * @return array<string, array<string, float|int|null>>
     */
    public function byGame(int $from, int $to, bool $includeTest): array
    {
        $saved = $this->game;
        $out = [];
        try {
            foreach (array_keys(self::GAMES) as $game) {
                $out[$game] = $this->forGame($game)->summary($from, $to, $includeTest);
            }
        } finally {
            $this->game = $saved;
        }

        return $out;
    }

    /**
     * Level/round funnel: per mode and level, the sessions that reached it, finished it and won it.
     *
     * @return list<array{mode: string, level: int, reached: int, finished: int, won: int, avg_score: float|null}>
     */
    public function levels(int $from, int $to, bool $includeTest): array
    {
        $test = $this->scope($includeTest);
        $rows = $this->db()->select("SELECT ctrl AS mode, CAST(num AS INTEGER) AS level,
                COUNT(DISTINCT CASE WHEN name = 'level' THEN (CASE WHEN sid <> '' THEN sid ELSE vid END) END) AS reached,
                SUM(name = 'result') AS finished,
                SUM(CASE WHEN name = 'result' THEN json_extract(data, '$.won') = 1 ELSE 0 END) AS won,
                AVG(CASE WHEN name = 'result' THEN json_extract(data, '$.sc') END) AS avg_score
            FROM events WHERE name IN ('level', 'result') AND num IS NOT NULL AND ts >= ? AND ts < ?{$test}
            GROUP BY ctrl, CAST(num AS INTEGER) ORDER BY ctrl, level LIMIT 200", [$from, $to]);

        return array_map(fn ($row): array => [
            'mode' => (string) $row->mode,
            'level' => (int) $row->level,
            'reached' => (int) $row->reached,
            'finished' => (int) $row->finished,
            'won' => (int) $row->won,
            'avg_score' => $row->avg_score === null ? null : round((float) $row->avg_score, 1),
        ], $rows);
    }

    public function testEventCount(): int
    {
        return $this->db()->table('events')->where('test', 1)->count()
            + $this->db()->table('suggestions')->where('test', 1)->count();
    }
}
