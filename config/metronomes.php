<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Metronome Sync Game stats
    |--------------------------------------------------------------------------
    |
    | Anonymous play stats for the static game in public/metronomes. Events go
    | to their own SQLite file (no migrations). Only the bcrypt hash of the
    | admin password is stored here; the plaintext lives outside the repo.
    |
    */

    'stats_path' => env('METRONOME_STATS_PATH', storage_path('app/metronome-stats.sqlite')),

    'admin_hash' => env('METRONOME_ADMIN_HASH', '$2y$12$CUeGm3.pQ1Zw9HKrXQksluT14a8JWUxitsObhD1HT.zvhk6JIehg2'),

];
