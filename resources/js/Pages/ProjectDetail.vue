<template>

    <Head :title="title" />
    <article class="project-detail container section" v-if="project">
        <div class="back-link fade-up">
            <Link href="/projects" class="btn-outline">
            <ArrowLeft :size="16" class="mr-2" />
            Back to Projects
            </Link>
        </div>

        <header class="project-header fade-up" style="animation-delay: 100ms">
            <h1 class="project-title font-mono">{{ project.title }}</h1>
            <div class="tags">
                <span v-for="tag in project.tags" :key="tag" class="tag font-mono">{{ tag }}</span>
            </div>
        </header>

        <div class="hero-image fade-up" style="animation-delay: 200ms">
            <img v-if="project.image" :src="project.image" :alt="project.title" class="project-img" />
            <div v-else class="placeholder-hero" :style="{ backgroundColor: project.color }"></div>
        </div>

        <div class="project-content fade-up" style="animation-delay: 300ms">
            <div class="content-section">
                <h2>The Problem</h2>
                <p>{{ project.problem }}</p>
            </div>

            <div class="content-section">
                <h2>The Solution</h2>
                <p>{{ project.solution }}</p>
            </div>

            <div class="content-section">
                <h2>Tech Stack</h2>
                <ul class="tech-list">
                    <li v-for="tech in project.techStack" :key="tech">{{ tech }}</li>
                </ul>
            </div>

            <div class="content-section">
                <h2>Results</h2>
                <div class="metrics-grid">
                    <div v-for="(metric, label) in project.results" :key="label" class="metric-card">
                        <h3 class="font-mono">{{ metric }}</h3>
                        <p>{{ label }}</p>
                    </div>
                </div>
            </div>

            <div class="action-section">
                <a :href="project.liveUrl" target="_blank" v-if="project.liveUrl" class="btn-primary">
                    View Live Demo
                    <ExternalLink :size="16" style="margin-left: 0.5rem;" />
                </a>
            </div>
        </div>
    </article>

    <div v-else class="container section">
        <h1>Project Not Found</h1>
        <Link href="/projects">Return to Projects</Link>
    </div>
</template>

<script>
import { Head, Link } from '@inertiajs/vue3';
import { ArrowLeft, ExternalLink } from 'lucide-vue-next';
import { onMounted } from 'vue';

