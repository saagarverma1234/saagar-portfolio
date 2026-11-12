@extends('metronomes.layout')

@section('title', 'Metronome Stats')

@php
    $fmtTime = function ($seconds) {
        if ($seconds === null) {
            return '–';
        }
        $seconds = (int) $seconds;

        return $seconds >= 60 ? intdiv($seconds, 60).'m '.str_pad((string) ($seconds % 60), 2, '0', STR_PAD_LEFT).'s' : $seconds.'s';
    };
    $pct = fn ($value) => $value === null ? '–' : rtrim(rtrim(number_format($value, 1), '0'), '.').'%';
    $num = fn ($value) => number_format((int) $value);
    $challengeNames = ['c100' => 'Can 100 sync?', '5050' => '50 vs 50', 'tie3' => 'Break the 3-way tie', 'shake' => 'Shake at 229', 'weights' => 'Weights off', 'lift' => 'Lift 20 off', 'big' => 'Add 1 big one'];
    $controlNames = ['nudge' => 'Nudge', 'shake' => 'Shake (motor)', 'flip' => 'Flip button', 'tap' => 'Tap to flip', 'big' => 'Add/remove big one', 'weights' => 'Weights', 'lift' => 'Lift 20 off', 'teams' => 'Teams (random/2/3)', 'count' => 'Metronome count', 'speed' => 'Speed slider', 'reset' => 'Reset', 'randomise' => 'Randomise', 'again' => 'Again (after sync)', 'other' => 'Other'];
    $ist = fn (int $ts) => gmdate('j M, g:i A', $ts + \App\Services\MetronomeStats::IST_OFFSET);
@endphp

