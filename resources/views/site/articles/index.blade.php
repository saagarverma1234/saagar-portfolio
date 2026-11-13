@extends('site.layout')
@section('title', 'Articles: The Science Behind the Games | Saagar Verma')
@section('og_title', 'Articles: The Science Behind the Games')
@section('description', 'Short, plain-English articles on the physics and maths behind the games and videos on this site: metronome sync, exponential growth, code-made simulations and planet habitability.')
@section('path', '/articles')
@section('og_image', 'https://saagarverma.com/metronomes/og.png')
@section('content')
@include('site.articles._style')
<h1>Articles</h1>
<p class="lede">The science behind the games and videos on this site, explained in plain English. Each article goes with a game you can play in your browser, so you can test the ideas yourself.</p>
<ul class="art-list">
  @foreach (config('articles', []) as $a)
    <li>
      <a class="art-card" href="/articles/{{ $a['slug'] }}">
        <span class="k">{{ $a['minutes'] }} min read</span>
        <h2>{{ $a['title'] }}</h2>
        <p>{{ $a['summary'] }}</p>
        <span class="rt">Read article &rarr;</span>
      </a>
    </li>
  @endforeach
</ul>
@endsection
