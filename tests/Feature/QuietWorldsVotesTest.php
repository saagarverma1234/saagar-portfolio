<?php

use App\Services\MetronomeStats;
use App\Services\QuietWorldsVotes;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->statsPath = sys_get_temp_dir().'/qw-votes-test-'.uniqid().'.sqlite';
    config(['metronomes.stats_path' => $this->statsPath, 'metronomes.votes_cache_store' => 'array']);
    Cache::store('array')->flush();
});

afterEach(function () {
    DB::purge(MetronomeStats::CONNECTION);
    foreach (glob($this->statsPath.'*') as $file) {
        @unlink($file);
    }
});

function qwBeacon(array $payload, string $cid = ''): \Illuminate\Testing\TestResponse
{
    $payload += ['g' => 'quiet-worlds'];
    if ($cid !== '') {
        $payload['cid'] = $cid;
    }

    return test()->call('POST', '/metronomes-api/event', [], [], [], [
        'HTTP_USER_AGENT' => 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36',
        'CONTENT_TYPE' => 'text/plain',
    ], json_encode($payload));
}

function qwEvents(): \Illuminate\Support\Collection
{
    return app(MetronomeStats::class)->db()->table('events')->get();
}

/** A different random browser ID for each simulated player. */
function qwPlayer(int $index): string
{
    return str_pad(dechex($index + 1), 16, '0', STR_PAD_LEFT);
}

test('valid Quiet Worlds votes are whitelisted and stored without personal data', function () {
    qwBeacon(['e' => 'qw_pick', 'd' => ['w' => 'aurora', 'day' => 3]], qwPlayer(1))->assertNoContent();
    qwBeacon(['e' => 'qw_choice', 'd' => ['w' => 'aurora', 'b' => 2, 'o' => 1]], qwPlayer(1))->assertNoContent();
    qwBeacon(['e' => 'qw_end', 'd' => ['w' => 'aurora', 'r' => 1, 'day' => 3]], qwPlayer(1))->assertNoContent();

    $rows = qwEvents()->keyBy('name');
    expect($rows)->toHaveCount(3)
        ->and($rows['qw_pick']->ctrl)->toBe('aurora')
        ->and((int) $rows['qw_pick']->num)->toBe(3)
        ->and((int) $rows['qw_choice']->num)->toBe(21)
        ->and(json_decode($rows['qw_choice']->data, true))->toBe(['b' => 2, 'o' => 1])
        ->and((int) $rows['qw_end']->num)->toBe(1)
        ->and($rows['qw_end']->game)->toBe('quiet-worlds')
        ->and(json_encode($rows))->not->toContain('127.0.0.1');
});

test('invalid Quiet Worlds votes are dropped', function (array $payload) {
    qwBeacon($payload)->assertNoContent();

    expect(qwEvents())->toHaveCount(0);
})->with([
    'unknown world' => [['e' => 'qw_pick', 'd' => ['w' => 'nowhere', 'day' => 1]]],
    'world is not a string' => [['e' => 'qw_pick', 'd' => ['w' => ['aurora'], 'day' => 1]]],
    'day zero' => [['e' => 'qw_pick', 'd' => ['w' => 'aurora', 'day' => 0]]],
    'day as text' => [['e' => 'qw_pick', 'd' => ['w' => 'aurora', 'day' => '3']]],
    'beat out of range' => [['e' => 'qw_choice', 'd' => ['w' => 'aurora', 'b' => 4, 'o' => 0]]],
    'option out of range' => [['e' => 'qw_choice', 'd' => ['w' => 'aurora', 'b' => 1, 'o' => 3]]],
    'unknown ending' => [['e' => 'qw_end', 'd' => ['w' => 'aurora', 'r' => 3, 'day' => 1]]],
    'missing data' => [['e' => 'qw_choice']],
    'another game' => [['e' => 'qw_pick', 'g' => 'bump-theory', 'd' => ['w' => 'aurora', 'day' => 1]]],
    'event not on the whitelist' => [['e' => 'qw_vote', 'd' => ['w' => 'aurora', 'day' => 1]]],
]);

test('a browser votes once per world, beat and option a day', function () {
    qwBeacon(['e' => 'qw_choice', 'd' => ['w' => 'candy', 'b' => 1, 'o' => 0]], qwPlayer(1));
    qwBeacon(['e' => 'qw_choice', 'd' => ['w' => 'candy', 'b' => 1, 'o' => 0]], qwPlayer(1));
    qwBeacon(['e' => 'qw_choice', 'd' => ['w' => 'candy', 'b' => 1, 'o' => 0]], qwPlayer(2));

    expect(qwEvents())->toHaveCount(2);
});

