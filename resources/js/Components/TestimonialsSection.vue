<template>
    <section class="testimonials-section section" id="testimonials">
        <div class="container">
            <header class="section-header fade-up">
                <div class="header-pre">
                    <span class="badge font-mono">Testimonials</span>
                </div>
                <h2 class="section-title font-mono">02. Client Stories</h2>
                <div class="rating-banner">
                    <div class="stars">
                        <Star v-for="i in 5" :key="i" class="star-icon" :fill="i <= 5 ? 'var(--accent)' : 'none'" />
                    </div>
                    <div class="rating-info">
                        <p class="rating-text font-mono">
                            <strong>5.0/5.0</strong> Rating across <strong>37+</strong> verified projects
                        </p>
                        <p class="verification-note font-mono">
                            All reviews are 100% authentic.
                            <a href="https://www.upwork.com/freelancers/~014475753a03f5690d" target="_blank"
                                class="upwork-link">
                                Verify on Upwork
                            </a>
                        </p>
                    </div>
                </div>
            </header>

            <div class="testimonials-masonry">
                <div v-for="(testimonial, index) in visibleTestimonials" :key="index" class="testimonial-card fade-up"
                    :class="{ 'featured': testimonial.featured }" :style="{ animationDelay: (index * 50) + 'ms' }">

                    <Quote class="quote-icon" :size="24" />

                    <div class="testimonial-body">
                        <p class="content">{{ testimonial.text }}</p>
                        <a v-if="testimonial.link" :href="testimonial.link" target="_blank"
                            class="project-link font-mono">
                            <ExternalLink :size="14" />
                            View Project
                        </a>
                    </div>

                    <div class="testimonial-footer">
                        <div class="client-info">
                            <div class="client-avatar" v-if="testimonial.avatar">
                                <img :src="testimonial.avatar" :alt="testimonial.author">
                            </div>
                            <div class="client-placeholder" v-else>
                                {{ testimonial.author.charAt(0) }}
                            </div>
                            <div class="meta">
                                <h4 class="author">{{ testimonial.author }}</h4>
                                <p class="role" v-if="testimonial.role">{{ testimonial.role }}</p>
                                <div class="verified-badge" v-if="testimonial.verified">
                                    <ShieldCheck :size="12" />
                                    <span>Verified Client</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="show-more-wrapper fade-up" v-if="testimonials.length > initialLimit">
                <button class="btn-outline font-mono" @click="toggleShowAll">
                    {{ showAll ? 'Show Less' : 'Show All Testimonials' }}
                </button>
            </div>
        </div>
    </section>
</template>

<script setup>
import {
    Star,
    Quote,
    ShieldCheck,
    ExternalLink
} from 'lucide-vue-next';
import { ref, computed, onMounted, nextTick } from 'vue';

const showAll = ref(false);
const initialLimit = 6;

const visibleTestimonials = computed(() => {
    return showAll.value ? testimonials : testimonials.slice(0, initialLimit);
});

const toggleShowAll = async () => {
    showAll.value = !showAll.value;

    if (showAll.value) {
        await nextTick();
        const observer = createObserver();
        document.querySelectorAll('.testimonial-card.fade-up').forEach(el => observer.observe(el));
    }
};

const createObserver = () => {
    return new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
};

const testimonials = [
    {
        featured: true,
        author: "Christina Stoltz",
        role: "Business Owner",
        verified: true,
        text: "Saagar didn’t just complete a project — he saved it. I brought Saagar in during a critical moment when my business was under real pressure, timelines were tight, and the work required both technical precision and calm, thoughtful problem-solving. He stepped in immediately, took ownership, and delivered with a level of care and dedication that is extremely rare. What sets Saagar apart is not just his technical skill, but his commitment to his clients. He communicates clearly, works tirelessly, and genuinely cares about the long-term success of the project — not just “checking boxes” or closing a contract."
    },
    {
        author: "eCommerce Team",
        role: "Australian Retailer",
        verified: true,
        text: "We've been working with Saagar for over a year now and he's been a fantastic resource for our eCommerce team. He is diligent, a fast worker and even gets up at 6am to get our EDMs formatted in line with our Australian marketing schedule. We would happily recommend him to those needing an extra eCommerce arm."
    },
    {
        author: "Spinal Studio Australia",
        role: "Custom Build Client",
        verified: true,
        link: "https://thespinalstudio.com.au/",
        text: "I've been working with Saagar for a year now. This was a complex build (custom) from a custom design. Saagar actioned all my feedback to get the project across the line."
    },
    {
        author: "Enterprise Client",
        role: "Tech Lead",
        verified: true,
        text: "It was great working with Saagar on a project that had moving requirements and a vast technical scope in terms of number of technologies used. He is highly co-operative and very keen to learn new areas, that might be out of his current comfort level. He takes feedback very well and incorporates it into his next work. +1 for his troubleshooting skills."
    },
    {
        author: "Hemant B.",
        role: "Software Engineer at Google",
        verified: true,
        text: "Saagar did a fantastic job on my project to create a news application along with advertisements. He handled everything from scratch on his own. Completed the project before the deadline! His code was clean with perfect use of comments. I was most amazed by his speed. I definitely recommend him for long-term projects."
    },
    {
        author: "Gaurav M.",
        role: "Upwork Client",
        verified: true,
        text: "Saagar is an amazing developer who works very quickly and efficiently. I had a big project and he did it perfectly! I will recommend him for big and long-term projects because he is the type of developer who can handle them and complete them with ease."
    },
    {
        author: "WordPress Client",
        role: "Portfolio Site Owner",
        verified: true,
        text: "Saagar was able to solve some issues with my wordpress theme I was struggling for a long time. I am really glad I got him recommended by a friend! He has done a fast and great job. Highly recommended. Will definitely work with him again!"
    },
    {
        author: "Retail Business",
        role: "Store Owner",
        verified: true,
        text: "Saagar is a pleasure to work with. He is an excellent communicator and completes projects to a high standard on time. He has been thoroughly knowledgeable about all the tasks he has completed for us so far. We look forward to continuing to work with him."
    },
    {
        author: "Upwork Newcomer",
        role: "Video Project",
        verified: true,
        text: "First time using Upwork and Saagar was great! Communication was spot on and very timely. His video was just what I had imagined."
    },
    {
        author: "Web Agency",
        role: "Development Partner",
        verified: true,
        text: "Working with Saagar has been a great experience. He’s consistent, reliable, and genuinely takes pride in his work. His attention to detail, clear communication, and ability to turn complex feedback into clean, accurate outputs have made him an invaluable part of our development and content process across multiple projects."
    },
    {
        author: "Digital Director",
        role: "Agency Client",
        verified: true,
        text: "Saagar is a talented developer. He has successfully managed our clients WordPress sites and Shopify sites along with other projects. He is a fast worker, very reliable and dependable, and always willing to go the extra mile. We will definitely be using him for future work."
    },
    {
        author: "UX Specialist",
        role: "Project Manager",
        verified: true,
        text: "Saagar always delivers on-time. He replies promptly. And he can do anything you want with the website. Will continue to engage him. Highly recommended!"
    }
];

