<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('HomePage', ['title' => 'Home']);
});

Route::get('/projects', function () {
    return Inertia::render('ProjectsPage', ['title' => 'Projects']);
});

Route::get('/projects/{slug}', function ($slug) {
    return Inertia::render('ProjectDetail', ['title' => 'Project', 'slug' => $slug]);
});

Route::get('/certifications', function () {
    return Inertia::render('CertificationsPage', ['title' => 'Certifications']);
});