test('the votes endpoint hides shares until enough players chose', function () {
    foreach (range(1, QuietWorldsVotes::MIN_VOTES - 1) as $i) {
        qwBeacon(['e' => 'qw_choice', 'd' => ['w' => 'candy', 'b' => 1, 'o' => 0]], qwPlayer($i));
    }

    $this->getJson('/quiet-worlds-api/votes?w=candy&day=1')
        ->assertSuccessful()
        ->assertHeader('X-Robots-Tag', 'noindex')
        ->assertJsonPath('ok', true)
        ->assertJsonPath('min', QuietWorldsVotes::MIN_VOTES)
        ->assertJsonPath('beats.0.n', QuietWorldsVotes::MIN_VOTES - 1)
        ->assertJsonPath('beats.0.pct', null)
        ->assertJsonPath('pick.pct', null)
        ->assertJsonPath('end.pct', null);
});

test('the votes endpoint returns rounded shares per drop, beat and ending', function () {
    foreach (range(1, 30) as $i) {
        $player = qwPlayer($i);
        qwBeacon(['e' => 'qw_pick', 'd' => ['w' => $i <= 20 ? 'candy' : 'aurora', 'day' => 5]], $player);
        qwBeacon(['e' => 'qw_choice', 'd' => ['w' => 'candy', 'b' => 2, 'o' => $i <= 10 ? 0 : ($i <= 25 ? 1 : 2)]], $player);
        qwBeacon(['e' => 'qw_end', 'd' => ['w' => 'candy', 'r' => $i <= 24 ? 0 : 1, 'day' => 5]], $player);
    }
    qwBeacon(['e' => 'qw_pick', 'd' => ['w' => 'candy', 'day' => 6]], qwPlayer(99));

    $this->getJson('/quiet-worlds-api/votes?w=candy&day=5')
        ->assertSuccessful()
        ->assertHeader('Cache-Control', 'max-age=120, public')
        ->assertJsonPath('pick.n', 30)
        ->assertJsonPath('pick.pct', ['aurora' => 33, 'candy' => 67])
        ->assertJsonPath('beats.0.pct', null)
        ->assertJsonPath('beats.1.n', 30)
        ->assertJsonPath('beats.1.pct', [33, 50, 17])
        ->assertJsonPath('end.pct', ['thrived' => 80, 'survived' => 20, 'lost' => 0]);
});

test('test events only count when a test build asks for them', function () {
    foreach (range(1, QuietWorldsVotes::MIN_VOTES) as $i) {
        qwBeacon(['e' => 'qw_end', 'test' => 1, 'd' => ['w' => 'mushroom', 'r' => 2, 'day' => 1]], qwPlayer($i));
    }

    $this->getJson('/quiet-worlds-api/votes?w=mushroom&day=1')->assertJsonPath('end.pct', null);
    $this->getJson('/quiet-worlds-api/votes?w=mushroom&day=1&beta=1')->assertJsonPath('end.pct.lost', 100);
});

test('the votes endpoint is cached', function () {
    $this->getJson('/quiet-worlds-api/votes?w=oasis&day=2')->assertJsonPath('end.n', 0);
    qwBeacon(['e' => 'qw_end', 'd' => ['w' => 'oasis', 'r' => 1, 'day' => 2]], qwPlayer(1));

    $this->getJson('/quiet-worlds-api/votes?w=oasis&day=2')->assertJsonPath('end.n', 0);
    Cache::store('array')->flush();
    $this->getJson('/quiet-worlds-api/votes?w=oasis&day=2')->assertJsonPath('end.n', 1);
});

test('the votes endpoint rejects unknown worlds and days', function (string $query) {
    $this->getJson('/quiet-worlds-api/votes?'.$query)
        ->assertUnprocessable()
        ->assertJsonPath('ok', false)
        ->assertHeader('Cache-Control', 'no-store, private');
})->with([
    'no world' => ['day=1'],
    'unknown world' => ['w=atlantis&day=1'],
    'no day' => ['w=candy'],
    'day zero' => ['w=candy&day=0'],
    'day as text' => ['w=candy&day=soon'],
    'day too far' => ['w=candy&day=100001'],
]);

test('the votes endpoint is rate limited and sets no cookies', function () {
    foreach (range(1, 60) as $i) {
        $this->getJson('/quiet-worlds-api/votes?w=candy&day=1')->assertSuccessful()->assertCookieMissing('laravel_session');
    }

    $this->getJson('/quiet-worlds-api/votes?w=candy&day=1')->assertTooManyRequests();
});

test('the server world list matches the game worlds', function () {
    $js = file_get_contents(public_path('quiet-worlds/worlds.js'));
    preg_match_all('/"slug":\s*"([a-z0-9-]+)"/', $js, $matches);

    expect($matches[1])->toHaveCount(count(QuietWorldsVotes::WORLDS))
        ->and(array_values(array_diff($matches[1], QuietWorldsVotes::WORLDS)))->toBe([])
        ->and(array_values(array_diff(QuietWorldsVotes::WORLDS, $matches[1])))->toBe([]);
});
