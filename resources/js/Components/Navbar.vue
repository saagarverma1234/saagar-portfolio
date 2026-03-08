<template>
  <nav :class="['navbar', { 'scrolled': isScrolled }]">
    <div class="container nav-content">
      <Link href="/" class="brand" aria-label="Home">
      <div class="logo-wrapper">
        <svg class="brand-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <rect width="100" height="100" rx="20" class="logo-box" />
          <text x="50" y="66" font-family="'JetBrains Mono', monospace" font-size="45" font-weight="800"
            text-anchor="middle" class="logo-text">SV</text>
        </svg>
      </div>
      </Link>

      <!-- Desktop Nav -->
      <div class="nav-links desktop-only font-mono">
        <Link href="/#about">About</Link>
        <Link href="/#testimonials">Testimonials</Link>
        <Link href="/#experience">Experience</Link>
        <Link href="/#contact">Contact</Link>
        <Link href="/projects">Projects</Link>
        <Link href="/certifications">Certifications</Link>
      </div>

      <!-- Theme Toggle & Mobile Menu -->
      <div class="nav-actions">
        <button @click="themeStore.toggleTheme()" class="theme-btn" aria-label="Toggle Theme">
          <Moon v-if="themeStore.theme === 'dark'" :size="20" />
          <Sun v-else :size="20" />
        </button>

        <button class="mobile-menu-btn" @click="menuOpen = !menuOpen" aria-label="Toggle Menu">
          <Menu v-if="!menuOpen" :size="24" />
          <X v-else :size="24" />
        </button>
      </div>
    </div>

    <!-- Mobile Nav -->
    <div v-show="menuOpen" class="mobile-nav font-mono">
      <Link href="/#about" @click="menuOpen = false">About</Link>
      <Link href="/#testimonials" @click="menuOpen = false">Testimonials</Link>
      <Link href="/#experience" @click="menuOpen = false">Experience</Link>
      <Link href="/#contact" @click="menuOpen = false">Contact</Link>
      <Link href="/projects" @click="menuOpen = false">Projects</Link>
      <Link href="/certifications" @click="menuOpen = false">Certifications</Link>
    </div>
  </nav>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { Link } from '@inertiajs/vue3';
import { useThemeStore } from '@/Stores/useThemeStore';
import { Sun, Moon, Menu, X } from 'lucide-vue-next';

export default {
  components: {
    Link,
    Sun,
    Moon,
    Menu,
    X,
  },
  setup() {
    const themeStore = useThemeStore();
    const isScrolled = ref(false);
    const menuOpen = ref(false);

    const handleScroll = () => {
      isScrolled.value = window.scrollY > 20;
    };

    onMounted(() => {
      window.addEventListener('scroll', handleScroll);
    });

    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll);
    });

    return {
      themeStore,
      isScrolled,
      menuOpen
    };
  }
};
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  background-color: transparent;
  transition: all 0.3s ease;
  z-index: 10000;
}

.navbar.scrolled {
  height: 70px;
  background-color: var(--header-bg);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
}

.nav-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.logo-wrapper {
  display: flex;
  align-items: center;
}

.brand-logo {
  width: 36px;
  height: 36px;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.logo-box {
  fill: var(--text);
  transition: fill 0.3s ease;
}

.logo-text {
  fill: var(--bg);
  transition: fill 0.3s ease;
}

.brand:hover .brand-logo {
  transform: scale(1.1);
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-links a {
  font-size: 0.95rem;
  font-weight: 500;
  position: relative;
}

.nav-links a::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0%;
  height: 2px;
  background-color: var(--accent);
  transition: width 0.3s ease;
}

.nav-links a:hover::after {
  width: 100%;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.theme-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.theme-btn:hover {
  background-color: var(--muted);
}

.mobile-menu-btn {
  display: none;
}

.mobile-nav {
  display: none;
  background-color: var(--bg);
  border-bottom: 1px solid var(--border);
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  padding: 1rem;
  flex-direction: column;
  gap: 1rem;
  box-shadow: var(--shadow);
}

.mobile-nav a {
  padding: 1rem;
  font-weight: 500;
  border-radius: 4px;
}

.mobile-nav a:hover {
  background-color: var(--muted);
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }

  .mobile-menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
  }

  .mobile-nav {
    display: flex;
  }
}
</style>
