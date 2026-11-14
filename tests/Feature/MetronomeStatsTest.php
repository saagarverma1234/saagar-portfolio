<?php

use App\Services\MetronomeStats;
use Illuminate\Support\Facades\DB;

const PHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

beforeEach(function () {
    $this->statsPath = sys_get_temp_dir().'/metronome-stats-test-'.uniqid().'.sqlite';
    config([
        'metronomes.stats_path' => $this->statsPath,
        'metronomes.admin_hash' => password_hash('correct-horse', PASSWORD_BCRYPT, ['cost' => 4]),
        'metronomes.admin_email_hash' => hash('sha256', 'admin@example.com'),
    ]);
});

afterEach(function () {
    DB::purge(MetronomeStats::CONNECTION);
    foreach (glob($this->statsPath.'*') as $file) {
        @unlink($file);
    }
});

function beacon(array $payload, string $ua = PHONE_UA, array $headers = []): \Illuminate\Testing\TestResponse
{
    return test()->call('POST', '/metronomes-api/event', [], [], [], array_merge([
        'HTTP_USER_AGENT' => $ua,
        'CONTENT_TYPE' => 'text/plain',
        'HTTP_CF_IPCOUNTRY' => 'IN',
    ], $headers), json_encode($payload));
}

function events(): \Illuminate\Support\Collection
{
    return app(MetronomeStats::class)->db()->table('events')->get();
}

test('a pageview is stored without the IP and with parsed fields', function () {
    beacon(['e' => 'pageview', 'cid' => 'abcdef0123456789', 'sid' => '0123456789abcdef', 'd' => ['ref' => 'm.youtube.com', 'c' => '5050', 'ret' => 1]])
        ->assertNoContent()
        ->assertCookieMissing('laravel_session');

    $row = events()->sole();
    expect($row->name)->toBe('pageview')
        ->and($row->ref)->toBe('YouTube')
        ->and($row->chal)->toBe('5050')
        ->and($row->country)->toBe('IN')
        ->and($row->device)->toBe('phone')
        ->and($row->os)->toBe('iOS')
        ->and($row->browser)->toBe('Safari')
        ->and($row->ret)->toBe(1)
        ->and(strlen($row->vid))->toBe(16)
        ->and(json_encode($row))->not->toContain('127.0.0.1');
});

test('invalid, oversized and bot events are dropped but still get 204', function () {
    beacon(['e' => 'drop_tables'])->assertNoContent();
    beacon(['e' => 'pageview', 'd' => ['ref' => str_repeat('x', 3000)]])->assertNoContent();
    beacon(['e' => 'pageview'], 'Googlebot/2.1')->assertNoContent();
    test()->call('POST', '/metronomes-api/event', [], [], [], ['HTTP_USER_AGENT' => PHONE_UA], 'not json')->assertNoContent();

    expect(events())->toHaveCount(0);
});

test('test events are kept and flagged', function () {
    beacon(['e' => 'pageview', 'test' => 1], 'curl/8.0')->assertNoContent();

    expect(events()->sole()->test)->toBe(1);
});

test('events are rate limited per visitor', function () {
    for ($i = 0; $i < MetronomeStats::MAX_EVENTS_PER_MINUTE + 5; $i++) {
        beacon(['e' => 'control', 'd' => ['c' => 'nudge']]);
    }

    expect(events())->toHaveCount(MetronomeStats::MAX_EVENTS_PER_MINUTE);
});

test('the admin page needs a login and a wrong password fails', function () {
    $this->get('/admin')->assertOk()->assertSee('admin email and password')
        ->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

    $this->withHeader('Origin', config('app.url'))->post('/admin/login', ['email' => 'admin@example.com', 'password' => 'wrong'])
        ->assertRedirect('/admin?e=bad')
        ->assertCookieMissing('metronome_admin');
});

test('a login without a same-site origin is refused', function () {
    $this->post('/admin/login', ['email' => 'Admin@Example.com ', 'password' => 'correct-horse'])->assertRedirect('/admin?e=origin');
});

