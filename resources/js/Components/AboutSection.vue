<template>
    <section class="about-section section" id="about">
        <div class="container about-content">
            <div class="about-text fade-up">
                <header class="section-header">
                    <h2 class="section-title font-mono">01. About Me</h2>
                </header>

                <div class="bio-grid">
                    <div class="bio-text">
                        <p>
                            Hello! My name is Saagar. I am a highly motivated <strong>Technical Lead</strong> and
                            <strong>Senior Full Stack Developer</strong> with a passion for building scalable,
                            high-performance web applications that drive business growth.
                        </p>
                        <p>
                            With over <strong>5 years of professional experience</strong>, I've had the privilege of
                            leading development teams for companies in
                            Australia and the UAE. My journey has taken me through diverse roles—from lead frontend
                            developer to technical lead—allowing me to master the entire product lifecycle from initial
                            architecture to global scale.
                        </p>
                        <p>
                            I specialize in the <strong>TALL stack</strong> (Tailwind, Alpine, Laravel, Livewire) and
                            <strong>VILT stack</strong> (Vue, Inertia, Laravel, Tailwind), with a strong focus on
                            <strong>Inertia.js</strong> for building seamless single-page experiences. Beyond pure
                            coding, I bring deep expertise in <strong>Performance Marketing</strong> and
                            <strong>eCommerce optimization</strong>, ensuring every line of code serves a business
                            objective.
                        </p>
                        <p>
                            When I'm not architecting systems, you'll find me editing cinematic video content,
                            optimizing digital marketing funnels, or exploring the latest AI-driven development tools
                            like <strong>Claude Code</strong>.
                        </p>
                    </div>

                    <div class="skills-container">
                        <p class="skills-highlight font-mono">My Technical Toolkit</p>

                        <div class="skills-categories">
                            <div v-for="(category, catIndex) in skillCategories" :key="catIndex" class="skill-category">
                                <h4 class="category-name font-mono">
                                    <component :is="category.icon" :size="16" class="category-icon" />
                                    {{ category.name }}
                                </h4>
                                <ul class="skills-list font-mono">
                                    <li v-for="(skill, skillIndex) in category.skills" :key="skillIndex"
                                        @mouseenter="handleMouseEnter(skill)" @mouseleave="handleMouseLeave">
                                        {{ skill.name }}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Typing Tooltip moved to component root for better stacking -->
        <div v-if="hoveredSkill" class="skill-tooltip font-mono" :style="{
            left: mouseX + 20 + 'px',
            top: mouseY - 10 + 'px',
            opacity: (mouseX > 0) ? 1 : 0
        }">
            <div class="tooltip-header">
                <span class="skill-name">{{ hoveredSkill.name }}</span>
            </div>
            <div class="typed-text">{{ typedText }}<span class="cursor">_</span></div>
        </div>
    </section>
</template>

<script setup>
import {
    Code2,
    Layers,
    Cloud,
    Zap,
    Video,
    Mail,
    Database,
    Cpu
} from 'lucide-vue-next';
import { ref, onUnmounted } from 'vue';

const hoveredSkill = ref(null);
const typedText = ref("");
const mouseX = ref(0);
const mouseY = ref(0);
let typingInterval = null;

const updateTooltipPos = (e) => {
    mouseX.value = e.clientX;
    mouseY.value = e.clientY;
};

const startTypingAnimation = (text) => {
    if (typingInterval) clearInterval(typingInterval);
    typedText.value = "";
    let i = 0;
    typingInterval = setInterval(() => {
        if (i < text.length) {
            typedText.value += text.charAt(i);
            i++;
        } else {
            clearInterval(typingInterval);
        }
    }, 5);
};

const handleMouseEnter = (skill) => {
    hoveredSkill.value = skill;
    startTypingAnimation(skill.description);
    window.addEventListener('mousemove', updateTooltipPos);
};

const handleMouseLeave = () => {
    hoveredSkill.value = null;
    typedText.value = "";
    if (typingInterval) clearInterval(typingInterval);
    window.removeEventListener('mousemove', updateTooltipPos);
};

onUnmounted(() => {
    window.removeEventListener('mousemove', updateTooltipPos);
    if (typingInterval) clearInterval(typingInterval);
});

