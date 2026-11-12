<?php

use App\Services\MetronomeStats;
use Illuminate\Support\Facades\DB;

const PHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

beforeEach(function () {
    $this->statsPath = sys_get_temp_dir().'/metronome-stats-test-'.uniqid().'.sqlite';
    config([
        'metronomes.stats_path' => $this->statsPath,
        'metronomes.admin_hash' => password_hash('correct-horse', PASSWORD_BCRYPT, ['cost' => 4]),
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
    $this->get('/metronomes-admin')->assertOk()->assertSee('Enter the admin password')
        ->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

    $this->withHeader('Origin', config('app.url'))->post('/metronomes-admin/login', ['password' => 'wrong'])
        ->assertRedirect('/metronomes-admin?e=bad')
        ->assertCookieMissing('metronome_admin');
});

test('a login without a same-site origin is refused', function () {
    $this->post('/metronomes-admin/login', ['password' => 'correct-horse'])->assertRedirect('/metronomes-admin?e=origin');
});

test('logging in shows the dashboard with the stored events', function () {
    beacon(['e' => 'pageview', 'cid' => 'abcdef0123456789', 'sid' => '0123456789abcdef', 'd' => ['ref' => 'facebook.com']]);
    beacon(['e' => 'play', 'sid' => '0123456789abcdef']);
    beacon(['e' => 'synced', 'sid' => '0123456789abcdef', 'd' => ['t' => 12.5, 'n' => 100, 'ch' => 'c100']]);
    beacon(['e' => 'heartbeat', 'sid' => '0123456789abcdef', 'd' => ['s' => 15]]);

    $login = $this->withHeader('Origin', config('app.url'))->post('/metronomes-admin/login', ['password' => 'correct-horse']);
    $login->assertRedirect('/metronomes-admin')->assertCookie('metronome_admin', null, false);
    $cookie = collect($login->headers->getCookies())->firstWhere(fn ($c) => $c->getName() === 'metronome_admin');

    $this->withUnencryptedCookie('metronome_admin', $cookie->getValue())->get('/metronomes-admin')
        ->assertOk()
        ->assertSee('live now')
        ->assertSee('Facebook')
        ->assertSee('12.5 s')
        ->assertHeader('Cache-Control');

    $this->withUnencryptedCookie('metronome_admin', '9999999999.'.str_repeat('a', 64))->get('/metronomes-admin')->assertSee('Enter the admin password');
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
