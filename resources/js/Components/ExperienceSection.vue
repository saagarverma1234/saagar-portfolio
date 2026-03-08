<template>
    <section class="experience-section section" id="experience">
        <div class="container experience-content">
            <h2 class="section-title font-mono fade-up">04. Where I've Worked</h2>

            <div class="timeline fade-up" style="animation-delay: 150ms">
                <div class="timeline-item" v-for="(job, index) in jobs" :key="index">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <h3 class="role">{{ job.role }}</h3>
                        <p class="company font-mono">
                            <a :href="job.url" target="_blank" rel="noopener noreferrer" class="company-link">
                                {{ job.company }}
                            </a>
                            <span class="muted-text"> | {{ job.date }}</span>
                        </p>
                        <p class="description">{{ job.description }}</p>
                        <ul class="duties">
                            <li v-for="(duty, i) in job.duties" :key="i">
                                {{ duty }}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script>
export default {
    data() {
        return {
            jobs: [
                {
                    role: 'Technical Lead',
                    company: 'Coinvo Trading',
                    url: 'https://www.coinvotrading.com/',
                    date: 'October 2025 - Present',
                    description: 'Leading technical strategy and remote development efforts for high-performance trading platforms in the UAE.',
                    duties: [
                        'Overseeing the architecture and deployment of scalable fintech solutions.',
                        'Managing a distributed team of engineers across multiple time zones.',
                        'Optimizing system reliability and performance for real-time data processing.'
                    ]
                },
                {
                    role: 'Senior Full Stack Developer',
                    company: 'Peter Sheppard Footwear',
                    url: 'https://www.petersheppard.com.au/',
                    date: 'Sep 2024 - Sep 2025',
                    description: 'Modernized e-commerce infrastructure and streamlined internal operations for a leading Australian footwear retailer.',
                    duties: [
                        'Developed and maintained large-scale e-commerce platforms using modern web technologies.',
                        'Integrated complex inventory management systems with the frontend storefront.',
                        'Improved site performance and SEO rankings through technical audits and refactoring.'
                    ]
                },
                {
                    role: 'Full Stack Engineer',
                    company: 'Studio Greene',
                    url: 'https://studiogreene.com.au/',
                    date: 'Sep 2022 - Aug 2024',
                    description: 'Built high-end digital experiences and motion-focused web applications for creative clients.',
                    duties: [
                        'Bridged the gap between design and technology by implementing pixel-perfect interfaces.',
                        'Built robust backend services to support interactive frontend components.',
                        'Collaborated with creative directors to deliver award-winning digital projects.'
                    ]
                },
                {
                    role: 'Lead Frontend Developer',
                    company: 'TechNic3000',
                    url: 'https://technic3000.com/',
                    date: 'Aug 2020 - Aug 2022',
                    description: 'Led the frontend transition for an Australian tech firm, spearheading various remote development initiatives.',
                    duties: [
                        'Established coding standards and best practices for a growing frontend team.',
                        'Developed modular component libraries to accelerate product development.',
                        'Mentored junior developers and performed regular code reviews and technical assessments.'
                    ]
                }
            ]
        }
    }
}
</script>

<style scoped>
.experience-section {
    padding: 6rem 0;
    background-color: var(--card-bg);
}

.section-title {
    font-size: 2rem;
    margin-bottom: 4rem;
    color: var(--accent);
    display: flex;
    align-items: center;
    gap: 1rem;
}

.section-title::after {
    content: "";
    display: block;
    height: 1px;
    width: 200px;
    background-color: var(--border);
}

.timeline {
    display: flex;
    flex-direction: column;
    gap: 3rem;
    position: relative;
    max-width: 1200px;
    margin: 0 auto;
}

.timeline::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 6px;
    width: 2px;
    background-color: var(--border);
    border-radius: 2px;
}

.timeline-item {
    position: relative;
    padding-left: 3rem;
}

.timeline-dot {
    position: absolute;
    top: 8px;
    left: 0;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background-color: var(--bg);
    border: 2px solid var(--accent);
}

.role {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
}

.company {
    font-size: 1rem;
    color: var(--accent);
    margin-bottom: 1rem;
}

.company-link {
    color: var(--accent);
    text-decoration: none;
    position: relative;
    transition: color 0.2s ease;
}

.company-link::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 1px;
    background-color: var(--accent);
    transition: width 0.3s ease;
}

.company-link:hover {
    color: var(--accent);
}

.company-link:hover::after {
    width: 100%;
}

.muted-text {
    color: var(--text);
    opacity: 0.6;
}

.description {
    font-size: 1.125rem;
    line-height: 1.6;
    margin-bottom: 1rem;
    color: var(--text);
    opacity: 0.9;
}

.duties {
    list-style: none;
    padding: 0;
}

.duties li {
    position: relative;
    padding-left: 1.5rem;
    margin-bottom: 0.5rem;
    color: var(--text);
    opacity: 0.8;
    line-height: 1.6;
}

.duties li::before {
    content: '▹';
    position: absolute;
    left: 0;
    color: var(--accent);
}

@media (max-width: 768px) {
    .timeline::before {
        left: 0;
    }

    .timeline-dot {
        left: -6px;
    }

    .timeline-item {
        padding-left: 2rem;
    }
}
</style>