export default {
    components: {
        Head,
        Link,
        ArrowLeft,
        ExternalLink
    },
    props: {
        slug: String,
        title: {
            type: String,
            default: 'Project'
        }
    },
    data() {
        return {
            projectsDb: {
                'peter-sheppard': {
                    title: 'petersheppard.com.au',
                    tags: ['Shopify', 'E-commerce', 'Web Development'],
                    problem: 'Required a premium, seamless e-commerce experience for high-end footwear.',
                    solution: 'Developed a custom Shopify theme focusing on performance, mobile responsiveness, and elegant design.',
                    techStack: ['Shopify', 'Liquid', 'JavaScript', 'CSS'],
                    results: { 'Platform': 'Shopify', 'Status': 'Live' },
                    liveUrl: 'https://petersheppard.com.au',
                    image: '/images/projects/peter-sheppard.png',
                    color: '#95bf47'
                },
                'nail-company': {
                    title: 'nailcompany.com',
                    tags: ['Shopify', 'E-commerce'],
                    problem: 'Needed a robust online store to handle professional nail and beauty supplies.',
                    solution: 'Built a scalable Shopify e-commerce platform optimized for conversions and wholesale customers.',
                    techStack: ['Shopify', 'Liquid', 'Tailwind'],
                    results: { 'Platform': 'Shopify', 'Status': 'Live' },
                    liveUrl: 'https://nailcompany.com',
                    image: '/images/projects/nail-company.png',
                    color: '#e0b8c6'
                },
                'ploome-pilates': {
                    title: 'ploomepilates.com',
                    tags: ['Shopify', 'E-commerce'],
                    problem: 'Sought an online presence to sell pilates equipment and activewear efficiently.',
                    solution: 'Implemented a clean, conversion-focused Shopify store tailored to the fitness niche.',
                    techStack: ['Shopify', 'Liquid', 'JavaScript'],
                    results: { 'Platform': 'Shopify', 'Status': 'Live' },
                    liveUrl: 'https://ploomepilates.com',
                    image: '/images/projects/ploome-pilates.png',
                    color: '#a1c2a3'
                },
                'the-spinal-studio': {
                    title: 'thespinalstudio.com.au',
                    tags: ['WordPress', 'Healthcare'],
                    problem: 'Needed a professional, informative corporate website for a physical clinic.',
                    solution: 'Developed a custom WordPress website featuring service pages, booking integration, and team profiles.',
                    techStack: ['WordPress', 'PHP', 'CSS'],
                    results: { 'Platform': 'WordPress', 'Status': 'Live' },
                    liveUrl: 'https://thespinalstudio.com.au',
                    image: '/images/projects/the-spinal-studio.png',
                    color: '#005f73'
                },
                'gr8media': {
                    title: 'gr8media.com.au',
                    tags: ['WordPress', 'Agency'],
                    problem: 'Required a portfolio website to showcase digital marketing and creative services.',
                    solution: 'Designed and built a dynamic WordPress site highlighting previous work, services, and client testimonials.',
                    techStack: ['WordPress', 'PHP', 'JavaScript'],
                    results: { 'Platform': 'WordPress', 'Status': 'Live' },
                    liveUrl: 'https://gr8media.com.au',
                    image: '/images/projects/gr8-media.png',
                    color: '#ca6702'
                },
                'crunch-kids': {
                    title: 'crunchkids.com',
                    tags: ['WordPress', 'Education'],
                    problem: 'Needed an educational platform to provide resources and activities for children.',
                    solution: 'Built a user-friendly WordPress site with categorized content and interactive elements.',
                    techStack: ['WordPress', 'PHP', 'CSS'],
                    results: { 'Platform': 'WordPress', 'Status': 'Live' },
                    liveUrl: 'https://crunchkids.com',
                    image: '/images/projects/crunch-kids.png',
                    color: '#ee9b00'
                },
                'greene-financial': {
                    title: 'greenefinancial.com.au',
                    tags: ['WordPress', 'Finance'],
                    problem: 'Required a trustworthy, professional online presence for a financial advisory firm.',
                    solution: 'Delivered a secure, sleek WordPress website detailing financial services and consultant expertise.',
                    techStack: ['WordPress', 'PHP', 'JavaScript'],
                    results: { 'Platform': 'WordPress', 'Status': 'Live' },
                    liveUrl: 'https://greenefinancial.com.au',
                    image: '/images/projects/greene-financial.png',
                    color: '#0a9396'
                },
                'fixio': {
                    title: 'fixio.com.au',
                    tags: ['WordPress', 'Services'],
                    problem: 'Needed a fast, reliable website to promote tech and device repair services.',
                    solution: 'Created an optimized WordPress website outlining repair services, pricing, and contact information.',
                    techStack: ['WordPress', 'PHP', 'CSS'],
                    results: { 'Platform': 'WordPress', 'Status': 'Live' },
                    liveUrl: 'https://fixio.com.au',
                    image: '/images/projects/fixio.png',
                    color: '#bb3e03'
                },
                'eponaco': {
                    title: 'eponaco.com.au',
                    tags: ['WordPress', 'Business'],
                    problem: 'Sought a modern corporate website for business operations.',
                    solution: 'Developed a professional WordPress platform serving as the primary digital footprint.',
                    techStack: ['WordPress', 'PHP', 'JavaScript'],
                    results: { 'Platform': 'WordPress', 'Status': 'Live' },
                    liveUrl: 'https://eponaco.com.au',
                    image: '/images/projects/eponaco.png',
                    color: '#ae2012'
                },
                'ltufc': {
                    title: 'LTUFC',
                    tags: ['WordPress', 'Sports'],
                    problem: 'Required a central hub for the Latrobe University Football Club to share news, fixtures, and club information.',
                    solution: 'Built a custom WordPress platform showcasing team updates, events, and a vibrant community interface.',
                    techStack: ['WordPress', 'PHP', 'JavaScript'],
                    results: { 'Platform': 'WordPress', 'Status': 'Live' },
                    liveUrl: 'https://ltufc.com.au',
                    image: '/images/projects/ltufc.png',
                    color: '#e63946'
                },
                'unicorn-ai': {
                    title: 'unicornai.org',
                    tags: ['Custom Build', 'AI'],
                    problem: 'Required a bespoke platform for a custom AI organization.',
                    solution: 'Built a custom platform outlining the AI capabilities, architecture, and organizational goals.',
                    techStack: ['Vue/React', 'Node.js', 'AI Integration'],
                    results: { 'Platform': 'Custom', 'Status': 'Live' },
                    liveUrl: 'https://unicornai.org',
                    image: '/images/projects/unicorn-ai.png',
                    color: '#3c096c'
                },
                'storylife': {
                    title: 'storylife.ai',
                    tags: ['Custom Build', 'AI'],
                    problem: 'Needed an AI-driven platform for automated story creation and generation.',
                    solution: 'Developed a sophisticated custom web app connecting to LLMs to generate and display stories.',
                    techStack: ['Vue/React', 'Python', 'LLM APIs'],
                    results: { 'Platform': 'Custom', 'Status': 'Live' },
                    liveUrl: 'https://storylife.ai',
                    image: '/images/projects/storylife-ai.png',
                    color: '#5a189a'
                },
                'coinvo-trading': {
                    title: 'coinvotrading.com',
                    tags: ['Custom Build', 'Finance'],
                    problem: 'Required a custom platform providing cryptocurrency trading metrics and live signals.',
                    solution: 'Built a real-time data dashboard using custom backend services and an interactive frontend.',
                    techStack: ['Vue/React', 'WebSockets', 'Crypto APIs'],
                    results: { 'Platform': 'Custom', 'Status': 'Live' },
                    liveUrl: 'https://coinvotrading.com',
                    image: '/images/projects/coinvo-trading.png',
                    color: '#10002b'
                },
                'bug-tracker': {
                    title: 'bug-tracker.unicornai.org',
                    tags: ['Custom Build', 'SaaS'],
                    problem: 'Needed a tailored job and bug tracking system for internal workflows.',
                    solution: 'Developed a custom SaaS tool to manage tasks, bugs, and developer progress asynchronously.',
                    techStack: ['Laravel', 'Vue.js', 'MySQL'],
                    results: { 'Platform': 'Custom', 'Status': 'Live' },
                    liveUrl: 'https://bug-tracker.unicornai.org',
                    image: '/images/projects/job-tracker.png',
                    color: '#9d4edd'
                },
                'shopglu-connector': {
                    title: 'Shopify Takealot Connector',
                    tags: ['Shopify App', 'Integration'],
                    problem: 'Merchants needed a seamless way to sync their Shopify store inventory with the Takealot marketplace.',
                    solution: 'Built a custom public Shopify App that handles API syncing, webhooks, and inventory management.',
                    techStack: ['Node.js', 'Shopify API', 'React'],
                    results: { 'Platform': 'Custom', 'Status': 'Live' },
                    liveUrl: 'https://apps.shopify.com/shopglu-takealot-connector',
                    image: '/images/projects/shopglu.png',
                    color: '#ff9100'
                },
                'fansyme': {
                    title: 'fansyme.com',
                    tags: ['Custom Build', 'Platform'],
                    problem: 'Required a custom bespoke web platform with unique user interactions.',
                    solution: 'Delivered a full-stack custom build, handling user authentication, profiles, and interactive features.',
                    techStack: ['Vue/React', 'Node.js', 'Database'],
                    results: { 'Platform': 'Custom', 'Status': 'Live' },
                    liveUrl: 'https://fansyme.com',
                    image: '/images/projects/fansyme.png',
                    color: '#ff6d00'
                }
            }
        };
    },
    computed: {
        project() {
            return this.projectsDb[this.slug] || Object.values(this.projectsDb)[0]; // Fallback for demo
        }
    },
    mounted() {
        setTimeout(() => {
            document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
        }, 50);
    }
}
</script>

