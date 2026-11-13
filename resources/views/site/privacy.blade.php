@extends('site.layout')
@section('title', 'Privacy Policy | Saagar Verma')
@section('description', 'How saagarverma.com and its free browser games handle data: anonymous play stats with hashed IPs, browser storage for game progress, server logs, and Google AdSense cookies.')
@section('path', '/privacy')
@section('content')
<h1>Privacy Policy</h1>
<p class="meta">Last updated: 13 November 2026</p>

<p class="lede">This policy explains what happens to your data when you visit saagarverma.com, including the free browser games at <a href="/games">/games</a>, <a href="/metronomes/">/metronomes/</a> and <a href="/bump-theory/">/bump-theory/</a>. The short version: there are no accounts or sign-ups, the games keep your progress in your own browser, the metronome game counts plays anonymously, and the site shows ads from Google, which uses cookies.</p>

<h2>Who runs this site</h2>
<p>saagarverma.com is run by Saagar Verma, an individual web developer and video creator based in India. Saagar is responsible for the site and the data described here. You can reach him at <a href="mailto:saagarverma1234@gmail.com">saagarverma1234@gmail.com</a> (see also the <a href="/contact">contact page</a>).</p>

<h2>What we collect, and why</h2>

<h3>1. Anonymous play stats (Metronome Sync Game only)</h3>
<p>The <a href="/metronomes/">Metronome Sync Game</a> sends small anonymous events to our own server so we can see whether people play it and which parts they use. These stats do not use cookies and are never sold or shared. Each event can contain:</p>
<ul>
  <li><strong>What happened and when:</strong> page view, play, which button was used (for example Nudge, Shake or Flip), challenge started or finished, time taken to sync, shares, sound on or off, and a "still here" signal every 15 seconds while the tab is visible.</li>
  <li><strong>A hashed visitor code instead of your IP address.</strong> Your IP address and browser user-agent are combined with a secret salt that changes every day and run through a one-way hash (SHA-256, cut to 16 characters). Only that code is stored. Your IP address itself is never written to the stats database, and because the salt changes daily, codes from different days cannot be linked to each other.</li>
  <li><strong>Two random IDs:</strong> a random 16-character ID kept in your browser's local storage (key <code>c2o-vid</code>) so we can tell a returning visitor from a new one, and a new random ID for each page load. Neither is linked to your name, email or any account.</li>
  <li><strong>Rough context:</strong> your country (a two-letter code supplied by our network provider, Cloudflare), the name of the site that linked you (for example "YouTube" or "Google", not the full address), any campaign tags in the link (utm_source, utm_medium, utm_campaign), device type (phone, tablet, desktop), operating system and browser family, and screen width. The full user-agent string is not stored.</li>
</ul>
<p>Known bots and crawlers are filtered out. Events are kept in a private database on our server that only Saagar can view; there is currently no automatic deletion, but the data contains no IP addresses, names or contact details. The <a href="/bump-theory/">Bump Theory game</a> does not send any play stats (only suggestions you choose to send, see below).</p>

<h3>2. Game progress in your browser</h3>
<p>Both games save small settings in your browser's local storage so they work the way you left them: your level stars and best scores (Bump Theory, key <code>bt1</code>), your best challenge times and sound setting (Metronome game, keys starting with <code>c2o-</code>). This data stays on your device and is not sent to us, except the random ID described above. You can delete it at any time by clearing this site's data in your browser settings; the games will simply start fresh.</p>

<h3>3. The contact form on the home page</h3>
<p>If you use the contact form on the <a href="/">home page</a>, the name, email address and message you type are stored in the site's database so Saagar can read and reply to them. They are used only to answer you and are not added to any mailing list.</p>

<h3>4. The Suggestions box on the game pages</h3>
<p>Both game pages have an optional Suggestions box. If you send a suggestion, we store the game it came from, your message (up to 500 characters), the name or email you chose to type (optional), the time, and a keyed one-way hash of your IP address (HMAC-SHA256, cut to 16 characters) that we use only to limit each visitor to 5 suggestions an hour and to block spam. Your IP address itself is not stored. Suggestions are kept in the same private database as the play stats, are read only by Saagar on a password-protected page, are not emailed or sent to any outside service, and are used only to improve the games and, if you left an email, to reply to you. Please don't put sensitive personal information in a suggestion. Ask us any time to delete one you sent.</p>