test('logging in shows the dashboard with the stored events', function () {
    beacon(['e' => 'pageview', 'cid' => 'abcdef0123456789', 'sid' => '0123456789abcdef', 'd' => ['ref' => 'facebook.com']]);
    beacon(['e' => 'play', 'sid' => '0123456789abcdef']);
    beacon(['e' => 'synced', 'sid' => '0123456789abcdef', 'd' => ['t' => 12.5, 'n' => 100, 'ch' => 'c100']]);
    beacon(['e' => 'heartbeat', 'sid' => '0123456789abcdef', 'd' => ['s' => 15]]);

    $login = $this->withHeader('Origin', config('app.url'))->post('/admin/login', ['email' => 'Admin@Example.com ', 'password' => 'correct-horse']);
    $login->assertRedirect('/admin')->assertCookie('metronome_admin', null, false);
    $cookie = collect($login->headers->getCookies())->firstWhere(fn ($c) => $c->getName() === 'metronome_admin');

    $this->withUnencryptedCookie('metronome_admin', $cookie->getValue())->get('/admin')
        ->assertOk()
        ->assertSee('live now')
        ->assertSee('Facebook')
        ->assertSee('12.5 s')
        ->assertHeader('Cache-Control');

    $this->withUnencryptedCookie('metronome_admin', '9999999999.'.str_repeat('a', 64))->get('/admin')->assertSee('admin email and password');
});

