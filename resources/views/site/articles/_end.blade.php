@php
    $others = array_values(array_filter(config('articles', []), fn ($a) => $a['slug'] !== $article['slug']));
@endphp
<nav class="more-articles" aria-label="More articles">
  <h2>More articles</h2>
  <ul>
    @foreach ($others as $other)
      <li><a href="/articles/{{ $other['slug'] }}">{{ $other['title'] }}</a></li>
    @endforeach
  </ul>
</nav>
<script type="application/ld+json">
{!! json_encode([
    '@context' => 'https://schema.org',
    '@type' => 'Article',
    'headline' => $article['title'],
    'description' => $article['summary'],
    'datePublished' => $article['date'],
    'dateModified' => $article['date'],
    'author' => ['@type' => 'Person', 'name' => 'Saagar Verma', 'url' => 'https://saagarverma.com/about'],
    'publisher' => ['@type' => 'Person', 'name' => 'Saagar Verma'],
    'image' => $article['og_image'],
    'mainEntityOfPage' => 'https://saagarverma.com/articles/'.$article['slug'],
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}
</script>
