<template>
  <footer class="footer">
    <div class="container footer-content">
      <div class="footer-grid">
        <!-- Brand Column -->
        <div class="footer-col brand-col">
          <Link href="/" class="footer-logo" aria-label="Home">
          <div class="logo-wrapper">
            <svg class="brand-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
              <rect width="100" height="100" rx="20" class="logo-box" />
              <text x="50" y="66" font-family="'JetBrains Mono', monospace" font-size="45" font-weight="800"
                text-anchor="middle" class="logo-text">SV</text>
            </svg>
          </div>
          </Link>
          <p class="footer-tagline">
            Building software with purpose and telling stories through digital experiences.
          </p>
          <div class="social-links">
            <a v-for="social in socials" :key="social.name" :href="social.url" target="_blank" rel="noopener noreferrer"
              :aria-label="social.name" class="social-icon">
              <component :is="social.icon" :size="20" />
            </a>
          </div>
        </div>

        <!-- Links Columns -->
        <div class="footer-col">
          <h4 class="footer-title font-mono">Navigation</h4>
          <ul class="footer-nav">
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/projects">Projects</Link>
            </li>
            <li>
              <Link href="/certifications">Certifications</Link>
            </li>
          </ul>
        </div>

        <div class="footer-col">
          <h4 class="footer-title font-mono">Contact</h4>
          <ul class="footer-nav">
            <li><a href="mailto:saagarverma1234@gmail.com">Email</a></li>
            <li><a href="https://www.upwork.com/freelancers/~014475753a03f5690d" target="_blank">Upwork</a></li>
          </ul>
        </div>

        <div class="footer-col newsletter-col">
          <h4 class="footer-title font-mono">Current Status</h4>
          <p class="status-msg">
            Currently available for freelance projects and full-time opportunities.
          </p>
          <a href="/assets/resume.pdf" class="btn-outline resume-link" download="Saagar_Verma_Resume.pdf">
            Get Resume
          </a>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="copyright">
          © {{ new Date().getFullYear() }} Saagar Verma.
          <span class="built-with">Built without AI</span>
        </div>
        <div class="back-to-top" @click="scrollToTop">
          <span class="font-mono">Back to top</span>
          <ArrowUp :size="16" />
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
import { Link } from '@inertiajs/vue3';
import {
  Github,
  Linkedin,
  Twitter,
  Mail,
  Instagram,
  Facebook,
  Gamepad2,
  ArrowUp
} from 'lucide-vue-next';

export default {
  components: {
    Link,
    ArrowUp
  },
  data() {
    return {
      socials: [
        { name: 'GitHub', url: 'https://github.com/saagarverma1234', icon: Github },
        { name: 'LinkedIn', url: 'https://www.linkedin.com/in/saagar-verma/', icon: Linkedin },
        { name: 'X/Twitter', url: 'https://x.com/xavierfosterZX', icon: Twitter },
        { name: 'Instagram', url: 'https://www.instagram.com/zero_magnum_x/', icon: Instagram },
        { name: 'Facebook', url: 'https://www.facebook.com/xavier.foster.92798', icon: Facebook },
        { name: 'Steam', url: 'https://steamcommunity.com/profiles/76561198815421854/', icon: Gamepad2 }
      ]
    };
  },
  methods: {
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
</script>

<style scoped>
.footer {
  padding-top: 6rem;
  padding-bottom: 3rem;
  background-color: var(--bg);
  border-top: 1px solid var(--border);
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1.2fr;
  gap: 4rem;
  margin-bottom: 6rem;
}

.brand-col {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.brand-logo {
  width: 44px;
  height: 44px;
}

.logo-box {
  fill: var(--text);
}

.logo-text {
  fill: var(--bg);
}

.footer-tagline {
  font-size: 1rem;
  line-height: 1.6;
  opacity: 0.7;
  max-width: 300px;
}

.social-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.social-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: var(--card-bg);
  border: 1px solid var(--border);
  color: var(--text);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.social-icon:hover {
  transform: translateY(-4px);
  background-color: var(--accent);
  color: var(--bg);
  border-color: var(--accent);
}

.footer-title {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 2rem;
  color: var(--accent);
}

.footer-nav {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.footer-nav a {
  font-size: 0.95rem;
  opacity: 0.7;
  transition: all 0.2s ease;
}

.footer-nav a:hover {
  opacity: 1;
  color: var(--accent);
  padding-left: 4px;
}

.status-msg {
  font-size: 0.95rem;
  line-height: 1.6;
  opacity: 0.7;
  margin-bottom: 1.5rem;
}

.resume-link {
  width: fit-content;
  font-size: 0.875rem;
}

.footer-bottom {
  padding-top: 3rem;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  opacity: 0.6;
}

.built-with {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
}

.back-to-top {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: color 0.2s ease;
}

.back-to-top:hover {
  color: var(--accent);
}

@media (max-width: 1024px) {
  .footer-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 3rem;
  }
}

@media (max-width: 640px) {
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 3rem;
  }

  .footer-bottom {
    flex-direction: column;
    gap: 2rem;
    text-align: center;
  }
}
</style>
