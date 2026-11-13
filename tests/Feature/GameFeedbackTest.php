<?php

use App\Services\MetronomeStats;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->statsPath = sys_get_temp_dir().'/metronome-feedback-test-'.uniqid().'.sqlite';
    config(['metronomes.stats_path' => $this->statsPath]);
});

afterEach(function () {
    DB::purge(MetronomeStats::CONNECTION);
    foreach (glob($this->statsPath.'*') as $file) {
        @unlink($file);
    }
});

function suggest(array $body, ?array $headers = null): \Illuminate\Testing\TestResponse
{
    return test()->withHeaders($headers ?? ['Origin' => config('app.url')])->postJson('/game-feedback', $body);
}

function suggestionRows(): \Illuminate\Support\Collection
{
    return app(MetronomeStats::class)->db()->table('suggestions')->get();
}

test('a suggestion is stored with a hashed IP and no cookies', function () {
    suggest(['game' => 'bump-theory', 'message' => '  More levels please ', 'contact' => 'sam@example.com'])
        ->assertOk()->assertJson(['ok' => true])->assertCookieMissing('laravel_session');

    $row = suggestionRows()->sole();
    expect($row->game)->toBe('bump-theory')
        ->and($row->message)->toBe('More levels please')
        ->and($row->contact)->toBe('sam@example.com')
        ->and($row->ip_hash)->toMatch('/^[0-9a-f]{16}$/')
        ->and($row->ip_hash)->not->toContain('127.0.0.1');
});

test('cross-site, honeypot and invalid suggestions are not stored', function () {
    suggest(['game' => 'metronomes', 'message' => 'hello there'], ['Origin' => 'https://evil.example'])->assertForbidden();
    suggest(['game' => 'metronomes', 'message' => 'hello there'], [])->assertForbidden();
    suggest(['game' => 'metronomes', 'message' => 'buy now', 'website' => 'http://spam'])->assertOk();
    suggest(['game' => 'other', 'message' => 'hello there'])->assertStatus(422);
    suggest(['game' => 'metronomes', 'message' => 'x'])->assertStatus(422);
    suggest(['game' => 'metronomes', 'message' => str_repeat('a', 501)])->assertStatus(422);

    expect(suggestionRows())->toHaveCount(0);
});

test('each IP can send 5 suggestions an hour', function () {
    for ($i = 0; $i < 5; $i++) {
        suggest(['game' => 'metronomes', 'message' => "idea number {$i}"])->assertOk();
    }
    suggest(['game' => 'metronomes', 'message' => 'one more'])->assertStatus(429);

    expect(suggestionRows())->toHaveCount(5);
});

test('suggestions show on the admin page and test ones can be deleted', function () {
    config(['metronomes.admin_hash' => password_hash('correct-horse', PASSWORD_BCRYPT, ['cost' => 4])]);
    suggest(['game' => 'metronomes', 'message' => 'Add a 200 metronome mode']);
    suggest(['game' => 'bump-theory', 'message' => 'test row', 'test' => 1]);

    $login = $this->withHeaders(['Origin' => config('app.url')])->post('/metronomes-admin/login', ['password' => 'correct-horse']);
    $cookie = collect($login->headers->getCookies())->first(fn ($c) => $c->getName() === 'metronome_admin');

    $this->withUnencryptedCookie('metronome_admin', $cookie->getValue())->get('/metronomes-admin')
        ->assertOk()->assertSee('Suggestions from players')->assertSee('Add a 200 metronome mode')->assertDontSee('test row');

    $this->withUnencryptedCookie('metronome_admin', $cookie->getValue())->withHeaders(['Origin' => config('app.url')])->post('/metronomes-admin/delete-test');
    expect(suggestionRows()->pluck('message')->all())->toBe(['Add a 200 metronome mode']);
});

test('content pages and the games hub render without cookies', function (string $path, string $text) {
    $this->get($path)->assertOk()->assertSee($text, false)->assertCookieMissing('laravel_session');
})->with([
    ['/privacy', 'Privacy Policy'],
    ['/about', 'Chaos to Order'],
    ['/contact', 'saagarverma1234@gmail.com'],
    ['/games', 'href="/bump-theory/"'],
]);
