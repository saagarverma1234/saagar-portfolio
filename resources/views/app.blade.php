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
    
    <!-- Primary Meta Tags -->
    <title inertia>{{ config('app.name', 'Saagar Verma | Full Stack Developer & Video Editor') }}</title>
    <meta name="title" content="Saagar Verma | Full Stack Developer & Video Editor">
    <meta name="description" content="Hire Saagar Verma, a Senior Full Stack Developer and Video Editor. Specializing in creating fast, scalable websites, custom web apps, eCommerce optimization, and cinematic video storytelling for your brand.">
    <meta name="keywords" content="freelancer, create a website, web developer, full stack developer, video editor, Laravel, Vue, TALL stack, VILT stack, eCommerce developer, custom website, Saagar Verma">
    <meta name="author" content="Saagar Verma">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ config('app.url') }}/">
    <meta property="og:title" content="Saagar Verma | Full Stack Developer & Video Editor">
    <meta property="og:description" content="Hire Saagar Verma, a Senior Full Stack Developer and Video Editor. Specializing in creating fast, scalable websites, custom web apps, eCommerce optimization, and cinematic video storytelling for your brand.">
    <meta property="og:image" content="{{ asset('images/saagar-verma.png') }}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="{{ config('app.url') }}/">
    <meta property="twitter:title" content="Saagar Verma | Full Stack Developer & Video Editor">
    <meta property="twitter:description" content="Hire Saagar Verma, a Senior Full Stack Developer and Video Editor. Specializing in creating fast, scalable websites, custom web apps, eCommerce optimization, and cinematic video storytelling for your brand.">
    <meta property="twitter:image" content="{{ asset('images/saagar-verma.png') }}">
    
    <!-- Fonts & Icons -->
    <link rel="icon" type="image/svg+xml" href="/images/logo.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">

    @vite(['resources/css/main.css', 'resources/js/app.js'])
    @inertiaHead
</head>
<body class="antialiased">
    @inertia
</body>
</html>
