@extends('metronomes.layout')

@section('title', 'Metronome Stats Login')

@section('body')
<div class="wrap" style="max-width:420px;padding-top:12vh">
  <div class="card" style="padding:22px">
    <h1>Metronome stats</h1>
    <p class="muted" style="margin:6px 0 18px">Private. Enter the admin password.</p>
    @if ($error)
      <p role="alert" style="color:var(--bad);margin:0 0 12px">{{ $error }}</p>
    @endif
    <form method="post" action="/metronomes-admin/login" style="display:grid;gap:12px">
      <label for="password" class="muted" style="font-size:13px">Password</label>
      <input type="password" id="password" name="password" autocomplete="current-password" required autofocus maxlength="200">
      <button type="submit" class="btn primary" style="justify-content:center">Log in</button>
    </form>
  </div>
</div>
@endsection
