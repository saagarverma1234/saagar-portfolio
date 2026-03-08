<template>
    <section class="contact-section section" id="contact">
        <div class="container contact-content">
            <div class="content-wrapper fade-up">
                <h2 class="section-title font-mono">05. Get In Touch</h2>
                <h3 class="contact-heading">Ready to start your next project?</h3>
                <p class="contact-description">
                    Whether you have a specific project in mind or just want to say hi, my inbox is always open.
                    I'm currently looking for new opportunities and would love to hear from you.
                </p>

                <div class="contact-grid">
                    <!-- Contact Form -->
                    <form @submit.prevent="handleSubmit" class="contact-form">
                        <div class="form-group">
                            <label for="name" class="font-mono">Name</label>
                            <input type="text" id="name" v-model="form.name" required placeholder="">
                        </div>
                        <div class="form-group">
                            <label for="email" class="font-mono">Email</label>
                            <input type="email" id="email" v-model="form.email" required placeholder="">
                        </div>
                        <div class="form-group">
                            <label for="message" class="font-mono">Message</label>
                            <textarea id="message" v-model="form.message" rows="5" required placeholder=""></textarea>
                        </div>
                        <button type="submit" class="btn-primary" :disabled="isSubmitting">
                            {{ isSubmitting ? 'Sending...' : 'Send Message' }}
                        </button>
                        <transition name="fade">
                            <p v-if="submitted" class="success-msg font-mono">Message sent successfully!</p>
                        </transition>
                    </form>

                    <!-- Alternative Actions -->
                    <div class="contact-alt">
                        <div class="alt-card">
                            <h4 class="font-mono">Schedule a Meeting</h4>
                            <p>Prefer to hop on a call? Choose a time that works for you on my Google Calendar.</p>
                            <a href="https://calendar.google.com/" target="_blank" class="btn-outline calendar-btn">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                Book a discovery call
                            </a>
                        </div>
                        <div class="alt-card">
                            <h4 class="font-mono">Direct Email</h4>
                            <p>Skip the form and send a message directly to my inbox.</p>
                            <a href="mailto:saagarverma1234@gmail.com" class="email-link">saagarverma1234@gmail.com</a>
                        </div>
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
            form: {
                name: '',
                email: '',
                message: ''
            },
            isSubmitting: false,
            submitted: false
        };
    },
    methods: {
        async handleSubmit() {
            this.isSubmitting = true;
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            this.isSubmitting = false;
            this.submitted = true;
            this.form = { name: '', email: '', message: '' };
            setTimeout(() => { this.submitted = false; }, 5000);
        }
    }
}
</script>

<style scoped>
.contact-section {
    padding: 8rem 0;
    background-color: var(--bg);
}

.content-wrapper {
    max-width: 1200px;
    margin: 0 auto;
}

.section-title {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    color: var(--accent);
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

.contact-heading {
    font-size: clamp(2rem, 4vw, 3rem);
    margin-bottom: 1rem;
    font-weight: 700;
    color: var(--text);
}

.contact-description {
    font-size: 1.125rem;
    max-width: 600px;
    margin-bottom: 4rem;
    color: var(--text);
    opacity: 0.8;
    line-height: 1.6;
}

.contact-grid {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 4rem;
}

.contact-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group label {
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--accent);
}

.form-group input,
.form-group textarea {
    padding: 1rem;
    background-color: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    font-family: inherit;
    font-size: 1rem;
    transition: all 0.2s ease;
}

.form-group input:focus,
.form-group textarea:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.05);
}

.success-msg {
    color: #27c93f;
    font-size: 0.875rem;
}

.contact-alt {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.alt-card {
    padding: 2rem;
    background-color: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.alt-card h4 {
    font-size: 1rem;
    color: var(--accent);
}

.alt-card p {
    font-size: 0.95rem;
    opacity: 0.7;
}

.calendar-btn {
    gap: 0.75rem;
    justify-content: center;
    margin-top: 0.5rem;
}

.email-link {
    font-size: 1rem;
    font-weight: 600;
    color: var(--accent);
    text-decoration: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 4px;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s;
}

.fade-enter,
.fade-leave-to {
    opacity: 0;
}

@media (max-width: 900px) {
    .contact-grid {
        grid-template-columns: 1fr;
        gap: 3rem;
    }
}
</style>
