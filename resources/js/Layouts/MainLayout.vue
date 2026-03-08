<template>
  <div class="layout">
    <Preloader />
    <Navbar />
    <main class="main-content">
      <slot />
    </main>
    <Footer />
  </div>
</template>

<script>
import Navbar from '@/Components/Navbar.vue';
import Footer from '@/Components/Footer.vue';
import Preloader from '@/Components/Preloader.vue';
import { useThemeStore } from '@/Stores/useThemeStore';
import { onMounted } from 'vue';

export default {
  components: {
    Navbar,
    Footer,
    Preloader
  },
  setup() {
    const themeStore = useThemeStore();

    onMounted(() => {
      themeStore.init();
    });

    return {};
  }
};
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex-grow: 1;
  padding-top: 80px;
  /* Offset for sticky navbar */
}
</style>
