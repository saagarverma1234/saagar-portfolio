<template>

    <Head :title="title" />
    <div class="projects-page section container">
        <header class="section-header">
            <h1 class="font-mono fade-up">Projects</h1>
            <p class="fade-up" style="animation-delay: 100ms">A selection of my recent work spanning web development
                and video editing.</p>
        </header>

        <div class="filters fade-up" style="animation-delay: 200ms">
            <button v-for="filter in filters" :key="filter" @click="activeFilter = filter" class="filter-btn"
                :class="{ 'active': activeFilter === filter }">
                {{ filter }}
            </button>
        </div>

        <div class="projects-grid">
            <TransitionGroup name="list" appear>
                <div v-for="project in filteredProjects" :key="project.slug" class="project-card">
                    <Link :href="`/projects/${project.slug}`" class="card-link">
                    <div class="card-image">
                        <img v-if="project.image" :src="project.image" :alt="project.title" class="project-img" />
                        <div v-else class="placeholder-img" :style="{ backgroundColor: project.color }"></div>
                    </div>
                    <div class="card-content">
                        <h3>{{ project.title }}</h3>
                        <p class="muted-text">{{ project.shortDescription }}</p>
                        <div class="tags">
                            <span v-for="tag in project.tags" :key="tag" class="tag font-mono">
                                {{ tag }}
                            </span>
                        </div>
                    </div>
                    </Link>
                </div>
            </TransitionGroup>
        </div>
    </div>
</template>

<script>
import { Head, Link } from '@inertiajs/vue3';
import { onMounted, TransitionGroup } from 'vue';
import { ExternalLink, ArrowRight } from 'lucide-vue-next';

export default {
    components: {
        Head,
        Link,
        ExternalLink,
        ArrowRight,
        TransitionGroup
    },
    props: {
        title: {
            type: String,
            default: 'Projects'
        }
    },
    data() {
        return {
            activeFilter: 'All',
            filters: ['All', 'Shopify', 'WordPress', 'Custom Builds'],
            projects: [
                // Top Priority
                {
                    slug: 'coinvo-trading',
                    title: 'coinvotrading.com',
                    category: 'Custom Builds',
                    tags: ['Custom Build', 'Finance'],
                    shortDescription: 'Cryptocurrency trading metrics and signals platform.',
                    image: '/images/projects/coinvo-trading.png',
                    color: '#10002b'
                },
                {
                    slug: 'the-spinal-studio',
                    title: 'thespinalstudio.com.au',
                    category: 'WordPress',
                    tags: ['WordPress', 'Healthcare'],
                    shortDescription: 'Chiropractic and wellness center corporate website.',
                    image: '/images/projects/the-spinal-studio.png',
                    color: '#005f73'
                },
                {
                    slug: 'peter-sheppard',
                    title: 'petersheppard.com.au',
                    category: 'Shopify',
                    tags: ['Shopify', 'E-commerce'],
                    shortDescription: 'Premium footwear e-commerce experience.',
                    image: '/images/projects/peter-sheppard.png',
                    color: '#95bf47'
                },
                {
                    slug: 'fansyme',
                    title: 'fansyme.com',
                    category: 'Custom Builds',
                    tags: ['Custom Build', 'Platform'],
                    shortDescription: 'Custom bespoke web platform.',
                    image: '/images/projects/fansyme.png',
                    color: '#ff6d00'
                },
                {
                    slug: 'bug-tracker',
                    title: 'bug-tracker.unicornai.org',
                    category: 'Custom Builds',
                    tags: ['Custom Build', 'SaaS'],
                    shortDescription: 'Custom job and bug tracking system.',
                    image: '/images/projects/job-tracker.png',
                    color: '#9d4edd'
                },
                {
                    slug: 'unicorn-ai',
                    title: 'unicornai.org',
                    category: 'Custom Builds',
                    tags: ['Custom Build', 'AI'],
                    shortDescription: 'Custom AI platform and organizational website.',
                    image: '/images/projects/unicorn-ai.png',
                    color: '#3c096c'
                },
                {
                    slug: 'storylife',
                    title: 'storylife.ai',
                    category: 'Custom Builds',
                    tags: ['Custom Build', 'AI'],
                    shortDescription: 'AI-driven story creation and generation platform.',
                    image: '/images/projects/storylife-ai.png',
                    color: '#5a189a'
                },

                // Shopify
                {
                    slug: 'nail-company',
                    title: 'nailcompany.com',
                    category: 'Shopify',
                    tags: ['Shopify', 'E-commerce'],
                    shortDescription: 'Professional nail and beauty supply platform.',
                    image: '/images/projects/nail-company.png',
                    color: '#e0b8c6'
                },
                {
                    slug: 'ploome-pilates',
                    title: 'ploomepilates.com',
                    category: 'Shopify',
                    tags: ['Shopify', 'E-commerce'],
                    shortDescription: 'Pilates equipment and activewear online store.',
                    image: '/images/projects/ploome-pilates.png',
                    color: '#a1c2a3'
                },
                // WordPress
                {
                    slug: 'gr8media',
                    title: 'gr8media.com.au',
                    category: 'WordPress',
                    tags: ['WordPress', 'Agency'],
                    shortDescription: 'Digital marketing and creative agency portfolio.',
                    image: '/images/projects/gr8-media.png',
                    color: '#ca6702'
                },
                {
                    slug: 'crunch-kids',
                    title: 'crunchkids.com',
                    category: 'WordPress',
                    tags: ['WordPress', 'Education'],
                    shortDescription: 'Educational platform or resources for children.',
                    image: '/images/projects/crunch-kids.png',
                    color: '#ee9b00'
                },
                {
                    slug: 'greene-financial',
                    title: 'greenefinancial.com.au',
                    category: 'WordPress',
                    tags: ['WordPress', 'Finance'],
                    shortDescription: 'Financial consulting and advisory services website.',
                    image: '/images/projects/greene-financial.png',
                    color: '#0a9396'
                },
                {
                    slug: 'fixio',
                    title: 'fixio.com.au',
                    category: 'WordPress',
                    tags: ['WordPress', 'Services'],
                    shortDescription: 'Professional tech and device repair services.',
                    image: '/images/projects/fixio.png',
                    color: '#bb3e03'
                },
                {
                    slug: 'eponaco',
                    title: 'eponaco.com.au',
                    category: 'WordPress',
                    tags: ['WordPress', 'Business'],
                    shortDescription: 'Corporate business website built on WordPress.',
                    image: '/images/projects/eponaco.png',
                    color: '#ae2012'
                },
                {
                    slug: 'ltufc',
                    title: 'LTUFC',
                    category: 'WordPress',
                    tags: ['WordPress', 'Sports'],
                    shortDescription: 'Official website for the Latrobe University Football Club.',
                    image: '/images/projects/ltufc.png',
                    color: '#e63946'
                },
                // Custom Builds
                {
                    slug: 'shopglu-connector',
                    title: 'Shopify App: Shopglu',
                    category: 'Custom Builds',
                    tags: ['Shopify App', 'Integration'],
                    shortDescription: 'Custom Shopify App connector for Takealot.',
                    image: '/images/projects/shopglu.png',
                    color: '#ff9100'
                }
            ]
        };
    },
    computed: {
        filteredProjects() {
            if (this.activeFilter === 'All') {
                return this.projects;
            }
            return this.projects.filter(p => p.category === this.activeFilter);
        }
    },
    mounted() {
        // Basic Intersection Observer for fade-up animation on cards
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
    }
}
</script>