test('referrers and user agents are classified', function () {
    $stats = app(MetronomeStats::class);

    expect($stats->classifyReferrer('l.facebook.com'))->toBe('Facebook')
        ->and($stats->classifyReferrer('www.google.co.in'))->toBe('Google')
        ->and($stats->classifyReferrer('', 'Instagram app'))->toBe('Instagram')
        ->and($stats->classifyReferrer(''))->toBe('Direct')
        ->and($stats->parseUserAgent('Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Chrome/130 Safari/537.36'))->toBe(['tablet', 'Android', 'Chrome'])
        ->and($stats->parseUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36 Edg/130'))->toBe(['desktop', 'Windows', 'Edge']);
});

function adminCookie(): string
{
    $login = test()->withHeader('Origin', config('app.url'))->post('/admin/login', ['email' => 'admin@example.com', 'password' => 'correct-horse']);

    return collect($login->headers->getCookies())->firstWhere(fn ($c) => $c->getName() === 'metronome_admin')->getValue();
}

test('a wrong email with the right password is refused with the same message', function () {
    $this->withHeader('Origin', config('app.url'))->post('/admin/login', ['email' => 'someone@example.com', 'password' => 'correct-horse'])
        ->assertRedirect('/admin?e=bad')
        ->assertCookieMissing('metronome_admin');
    $this->get('/admin?e=bad')->assertSee('Wrong email or password.');
});

test('the old admin urls redirect permanently to /admin', function () {
    $this->get('/metronomes-admin')->assertStatus(301)->assertRedirect('/admin');
    $this->get('/metronomes/admin')->assertStatus(301)->assertRedirect('/admin');
});

test('events carry a whitelisted game and default to metronomes', function () {
    beacon(['e' => 'pageview']);
    beacon(['e' => 'pageview', 'g' => 'bump-theory', 'cid' => 'abcdef0123456789']);
    beacon(['e' => 'level', 'g' => 'quiet-worlds', 'd' => ['m' => 'daily', 'n' => 3]]);
    beacon(['e' => 'result', 'g' => 'bump-theory', 'd' => ['m' => 'level', 'n' => 4, 'won' => 1, 'st' => 2, 'sc' => 1234]]);
    beacon(['e' => 'pageview', 'g' => 'not-a-game']);

    $rows = events();
    expect($rows)->toHaveCount(4)
        ->and($rows->pluck('game')->all())->toBe(['metronomes', 'bump-theory', 'quiet-worlds', 'bump-theory'])
        ->and($rows[2]->ctrl)->toBe('daily')
        ->and((int) $rows[2]->num)->toBe(3)
        ->and(json_decode($rows[3]->data, true))->toBe(['won' => 1, 'st' => 2, 'sc' => 1234]);
});

test('level, daily and share card events are stored with clamped, whitelisted fields', function () {
    beacon(['e' => 'level_created', 'test' => 1, 'd' => ['n' => 64, 'b' => 216, 's' => 'tie3', 'tl' => 63, 'tg' => 12.5, 'mf' => 5, 'w' => 1, 'how' => 'share']]);
    beacon(['e' => 'level_played', 'd' => ['src' => 'link', 'n' => 64, 'tg' => 9999]]);
    beacon(['e' => 'daily_played', 'd' => ['day' => 3]]);
    beacon(['e' => 'daily_completed', 'd' => ['day' => 3, 't' => 7.4, 'flips' => 2, 'par' => 1]]);
    beacon(['e' => 'share_card', 'd' => ['w' => 'save', 'm' => 'daily']]);
    beacon(['e' => 'share_card', 'd' => ['w' => '<script>', 'm' => 'nope']]);

    $rows = events();
    expect($rows)->toHaveCount(6)
        ->and($rows[0]->test)->toBe(1)
        ->and($rows[0]->ctrl)->toBe('tie3')
        ->and((float) $rows[0]->num)->toBe(12.5)
        ->and(json_decode($rows[0]->data, true))->toBe(['n' => 64, 'b' => 216, 'tl' => 63, 'mf' => 5, 'w' => 1, 'how' => 'share'])
        ->and($rows[1]->ctrl)->toBe('link')
        ->and((float) $rows[1]->num)->toBe(600.0)
        ->and((int) $rows[2]->num)->toBe(3)
        ->and((float) $rows[3]->num)->toBe(7.4)
        ->and(json_decode($rows[3]->data, true))->toBe(['day' => 3, 'flips' => 2, 'par' => 1])
        ->and($rows[4]->ctrl)->toBe('save')
        ->and($rows[5]->ctrl)->toBe('open')
        ->and(json_decode($rows[5]->data, true))->toBe(['m' => 'free']);
});

test('the kids game never stores a browser id', function () {
    beacon(['e' => 'pageview', 'g' => 'swipe-theory', 'cid' => 'abcdef0123456789', 'sid' => '0123456789abcdef']);

    expect(events()->sole()->cid)->toBe('')->and(events()->sole()->sid)->toBe('0123456789abcdef');
});

test('an existing version 2 database gains the game column without losing rows', function () {
    $pdo = new PDO('sqlite:'.$this->statsPath);
    $pdo->exec("CREATE TABLE events (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, name TEXT NOT NULL, vid TEXT NOT NULL, cid TEXT NOT NULL DEFAULT '', sid TEXT NOT NULL DEFAULT '', country TEXT NOT NULL DEFAULT '', ref TEXT NOT NULL DEFAULT '', utm TEXT NOT NULL DEFAULT '', chal TEXT NOT NULL DEFAULT '', ctrl TEXT NOT NULL DEFAULT '', device TEXT NOT NULL DEFAULT '', os TEXT NOT NULL DEFAULT '', browser TEXT NOT NULL DEFAULT '', ret INTEGER NOT NULL DEFAULT 0, num REAL, data TEXT NOT NULL DEFAULT '', test INTEGER NOT NULL DEFAULT 0)");
    $pdo->exec('CREATE TABLE login_failures (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, who TEXT NOT NULL)');
    $pdo->exec("CREATE TABLE suggestions (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at INTEGER NOT NULL, game TEXT NOT NULL, message TEXT NOT NULL, contact TEXT NOT NULL DEFAULT '', ip_hash TEXT NOT NULL, test INTEGER NOT NULL DEFAULT 0)");
    $pdo->exec("INSERT INTO events (ts, name, vid) VALUES (1700000000, 'pageview', 'aaaaaaaaaaaaaaaa'), (1700000001, 'play', 'aaaaaaaaaaaaaaaa')");
    $pdo->exec('PRAGMA user_version = 2');
    $pdo = null;

    $db = app(MetronomeStats::class)->db();

    expect($db->selectOne('PRAGMA user_version')->user_version)->toBe(3)
        ->and($db->table('events')->pluck('game')->all())->toBe(['metronomes', 'metronomes']);
});

test('the admin shows all games and can switch to one game', function () {
    beacon(['e' => 'pageview', 'd' => ['ref' => 'facebook.com']]);
    beacon(['e' => 'pageview', 'g' => 'bump-theory', 'd' => ['ref' => 'm.youtube.com']]);
    beacon(['e' => 'play', 'g' => 'bump-theory']);
    beacon(['e' => 'level', 'g' => 'bump-theory', 'sid' => '0123456789abcdef', 'd' => ['m' => 'level', 'n' => 7]]);
    beacon(['e' => 'pageview', 'g' => 'quiet-worlds', 'test' => 1]);
    $cookie = adminCookie();

    $this->withUnencryptedCookie('metronome_admin', $cookie)->get('/admin')
        ->assertOk()->assertSee('Game stats')->assertSee('All games')->assertSee('By game')
        ->assertSee('Bump Theory')->assertSee('Swipe Theory')->assertSee('Quiet Worlds')->assertSee('Metronomes');

    $this->withUnencryptedCookie('metronome_admin', $cookie)->get('/admin?game=bump-theory')
        ->assertOk()->assertSee('Game stats: Bump Theory')->assertSee('Levels reached')->assertSee('YouTube')->assertDontSee('Facebook');

    $this->withUnencryptedCookie('metronome_admin', $cookie)->get('/admin?game=metronomes')
        ->assertOk()->assertSee('Challenges')->assertSee('Facebook')->assertDontSee('YouTube');

    expect(app(MetronomeStats::class)->forGame('quiet-worlds')->summary(0, time() + 1, false)['pageviews'])->toBe(0)
        ->and(app(MetronomeStats::class)->forGame('quiet-worlds')->summary(0, time() + 1, true)['pageviews'])->toBe(1);
});
