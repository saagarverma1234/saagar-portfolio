<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Game stats (all web games)
    |--------------------------------------------------------------------------
    |
    | Anonymous play stats for the static games in public/. Events go to their
    | own SQLite file (no migrations). The admin at /admin logs in with an email
    | and a password. This repo is public, so only hashes live here: a bcrypt
    | hash of the password and a SHA-256 hash of the lowercased, trimmed email.
    | The plaintext lives outside the repo.
    |
    */

    'stats_path' => env('METRONOME_STATS_PATH', storage_path('app/metronome-stats.sqlite')),

    /*
    | Cache store for the Quiet Worlds votes endpoint (its 2-minute cache and its
    | per-IP rate limit). "file" needs no database table.
    */
    'votes_cache_store' => env('QW_VOTES_CACHE_STORE', 'file'),

    'admin_hash' => env('GAME_ADMIN_PASSWORD_HASH', '$2y$12$gNvsLDAF7rLtiinhPBDR6edgiV/LzhjJ2KEcwB82PAbw/OmnZf56W'),

    'admin_email_hash' => env('GAME_ADMIN_EMAIL_HASH', '15af446990689537c83dfebd52ae0bc329549889f04354738d5880a9e404b69f'),

];
