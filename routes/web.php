<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('HomePage', ['title' => 'Saagar Verma - Senior Full Stack Developer | Hire Now']);
});

Route::get('/projects', function () {
    return Inertia::render('ProjectsPage', ['title' => 'Projects | Saagar Verma']);
});

Route::get('/projects/{slug}', function ($slug) {
    $meta = config("projects.{$slug}");
    return Inertia::render('ProjectDetail', [
        'title' => 'Project | Saagar Verma', 
        'slug' => $slug,
        'meta' => $meta
    ]);
});

Route::get('/certifications', function () {
    return Inertia::render('CertificationsPage', ['title' => 'Certifications | Saagar Verma']);
});

Route::post('/contact', [\App\Http\Controllers\ContactMessageController::class, 'store']);
