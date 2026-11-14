<?php

namespace App\Services;

/**
 * "% of players picked this" for Quiet Worlds. Aggregates the anonymous qw_pick,
 * qw_choice and qw_end events (stored by MetronomeStats) into rounded shares.
 * Nothing personal is read or returned: only counts per world, beat and option.
 */
class QuietWorldsVotes
{
    /** Shares are only shown once this many players have chosen. */
    public const MIN_VOTES = 20;

    /** Story beats per world (1-based in events) and options per beat. */
    public const BEATS = 3;

    public const OPTIONS = 3;

    /** Endings, in the order the game sends them (num of qw_end). */
    public const ENDINGS = ['thrived', 'survived', 'lost'];

    /** Highest daily drop number accepted (about 270 years of days). */
    public const MAX_DAY = 100000;

    /**
     * Every world slug in public/quiet-worlds/worlds.js (a test keeps the two lists in sync).
     */
    public const WORLDS = [
        'endless-evening', 'candy', 'snow-globe', 'hot-spring', 'cloud-islands', 'cat-village', 'pillow-hills', 'turtle-back',
        'kappa-pond', 'penguin-bay', 'hibernation', 'seal-bay', 'tiny-kaiju', 'panda-daycare', 'kitten-cottage', 'ice-fishing',
        'duck-lake', 'manatee-bay', 'puppy-dorm', 'rabbit-hills', 'endless-hotel', 'hedge-maze', 'singing-swamp', 'rake-woods',
        'gnome-garden', 'oasis', 'raptor-ferns', 'one-room', 'mirror-salt', 'sheep-hills', 'aurora', 'paper-hills',
        'two-minute-world', 'upward-rain', 'ice-cream-truck', 'space-station', 'kelp-forest', 'bunker-town', 'what-you-eat',
        'blizzard-cabin', 'slime-hills', 'boulder-giants', 'frozen-lake', 'hourglass', 'dog-park', 'quiet-hospital',
        'lantern-lake', 'mushroom', 'night-sea', 'double-well', 'empty-zoo', 'scarecrow', 'endless-mall', 'pumpkin-patch',
        'drive-in', 'endless-library', 'teddy-bear-hills', 'night-market', 'playground', 'observatory', 'sunken-city',
        'kaiju-bones', 'video-store', 'pawn-shop', 'sunbeam-orchard', 'teacup-sea', 'sleeping-giants', 'star-mailbox',
        'weather-shop', 'echo-canyon', 'hundred-floors', 'whisper-grass',
    ];

    public function __construct(public MetronomeStats $stats) {}

    public static function isWorld(mixed $slug): bool
    {
        return is_string($slug) && in_array($slug, self::WORLDS, true);
    }

    /**
     * Shares for one world: which planet people picked on that day's drop, what they chose
     * at each beat of this world, and how their year ended. Shares are null below MIN_VOTES.
     *
     * @return array{w: string, day: int, min: int, pick: array{n: int, pct: array<string, int>|null}, beats: list<array{n: int, pct: list<int>|null}>, end: array{n: int, pct: array<string, int>|null}}
     */
    public function forWorld(string $world, int $day, bool $includeTest): array
    {
        $result = [
            'w' => $world,
            'day' => $day,
            'min' => self::MIN_VOTES,
            'pick' => ['n' => 0, 'pct' => null],
            'beats' => array_fill(0, self::BEATS, ['n' => 0, 'pct' => null]),
            'end' => ['n' => 0, 'pct' => null],
        ];

        if (! $this->stats->sqliteAvailable()) {
            return $result;
        }

        $base = fn (string $event) => $this->stats->db()->table('events')
            ->where('game', 'quiet-worlds')
            ->where('name', $event)
            ->when(! $includeTest, fn ($query) => $query->where('test', 0));

        $picks = $base('qw_pick')->where('num', $day)
            ->selectRaw('ctrl, COUNT(*) AS c')->groupBy('ctrl')->pluck('c', 'ctrl')->map(fn ($count) => (int) $count)->all();
        $result['pick'] = $this->shares($picks);

        $choices = $base('qw_choice')->where('ctrl', $world)
            ->selectRaw('CAST(num AS INTEGER) AS k, COUNT(*) AS c')->groupBy('k')->pluck('c', 'k')->all();
        foreach (range(1, self::BEATS) as $beat) {
            $counts = [];
            foreach (range(0, self::OPTIONS - 1) as $option) {
                $counts[] = (int) ($choices[$beat * 10 + $option] ?? 0);
            }
            $shares = $this->shares($counts);
            $result['beats'][$beat - 1] = ['n' => $shares['n'], 'pct' => $shares['pct'] === null ? null : array_values($shares['pct'])];
        }

        $endings = $base('qw_end')->where('ctrl', $world)
            ->selectRaw('CAST(num AS INTEGER) AS k, COUNT(*) AS c')->groupBy('k')->pluck('c', 'k')->all();
        $counts = [];
        foreach (self::ENDINGS as $index => $ending) {
            $counts[$ending] = (int) ($endings[$index] ?? 0);
        }
        $result['end'] = $this->shares($counts);

        return $result;
    }

    /**
     * Whole-number percentages of each count, or null while there are too few votes.
     *
     * @param  array<array-key, int>  $counts
     * @return array{n: int, pct: array<array-key, int>|null}
     */
    private function shares(array $counts): array
    {
        $total = array_sum($counts);
        if ($total < self::MIN_VOTES) {
            return ['n' => $total, 'pct' => null];
        }

        return ['n' => $total, 'pct' => array_map(fn (int $count): int => (int) round($count * 100 / $total), $counts)];
    }
}
