# Saagar Verma — Portfolio

Personal portfolio of Saagar Verma, Head of Engineering and Full-Stack & DevOps Engineer. Built with Laravel, Vue, and Inertia.js to present selected projects, professional experience, certifications, and a contact form.

**Visit the portfolio: [saagarverma.com](https://saagarverma.com)**

## Stack

- **Backend:** Laravel 12 and PHP
- **Frontend:** Vue 3, Inertia.js 2, and Pinia
- **Build tooling:** Vite 7 with client and server-side rendering builds
- **Icons:** Lucide
- **Local database:** SQLite by default
- **Development tools:** Pest 4 and Laravel Pint

## Features

- Home page with dedicated sections for introduction, experience, testimonials, and contact
- Project listing and individual project pages
- Certifications page
- Theme store and reusable Vue components
- Contact form with server-side validation and database storage
- Public résumé, project images, robots.txt, and sitemap.xml

The contact endpoint stores submissions in the `contact_messages` table. It does not currently send email notifications.

## Run locally

### Requirements

- PHP 8.3 or newer, with the extensions required by Composer and SQLite support
- Composer 2
- Node.js 22.12 or newer and npm

Although the application declares PHP `^8.2`, its locked Pest 4 / PHPUnit 12 development dependencies require PHP 8.3.

### Installation

Run these commands in a fresh local checkout:

```bash
git clone https://github.com/saagarverma1234/saagar-portfolio.git
cd saagar-portfolio
composer install
cp .env.example .env
php artisan key:generate
php -r "file_exists('database/database.sqlite') || touch('database/database.sqlite');"
php artisan migrate
npm ci
npm run build
composer run dev
```

Open the address printed by the Laravel development server, normally `http://127.0.0.1:8000`.

The development command starts the Laravel server, queue listener, log viewer, and Vite together. The default environment uses SQLite with database-backed sessions, cache, and queues.

## Project structure

| Path | Purpose |
| --- | --- |
| `routes/web.php` | Page routes and contact endpoint |
| `resources/js/Pages/` | Home, projects, project detail, and certifications pages |
| `resources/js/Components/` | Reusable portfolio sections |
| `resources/js/Layouts/` | Shared page layout |
| `resources/js/Stores/` | Theme state |
| `resources/css/main.css` | Site styles |
| `config/projects.php` | Project metadata used by the detail route |
| `app/Http/Controllers/ContactMessageController.php` | Contact validation and persistence |
| `database/migrations/` | Database schema |
| `public/images/` | Profile, project, and brand assets |
| `public/assets/resume.pdf` | Downloadable résumé |

## Working on the portfolio

Update the relevant Vue page or component for page content. Project details also use metadata in `config/projects.php`; keep that metadata consistent with the frontend. Replace images under `public/images/` and the résumé at `public/assets/resume.pdf` as needed.

### Build assets

```bash
npm run build
```

This generates both client assets and an SSR bundle. Running SSR in production additionally requires the Inertia SSR process; generating the bundle alone does not start it.

### Run the existing tests

```bash
composer test
```

The current test suite contains starter example tests, rather than comprehensive portfolio or contact-form coverage.

### Format PHP

```bash
vendor/bin/pint
```

## Hosting

This is a PHP application and requires Laravel-compatible hosting with the web root pointed at `public/`. GitHub Pages cannot run its backend or contact endpoint.

For production, configure the environment and database, disable debug mode, build assets, and run the required migrations. Keep `.env`, credentials, and submitted contact messages out of version control.

## Feedback

Suggestions and reproducible bug reports are welcome through this repository's issues. For professional enquiries, visit [saagarverma.com](https://saagarverma.com) or email [saagarverma1234@gmail.com](mailto:saagarverma1234@gmail.com).
