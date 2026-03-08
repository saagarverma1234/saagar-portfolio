<template>
  <section class="hero-section" id="home">
    <div class="container hero-content">
      <!-- Left side: Text -->
      <div class="hero-text fade-up" :class="{ 'visible': isMounted }">
        <h1 class="hero-title font-mono">
          <span class="highlight">Hi,</span> I'm Saagar Verma.
        </h1>
        <h2 class="hero-subtitle">
          Building scalable software & telling stories through video.
        </h2>
        <p class="hero-description muted-text">
          Full Stack Developer + Video Editor with over 5 years of experience in crafting experiences that look good and
          run fast. Based in India, working globally.
        </p>

        <div class="hero-actions">
          <Link href="/projects" class="btn-primary">
          View Projects
          </Link>
          <a href="https://www.upwork.com/freelancers/~014475753a03f5690d" class="btn-outline" target="_blank"
            rel="noopener noreferrer">
            Upwork
          </a>
          <a href="/resume.pdf" class="btn-outline" target="_blank">
            Resume
          </a>
        </div>

        <!-- Stats/Impact Section moved back to Hero -->
        <div class="hero-stats" ref="heroStats">
          <!-- Row 1: Main Work Metrics -->
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-number font-mono">{{ displayedYears }}+</span>
              <span class="stat-label">Years of<br>Experience</span>
            </div>
            <div class="stat-item">
              <span class="stat-number font-mono">{{ displayedHours }}+</span>
              <span class="stat-label">Total Hours<br>Worked</span>
            </div>
            <div class="stat-item">
              <span class="stat-number font-mono">{{ displayedSuccess }}%</span>
              <span class="stat-label">Job Success<br>Score</span>
            </div>
          </div>

          <!-- Row 2: Achievement Metrics -->
          <div class="stats-row secondary">
            <div class="stat-item">
              <span class="stat-number font-mono">{{ displayedProjects }}+</span>
              <span class="stat-label">Projects<br>Completed</span>
            </div>
            <div class="stat-item">
              <span class="stat-number font-mono">{{ (displayedRating / 10).toFixed(1) }}</span>
              <div class="stars">
                <Star v-for="i in 5" :key="i" :size="14" fill="#FFD700" color="#FFD700" />
              </div>
              <span class="stat-label">Average<br>Rating</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right side: Code Animation -->
      <div class="hero-code-animation fade-up" :class="{ 'visible': isMounted }" style="animation-delay: 200ms">
        <div class="code-window" :style="codeWindowStyle">
          <div class="code-header">
            <div class="code-dots">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <div class="code-title font-mono">saagar_verma.js</div>
          </div>
          <div class="code-body font-mono">
            <pre><code v-html="highlightedCode"></code><span class="cursor">_</span></pre>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { Link } from '@inertiajs/vue3';
import { Star } from 'lucide-vue-next';

export default {
  components: {
    Link,
    Star
  },
  data() {
    return {
      isMounted: false,
      codeLines: [
        "const developer = {",
        "  name: 'Saagar Verma',",
        "  role: ['Full Stack', 'Video Editor'],",
        "  location: 'India',",
        "  isCreating: true,",
        "  skills: [",
        "    'Vue', 'Laravel', 'React',",
        "    'Premiere Pro', 'After Effects'",
        "  ],",
        "  hire: () => 'Get in touch!'",
        "};"
      ],
      currentText: "",
      fullText: "",
      typingDelay: 50,
      newLineDelay: 300,
      restartDelay: 4000,
      charIndex: 0,
      mouseX: 0,
      mouseY: 0,
      windowWidth: typeof window !== 'undefined' ? window.innerWidth : 1200,
      windowHeight: typeof window !== 'undefined' ? window.innerHeight : 800,
      displayedYears: 0,
      displayedHours: 0,
      displayedProjects: 0,
      displayedRating: 0,
      displayedSuccess: 0,
      hasAnimated: false,
      observer: null
    };
  },
  computed: {
    highlightedCode() {
      let html = this.currentText;
      html = html.replace(/(const|let|var|return|true|false)\b/g, '<span class="keyword">$1</span>');
      html = html.replace(/('[^']*')/g, '<span class="string">$1</span>');
      html = html.replace(/([a-zA-Z0-9_]+):/g, '<span class="property">$1</span>:');
      html = html.replace(/(\(|\)|\[|\]|{|})/g, '<span class="bracket">$1</span>');
      return html;
    },
    codeWindowStyle() {
      if (!this.isMounted) return { transform: 'perspective(1000px) rotateX(5deg) rotateY(-5deg)' };

      // Calculate rotation based on global mouse position
      const centerX = this.windowWidth / 2;
      const centerY = this.windowHeight / 2;

      // Calculate tilt based on distance from center (max 5 degrees)
      const rotateX = this.windowHeight > 0 ? ((this.mouseY - centerY) / centerY) * -5 : 2;
      const rotateY = this.windowWidth > 0 ? ((this.mouseX - centerX) / centerX) * 5 : -2;

      return {
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: 'transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      };
    }
  },
  mounted() {
    setTimeout(() => {
      this.isMounted = true;
    }, 100);

    // Prepare full text with newlines
    this.fullText = this.codeLines.join('\n');
    this.startTyping();

    // Mouse tracking for 3D code window effect
    this.handleResize();
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('resize', this.handleResize);

    this.setupIntersectionObserver();
  },
  unmounted() {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('resize', this.handleResize);
    if (this.observer) {
      this.observer.disconnect();
    }
  },
  methods: {
    handleMouseMove(e) {
      if (!this.isMounted) return;
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    },
    handleResize() {
      this.windowWidth = window.innerWidth;
      this.windowHeight = window.innerHeight;
      this.mouseX = this.windowWidth / 2; // Center it until user moves mouse
      this.mouseY = this.windowHeight / 2;
    },
    startTyping() {
      this.currentText = "";
      this.charIndex = 0;
      this.typeChar();
    },
    typeChar() {
      if (this.charIndex < this.fullText.length) {
        const char = this.fullText.charAt(this.charIndex);
        this.currentText += char;
        this.charIndex++;

        let delay = this.typingDelay;
        if (char === '\n') {
          delay = this.newLineDelay;
        }

        setTimeout(this.typeChar, delay);
      } else {
        // Wait and then restart
        setTimeout(() => {
          this.startTyping();
        }, this.restartDelay);
      }
    },
    setupIntersectionObserver() {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.hasAnimated) {
            this.animateCounters();
          }
        });
      }, { threshold: 0.3 });

      if (this.$refs.heroStats) {
        this.observer.observe(this.$refs.heroStats);
      }
    },
    animateCounters() {
      if (this.hasAnimated) return;
      this.hasAnimated = true;

      const duration = 2000;
      const startTime = performance.now();

      const targets = {
        years: 5,
        hours: 8000,
        projects: 37,
        rating: 50, // Multiplied by 10 for integer animation
        success: 100
      };

      const step = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out quadratic
        const easedProgress = 1 - (1 - progress) * (1 - progress);

        this.displayedYears = Math.floor(easedProgress * targets.years);
        this.displayedHours = Math.floor(easedProgress * targets.hours);
        this.displayedProjects = Math.floor(easedProgress * targets.projects);
        this.displayedRating = Math.floor(easedProgress * targets.rating);
        this.displayedSuccess = Math.floor(easedProgress * targets.success);

        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          this.displayedYears = targets.years;
          this.displayedHours = targets.hours;
          this.displayedProjects = targets.projects;
          this.displayedRating = targets.rating;
          this.displayedSuccess = targets.success;
        }
      };

      window.requestAnimationFrame(step);
    }
  }
}
</script>

