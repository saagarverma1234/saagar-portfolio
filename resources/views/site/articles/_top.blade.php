@include('site.articles._style')
<p class="crumbs"><a href="/articles">&larr; All articles</a></p>
<h1>{{ $article['title'] }}</h1>
<p class="meta">By Saagar Verma &middot; <time datetime="{{ $article['date'] }}">{{ \Carbon\Carbon::parse($article['date'])->format('j F Y') }}</time> &middot; {{ $article['minutes'] }} min read</p>