const skillCategories = [
    {
        name: "Development",
        icon: Code2,
        skills: [
            { name: "HTML5 / CSS3", description: "Semantic markup and modern styling with CSS Grid/Flexbox.\nExpert in responsive layouts and animations." },
            { name: "JavaScript", description: "Expert in ES6+, asynchronous programming, and DOM manipulation.\nCore focus on performance and reliability." },
            { name: "PHP", description: "Advanced server-side programming with focus on modern PHP 8.x features.\nSpecialist in scalable backend architecture." },
            { name: "MySQL", description: "Database design, optimization, and advanced query writing.\nEnsuring data integrity and high-speed retrieval." },
            { name: "RESTful APIs", description: "Architecting and building secure, standardized web services.\nExpert in JSON, authentication, and state management." },
            { name: "API Integration", description: "Seamlessly connecting third-party services like Stripe, Twilio, and CRM tools.\nBuilding robust data pipelines." }
        ]
    },
    {
        name: "Frameworks",
        icon: Layers,
        skills: [
            { name: "Vue 3", description: "Building reactive, high-performance SPAs using Composition API.\nExpert in Pinia, Vite, and component architecture." },
            { name: "Laravel 12", description: "Mastering the world's most elegant PHP framework for robust apps.\nExpert in Eloquent, Queues, and complex business logic." },
            { name: "Inertia.js", description: "The bridge between Laravel and Vue for seamless single-page experiences.\nCrafting app-like feel with server-side simplicity." },
            { name: "Tailwind CSS", description: "Rapid utility-first styling for unique, consistent designs.\nExpert in building scalable design systems." },
            { name: "WordPress", description: "Custom theme and plugin development from scratch.\nOptimizing for speed, security, and enterprise scale." },
            { name: "Shopify", description: "Developing custom liquid themes and private apps.\nScaling high-volume eCommerce stores globally." }
        ]
    },
    {
        name: "Cloud & DevTools",
        icon: Cloud,
        skills: [
            { name: "AWS", description: "Deploying and managing scalable infrastructure on EC2, S3, and RDS.\nFocus on devops, security, and cost-efficiency." },
            { name: "GCP", description: "Leveraging Google's global cloud network for analytics and scaling.\nExperience with Firebase and App Engine." },
            { name: "Git / GitHub", description: "Expert version control, branch management, and team collaboration.\nFocused on clean commits and efficient CI/CD." },
            { name: "Claude Code", description: "Advanced AI-assisted development for faster, smarter coding.\nHarnessing next-gen LLMs for code architecture." },
            { name: "Linux", description: "Powerful server management via terminal control.\nExpert in server hardening, Nginx, and system optimization." },
        ]
    },
    {
        name: "Growth & Creative",
        icon: Zap,
        skills: [
            { name: "Performance Marketing", description: "Data-driven marketing strategies to maximize ROI and scale.\nExpert in FB Ads, Google Ads, and funnel tracking." },
            { name: "Conversion (CRO)", description: "Analyzing user behavior to optimize conversion paths and sales.\nA/B testing and technical tracking implementation." },
            { name: "Email Marketing", description: "Automated lifecycle campaigns and high-deliverability strategies.\nExpert in Klaviyo, Mailchimp, and custom SMTP." },
            { name: "Video Editing", description: "Crafting cinematic, viral-ready content that tells a story.\nMaster of Premiere Pro, After Effects, and DaVinci." },
            { name: "Technical SEO", description: "Optimizing code and site structure for maximum visibility.\nEnsuring high Core Web Vitals and crawl efficiency." },
            { name: "AI Integration", description: "Implementing AI solutions into apps for enhanced user value.\nWorking with OpenAI, Anthropic, and localized models." }
        ]
    }
];
</script>

<style scoped>
.about-section {
    padding: 8rem 0 6rem 0;
    background-color: var(--bg);
    position: relative;
}

.about-content {
    max-width: 1200px;
    margin: 0 auto;
}

.section-title {
    font-size: clamp(2rem, 5vw, 2.5rem);
    color: var(--text);
    margin-bottom: 3rem;
    display: flex;
    align-items: center;
    gap: 1rem;
}

.section-title::after {
    content: "";
    display: block;
    height: 1px;
    width: clamp(100px, 20vw, 300px);
    background-color: var(--border);
}

.bio-grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 4rem;
    align-items: start;
}

.bio-text p {
    font-size: 1.05rem;
    line-height: 1.7;
    color: var(--text);
    margin-bottom: 1.5rem;
    opacity: 0.8;
}

.bio-text strong {
    color: var(--accent);
    font-weight: 600;
}

.skills-container {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border);
    padding: 2.5rem;
    border-radius: 20px;
    backdrop-filter: blur(10px);
    position: relative;
}

.skills-highlight {
    color: var(--accent);
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    margin-bottom: 2rem;
    display: block;
}

.skills-categories {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2.5rem;
}

.skill-category .category-name {
    font-size: 0.9rem;
    color: var(--text);
    margin-bottom: 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 600;
}

.category-icon {
    color: var(--accent);
}

.skills-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.skills-list li {
    position: relative;
    padding-left: 1.25rem;
    font-size: 0.85rem;
    color: var(--text);
    opacity: 0.6;
    margin-bottom: 0.75rem;
    transition: all 0.2s ease;
    cursor: pointer;
}

.skills-list li:hover {
    opacity: 1;
    color: var(--accent);
    transform: translateX(4px);
}

.skills-list li::before {
    content: "▹";
    position: absolute;
    left: 0;
    color: var(--accent);
}

/* Tooltip Styles */
.skill-tooltip {
    position: fixed;
    z-index: 9999;
    background: rgba(10, 25, 47, 0.95);
    border: 1px solid var(--accent);
    border-radius: 8px;
    padding: 1rem;
    width: 280px;
    pointer-events: none;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(5px);
}

.tooltip-header {
    border-bottom: 1px solid rgba(100, 255, 218, 0.2);
    margin-bottom: 0.5rem;
    padding-bottom: 0.25rem;
}

.skill-name {
    color: var(--accent);
    font-weight: 600;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
}

.typed-text {
    font-size: 0.8rem;
    line-height: 1.5;
    color: var(--text);
    white-space: pre-wrap;
}

.cursor {
    animation: blink 1s step-end infinite;
    color: var(--accent);
    font-weight: bold;
}

@keyframes blink {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0;
    }
}

@media (max-width: 1024px) {
    .bio-grid {
        grid-template-columns: 1fr;
        gap: 3rem;
    }
}

@media (max-width: 640px) {
    .skills-categories {
        grid-template-columns: 1fr;
        gap: 2rem;
    }
}
</style>