<style scoped>
.project-detail {
    max-width: 800px;
    margin: 0 auto;
}

.back-link {
    margin-bottom: 3rem;
}

.mr-2 {
    margin-right: 0.5rem;
}

.project-header {
    margin-bottom: 3rem;
}

.project-title {
    font-size: clamp(2rem, 8vw, 3.5rem);
    margin-bottom: 1rem;
    line-height: 1.1;
    letter-spacing: -1px;
}

.tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.tag {
    font-size: 0.875rem;
    padding: 0.25rem 0.75rem;
    background-color: var(--muted);
    border-radius: 999px;
    color: var(--text);
}

.hero-image {
    margin-bottom: 4rem;
    border-radius: 12px;
    overflow: hidden;
    aspect-ratio: 16/9;
    box-shadow: var(--shadow);
}

.placeholder-hero {
    width: 100%;
    height: 100%;
}

.project-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.content-section {
    margin-bottom: 4rem;
}

.content-section h2 {
    font-size: 2rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border);
}

.content-section p {
    font-size: 1.125rem;
    line-height: 1.8;
    color: var(--text);
    opacity: 0.9;
}

.tech-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
    list-style: none;
    /* Remove bullets */
}

.tech-list li {
    padding: 1rem;
    background-color: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    text-align: center;
    font-weight: 500;
}

.metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
}

.metric-card {
    padding: 2rem;
    background-color: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    text-align: center;
}

.metric-card h3 {
    font-size: 2.5rem;
    color: var(--accent);
    margin-bottom: 0.5rem;
}

.metric-card p {
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 0;
    border: none;
    padding: 0;
}

.action-section {
    margin-top: 5rem;
    padding-top: 3rem;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: center;
}
</style>