@push('head')
<style>
header.top { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
.live { display: inline-flex; align-items: center; gap: 8px; background: var(--surface); border: 1px solid var(--line); border-radius: 999px; padding: 6px 12px; font-size: 14px; }
.live i { width: 9px; height: 9px; border-radius: 50%; background: var(--good); box-shadow: 0 0 0 3px rgba(31,138,76,.18); }
.live b { font-variant-numeric: tabular-nums; }
.periods { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }
@media (max-width: 760px) { .periods { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.period h2 { margin-bottom: 6px; }
.period .big { font-size: 30px; font-weight: 700; line-height: 1.1; font-variant-numeric: tabular-nums; }
.period .big small { font-size: 13px; font-weight: 500; color: var(--muted); }
.kv { display: grid; grid-template-columns: 1fr auto; gap: 2px 8px; margin-top: 8px; font-size: 13px; }
.kv span:nth-child(odd) { color: var(--muted); }
.kv span:nth-child(even) { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
.grid2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px; margin-bottom: 10px; }
@media (max-width: 760px) { .grid2 { grid-template-columns: minmax(0, 1fr); } }
.stack > * + * { margin-top: 10px; }
.chart svg { display: block; width: 100%; height: auto; overflow: visible; }
.chart .bar { fill: var(--accent); }
.chart .hit { fill: transparent; cursor: pointer; }
.chart .hit:hover + .bar, .chart .bar.sel { fill: var(--text); }
.chart .axis { fill: var(--dim); font-size: 10px; font-variant-numeric: tabular-nums; }
.chart .gridline { stroke: var(--line); stroke-width: 1; }
.readout { font-size: 13px; color: var(--muted); min-height: 20px; margin: -4px 0 6px; font-variant-numeric: tabular-nums; }
.rangebar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: 18px 0 10px; }
.rangebar form { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.rangebar input[type=date] { min-height: 38px; padding: 4px 8px; font-size: 14px; }
.rangesum { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-bottom: 10px; }
@media (max-width: 760px) { .rangesum { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.rangesum .card { padding: 10px 12px; }
.rangesum b { display: block; font-size: 22px; font-variant-numeric: tabular-nums; }
.rangesum span { font-size: 12px; color: var(--muted); }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { text-align: left; font-weight: 600; color: var(--muted); font-size: 12px; padding: 4px 6px 6px 0; border-bottom: 1px solid var(--line); }
td { padding: 6px 6px 6px 0; border-bottom: 1px solid var(--line); vertical-align: top; }
tr:last-child td { border-bottom: 0; }
td.n, th.n { text-align: right; font-variant-numeric: tabular-nums; padding-right: 0; padding-left: 6px; white-space: nowrap; }
.meter { position: relative; }
.meter::before { content: ''; position: absolute; left: 0; top: 3px; bottom: 3px; width: var(--w); background: var(--accent-soft); border-radius: 4px; }
.meter > span { position: relative; }
.scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.recent td { white-space: nowrap; }
.tag { display: inline-block; font-size: 11px; padding: 1px 6px; border-radius: 6px; background: var(--accent-soft); }
.empty { color: var(--dim); font-size: 13px; padding: 6px 0; }
.foot { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 18px; font-size: 13px; }
</style>
@endpush

@section('body')
<div class="wrap">
@if ($unavailable)
  <header class="top"><h1>Metronome stats</h1></header>
  <div class="card">
    <p><b>Stats storage is not available on this server.</b></p>
    @isset($error)<p class="muted">{{ $error }}</p>@endisset
    @if (! extension_loaded('pdo_sqlite'))
      <p class="muted">PHP's pdo_sqlite extension is missing. Events are still being saved to {{ basename($fallback) }} and will be imported automatically once pdo_sqlite is enabled.</p>
    @endif
  </div>
@else
  <header class="top">
    <h1>Metronome stats</h1>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <span class="live" title="Sessions with any activity in the last 2 minutes"><i></i><b>{{ $live }}</b> live now</span>
      <a class="btn" href="{{ request()->fullUrl() }}">Refresh</a>
    </div>
  </header>

  <section class="periods" aria-label="Headline numbers">
    @foreach (['today' => 'Today', '7d' => '7 days', '30d' => '30 days', 'all' => 'All time'] as $key => $title)
      @php $c = $cards[$key]; @endphp
      <div class="card period">
        <h2>{{ $title }}</h2>
        <div class="big">{{ $num($c['visitors']) }} <small>visitors</small></div>
        <div class="kv">
          <span>Pageviews</span><span>{{ $num($c['pageviews']) }}</span>
          <span>Plays</span><span>{{ $num($c['plays']) }}</span>
          <span>Play rate</span><span>{{ $pct($c['play_rate']) }}</span>
          <span>Syncs</span><span>{{ $num($c['syncs']) }}</span>
          <span>Shares</span><span>{{ $num($c['shares']) }}</span>
          <span>Avg time</span><span>{{ $fmtTime($c['avg_time']) }}</span>
          <span>Returning</span><span>{{ $pct($c['returning_rate']) }}</span>
        </div>
      </div>
    @endforeach
  </section>

  @php
      $charts = [
          ['id' => 'daily', 'title' => 'Visitors per day, last 30 days', 'rows' => $daily, 'unit' => 'day'],
          ['id' => 'hourly', 'title' => 'Visitors per hour, last 48 hours (IST)', 'rows' => $hourly, 'unit' => 'hour'],
      ];
  @endphp
  <div class="grid2">
    @foreach ($charts as $chart)
      @php
          $rows = $chart['rows'];
          $count = count($rows);
          $max = max(1, max(array_column($rows, 'visitors')));
          $niceMax = $max <= 5 ? 5 : (int) (ceil($max / pow(10, floor(log10($max)))) * pow(10, floor(log10($max))));
          $w = 360; $h = 160; $left = 26; $bottom = 20; $top = 8;
          $plotW = $w - $left; $plotH = $h - $bottom - $top;
          $slot = $plotW / max(1, $count); $barW = max(1.5, $slot - ($slot > 6 ? 2 : 1));
      @endphp
      <div class="card chart" data-chart>
        <h2>{{ $chart['title'] }}</h2>
        <div class="readout" data-readout>Tap a bar for details.</div>
        <svg viewBox="0 0 {{ $w }} {{ $h }}" role="img" aria-label="{{ $chart['title'] }}">
          @foreach ($niceMax % 2 === 0 ? [0, 0.5, 1] : [0, 1] as $f)
            @php $y = $top + $plotH * (1 - $f); @endphp
            <line class="gridline" x1="{{ $left }}" x2="{{ $w }}" y1="{{ $y }}" y2="{{ $y }}"/>
            <text class="axis" x="{{ $left - 6 }}" y="{{ $y + 3 }}" text-anchor="end">{{ $num(round($niceMax * $f)) }}</text>
          @endforeach
          @foreach ($rows as $i => $row)
            @php
                $bh = $row['visitors'] ? max(2, $plotH * $row['visitors'] / $niceMax) : 0;
                $x = $left + $i * $slot + 1;
                if ($chart['unit'] === 'day') {
                    $label = \Carbon\Carbon::createFromFormat('Y-m-d', $row['label'])->format('D j M');
                    $tick = ($count - 1 - $i) % 7 === 0 ? \Carbon\Carbon::createFromFormat('Y-m-d', $row['label'])->format('j M') : null;
                } else {
                    $dt = \Carbon\Carbon::createFromFormat('Y-m-d H', $row['label']);
                    $label = $dt->format('D j M, g A').' to '.$dt->copy()->addHour()->format('g A');
                    $tick = $dt->hour % 12 === 0 ? ($dt->hour === 0 ? $dt->format('j M') : '12 PM') : null;
                }
                $tip = $label.': '.$num($row['visitors']).' visitors, '.$num($row['pageviews']).' pageviews';
            @endphp
            <rect class="hit" x="{{ $left + $i * $slot }}" y="{{ $top }}" width="{{ $slot }}" height="{{ $plotH }}" data-tip="{{ $tip }}"><title>{{ $tip }}</title></rect>
            @if ($bh > 0)
              <rect class="bar" x="{{ round($x, 2) }}" y="{{ round($top + $plotH - $bh, 2) }}" width="{{ round($barW, 2) }}" height="{{ round($bh, 2) }}" rx="{{ min(3, $barW / 2) }}"/>
            @else
              <rect class="bar" x="{{ round($x, 2) }}" y="{{ $top + $plotH - 0.5 }}" width="{{ round($barW, 2) }}" height="0.5" opacity=".35"/>
            @endif
            @if ($tick)
              <text class="axis" x="{{ round($x + $barW / 2, 2) }}" y="{{ $h - 6 }}" text-anchor="middle">{{ $tick }}</text>
            @endif
          @endforeach
        </svg>
      </div>
    @endforeach
  </div>

  <div class="rangebar">
    @foreach ($presets as $key => $title)
      <a class="btn {{ $preset === $key ? 'on' : '' }}" href="?range={{ $key }}{{ $includeTest ? '&test=1' : '' }}">{{ $title }}</a>
    @endforeach
    <form method="get" action="/metronomes-admin">
      <input type="hidden" name="range" value="custom">
      @if ($includeTest)<input type="hidden" name="test" value="1">@endif
      <input type="date" name="from" value="{{ $fromDate }}" aria-label="From date">
      <input type="date" name="to" value="{{ $toDate }}" aria-label="To date">
      <button class="btn {{ $preset === 'custom' ? 'on' : '' }}" type="submit">Apply</button>
    </form>
  </div>
  <p class="muted" style="margin:0 0 10px;font-size:13px">Breakdowns below: <b style="color:var(--text)">{{ $rangeLabel }}</b> (IST){{ $includeTest ? ', including test events' : '' }}</p>

  <div class="rangesum">
    <div class="card"><b>{{ $num($range['visitors']) }}</b><span>visitors</span></div>
    <div class="card"><b>{{ $pct($range['play_rate']) }}</b><span>play rate ({{ $num($range['plays']) }} plays)</span></div>
    <div class="card"><b>{{ $num($range['syncs']) }}</b><span>syncs · median {{ $medianSync === null ? '–' : $medianSync.' s' }}</span></div>
    <div class="card"><b>{{ $fmtTime($range['avg_time']) }}</b><span>avg time · {{ $num($range['shares']) }} shares</span></div>
  </div>

  @php
      $table = function (array $rows, string $head, ?array $names = null) use ($num) {
          if (! $rows) {
              return '<div class="empty">No data yet.</div>';
          }
          $total = max(1, array_sum(array_column($rows, 'visitors')));
          $max = max(1, max(array_column($rows, 'visitors')));
          $html = '<table><thead><tr><th>'.e($head).'</th><th class="n">Visitors</th><th class="n">Share</th></tr></thead><tbody>';
          foreach ($rows as $row) {
              $label = $row['label'] === '' ? 'Unknown' : ($names[$row['label']] ?? $row['label']);
              $html .= '<tr><td class="meter" style="--w:'.round(100 * $row['visitors'] / $max).'%"><span>'.e($label).'</span></td><td class="n">'.$num($row['visitors']).'</td><td class="n">'.round(100 * $row['visitors'] / $total).'%</td></tr>';
          }

          return $html.'</tbody></table>';
      };
  @endphp

  <div class="grid2">
    <div class="card"><h2>Referrers</h2>{!! $table($referrers, 'Source') !!}
      @if ($campaigns)
        <h2 style="margin-top:14px">UTM campaigns</h2>{!! $table($campaigns, 'source/medium/campaign') !!}
      @endif
    </div>
    <div class="card"><h2>Countries</h2>{!! $table($countries, 'Country') !!}</div>
  </div>

  <div class="grid2">
    <div class="card stack">
      <div><h2>Devices</h2>{!! $table($devices, 'Device') !!}</div>
      <div><h2>Operating systems</h2>{!! $table($systems, 'OS') !!}</div>
    </div>
    <div class="card"><h2>Browsers</h2>{!! $table($browsers, 'Browser') !!}</div>
  </div>

  <div class="grid2">
    <div class="card">
      <h2>Challenges</h2>
      @if ($challenges)
        <div class="scroll"><table>
          <thead><tr><th>Challenge</th><th class="n">Starts</th><th class="n">Via link</th><th class="n">Done</th><th class="n">Rate</th><th class="n">Median</th></tr></thead>
          <tbody>
          @foreach ($challenges as $row)
            <tr>
              <td>{{ $challengeNames[$row['challenge']] ?? $row['challenge'] }}</td>
              <td class="n">{{ $num($row['starts']) }}</td>
              <td class="n">{{ $num($row['from_links']) }}</td>
              <td class="n">{{ $num($row['completions']) }}</td>
              <td class="n">{{ $pct($row['completion_rate']) }}</td>
              <td class="n">{{ $row['median_time'] === null ? '–' : $row['median_time'].' s' }}</td>
            </tr>
          @endforeach
          </tbody>
        </table></div>
        <p class="dim" style="font-size:12px;margin:8px 0 0">Rate = sessions that finished a challenge they started. Median = time to sync.</p>
      @else
        <div class="empty">No challenges played yet.</div>
      @endif
    </div>
    <div class="card">
      <h2>Most-used controls</h2>
      @if ($controls)
        @php $maxUses = max(1, max(array_column($controls, 'uses'))); @endphp
        <table>
          <thead><tr><th>Control</th><th class="n">Uses</th><th class="n">Visitors</th></tr></thead>
          <tbody>
          @foreach ($controls as $row)
            <tr><td class="meter" style="--w:{{ round(100 * $row['uses'] / $maxUses) }}%"><span>{{ $controlNames[$row['control']] ?? $row['control'] }}</span></td><td class="n">{{ $num($row['uses']) }}</td><td class="n">{{ $num($row['visitors']) }}</td></tr>
          @endforeach
          </tbody>
        </table>
      @else
        <div class="empty">No controls used yet.</div>
      @endif
    </div>
  </div>

  <div class="card">
    <h2>Recent 50 events</h2>
    @if ($recent)
      <div class="scroll"><table class="recent">
        <thead><tr><th>Time (IST)</th><th>Event</th><th>Detail</th><th>Country</th><th>From</th><th>Device</th></tr></thead>
        <tbody>
        @foreach ($recent as $event)
          @php
              $data = $event->data ? (json_decode($event->data, true) ?: []) : [];
              $detail = match ($event->name) {
                  'control' => ($controlNames[$event->ctrl] ?? $event->ctrl).(isset($data['v']) ? ' → '.$data['v'] : ''),
                  'synced' => ($event->num !== null ? $event->num.' s' : '').(isset($data['n']) ? ', '.$data['n'].' metronomes' : '').(! empty($data['flips']) ? ', '.$data['flips'].' flips' : '').($event->chal ? ' · '.($challengeNames[$event->chal] ?? $event->chal) : ''),
                  'challenge_start' => ($challengeNames[$event->chal] ?? $event->chal).' (via '.$event->ctrl.')',
                  'challenge_complete' => ($challengeNames[$event->chal] ?? $event->chal).($event->num !== null ? ', '.$event->num.' s' : ''),
                  'share' => $event->ctrl.' button'.(! empty($data['synced']) ? ', after sync' : ''),
                  'mute' => $event->num ? 'muted' : 'unmuted',
                  'pageview' => $event->chal ? 'challenge link: '.($challengeNames[$event->chal] ?? $event->chal) : '',
                  'play' => $event->chal ? ($challengeNames[$event->chal] ?? $event->chal) : '',
                  default => '',
              };
          @endphp
          <tr>
            <td>{{ $ist($event->ts) }}</td>
            <td>{{ str_replace('_', ' ', $event->name) }} @if ($event->test)<span class="tag">test</span>@endif</td>
            <td>{{ $detail }}</td>
            <td>{{ $event->country ?: '–' }}</td>
            <td>{{ $event->ref ?: '–' }}</td>
            <td>{{ $event->device }} · {{ $event->os }} · {{ $event->browser }}</td>
          </tr>
        @endforeach
        </tbody>
      </table></div>
    @else
      <div class="empty">No events yet.</div>
    @endif
  </div>

  <div class="foot">
    <a class="btn" href="?range={{ $preset }}{{ $preset === 'custom' ? '&from='.$fromDate.'&to='.$toDate : '' }}{{ $includeTest ? '' : '&test=1' }}">{{ $includeTest ? 'Hide test events' : 'Show test events' }}</a>
    <form method="post" action="/metronomes-admin/delete-test" onsubmit="return confirm('Delete all {{ $testCount }} test events?')">
      <button class="btn" type="submit" @disabled($testCount === 0)>Delete test events ({{ $num($testCount) }})</button>
    </form>
    <button class="btn" type="button" id="testDevice">This device: counted</button>
    <form method="post" action="/metronomes-admin/logout"><button class="btn" type="submit">Log out</button></form>
    <span class="dim">Updated {{ $generatedAt }} IST. No IPs are stored.</span>
  </div>
@endif
</div>
<script>
(function () {
  document.querySelectorAll('[data-chart]').forEach(function (chart) {
    var out = chart.querySelector('[data-readout]'), sel = null;
    chart.querySelectorAll('.hit').forEach(function (hit) {
      var show = function () {
        out.textContent = hit.getAttribute('data-tip');
        if (sel) { sel.classList.remove('sel'); }
        sel = hit.nextElementSibling; if (sel) { sel.classList.add('sel'); }
      };
      hit.addEventListener('pointerenter', show);
      hit.addEventListener('click', show);
    });
  });
  var btn = document.getElementById('testDevice');
  if (!btn) { return; }
  var get = function () { try { return localStorage.getItem('c2o-stats-test') === '1'; } catch (e) { return false; } };
  var paint = function () { btn.textContent = get() ? 'This device: marked as test' : 'Mark this device as test'; btn.classList.toggle('on', get()); };
  btn.addEventListener('click', function () {
    try { if (get()) { localStorage.removeItem('c2o-stats-test'); } else { localStorage.setItem('c2o-stats-test', '1'); } } catch (e) {}
    paint();
  });
  paint();
})();
</script>
@endsection
