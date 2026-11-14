@extends('metronomes.layout')

@section('title', 'Game Stats Login')

@section('body')
<div class="wrap" style="max-width:420px;padding-top:12vh">
  <div class="card" style="padding:22px">
    <h1>Game stats</h1>
    <p class="muted" style="margin:6px 0 18px">Private. Log in with the admin email and password.</p>
    @if ($error)
      <p role="alert" style="color:var(--bad);margin:0 0 12px">{{ $error }}</p>
    @endif
    <form method="post" action="/admin/login" style="display:grid;gap:12px">
      <label for="email" class="muted" style="font-size:13px">Email</label>
      <input type="email" id="email" name="email" autocomplete="username" inputmode="email" autocapitalize="off" spellcheck="false" required autofocus maxlength="200">
      <label for="password" class="muted" style="font-size:13px">Password</label>
      <input type="password" id="password" name="password" autocomplete="current-password" required maxlength="200">
      <button type="submit" class="btn primary" style="justify-content:center;min-height:44px">Log in</button>
    </form>
  </div>
</div>
@endsection