<style scoped>
.hero-section {
  min-height: calc(100vh - 80px);
  /* Subtract header height */
  display: flex;
  align-items: flex-start;
  /* Anchor to the top instead of centering */
  padding-top: 4rem;
  /* Specific padding instead of generic .section's 6rem */
  position: relative;
  overflow: hidden;
}

/* Optional dot grid background */
.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(var(--border) 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.3;
  z-index: -1;
  pointer-events: none;
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: flex-start;
  /* Changed from center to align heights to the top */
  gap: 4rem;
  width: 100%;
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  margin-top: 0;
  margin-bottom: 1rem;
  line-height: 1.1;
  letter-spacing: -2px;
}

.highlight {
  color: var(--text);
  opacity: 0.5;
}

.hero-subtitle {
  font-size: clamp(1.25rem, 2.5vw, 2rem);
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--text);
  line-height: 1.3;
}

.hero-description {
  font-size: 1.125rem;
  max-width: 600px;
  margin-bottom: 2.5rem;
  line-height: 1.7;
}

.muted-text {
  color: var(--text);
  opacity: 0.7;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 3rem;
}

/* Stats Styling */
.hero-stats {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border);
  width: 100%;
  max-width: 600px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.stats-row.secondary {
  grid-template-columns: repeat(3, 1fr);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.stat-number {
  font-size: clamp(1.25rem, 3.5vw, 1.75rem);
  color: var(--accent);
  line-height: 1;
  font-weight: 700;
}

.stars {
  display: flex;
  gap: 2px;
  margin-bottom: 0.1rem;
}

.stat-label {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.6;
  font-weight: 600;
  line-height: 1.3;
  margin: 0;
}

@media (max-width: 1024px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 3rem;
  }

  .hero-text {
    max-width: 800px;
  }
}

@media (max-width: 768px) {
  .hero-actions {
    flex-direction: column;
  }
}

/* Code Window Animation Styles */
.hero-code-animation {
  width: 100%;
  perspective: 1000px;
  /* Margins are reset since grid align-items: flex-start handles top alignment perfectly */
  margin-top: 0;
}

.code-window {
  background-color: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow), 0 20px 40px rgba(0, 0, 0, 0.2);
  /* Transform is now applied dynamically via vue style bindings */
}

/* We remove hover styles since interaction is global now */

.code-header {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid var(--border);
}

.code-dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot.red {
  background-color: #ff5f56;
}

.dot.yellow {
  background-color: #ffbd2e;
}

.dot.green {
  background-color: #27c93f;
}

.code-title {
  margin: 0 auto;
  font-size: 0.875rem;
  color: var(--muted);
}

.code-body {
  padding: 1.5rem;
  font-size: 0.875rem;
  line-height: 1.6;
  min-height: 300px;
  max-width: 100%;
  overflow-x: auto;
}

.code-body pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

/* Syntax Highlighting overrides utilizing theme variables */
:deep(.keyword) {
  color: #ff7b72;
}

:deep(.string) {
  color: #a5d6ff;
}

:deep(.property) {
  color: #79c0ff;
}

:deep(.bracket) {
  color: var(--text);
  opacity: 0.7;
}

/* Light Theme overrides for syntax highlighting */
[data-theme="light"] :deep(.keyword) {
  color: #d73a49;
}

[data-theme="light"] :deep(.string) {
  color: #032f62;
}

[data-theme="light"] :deep(.property) {
  color: #005cc5;
}

.cursor {
  animation: blink 1s step-end infinite;
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
</style>
