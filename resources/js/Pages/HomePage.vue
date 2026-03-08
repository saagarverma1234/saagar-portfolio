<template>

    <Head :title="title" />
    <div class="home">
        <HeroSection />
        <AboutSection />
        <TestimonialsSection />
        <GithubContributions />
        <ExperienceSection />

        <ContactSection />
    </div>
</template>

<script>
import { Head } from '@inertiajs/vue3';
import HeroSection from '@/Components/HeroSection.vue';
import AboutSection from '@/Components/AboutSection.vue';
import GithubContributions from '@/Components/GithubContributions.vue';
import TestimonialsSection from '@/Components/TestimonialsSection.vue';
import ExperienceSection from '@/Components/ExperienceSection.vue';
import ContactSection from '@/Components/ContactSection.vue';
import { onMounted } from 'vue';

export default {
    components: {
        Head,
        HeroSection,
        AboutSection,
        GithubContributions,
        TestimonialsSection,
        ExperienceSection,
        ContactSection
    },
    props: {
        title: {
            type: String,
            default: 'Home'
        }
    },
    mounted() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
    }
};
</script>

<style scoped></style>