<h3>5. Server logs and essential cookies</h3>
<p>Like almost every website, our web server and our network provider record basic technical logs for each request: IP address, date and time, the page requested, the referring page and the browser user-agent. These logs are used to keep the site running, to fix errors and to block abuse, and are kept by the hosting provider for a limited period. The portfolio pages (home, projects, certifications) also set two strictly necessary cookies, a session cookie and an <code>XSRF-TOKEN</code> security cookie, which the framework (Laravel) uses to protect the contact form; the session record on the server includes your IP address and browser user-agent and expires after a couple of hours of inactivity. A <code>theme</code> value in local storage remembers if you picked the light theme.</p>

<h2>Advertising: Google AdSense and cookies</h2>
<p>This site uses Google AdSense to show ads, which helps keep the games free. Google is a third-party vendor, and it and its partners use cookies and similar technologies to serve ads:</p>
<ul>
  <li>Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this website or other websites.</li>
  <li>Google's use of advertising cookies enables it and its partners to serve ads to you based on your visits to this site and/or other sites on the internet.</li>
  <li>You can opt out of personalised advertising by visiting Google's <a href="https://adssettings.google.com" rel="noopener" target="_blank">Ad Settings</a>. You can also opt out of some third-party vendors' use of cookies for personalised advertising at <a href="https://www.aboutads.info/choices/" rel="noopener" target="_blank">www.aboutads.info/choices</a>.</li>
  <li>Learn how Google uses information from sites that use its services, and how it uses cookies in advertising, at <a href="https://policies.google.com/technologies/ads" rel="noopener" target="_blank">policies.google.com/technologies/ads</a> and <a href="https://policies.google.com/technologies/partner-sites" rel="noopener" target="_blank">policies.google.com/technologies/partner-sites</a>.</li>
</ul>
<p>Where the law requires it (for example for visitors in the European Economic Area, the UK and Switzerland), Google may show a consent message before personalised ads are used. If you decline, Google may still show non-personalised ads, which use cookies for things like frequency capping and fraud prevention. We do not control which cookies Google sets and we do not receive any personal information from Google about you.</p>

<h2>Other third-party services</h2>
<table>
  <tr><th>Service</th><th>What it does here</th><th>What it can receive</th></tr>
  <tr><td>Cloudflare</td><td>Network and security provider in front of the site (caching, protection against attacks)</td><td>IP address and request details for every visit</td></tr>
  <tr><td>Hosting provider</td><td>Runs the server the site lives on</td><td>Server logs as described above</td></tr>
  <tr><td>Google AdSense</td><td>Shows ads</td><td>Cookies and device data, under Google's own privacy policy</td></tr>
  <tr><td>Google Fonts</td><td>Serves the fonts on the portfolio pages</td><td>IP address and browser details when the font files load</td></tr>
  <tr><td>YouTube</td><td>Only when you click a link to one of our channels</td><td>Whatever YouTube collects once you are on youtube.com</td></tr>
</table>
<p>We do not sell personal data, we do not use it to build profiles of you, and we do not share it with anyone except the service providers above, or if required by law.</p>

<h2>Children</h2>
<p>The games are general-audience games suitable for all ages; they are not designed specifically for children. We do not knowingly collect personal information from children under 13. The games need no account and ask for no personal details. If you are a parent and believe your child has sent us personal information (for example through the contact form), email us and we will delete it.</p>

<h2>Your choices and rights</h2>
<ul>
  <li><strong>Clear browser data</strong> for saagarverma.com to remove game progress and the random visitor ID.</li>
  <li><strong>Block or delete cookies</strong> in your browser, or use Google's Ad Settings, to limit advertising cookies.</li>
  <li><strong>Ask us</strong> to access, correct or delete personal information we hold about you, such as a contact-form message or a suggestion. Because play stats contain no IP address or name, we usually cannot match them to a specific person, but we will help where we can.</li>
</ul>
<p>Depending on where you live (for example under India's Digital Personal Data Protection Act, the EU/UK GDPR or US state laws) you may have additional rights. Email us and we will respond within 30 days.</p>

<h2>Security</h2>
<p>The site is served only over HTTPS. The stats database, suggestions and contact messages are stored on the server, outside the public web folder, and the dashboard where stats and suggestions are read is password-protected. No method of transmission or storage is perfectly secure, but we collect as little as possible so there is little to protect.</p>

<h2>Changes to this policy</h2>
<p>If we change how the site handles data, we will update this page and the "Last updated" date at the top.</p>

<h2>Contact</h2>
<p>Questions about this policy or your data: <a href="mailto:saagarverma1234@gmail.com">saagarverma1234@gmail.com</a>.</p>
@endsection