<style scoped>
.section-header {
    margin-bottom: 4rem;
    text-align: center;
}

.section-header h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.section-header p {
    color: var(--muted);
    font-size: 1.125rem;
}

.filters {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 4rem;
}

.filter-btn {
    padding: 0.5rem 1.5rem;
    border-radius: 999px;
    border: 1px solid var(--border);
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
    color: var(--text);
}

.filter-btn:hover {
    background-color: var(--muted);
}

.filter-btn.active {
    background-color: var(--accent);
    color: var(--bg);
    border-color: var(--accent);
}

.projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 2rem;
}

.project-card {
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    background-color: var(--card-bg);
    transition: transform 0.3s, box-shadow 0.3s;
}

.project-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow);
}

/* Vue TransitionGroup Styles */
.list-move {
    transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.list-enter-active {
    transition: all 0.6s ease;
}

.list-leave-active {
    transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: scale(0.9);
}

.card-link {
    display: block;
    height: 100%;
}

.card-image {
    aspect-ratio: 16/9;
    overflow: hidden;
    border-bottom: 1px solid var(--border);
}

.placeholder-img {
    width: 100%;
    height: 100%;
    background-color: #333;
    /* Fallback */
    transition: transform 0.3s;
}

.project-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
}

.project-card:hover .placeholder-img,
.project-card:hover .project-img {
    transform: scale(1.05);
}

.card-content {
    padding: 1.5rem;
}

.card-content h3 {
    font-family: 'Inter', sans-serif;
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
}

.card-content .muted-text {
    color: var(--text);
    opacity: 0.7;
    font-size: 0.95rem;
    margin-bottom: 1.5rem;
    line-height: 1.5;
}

.tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.tag {
    font-size: 0.75rem;
    padding: 0.25rem 0.75rem;
    background-color: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
}
</style>