onMounted(() => {
    const observer = createObserver();
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
});
</script>

<style scoped>
.testimonials-section {
    background-color: var(--bg);
    position: relative;
    overflow: hidden;
    padding-top: 2rem;
}

.section-header {
    margin-bottom: 4rem;
}

.header-pre {
    margin-bottom: 1rem;
}

.badge {
    font-size: 0.75rem;
    color: var(--accent);
    border: 1px solid var(--accent);
    padding: 4px 12px;
    border-radius: 100px;
    background-color: rgba(100, 255, 218, 0.05);
}

.section-title {
    font-size: clamp(2rem, 5vw, 2.5rem);
    margin-bottom: 1.5rem;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 1rem;
}

.section-title::after {
    content: "";
    display: block;
    height: 1px;
    width: 150px;
    background-color: var(--border);
}

.rating-banner {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.stars {
    display: flex;
    gap: 4px;
}

.star-icon {
    width: 18px;
    height: 18px;
}

.rating-text {
    font-size: 0.95rem;
    opacity: 1;
    margin: 0;
}

.rating-text strong {
    color: var(--accent);
}

.verification-note {
    font-size: 0.75rem;
    opacity: 0.6;
    margin-top: 5px;
}

.upwork-link {
    color: var(--accent);
    text-decoration: underline;
    margin-left: 4px;
}

.upwork-link:hover {
    opacity: 0.8;
}

.testimonials-masonry {
    columns: 3 300px;
    gap: 1.5rem;
    margin-bottom: 3rem;
}

.show-more-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
}

.btn-outline {
    padding: 1rem 2.5rem;
    border: 1px solid var(--accent);
    color: var(--accent);
    background: transparent;
    cursor: pointer;
    transition: all 0.3s ease;
    border-radius: 4px;
}

.btn-outline:hover {
    background: rgba(100, 255, 218, 0.1);
    transform: translateY(-3px);
}

.testimonial-card {
    break-inside: avoid;
    background-color: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 1.5rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    display: flex;
    flex-direction: column;
}

.testimonial-card:hover {
    border-color: var(--accent);
    transform: translateY(-5px);
    box-shadow: var(--shadow);
}

.testimonial-card.featured {
    border-left-width: 4px;
    border-left-color: var(--accent);
}

.quote-icon {
    color: var(--accent);
    opacity: 0.2;
    margin-bottom: 1rem;
}

.testimonial-body {
    margin-bottom: 1.5rem;
}

.content {
    font-size: 1rem;
    line-height: 1.6;
    opacity: 0.9;
}

.project-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--accent);
    text-decoration: none;
    margin-top: 1rem;
    transition: opacity 0.2s ease;
}

.project-link:hover {
    opacity: 0.7;
}

.testimonial-footer {
    margin-top: auto;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
}

.client-info {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.client-placeholder {
    width: 40px;
    height: 40px;
    background-color: var(--accent);
    color: var(--bg);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1rem;
}

.meta .author {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text);
    margin: 0;
}

.meta .role {
    font-size: 0.8rem;
    opacity: 0.5;
    margin: 0;
}

.verified-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.7rem;
    color: #3b82f6;
    font-weight: 600;
    margin-top: 2px;
}

@media (max-width: 1024px) {
    .testimonials-masonry {
        columns: 2 300px;
    }
}

@media (max-width: 640px) {
    .testimonials-masonry {
        columns: 1;
    }

    .rating-banner {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
    }
}
</style>
