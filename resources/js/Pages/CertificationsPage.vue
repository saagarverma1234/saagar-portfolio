<template>

    <Head :title="title" />

    <div class="certifications-page">
        <div class="container section-padding">
            <header class="page-header fade-up">
                <h1 class="page-title font-mono">Certifications</h1>
                <p class="page-subtitle muted-text">
                    Professional certifications and verified skills across advertising, AI, and digital performance.
                </p>
            </header>

            <div class="certs-grid">
                <div v-for="(cert, index) in certifications" :key="index" class="cert-card fade-up"
                    :style="{ animationDelay: (index * 100) + 'ms' }">

                    <div class="cert-icon-wrapper" :class="cert.provider.toLowerCase()">
                        <div class="cert-icon-glow"></div>
                        <component :is="cert.icon" :size="32" class="cert-icon" />
                    </div>

                    <div class="cert-content">
                        <h2 class="cert-name">{{ cert.name }}</h2>

                        <div class="cert-meta font-mono">
                            <div v-if="cert.verifiedBy" class="meta-item verified">
                                <ShieldCheck :size="14" />
                                <span>Verified by {{ cert.verifiedBy }}</span>
                            </div>
                            <div class="meta-item">
                                <span class="label">Provider:</span>
                                <span class="value">{{ cert.provider }}</span>
                            </div>
                            <div v-if="cert.issued" class="meta-item">
                                <span class="label">Issued:</span>
                                <span class="value">{{ cert.issued }}</span>
                            </div>
                            <div v-if="cert.id" class="meta-item">
                                <span class="label">ID:</span>
                                <span class="value">{{ cert.id }}</span>
                            </div>
                        </div>

                        <button class="show-description font-mono" @click="cert.showDesc = !cert.showDesc">
                            {{ cert.showDesc ? 'Hide description' : 'Show description' }}
                        </button>

                        <transition name="expand">
                            <p v-if="cert.showDesc" class="cert-description muted-text">
                                {{ cert.description }}
                            </p>
                        </transition>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Head } from '@inertiajs/vue3';
import {
    ShieldCheck,
    Monitor,
    Video,
    ShoppingBag,
    Zap,
    LineChart
} from 'lucide-vue-next';

defineProps({
    title: String,
});

const certifications = ref([
    {
        name: 'Shopping Ads Certification',
        provider: 'Google',
        verifiedBy: 'Upwork',
        icon: ShoppingBag,
        showDesc: false,
        description: 'Demonstrates proficiency in using and optimizing Google Shopping campaigns to reach more customers and drive sales performance.'
    },
    {
        name: 'Google Ads Video Certification',
        provider: 'Google',
        verifiedBy: 'Upwork',
        icon: Video,
        showDesc: false,
        description: 'Covers the ability to deliver effective video advertising on YouTube and Google Video partners to achieve business goals.'
    },
    {
        name: 'Google Ads Display Certification',
        provider: 'Google',
        verifiedBy: 'Upwork',
        icon: Monitor,
        showDesc: false,
        description: 'Validation of expertise in creating, managing, measuring, and optimizing Google Display campaigns.'
    },
    {
        name: 'Conversion Optimization Certification',
        provider: 'SkillShop',
        issued: 'October 2025',
        id: '164726815',
        icon: Zap,
        showDesc: false,
        description: 'Advanced certification focused on improving website conversion rates through data-driven testing and user experience optimization.'
    },
    {
        name: 'AI-Powered Performance Ads Certification',
        provider: 'Skillshop',
        issued: 'October 2025',
        id: '164665768',
        icon: LineChart,
        showDesc: false,
        description: 'Mastery of using Google AI tools to enhance ad performance, including automated bidding, responsive search ads, and creative optimization.'
    }
]);

onMounted(() => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
});
</script>

<style scoped>
.certifications-page {
    padding: 2rem 0 6rem 0;
}

.page-header {
    margin-bottom: 4rem;
    max-width: 700px;
}

.page-title {
    font-size: clamp(2.5rem, 5vw, 4rem);
    margin-bottom: 1.5rem;
    color: var(--accent);
}

.page-subtitle {
    font-size: 1.25rem;
    line-height: 1.6;
}

.certs-grid {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.cert-card {
    display: flex;
    gap: 2.5rem;
    padding: 2.5rem;
    background-color: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 20px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.cert-card:hover {
    transform: translateY(-5px);
    border-color: var(--accent);
    box-shadow: var(--shadow);
}

.cert-icon-wrapper {
    position: relative;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    flex-shrink: 0;
    border: 1px solid var(--border);
}

.cert-icon {
    color: var(--accent);
    z-index: 1;
}

.cert-icon-glow {
    position: absolute;
    width: 40px;
    height: 40px;
    background-color: var(--accent);
    filter: blur(30px);
    opacity: 0.1;
    transition: opacity 0.3s ease;
}

.cert-card:hover .cert-icon-glow {
    opacity: 0.3;
}

.cert-content {
    flex-grow: 1;
}

.cert-name {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--text);
}

.cert-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
}

.meta-item.verified {
    color: #3b82f6;
    font-weight: 600;
}

.meta-item .label {
    opacity: 0.5;
}

.meta-item .value {
    font-weight: 500;
}

.show-description {
    background: none;
    border: none;
    color: var(--accent);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    display: block;
    transition: opacity 0.2s ease;
}

.show-description:hover {
    opacity: 0.7;
    text-decoration: underline;
}

.cert-description {
    margin-top: 1.5rem;
    font-size: 0.95rem;
    line-height: 1.7;
    max-width: 800px;
}

/* Transitions */
.expand-enter-active,
.expand-leave-active {
    transition: all 0.3s ease-out;
    max-height: 200px;
}

.expand-enter-from,
.expand-leave-to {
    max-height: 0;
    opacity: 0;
    transform: translateY(-10px);
}

@media (max-width: 768px) {
    .cert-card {
        flex-direction: column;
        gap: 1.5rem;
        padding: 2rem;
    }

    .cert-icon-wrapper {
        width: 60px;
        height: 60px;
    }

    .cert-name {
        font-size: 1.25rem;
    }

    .cert-meta {
        gap: 1rem;
    }
}
</style>
