<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" data-theme="dark">
<head>
    <script>
        if (localStorage.getItem('theme') === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    </script>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    
    <!-- Fallback Meta Settings -->
    @php
        $metaTitle = $page['props']['meta']['title'] ?? $page['props']['title'] ?? 'Saagar Verma - Senior Full Stack Developer | Hire Now';
        $metaDesc = $page['props']['meta']['description'] ?? 'Hire Saagar Verma, a Senior Full Stack Developer and Video Editor. Specializing in creating fast, scalable websites, custom web apps, eCommerce optimization, and cinematic video storytelling for your brand.';
        $metaImage = $page['props']['meta']['image'] ?? '/images/saagar-verma.png';
    @endphp

    <!-- Primary Meta Tags -->
    <title inertia>{{ $metaTitle }}</title>
    <meta name="title" content="{{ $metaTitle }}">
    <meta name="description" content="{{ $metaDesc }}">
    <meta name="keywords" content="freelancer, create a website, web developer, full stack developer, video editor, Laravel, Vue, TALL stack, VILT stack, eCommerce developer, custom website, Saagar Verma">
    <meta name="author" content="Saagar Verma">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ request()->url() }}">
    <meta property="og:title" content="{{ $metaTitle }}">
    <meta property="og:description" content="{{ $metaDesc }}">
    <meta property="og:image" content="{{ asset($metaImage) }}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="{{ request()->url() }}">
    <meta property="twitter:title" content="{{ $metaTitle }}">
    <meta property="twitter:description" content="{{ $metaDesc }}">
    <meta property="twitter:image" content="{{ asset($metaImage) }}">
    
    <!-- Fonts & Icons -->
    <link rel="icon" type="image/svg+xml" href="/images/logo.svg" />
    <link rel="shortcut icon" href="/images/logo.svg" />
    <link rel="apple-touch-icon" href="/images/logo.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">

    @vite(['resources/css/main.css', 'resources/js/app.js'])
    @inertiaHead

    <!-- Structured Data: Person -->
    <script type="application/ld+json">
    {
      "@@context": "https://schema.org",
      "@@type": "Person",
      "name": "Saagar Verma",
      "url": "{{ config('app.url') }}/",
      "image": "{{ config('app.url') }}/images/saagar-verma.png",
      "sameAs": [
        "https://www.upwork.com/freelancers/~014475753a03f5690d"
      ],
      "jobTitle": "Senior Full Stack Developer & Video Editor",
      "worksFor": {
        "@@type": "Organization",
        "name": "Freelance"
      },
      "description": "Hire Saagar Verma, a Senior Full Stack Developer and Video Editor based in India, specializing in fast, scalable websites, custom web apps, and cinematic video storytelling."
    }
    </script>

    <!-- Structured Data: Website + Sitelinks Search Box -->
    <script type="application/ld+json">
    {
      "@@context": "https://schema.org",
      "@@type": "WebSite",
      "name": "Saagar Verma",
      "url": "{{ config('app.url') }}/"
    }
    </script>

    <!-- Structured Data: Site Navigation (helps Google show sitelinks) -->
    <script type="application/ld+json">
    {
      "@@context": "https://schema.org",
      "@@type": "ItemList",
      "name": "Site Navigation",
      "itemListElement": [
        {
          "@@type": "ListItem",
          "position": 1,
          "name": "Projects",
          "description": "View all web development and video editing projects by Saagar Verma.",
          "url": "{{ config('app.url') }}/projects"
        },
        {
          "@@type": "ListItem",
          "position": 2,
          "name": "Certifications",
          "description": "Professional certifications and credentials earned by Saagar Verma.",
          "url": "{{ config('app.url') }}/certifications"
        },
        {
          "@@type": "ListItem",
          "position": 3,
          "name": "About",
          "description": "Learn more about Saagar Verma, Full Stack Developer and Video Editor.",
          "url": "{{ config('app.url') }}/#about"
        },
        {
          "@@type": "ListItem",
          "position": 4,
          "name": "Contact",
          "description": "Get in touch with Saagar Verma for freelance work and collaborations.",
          "url": "{{ config('app.url') }}/#contact"
        }
      ]
    }
    </script>
</head>
<body class="antialiased">
    @inertia
</body>
</html>
